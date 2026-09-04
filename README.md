# UnikTap

PWA для абитуриентов Казахстана: каталог университетов, специальности с проходными баллами, отзывы
студентов, карта, калькулятор ЕНТ и админка со статистикой. Интерфейс на русском и казахском.

Next.js 15 (App Router, React 19) · TypeScript · Tailwind · Supabase (Postgres + Auth + Storage) · Vercel.

## Требования

Node.js 20+, аккаунты Supabase и Vercel.

## Локальный запуск

```bash
npm install
cp .env.example .env.local   # заполнить ключами из Supabase
npm run dev
```

Приложение поднимется на http://localhost:3000. Без заполненного `.env.local` сборка упадёт —
ключи обязательны, база нужна даже для главной страницы.

### Переменные окружения

| Переменная | Где взять | Примечание |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | обязательна |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | там же, `anon public` | обязательна |
| `SUPABASE_SERVICE_ROLE_KEY` | там же, `service_role` | обязательна, только сервер |
| `NEXT_PUBLIC_SITE_URL` | адрес сайта, локально `http://localhost:3000` | обязательна |
| `REVALIDATE_SECRET` | любая случайная строка от 32 символов | обязательна |

`service_role` даёт полный доступ к базе в обход RLS. Он импортируется только в `lib/supabase/admin.ts`
с пометкой `server-only`, поэтому в клиентский бандл не попадает — и в git его коммитить нельзя.

## База данных

1. Создать проект в Supabase, регион Frankfurt (`eu-central-1`).
2. Открыть `supabase/setup-all.sql`, скопировать целиком в SQL Editor, выполнить. Внутри миграции
   0001–0010 и сид одним куском. Если ведёте историю миграций — `supabase db push` либо файлы из
   `supabase/migrations/` по порядку, затем `supabase/seed.sql`. Скрипт идемпотентный, повторный
   запуск данные не задвоит.
3. Проверить, что в Storage появились бакеты `university-media` и `avatars` — оба публичные,
   лимит файла 5 MB. Если нет, создать вручную.

Сид создаёт 18 городов, 13 предметов ЕНТ, 56 образовательных программ, 3 демо-ВУЗа с контактами,
специальностями и историей баллов, а также настройки и статические страницы.

Если Supabase ругается на `CREATE EXTENSION in a read-only transaction`, используйте
`supabase/setup-all-no-extensions.sql` — тот же скрипт без установки расширений.

### Авторизация

В Authentication → Providers включить Email (с `Confirm email`) и, если нужен вход через Google,
добавить Client ID и Secret из Google Cloud Console. В Authentication → URL Configuration →
Redirect URLs добавить все четыре адреса:

```
http://localhost:3000/ru/auth/callback
http://localhost:3000/kk/auth/callback
https://<домен>/ru/auth/callback
https://<домен>/kk/auth/callback
```

Вход по SMS выключен флагом `auth_phone_enabled` и подключения не требует.

## Деплой

Импортировать репозиторий в Vercel, регион `fra1`, прописать те же переменные окружения (в
`NEXT_PUBLIC_SITE_URL` — боевой домен) и задеплоить. После смены домена нужна пересборка: адрес
попадает в sitemap, OG-теги и ссылки авторизации на этапе сборки.

Чтобы стать суперадмином: зарегистрироваться в приложении, затем в SQL Editor выполнить

```sql
update public.profiles set role = 'superadmin' where email = 'ваш@email';
```

После этого открывается `/admin`.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | локальная разработка |
| `npm run build` | production-сборка, нужен доступ к `fonts.googleapis.com` за шрифтом Inter |
| `npm run start` | запуск собранного приложения |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | алгоритмы ЕНТ, совпадение ключей ru/kk, поведение диалогов |
| `npm run gen:types` | перегенерировать `types/database.ts` из живой базы |

## Структура

```
app/
├─ [locale]/                 приложение абитуриента (ru | kk)
│  ├─ page.tsx               каталог с фильтрами и сортировкой
│  ├─ universities/[slug]    обзор · поступление · специальности · отзывы · контакты
│  └─ map · calculator · favorites · profile · onboarding · auth · faq · (static)/[slug]
├─ admin/                    админка (только русский, из индекса исключена)
│  ├─ page.tsx               дашборд с графиками
│  └─ universities · majors · reviews · users · dictionaries · content · analytics · settings · audit
└─ api/                      track (события аналитики) · revalidate (инвалидация ISR из админки)

components/ui/               дизайн-система
components/student/          экраны абитуриента
components/admin/            экраны админки
lib/queries/                 все чтения из БД
lib/actions/                 все мутации (Server Actions)
lib/ent.ts                   шансы на грант, пороги, ранжирование
messages/{ru,kk}.json        тексты интерфейса
supabase/                    миграции, сид и setup-all.sql
```

Компоненты не ходят в Supabase напрямую: чтение через `lib/queries/*`, запись через `lib/actions/*`.

## Роли

| Роль | Как получает | Что может |
|---|---|---|
| Гость | просто открыл сайт | каталог, карточки ВУЗов, специальности, отзывы, карта, калькулятор |
| Пользователь | регистрация по email | + избранное, профиль с баллом ЕНТ, свои отзывы, жалобы |
| Суперадмин | `profiles.role = 'superadmin'` вручную | полный CRUD, модерация, статистика, настройки |

`/admin` закрыт на трёх уровнях: middleware, проверка роли в серверном layout и RLS в базе.
Без роли раздел отдаёт 404, а не 403.

## Безопасность

- RLS включён на всех 19 таблицах, политики в `supabase/migrations/0009_rls.sql`.
- Поля `role`, `university_id`, `is_blocked` защищены триггером `guard_profile_fields` — поднять себе
  права через обычный апдейт профиля нельзя, они меняются только сервисным ключом из админки.
- Markdown из базы проходит через `rehype-sanitize` перед рендером.
- Заголовки безопасности (`X-Frame-Options`, `Referrer-Policy`, HSTS) — в `next.config.ts`.
- Аналитика обезличена: IP и user-agent не пишутся, из referrer остаётся только домен.

## Резервные копии

На платном плане Supabase бэкапы делаются сами. На бесплатном — вручную:

```bash
supabase db dump -f backup-$(date +%F).sql --db-url "postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres"
```

## Чего нет в MVP

Кабинеты университетов, сравнение ВУЗов, push-уведомления, онлайн-подача документов, чат с приёмной
комиссией, колледжи и магистратура, платное продвижение, приложения в сторах, тёмная тема. Поля в БД
под это заложены.
