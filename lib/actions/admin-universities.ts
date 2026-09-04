'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentProfile, isSuperadmin } from '@/lib/queries/profile'
import { writeAudit } from '@/lib/audit'
import { admissionBlockSchema, majorSchema, universitySchema } from '@/lib/validation/schemas'

export type AdminResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

async function guard() {
  if (!(await isSuperadmin())) throw new Error('forbidden')
  const profile = await getCurrentProfile()
  return { supabase: createAdminClient(), actorId: profile?.id ?? null }
}

function refresh(slug?: string) {
  // Сбрасываем и страницы, и теги кэша данных — иначе публичная страница
  // будет час отдавать старую версию карточки.
  revalidateTag('universities')
  revalidateTag('majors')
  revalidatePath('/admin/universities')
  revalidatePath('/ru', 'page')
  revalidatePath('/kk', 'page')
  if (slug) {
    revalidateTag(`university:${slug}`)
    revalidatePath(`/ru/universities/${slug}`)
    revalidatePath(`/kk/universities/${slug}`)
  }
}

export async function saveUniversity(input: unknown, id?: string): Promise<AdminResult<{ id: string }>> {
  const parsed = universitySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Проверьте форму' }

  try {
    const { supabase, actorId } = await guard()

    if (id) {
      const { data: before } = await supabase.from('universities').select('*').eq('id', id).maybeSingle()
      const { data, error } = await supabase.from('universities').update(parsed.data).eq('id', id).select('id, slug').single()
      if (error) return { ok: false, error: error.message }
      await writeAudit({ actorId, action: 'update', entity: 'universities', entityId: id, before, after: parsed.data })
      refresh(data.slug)
      return { ok: true, data: { id: data.id } }
    }

    const { data, error } = await supabase.from('universities').insert(parsed.data).select('id, slug').single()
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'insert', entity: 'universities', entityId: data.id, after: parsed.data })
    refresh(data.slug)
    return { ok: true, data: { id: data.id } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function setUniversityPublished(id: string, published: boolean): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { data, error } = await supabase
      .from('universities')
      .update({ is_published: published })
      .eq('id', id)
      .select('slug')
      .single()
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'update', entity: 'universities', entityId: id, after: { is_published: published } })
    refresh(data.slug)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function deleteUniversity(id: string, hard = false): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { error } = hard
      ? await supabase.from('universities').delete().eq('id', id)
      : await supabase.from('universities').update({ deleted_at: new Date().toISOString(), is_published: false }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: hard ? 'delete' : 'update', entity: 'universities', entityId: id })
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function restoreUniversity(id: string): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { error } = await supabase.from('universities').update({ deleted_at: null }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'restore', entity: 'universities', entityId: id })
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function duplicateUniversity(id: string): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { data: source } = await supabase.from('universities').select('*').eq('id', id).maybeSingle()
    if (!source) return { ok: false, error: 'Не найдено' }

    const copy = { ...(source as Record<string, unknown>) }
    delete copy.id
    delete copy.created_at
    delete copy.updated_at
    copy.slug = `${source.slug}-copy-${Date.now().toString(36)}`
    copy.name_ru = `${source.name_ru} (копия)`
    copy.is_published = false
    copy.rating = 0
    copy.reviews_count = 0
    copy.views_count = 0

    const { error } = await supabase.from('universities').insert(copy)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'insert', entity: 'universities', entityId: String(copy.slug) })
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function saveMajor(input: unknown): Promise<AdminResult> {
  const parsed = majorSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Проверьте форму' }

  try {
    const { supabase, actorId } = await guard()
    const { id, ...payload } = parsed.data

    const { error } = id
      ? await supabase.from('university_majors').update(payload).eq('id', id)
      : await supabase.from('university_majors').insert(payload)
    if (error) return { ok: false, error: error.message }

    await writeAudit({ actorId, action: id ? 'update' : 'insert', entity: 'university_majors', entityId: id ?? null, after: payload })
    revalidatePath('/admin/majors')
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function deleteMajor(id: string): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { error } = await supabase
      .from('university_majors')
      .update({ deleted_at: new Date().toISOString(), is_published: false })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'delete', entity: 'university_majors', entityId: id })
    revalidatePath('/admin/majors')
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function saveScoreHistory(input: {
  university_major_id: string
  year: number
  grant_score: number | null
  paid_min_score: number | null
  grants_count: number | null
}): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { error } = await supabase
      .from('major_score_history')
      .upsert(input, { onConflict: 'university_major_id,year' })
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'update', entity: 'major_score_history', entityId: input.university_major_id, after: input })
    revalidatePath('/admin/majors')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function saveAdmissionBlock(input: unknown): Promise<AdminResult> {
  const parsed = admissionBlockSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Проверьте форму' }

  try {
    const { supabase, actorId } = await guard()
    const { id, ...payload } = parsed.data
    const { error } = id
      ? await supabase.from('admission_blocks').update(payload).eq('id', id)
      : await supabase.from('admission_blocks').insert(payload)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: id ? 'update' : 'insert', entity: 'admission_blocks', entityId: id ?? null })
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function deleteAdmissionBlock(id: string): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { error } = await supabase.from('admission_blocks').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'delete', entity: 'admission_blocks', entityId: id })
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function saveImage(input: { university_id: string; url: string; caption_ru?: string; sort_order?: number }): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { error } = await supabase.from('university_images').insert(input)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'insert', entity: 'university_images', entityId: input.university_id })
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

