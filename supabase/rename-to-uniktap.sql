-- Переименование в уже наполненной базе: ВУЗ-Навигатор / ЖОО-Навигатор → UnikTap.
-- Выполнить один раз в SQL Editor. Скрипт безопасно запускать повторно.

update public.static_pages set
  title_ru   = replace(coalesce(title_ru, ''),   'ВУЗ-Навигатор', 'UnikTap'),
  title_kk   = replace(coalesce(title_kk, ''),   'ЖОО-Навигатор', 'UnikTap'),
  content_ru = replace(coalesce(content_ru, ''), 'ВУЗ-Навигатор', 'UnikTap'),
  content_kk = replace(coalesce(content_kk, ''), 'ЖОО-Навигатор', 'UnikTap')
where coalesce(title_ru, '')   like '%ВУЗ-Навигатор%'
   or coalesce(content_ru, '') like '%ВУЗ-Навигатор%'
   or coalesce(title_kk, '')   like '%ЖОО-Навигатор%'
   or coalesce(content_kk, '') like '%ЖОО-Навигатор%';

update public.faq set
  question_ru = replace(coalesce(question_ru, ''), 'ВУЗ-Навигатор', 'UnikTap'),
  answer_ru   = replace(coalesce(answer_ru, ''),   'ВУЗ-Навигатор', 'UnikTap'),
  question_kk = replace(coalesce(question_kk, ''), 'ЖОО-Навигатор', 'UnikTap'),
  answer_kk   = replace(coalesce(answer_kk, ''),   'ЖОО-Навигатор', 'UnikTap')
where coalesce(question_ru, '') like '%ВУЗ-Навигатор%'
   or coalesce(answer_ru, '')   like '%ВУЗ-Навигатор%'
   or coalesce(question_kk, '') like '%ЖОО-Навигатор%'
   or coalesce(answer_kk, '')   like '%ЖОО-Навигатор%';

-- Проверка: должно вернуть 0 строк
select 'static_pages' as таблица, slug from public.static_pages
where coalesce(content_ru, '') like '%Навигатор%' or coalesce(content_kk, '') like '%Навигатор%'
union all
select 'faq', question_ru from public.faq
where coalesce(answer_ru, '') like '%Навигатор%' or coalesce(answer_kk, '') like '%Навигатор%';
