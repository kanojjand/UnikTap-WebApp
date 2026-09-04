/**
 * Заливает общую информацию по вузам Шымкента прямо в базу.
 * Копировать SQL вручную не нужно.
 *
 * Запуск из корня проекта:
 *   node supabase/apply-shymkent-info.mjs
 *
 * Что делает: обновляет описание, историю, соцсети, телефоны, адреса,
 * приёмную комиссию и общежития у 11 вузов Шымкента.
 * Программы, цены и всё остальное не трогает.
 * Запускать можно повторно — данные перезапишутся теми же значениями.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { UNIVERSITIES } from './shymkent-info.data.mjs'

const OK = '\x1b[32m✓\x1b[0m'
const BAD = '\x1b[31m✗\x1b[0m'
const WARN = '\x1b[33m!\x1b[0m'

const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error(`${BAD} Не найден .env.local. Запускайте из корня проекта — там, где лежит package.json.`)
  process.exit(1)
}
const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].trim()
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error(`${BAD} В .env.local нет NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY.`)
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

console.log(`\nБаза: ${url}`)
console.log(`Вузов к обновлению: ${UNIVERSITIES.length}\n`)

let updated = 0
let missing = 0
let failed = 0

for (const { slug, ...fields } of UNIVERSITIES) {
  const { data, error } = await db
    .from('universities')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select('slug, short_name')

  if (error) {
    console.log(`${BAD} ${slug} — ${error.message}`)
    failed++
  } else if (!data || data.length === 0) {
    console.log(`${WARN} ${slug} — такого вуза нет в базе, пропущен`)
    missing++
  } else {
    const socials = fields.socials ? Object.keys(fields.socials).length : 0
    const parts = [
      fields.history_ru ? 'история' : null,
      socials ? `соцсетей ${socials}` : null,
      fields.admission_intro_ru ? 'приём' : null,
      fields.has_dormitory ? 'общежитие' : null,
    ].filter(Boolean)
    console.log(`${OK} ${data[0].short_name || slug}${parts.length ? ' — ' + parts.join(', ') : ''}`)
    updated++
  }
}

console.log(`\nОбновлено: ${updated}, пропущено: ${missing}, с ошибкой: ${failed}`)

if (missing > 0) {
  console.log(`\n${WARN} Пропущенные вузы появятся после выполнения supabase/shymkent-universities.sql`)
  console.log('   в SQL Editor — этот скрипт только дополняет уже существующие карточки.')
}

if (failed === 0 && updated > 0) {
  console.log('\nПроверка — что теперь в базе:\n')
  const { data } = await db
    .from('universities')
    .select('short_name, slug, description_ru, history_ru, socials, phones, website')
    .in('slug', UNIVERSITIES.map((u) => u.slug))
  if (data) {
    const order = UNIVERSITIES.map((u) => u.slug)
    console.table(
      data
        .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
        .map((r) => ({
          вуз: r.short_name || r.slug,
          описание: r.description_ru ? '✓' : '—',
          история: r.history_ru ? '✓' : '—',
          соцсетей: Object.keys(r.socials ?? {}).length,
          телефонов: (r.phones ?? []).length,
          сайт: r.website,
        })),
    )
  }

  console.log('Готово. Осталось сбросить кэш, иначе сайт ещё час будет отдавать старое:')
  console.log('   Админка → Настройки → «Очистить кэш»\n')
}

process.exit(failed > 0 ? 1 : 0)
