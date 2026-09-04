'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { reportSchema, reviewSchema } from '@/lib/validation/schemas'

type ActionResult = { ok: true } | { ok: false; error: string }

/** Простая эвристика против бессмысленного текста (раздел 7.4). */
function looksMeaningful(text: string): boolean {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  if (words.length < 5) return false
  const unique = new Set(words)
  if (unique.size / words.length <= 0.3) return false
  if (/(.)\1{6,}/u.test(text)) return false
  return true
}

export async function submitReview(input: unknown): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Проверьте форму' }
  const review = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  if (!looksMeaningful(review.body)) {
    return { ok: false, error: 'Текст выглядит бессмысленным — расскажите подробнее' }
  }

  // Rate limit: не более 3 отзывов в сутки с аккаунта
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)
  if ((count ?? 0) >= 3) return { ok: false, error: 'Слишком много отзывов за сутки. Попробуйте завтра' }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()

  const { data: autoPublish } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'review_auto_publish')
    .maybeSingle()

  const payload = {
    ...review,
    user_id: user.id,
    author_name: review.is_anonymous ? '' : (profile?.full_name ?? ''),
    status: 'pending' as const,
  }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('university_id', review.university_id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('reviews').update(payload).eq('id', existing.id)
    : await supabase.from('reviews').insert(payload)

  if (error) return { ok: false, error: error.message }

  // Автопубликация — только через сервисный ключ, чтобы RLS не пускал status напрямую
  if (autoPublish?.value === true) {
    try {
      const admin = createAdminClient()
      await admin
        .from('reviews')
        .update({ status: 'approved', moderated_at: new Date().toISOString() })
        .eq('university_id', review.university_id)
        .eq('user_id', user.id)
    } catch {
      /* без сервисного ключа отзыв просто ждёт модерации */
    }
  }

  revalidatePath('/[locale]/universities/[slug]', 'page')
  return { ok: true }
}

export async function voteHelpful(reviewId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: existing } = await supabase
    .from('review_votes')
    .select('review_id')
    .eq('review_id', reviewId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('review_votes').delete().eq('review_id', reviewId).eq('user_id', user.id)
  } else {
    await supabase.from('review_votes').insert({ review_id: reviewId, user_id: user.id })
  }

  revalidatePath('/[locale]/universities/[slug]', 'page')
  return { ok: true }
}

export async function reportReview(input: unknown): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Проверьте форму' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { error } = await supabase.from('review_reports').insert({ ...parsed.data, user_id: user.id })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteMyReview(reviewId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { error } = await supabase.from('reviews').delete().eq('id', reviewId).eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/[locale]/profile', 'page')
  return { ok: true }
}
