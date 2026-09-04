'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, isSuperadmin } from '@/lib/queries/profile'
import { writeAudit } from '@/lib/audit'
import type { AdminResult } from './admin-universities'

async function guard() {
  if (!(await isSuperadmin())) throw new Error('forbidden')
  const profile = await getCurrentProfile()
  return { supabase: createAdminClient(), actorId: profile?.id ?? null }
}

function wrap<T>(fn: () => Promise<AdminResult<T>>): Promise<AdminResult<T>> {
  return fn().catch((error) => ({ ok: false as const, error: error instanceof Error ? error.message : 'Ошибка' }))
}

// ── Модерация отзывов ───────────────────────────────────────────────────
export async function moderateReview(
  id: string,
  status: 'approved' | 'rejected',
  comment = '',
): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { data: before } = await supabase.from('reviews').select('*').eq('id', id).maybeSingle()
    const { error } = await supabase
      .from('reviews')
      .update({
        status,
        moderation_comment: comment,
        moderated_by: actorId,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }

    await writeAudit({ actorId, action: 'moderate', entity: 'reviews', entityId: id, before, after: { status, comment } })
    revalidateTag('universities')
    revalidatePath('/admin/reviews')
    revalidatePath('/ru', 'page')
    return { ok: true }
  })
}

export async function moderateReviewsBulk(ids: string[], status: 'approved' | 'rejected'): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { error } = await supabase
      .from('reviews')
      .update({ status, moderated_by: actorId, moderated_at: new Date().toISOString() })
      .in('id', ids)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'moderate', entity: 'reviews', after: { ids, status } })
    revalidateTag('universities')
    revalidatePath('/admin/reviews')
    return { ok: true }
  })
}

export async function editReviewText(id: string, body: string): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { error } = await supabase
      .from('reviews')
      .update({ body: `${body}\n\n(отредактировано модератором)` })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'update', entity: 'reviews', entityId: id })
    revalidatePath('/admin/reviews')
    return { ok: true }
  })
}

export async function deleteReview(id: string): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { error } = await supabase.from('reviews').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'delete', entity: 'reviews', entityId: id })
    revalidatePath('/admin/reviews')
    return { ok: true }
  })
}

export async function resolveReport(id: string, hideReview: boolean): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { data: report } = await supabase.from('review_reports').select('review_id').eq('id', id).maybeSingle()
    await supabase.from('review_reports').update({ is_resolved: true }).eq('id', id)
    if (hideReview && report) {
      await supabase.from('reviews').update({ status: 'rejected', moderated_by: actorId }).eq('id', report.review_id)
    }
    await writeAudit({ actorId, action: 'moderate', entity: 'review_reports', entityId: id, after: { hideReview } })
    revalidatePath('/admin/reviews')
    return { ok: true }
  })
}

// ── Пользователи ────────────────────────────────────────────────────────
export async function setUserBlocked(id: string, blocked: boolean, reason = ''): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { error } = await supabase.from('profiles').update({ is_blocked: blocked }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'update', entity: 'profiles', entityId: id, after: { is_blocked: blocked, reason } })
    revalidatePath('/admin/users')
    return { ok: true }
  })
}

export async function setUserRole(id: string, role: 'user' | 'superadmin'): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'update', entity: 'profiles', entityId: id, after: { role } })
    revalidatePath('/admin/users')
    return { ok: true }
  })
}

export async function deleteUser(id: string): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    await supabase.from('reviews').update({ deleted_at: new Date().toISOString() }).eq('user_id', id)
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'delete', entity: 'profiles', entityId: id })
    revalidatePath('/admin/users')
    return { ok: true }
  })
}

export async function logExport(entity: string, rows: number): Promise<AdminResult> {
  return wrap(async () => {
    const { actorId } = await guard()
    await writeAudit({ actorId, action: 'export', entity, after: { rows } })
    return { ok: true }
  })
}

// ── Справочники ─────────────────────────────────────────────────────────
export async function saveDictionaryRow(
  table: 'cities' | 'specialties' | 'ent_subjects',
  row: Record<string, unknown>,
): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { id, ...payload } = row
    const { error } = id
      ? await supabase.from(table).update(payload).eq('id', id)
      : await supabase.from(table).insert(payload)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: id ? 'update' : 'insert', entity: table, entityId: id ? String(id) : null, after: payload })
    revalidateTag('dictionaries')
    revalidatePath('/admin/dictionaries')
    return { ok: true }
  })
}

export async function deleteDictionaryRow(
  table: 'cities' | 'specialties' | 'ent_subjects',
  id: number,
): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    if (table === 'cities') {
      const { count } = await supabase.from('universities').select('id', { count: 'exact', head: true }).eq('city_id', id)
      if (count && count > 0) return { ok: false, error: `Используется в ${count} ВУЗах` }
    }
    if (table === 'specialties') {
      const { count } = await supabase.from('university_majors').select('id', { count: 'exact', head: true }).eq('specialty_id', id)
      if (count && count > 0) return { ok: false, error: `Используется в ${count} программах` }
    }
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'delete', entity: table, entityId: String(id) })
    revalidateTag('dictionaries')
    revalidatePath('/admin/dictionaries')
    return { ok: true }
  })
}

// ── Контент и настройки ─────────────────────────────────────────────────
export async function saveFaq(row: Record<string, unknown>): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { id, ...payload } = row
    const { error } = id
      ? await supabase.from('faq').update(payload).eq('id', id)
      : await supabase.from('faq').insert(payload)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: id ? 'update' : 'insert', entity: 'faq', entityId: id ? String(id) : null })
    revalidatePath('/admin/content')
    revalidatePath('/ru/faq')
    return { ok: true }
  })
}

export async function deleteFaq(id: number): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { error } = await supabase.from('faq').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'delete', entity: 'faq', entityId: String(id) })
    revalidatePath('/admin/content')
    return { ok: true }
  })
}

export async function saveStaticPage(row: Record<string, unknown>): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    const { id, ...payload } = row
    const { error } = id
      ? await supabase.from('static_pages').update(payload).eq('id', id)
      : await supabase.from('static_pages').insert(payload)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: id ? 'update' : 'insert', entity: 'static_pages', entityId: id ? String(id) : null })
    revalidatePath('/admin/content')
    revalidatePath(`/ru/${payload.slug ?? ''}`)
    return { ok: true }
  })
}

export async function saveSettings(values: Record<string, unknown>): Promise<AdminResult> {
  return wrap(async () => {
    const { supabase, actorId } = await guard()
    for (const [key, value] of Object.entries(values)) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      if (error) return { ok: false, error: error.message }
    }
    await writeAudit({ actorId, action: 'settings', entity: 'app_settings', after: values })
    revalidateTag('settings')
    revalidatePath('/admin/settings')
    revalidatePath('/ru', 'page')
    revalidatePath('/kk', 'page')
    return { ok: true }
  })
}

export async function purgeCache(): Promise<AdminResult> {
  return wrap(async () => {
    await guard()
    for (const tag of ['universities', 'majors', 'dictionaries', 'settings']) revalidateTag(tag)
    revalidatePath('/', 'layout')
    return { ok: true }
  })
}