export async function deleteImage(id: string): Promise<AdminResult> {
  try {
    const { supabase, actorId } = await guard()
    const { error } = await supabase.from('university_images').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeAudit({ actorId, action: 'delete', entity: 'university_images', entityId: id })
    refresh()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}

/** Импорт специальностей из CSV (раздел 8.5). Возвращает построчный отчёт. */
export async function importMajorsCsv(
  rows: Record<string, string>[],
  apply: boolean,
): Promise<AdminResult<{ created: number; updated: number; errors: { line: number; message: string }[] }>> {
  try {
    const { supabase, actorId } = await guard()
    const report = { created: 0, updated: 0, errors: [] as { line: number; message: string }[] }

    for (const [index, row] of rows.entries()) {
      const line = index + 2
      const { data: university } = await supabase
        .from('universities')
        .select('id')
        .eq('slug', (row.university_slug ?? '').trim())
        .maybeSingle()
      if (!university) {
        report.errors.push({ line, message: `ВУЗ «${row.university_slug}» не найден` })
        continue
      }

      const { data: specialty } = await supabase
        .from('specialties')
        .select('id')
        .eq('code', (row.specialty_code ?? '').trim())
        .maybeSingle()
      if (!specialty) {
        report.errors.push({ line, message: `Специальность «${row.specialty_code}» не найдена` })
        continue
      }

      const payload = {
        university_id: university.id,
        specialty_id: specialty.id,
        degree: (row.degree || 'bachelor') as 'bachelor',
        fee_per_year: row.fee_per_year ? Number(row.fee_per_year) : null,
        grant_score: row.grant_score ? Number(row.grant_score) : null,
        paid_min_score: row.paid_min_score ? Number(row.paid_min_score) : null,
        grants_count: row.grants_count ? Number(row.grants_count) : null,
        languages: (row.languages || 'ru').split(/[,;]/).map((value) => value.trim()).filter(Boolean),
        study_forms: (row.study_forms || 'full_time').split(/[,;]/).map((value) => value.trim()).filter(Boolean),
      }

      const { data: existing } = await supabase
        .from('university_majors')
        .select('id')
        .eq('university_id', university.id)
        .eq('specialty_id', specialty.id)
        .eq('degree', payload.degree)
        .maybeSingle()

      if (!apply) {
        if (existing) report.updated += 1
        else report.created += 1
        continue
      }

      const { error } = existing
        ? await supabase.from('university_majors').update(payload).eq('id', existing.id)
        : await supabase.from('university_majors').insert(payload)

      if (error) report.errors.push({ line, message: error.message })
      else if (existing) report.updated += 1
      else report.created += 1
    }

    if (apply) {
      await writeAudit({ actorId, action: 'insert', entity: 'university_majors', after: { import: report } })
      revalidatePath('/admin/majors')
      refresh()
    }

    return { ok: true, data: report }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Ошибка' }
  }
}
