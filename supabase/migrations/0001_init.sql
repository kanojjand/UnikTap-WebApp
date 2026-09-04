-- 0001 — расширения и перечисления
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

do $$ begin
  create type user_role as enum ('user', 'university_admin', 'superadmin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type university_type as enum ('national', 'state', 'private', 'international', 'autonomous');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_reason as enum ('spam', 'offensive', 'fake', 'personal_data', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admission_kind as enum ('step', 'document', 'condition', 'deadline', 'benefit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type degree_level as enum ('bachelor', 'master', 'phd', 'college');
exception when duplicate_object then null; end $$;

do $$ begin
  create type study_form as enum ('full_time', 'part_time', 'evening', 'distance');
exception when duplicate_object then null; end $$;
