-- Draft policy for an existing private Supabase bucket. This migration does not create a bucket.
-- Configure the bucket through the approved Storage API before even trying it in staging.
begin;

do $guard$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'mfc-wardrobe-private-v1' and public is false
  ) then raise exception 'The future wardrobe bucket must exist and be private.'; end if;
end
$guard$;

-- Other permissive storage policies must never expand access to this bucket.
create policy closet_photo_owner_fence on storage.objects
  as restrictive for all to authenticated
  using (
    bucket_id <> 'mfc-wardrobe-private-v1'
    or exists (
      select 1 from public.closet_garments as garment
      where garment.owner_id = (select auth.uid()) and garment.photo_object_key = storage.objects.name
    )
  )
  with check (
    bucket_id <> 'mfc-wardrobe-private-v1'
    or exists (
      select 1 from public.closet_garments as garment
      where garment.owner_id = (select auth.uid()) and garment.photo_object_key = storage.objects.name
    )
  );

-- Signed-out roles lack access to wardrobe tables. Deny this bucket explicitly even
-- if unrelated project policies allow other objects to be accessed anonymously.
create policy closet_photo_no_anon on storage.objects
  as restrictive for all to anon
  using (bucket_id <> 'mfc-wardrobe-private-v1')
  with check (bucket_id <> 'mfc-wardrobe-private-v1');

-- Avoid renaming, moving or upserting into/out of this bucket. A production writer must separately
-- verify a replacement and rollback design before exposing photo replacement.
create policy closet_photo_immutable_key on storage.objects
  as restrictive for update to anon, authenticated
  using (bucket_id <> 'mfc-wardrobe-private-v1')
  with check (bucket_id <> 'mfc-wardrobe-private-v1');

create policy closet_photo_read on storage.objects for select to authenticated
  using (bucket_id = 'mfc-wardrobe-private-v1');
create policy closet_photo_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'mfc-wardrobe-private-v1');
create policy closet_photo_delete on storage.objects for delete to authenticated
  using (bucket_id = 'mfc-wardrobe-private-v1');

commit;
