-- Draft only: illustrative pilot ceiling, not an approved live budget.
begin;

create table public.closet_styling_usage (
  usage_day date not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  allowed_calls integer not null check (allowed_calls between 1 and 5),
  primary key (usage_day, owner_id)
);
create table public.closet_styling_global_usage (
  usage_day date primary key,
  allowed_calls integer not null check (allowed_calls between 1 and 80)
);
alter table public.closet_styling_usage enable row level security;
alter table public.closet_styling_global_usage enable row level security;
revoke all on public.closet_styling_usage, public.closet_styling_global_usage from public, anon, authenticated, service_role;

create function public.reserve_closet_styling_call(p_owner_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $budget$
declare
  day_utc date := (pg_catalog.statement_timestamp() at time zone 'UTC')::date;
  enabled_for_account boolean;
  account_total bigint;
  day_total bigint;
begin
  -- One transaction lock for the small pilot ensures the global cap is checked with the write.
  perform pg_catalog.pg_advisory_xact_lock(81754, 6091);
  select consent.enabled into enabled_for_account
    from public.closet_styling_consent as consent
    where consent.owner_id = p_owner_id and consent.version = 'wardrobe-metadata-v1'
    for share;
  if not coalesce(enabled_for_account, false) then return false; end if;

  select usage.allowed_calls into account_total from public.closet_styling_usage as usage
    where usage.usage_day = day_utc and usage.owner_id = p_owner_id;
  select usage.allowed_calls into day_total from public.closet_styling_global_usage as usage
    where usage.usage_day = day_utc;
  if coalesce(account_total, 0) >= 5 or coalesce(day_total, 0) >= 80 then return false; end if;

  insert into public.closet_styling_usage as usage (usage_day, owner_id, allowed_calls)
    values (day_utc, p_owner_id, 1)
    on conflict (usage_day, owner_id) do update set allowed_calls = usage.allowed_calls + 1;
  insert into public.closet_styling_global_usage as usage (usage_day, allowed_calls)
    values (day_utc, 1)
    on conflict (usage_day) do update set allowed_calls = usage.allowed_calls + 1;
  return true;
end
$budget$;

revoke all on function public.reserve_closet_styling_call(uuid) from public, anon, authenticated;
grant execute on function public.reserve_closet_styling_call(uuid) to service_role;

commit;
