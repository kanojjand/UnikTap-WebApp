-- 0010 — бакеты хранилища и политики (раздел 4.11)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('university-media', 'university-media', true, 5242880,
   array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 5242880,
   array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select
  using (bucket_id in ('university-media', 'avatars'));

drop policy if exists "media superadmin write" on storage.objects;
create policy "media superadmin write" on storage.objects for all to authenticated
  using (bucket_id = 'university-media' and public.is_superadmin())
  with check (bucket_id = 'university-media' and public.is_superadmin());

-- Аватар: путь {user_id}/avatar.webp — писать может только владелец
drop policy if exists "avatar owner write" on storage.objects;
create policy "avatar owner write" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
