/**
 * Заливает вузы Шымкента 2026–2027 из supabase/shymkent-2026.data.mjs.
 *
 * Запуск из корня проекта:
 *   node supabase/apply-shymkent-2026.mjs         — записать в базу из .env.local
 *   node supabase/apply-shymkent-2026.mjs --sql   — пересобрать supabase/shymkent-2026.sql для SQL Editor
 *
 * Перед первым запуском нужна миграция supabase/migrations/0011_programs_campuses.sql.
 *
 * Что делает:
 *   • создаёт или обновляет 10 вузов: контакты, описание, соцсети, факультеты, корпуса;
 *     историю, тексты о поступлении и численность заполняет, только если в базе пусто;
 *   • заменяет программы бакалавриата: новые добавляет, совпавшие обновляет,
 *     отсутствующие в таблице скрывает (deleted_at) — проходные баллы на грант не трогает;
 *   • добавляет сроки приёмной кампании 2026 года;
 *   • снимает с публикации закрытые вузы (РСИУ, МГТИ, Silkway).
 * Запускать можно повторно.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CLOSED, GROUP_FIXES, NEW_GROUPS, UNIVERSITIES } from './shymkent-2026.data.mjs'

const OK = '\x1b[32m✓\x1b[0m'
const BAD = '\x1b[31m✗\x1b[0m'
const WARN = '\x1b[33m!\x1b[0m'

if (process.argv.includes('--sql')) {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shymkent-2026.sql')
  fs.writeFileSync(file, buildSql())
  console.log(`${OK} ${path.relative(process.cwd(), file)}`)
  process.exit(0)
}

const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error(`${BAD} Не найден .env.local. Запускайте из корня проекта — там, где лежит package.json.`)
  process.exit(1)
}
const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(?:\s#.*)?$/)
  if (m) env[m[1]] = m[2].trim()
}
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`${BAD} В .env.local нет NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY.`)
  process.exit(1)
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

console.log(`\nБаза: ${env.NEXT_PUBLIC_SUPABASE_URL}`)

const probe = await Promise.all([
  db.from('university_majors').select('program_code').limit(1),
  db.from('universities').select('campuses, faculties').limit(1),
])
if (probe.some((result) => result.error)) {
  console.error(`${BAD} В базе нет колонок для программ и корпусов.`)
  console.error('   Выполните supabase/migrations/0011_programs_campuses.sql в Supabase → SQL Editor и запустите скрипт ещё раз.')
  process.exit(1)
}

// ── справочник групп ─────────────────────────────────────────────────
const subjects = must(await db.from('ent_subjects').select('id, code'), 'предметы ЕНТ')
const subjectId = (code) => subjects.find((s) => s.code === code)?.id ?? null

must(
  await db.from('specialties').upsert(
    NEW_GROUPS.map((g) => ({
      code: g.code, name_ru: g.name_ru, direction_ru: g.direction_ru,
      subject_1_id: subjectId(g.subjects[0]), subject_2_id: subjectId(g.subjects[1]), is_active: true,
    })),
    { onConflict: 'code', ignoreDuplicates: true },
  ),
  'новые группы',
)
for (const fix of GROUP_FIXES) {
  must(
    await db.from('specialties')
      .update({ subject_1_id: subjectId(fix.subjects[0]), subject_2_id: subjectId(fix.subjects[1]) })
      .eq('code', fix.code),
    `группа ${fix.code}`,
  )
}

const specialtyId = new Map(must(await db.from('specialties').select('id, code'), 'группы').map((s) => [s.code, s.id]))
const missingGroups = [...new Set(UNIVERSITIES.flatMap((u) => u.majors.map((m) => m.group)))].filter((g) => !specialtyId.has(g))
if (missingGroups.length) {
  console.error(`${BAD} В справочнике specialties нет групп: ${missingGroups.join(', ')}`)
  process.exit(1)
}

const city = must(await db.from('cities').select('id').eq('slug', 'shymkent').single(), 'город Шымкент')

// ── вузы ─────────────────────────────────────────────────────────────
let failed = 0
for (const u of UNIVERSITIES) {
  try {
    const fillKeys = Object.keys(u.fill)
    const existing = must(
      await db.from('universities').select(['id', ...fillKeys].join(', ')).eq('slug', u.slug).maybeSingle(),
      'поиск вуза',
    )
    const fill = Object.fromEntries(
      Object.entries(u.fill).filter(([key]) => !existing || existing[key] == null || existing[key] === ''),
    )
    const row = { ...u.set, ...fill, city_id: city.id, deleted_at: null }

    const id = existing
      ? (must(await db.from('universities').update(row).eq('id', existing.id), 'обновление вуза'), existing.id)
      : must(await db.from('universities').insert({ slug: u.slug, ...row }).select('id').single(), 'создание вуза').id

    const current = must(
      await db.from('university_majors')
        .select('id, specialty_id, degree, program_code, program_name_ru, deleted_at')
        .eq('university_id', id),
      'программы вуза',
    )

    const keep = new Set()
    const inserts = []
    for (const [index, m] of u.majors.entries()) {
      const payload = {
        specialty_id: specialtyId.get(m.group),
        degree: 'bachelor',
        program_code: m.code,
        program_name_ru: m.name,
        study_forms: u.study_forms,
        languages: u.languages,
        duration_years: m.duration ?? 4,
        fee_per_year: m.fee,
        is_published: true,
        deleted_at: null,
        sort_order: index + 1,
        ...(m.paid_min_score != null ? { paid_min_score: m.paid_min_score } : {}),
        ...(m.description ? { description_ru: m.description } : {}),
      }
      const match = current.find(
        (c) => c.degree === 'bachelor' && c.specialty_id === payload.specialty_id &&
          c.program_code === m.code && c.program_name_ru === m.name,
      )
      if (match) {
        must(await db.from('university_majors').update(payload).eq('id', match.id), `программа ${m.code}`)
        keep.add(match.id)
      } else {
        inserts.push({ university_id: id, ...payload })
      }
    }
    if (inserts.length) must(await db.from('university_majors').insert(inserts), 'новые программы')

    const stale = current.filter((c) => !c.deleted_at && !keep.has(c.id)).map((c) => c.id)
    if (stale.length) {
      must(
        await db.from('university_majors')
          .update({ deleted_at: new Date().toISOString(), is_published: false })
          .in('id', stale),
        'скрытие старых программ',
      )
    }

    if (u.deadlines.length) {
      must(
        await db.from('admission_blocks').delete()
          .eq('university_id', id).eq('kind', 'deadline')
          .in('title_ru', u.deadlines.map((d) => d.title_ru)),
        'старые сроки',
      )
      must(
        await db.from('admission_blocks').insert(
          u.deadlines.map((d, index) => ({ university_id: id, kind: 'deadline', ...d, sort_order: index + 1, is_published: true })),
        ),
        'сроки приёма',
      )
    }

    const extra = [
      stale.length ? `скрыто старых ${stale.length}` : null,
      u.deadlines.length ? `сроков ${u.deadlines.length}` : null,
      Object.keys(fill).length ? `дополнено: ${Object.keys(fill).join(', ')}` : null,
    ].filter(Boolean)
    console.log(`${OK} ${u.set.short_name} — ${existing ? 'обновлён' : 'создан'}, программ ${u.majors.length}${extra.length ? ', ' + extra.join(', ') : ''}`)
  } catch (error) {
    failed++
    console.log(`${BAD} ${u.slug} — ${error.message}`)
  }
}

const closed = must(
  await db.from('universities').update({ is_published: false }).in('slug', CLOSED).select('short_name'),
  'закрытые вузы',
)
if (closed.length) console.log(`${OK} Сняты с публикации: ${closed.map((c) => c.short_name).join(', ')}`)

// ── сброс кэша сайта ─────────────────────────────────────────────────
if (env.NEXT_PUBLIC_SITE_URL && env.REVALIDATE_SECRET) {
  const slugs = [...UNIVERSITIES.map((u) => u.slug), ...CLOSED]
  let done = 0
  for (const slug of slugs) {
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_SITE_URL}/api/revalidate?slug=${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'x-revalidate-secret': env.REVALIDATE_SECRET },
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) done++
    } catch {
      break
    }
  }
  if (done) console.log(`${OK} Кэш сайта ${env.NEXT_PUBLIC_SITE_URL} сброшен для ${done} страниц`)
  else console.log(`${WARN} Сайт ${env.NEXT_PUBLIC_SITE_URL} не ответил — новые данные появятся в течение часа`)
}

console.log(failed ? `\n${BAD} С ошибкой: ${failed}` : `\n${OK} Готово`)
process.exit(failed ? 1 : 0)

// ── SQL для SQL Editor ───────────────────────────────────────────────
function buildSql() {
  const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
  const lit = (key, v) => {
    if (v == null) return 'null'
    if (key === 'type') return `${q(v)}::university_type`
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    if (Array.isArray(v) && key === 'phones') return v.length ? `array[${v.map(q).join(', ')}]::text[]` : `'{}'::text[]`
    if (typeof v === 'object') return `${q(JSON.stringify(v))}::jsonb`
    return q(v)
  }
  const TEXT_FILL = new Set(['name_kk', 'history_ru', 'admission_intro_ru', 'dormitory_info_ru', 'accreditation_ru', 'working_hours_ru'])

  let sql = `-- ============================================================
-- UnikTap · вузы Шымкента, 2026–2027 учебный год
--
-- СГЕНЕРИРОВАНО командой: node supabase/apply-shymkent-2026.mjs --sql
-- Данные — supabase/shymkent-2026.data.mjs, правьте их там.
-- Проще залить командой: node supabase/apply-shymkent-2026.mjs
-- Этот файл — тот же импорт для Supabase → SQL Editor.
--
-- Порядок: setup-all.sql → migrations/0011_programs_campuses.sql → этот файл.
-- Скрипт безопасно запускать повторно.
-- ============================================================

-- ── Справочник групп ────────────────────────────────────────────────
insert into public.specialties (code, name_ru, direction_ru, subject_1_id, subject_2_id, is_active)
select v.code, v.name, v.direction, s1.id, s2.id, true
from (values
${NEW_GROUPS.map((g) => `  (${[g.code, g.name_ru, g.direction_ru, ...g.subjects].map(q).join(', ')})`).join(',\n')}
) as v(code, name, direction, s1, s2)
left join public.ent_subjects s1 on s1.code = v.s1
left join public.ent_subjects s2 on s2.code = v.s2
on conflict (code) do nothing;
${GROUP_FIXES.map((f) => `
update public.specialties set
  subject_1_id = (select id from public.ent_subjects where code = ${q(f.subjects[0])}),
  subject_2_id = (select id from public.ent_subjects where code = ${q(f.subjects[1])})
where code = ${q(f.code)};`).join('\n')}
`

  for (const u of UNIVERSITIES) {
    const set = { ...u.set }
    const cols = Object.keys(set)
    const fillCols = Object.keys(u.fill)
    const all = [...cols, ...fillCols]
    sql += `
-- ── ${set.name_ru} ${'─'.repeat(Math.max(3, 60 - set.name_ru.length))}
insert into public.universities as u (slug, city_id, ${all.join(', ')})
values (
  ${q(u.slug)}, (select id from public.cities where slug = 'shymkent'),
${all.map((key) => `  ${lit(key, key in set ? set[key] : u.fill[key])}`).join(',\n')}
)
on conflict (slug) do update set
${cols.map((key) => `  ${key} = excluded.${key}`).join(',\n')},
${fillCols.map((key) => TEXT_FILL.has(key)
    ? `  ${key} = coalesce(nullif(u.${key}, ''), excluded.${key})`
    : `  ${key} = coalesce(u.${key}, excluded.${key})`).join(',\n')}${fillCols.length ? ',' : ''}
  deleted_at = null;

insert into public.university_majors (
  university_id, specialty_id, degree, program_code, program_name_ru, study_forms, languages,
  duration_years, fee_per_year, paid_min_score, description_ru, is_published, sort_order
)
select u.id, s.id, 'bachelor', v.code, v.name, ${q(`{${u.study_forms.join(',')}}`)}::study_form[], ${q(`{${u.languages.join(',')}}`)}::text[],
       coalesce(v.duration::numeric, 4), v.fee::int, v.min_score::int, coalesce(v.description, ''), true, v.ord
from (values
${u.majors.map((m, i) => `  (${[m.code, m.name, m.group].map(q).join(', ')}, ${m.fee ?? 'null'}, ${m.paid_min_score ?? 'null'}, ${m.duration ?? 'null'}, ${q(m.description ?? null)}, ${i + 1})`).join(',\n')}
) as v(code, name, grp, fee, min_score, duration, description, ord)
join public.universities u on u.slug = ${q(u.slug)}
join public.specialties s on s.code = v.grp
on conflict (university_id, specialty_id, degree, program_code, program_name_ru) do update set
  study_forms = excluded.study_forms,
  languages = excluded.languages,
  duration_years = excluded.duration_years,
  fee_per_year = excluded.fee_per_year,
  paid_min_score = coalesce(excluded.paid_min_score, university_majors.paid_min_score),
  description_ru = coalesce(nullif(excluded.description_ru, ''), university_majors.description_ru),
  sort_order = excluded.sort_order,
  is_published = true,
  deleted_at = null;

-- программы, которых нет в таблице, скрываются
update public.university_majors m set deleted_at = now(), is_published = false
from public.universities u, public.specialties s
where m.university_id = u.id and s.id = m.specialty_id and u.slug = ${q(u.slug)} and m.deleted_at is null
  and (m.program_code, m.program_name_ru, s.code) not in (values
${u.majors.map((m) => `    (${[m.code, m.name, m.group].map(q).join(', ')})`).join(',\n')}
  );
`
    if (u.deadlines.length) {
      sql += `
delete from public.admission_blocks b using public.universities u
where b.university_id = u.id and u.slug = ${q(u.slug)} and b.kind = 'deadline'
  and b.title_ru in (${u.deadlines.map((d) => q(d.title_ru)).join(', ')});

insert into public.admission_blocks (university_id, kind, title_ru, content_ru, date_from, date_to, sort_order, is_published)
select u.id, 'deadline', v.title, v.content, v.date_from::date, v.date_to::date, v.ord, true
from (values
${u.deadlines.map((d, i) => `  (${[d.title_ru, d.content_ru, d.date_from, d.date_to].map(q).join(', ')}, ${i + 1})`).join(',\n')}
) as v(title, content, date_from, date_to, ord)
join public.universities u on u.slug = ${q(u.slug)};
`
    }
  }

  sql += `
-- ── Закрытые вузы ───────────────────────────────────────────────────
update public.universities set is_published = false
where slug in (${CLOSED.map(q).join(', ')});

-- ── Проверка ────────────────────────────────────────────────────────
select u.short_name as вуз, u.majors_count as программ,
       coalesce(u.min_fee::text, 'не опубликована') as цена_от, u.is_published as опубликован
from public.universities u
join public.cities c on c.id = u.city_id
where c.slug = 'shymkent' and u.deleted_at is null
order by u.is_published desc, u.sort_order;
`
  return sql
}
