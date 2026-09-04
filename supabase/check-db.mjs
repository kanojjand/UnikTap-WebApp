/**
 * Проверка базы UnikTap.
 *
 * Запуск из корня проекта:
 *   node supabase/check-db.mjs
 *
 * Скрипт читает .env.local, подключается к базе и печатает отчёт:
 * что создано, сколько данных, чего не хватает. Ничего не меняет.
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const OK = '\x1b[32m✓\x1b[0m'
const BAD = '\x1b[31m✗\x1b[0m'
const WARN = '\x1b[33m!\x1b[0m'

// ── читаем .env.local ────────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error(`${BAD} Не найден .env.local. Запускайте из корня проекта (там, где package.json).`)
  process.exit(1)
}
const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].trim()
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n═══ Переменные окружения ═══')
let fatal = false
for (const [name, value] of [
  ['NEXT_PUBLIC_SUPABASE_URL', url],
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', anon],
  ['SUPABASE_SERVICE_ROLE_KEY', service],
  ['NEXT_PUBLIC_SITE_URL', env.NEXT_PUBLIC_SITE_URL],
  ['REVALIDATE_SECRET', env.REVALIDATE_SECRET],
]) {
  if (!value) {
    console.log(`${BAD} ${name} — не задана`)
    if (name !== 'REVALIDATE_SECRET') fatal = true
  } else {
    console.log(`${OK} ${name}`)
  }
}
if (fatal) process.exit(1)

// ── ключи должны относиться к тому же проекту, что и URL ─────────────
const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
const payload = (jwt) => {
  try {
    const p = jwt.split('.')[1]
    return JSON.parse(Buffer.from(p, 'base64url').toString())
  } catch {
    return null
  }
}
for (const [name, key, role, newPrefix] of [
  ['публичный', anon, 'anon', 'sb_publishable_'],
  ['секретный', service, 'service_role', 'sb_secret_'],
]) {
  // новый формат ключей Supabase — непрозрачная строка, проверить нечего
  if (key.startsWith('sb_publishable_') || key.startsWith('sb_secret_')) {
    if (key.startsWith(newPrefix)) console.log(`${OK} ключ ${name} — новый формат ${newPrefix}…`)
    else console.log(`${BAD} ключ ${name} должен начинаться на ${newPrefix}, а начинается иначе`)
    continue
  }
  const p = payload(key)
  if (!p) console.log(`${BAD} ключ ${name} — не похож ни на JWT, ни на ${newPrefix}…`)
  else if (p.ref !== ref) console.log(`${BAD} ключ ${name} от проекта ${p.ref}, а URL от ${ref}`)
  else if (p.role !== role) console.log(`${BAD} ключ ${name} имеет роль ${p.role}`)
  else console.log(`${OK} ключ ${name} (старый формат ${role}) совпадает с проектом ${ref}`)
}

const db = createClient(url, service, { auth: { persistSession: false } })
const pub = createClient(url, anon, { auth: { persistSession: false } })

const count = async (table, filter) => {
  // без head:true, иначе у несуществующей таблицы теряется текст ошибки
  let q = db.from(table).select('id', { count: 'exact' }).limit(1)
  if (filter) q = filter(q)
  let { count: n, error } = await q
  // у части таблиц ключ не id — пробуем ещё раз по первой колонке
  if (error?.code === '42703') {
    ;({ count: n, error } = await db.from(table).select('*', { count: 'exact' }).limit(1))
  }
  if (error) return { error: error.message }
  if (n === null) return { error: 'таблица не найдена' }
  return { n }
}

// ── связь ────────────────────────────────────────────────────────────
console.log('\n═══ Связь с базой ═══')
const ping = await count('cities')
if (ping.error) {
  console.log(`${BAD} Не удалось прочитать таблицу cities: ${ping.error}`)
  console.log('   Если написано «relation does not exist» — выполните supabase/setup-all.sql в SQL Editor.')
  console.log('   Если «fetch failed» — проверьте, что проект не на паузе (кнопка Restore project).')
  process.exit(1)
}
console.log(`${OK} База отвечает`)

// ── таблицы и справочники ────────────────────────────────────────────
console.log('\n═══ Справочники ═══')
const expect = [
  ['cities', 18, 'города'],
  ['ent_subjects', 13, 'предметы ЕНТ'],
  ['specialties', 80, 'группы образовательных программ'],
  ['app_settings', 8, 'настройки приложения'],
]
for (const [table, min, label] of expect) {
  const r = await count(table)
  if (r.error) console.log(`${BAD} ${table} — ${r.error}`)
  else if (r.n < min) console.log(`${WARN} ${table}: ${r.n} (ожидалось минимум ${min}) — ${label}`)
  else console.log(`${OK} ${table}: ${r.n} — ${label}`)
}

// ── вузы ─────────────────────────────────────────────────────────────
console.log('\n═══ Вузы ═══')
const { data: shymkent } = await db.from('cities').select('id').eq('slug', 'shymkent').single()
const totalU = await count('universities')
const shymU = shymkent ? await count('universities', (q) => q.eq('city_id', shymkent.id)) : { n: 0 }
console.log(`   всего вузов: ${totalU.n}`)
console.log(`   из них Шымкент: ${shymU.n}`)

if (shymU.n >= 11) console.log(`${OK} Данные по Шымкенту загружены`)
else if (shymU.n > 0) console.log(`${WARN} Шымкента меньше 11 — возможно, скрипт выполнен не полностью`)
else console.log(`${BAD} Вузов Шымкента нет — выполните supabase/shymkent-universities.sql`)

if (shymkent) {
  const { data: rows } = await db
    .from('universities')
    .select('slug, short_name, majors_count, min_fee, is_published')
    .eq('city_id', shymkent.id)
    .order('majors_count', { ascending: false })
  if (rows?.length) {
    console.log('')
    console.table(
      rows.map((r) => ({
        вуз: r.short_name ?? r.slug,
        программ: r.majors_count,
        'цена от': r.min_fee ? r.min_fee.toLocaleString('ru-RU') + ' ₸' : '—',
        опубликован: r.is_published ? 'да' : 'нет',
      })),
    )
  }
}

// ── программы ────────────────────────────────────────────────────────
console.log('═══ Образовательные программы ═══')
const majors = await count('university_majors')
const noPrice = await count('university_majors', (q) => q.is('fee_per_year', null))
console.log(`   всего программ: ${majors.n}`)
console.log(`   без опубликованной цены: ${noPrice.n} (это нормально — вузы их не публикуют)`)
if (noPrice.error?.includes('fee_per_year')) {
  console.log(`${BAD} Колонка fee_per_year не допускает null — выполните shymkent-universities.sql,`)
  console.log('   он снимает это ограничение первой же строкой.')
}

// ── хранилище ────────────────────────────────────────────────────────
console.log('\n═══ Хранилище файлов ═══')
const { data: buckets, error: bErr } = await db.storage.listBuckets()
if (bErr) {
  console.log(`${BAD} Не удалось получить список бакетов: ${bErr.message}`)
} else {
  for (const need of ['university-media', 'avatars']) {
    const b = buckets.find((x) => x.name === need)
    if (!b) console.log(`${BAD} бакет ${need} не создан`)
    else if (!b.public) console.log(`${WARN} бакет ${need} есть, но не публичный — фото не будут видны`)
    else console.log(`${OK} бакет ${need} — публичный`)
  }
}

// ── доступ анонимом (RLS) ────────────────────────────────────────────
console.log('\n═══ Права доступа (RLS) ═══')
const { data: anonRead, error: anonErr } = await pub
  .from('universities')
  .select('slug')
  .eq('is_published', true)
  .limit(1)
if (anonErr) console.log(`${BAD} Гость не может читать каталог: ${anonErr.message}`)
else if (!anonRead?.length) console.log(`${WARN} Гость читает каталог, но опубликованных вузов нет`)
else console.log(`${OK} Гость видит опубликованные вузы`)

const { error: anonWrite } = await pub.from('universities').insert({ slug: 'rls-probe', name_ru: 'x' })
if (anonWrite) console.log(`${OK} Гость не может писать в каталог (так и должно быть)`)
else {
  console.log(`${BAD} Гость СМОГ записать в universities — RLS не работает!`)
  await db.from('universities').delete().eq('slug', 'rls-probe')
}

// ── админы ───────────────────────────────────────────────────────────
console.log('\n═══ Администраторы ═══')
const { data: admins, error: aErr } = await db
  .from('profiles')
  .select('email, role')
  .eq('role', 'superadmin')
if (aErr) console.log(`${WARN} Не удалось прочитать profiles: ${aErr.message}`)
else if (!admins.length) {
  console.log(`${WARN} Суперадминов нет. Зарегистрируйтесь на сайте, потом в SQL Editor:`)
  console.log("   update public.profiles set role = 'superadmin' where email = 'ваш@email.com';")
} else {
  admins.forEach((a) => console.log(`${OK} ${a.email}`))
}

console.log('\nГотово.\n')
