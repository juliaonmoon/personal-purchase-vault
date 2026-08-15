-- Private storage bucket for receipts/warranties/photos.
-- Objects are keyed as "<user_id>/<uuid>-<filename>" so RLS can scope access
-- by folder name without a second lookup table.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_bucket_owner_select" on storage.objects
  for select using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_bucket_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_bucket_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
