-- Only the Edge Function's service role can access game state or secrets.
create table public.night_market_state (
  id integer primary key check (id = 1),
  version bigint not null default 0,
  game jsonb not null default '{"schema":1,"room":null}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.night_market_state(id) values (1);
create table public.night_market_archives (
  id bigint generated always as identity primary key,
  saved_at timestamptz not null default now(),
  game jsonb not null
);
create table public.night_market_limits (
  bucket text primary key,
  starts_at timestamptz not null default now(),
  hits integer not null default 1
);
alter table public.night_market_state enable row level security;
alter table public.night_market_archives enable row level security;
alter table public.night_market_limits enable row level security;
revoke all on public.night_market_state,public.night_market_archives,public.night_market_limits from anon,authenticated;
grant all on public.night_market_state,public.night_market_archives,public.night_market_limits to service_role;
grant usage,select on sequence public.night_market_archives_id_seq to service_role;
-- Compare-and-swap commits serialize concurrent students without lost decisions.
create function public.night_market_commit(expected_version bigint, next_game jsonb, archive_game jsonb default null)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update public.night_market_state set game=next_game,version=version+1,updated_at=now()
    where id=1 and version=expected_version;
  if not found then return false; end if;
  if archive_game is not null then
    insert into public.night_market_archives(game) values(archive_game);
  end if;
  return true;
end;
$$;
create function public.night_market_limit(bucket_key text, max_hits integer, window_seconds integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare count_now integer;
begin
  insert into public.night_market_limits as l(bucket,starts_at,hits) values(bucket_key,now(),1)
  on conflict(bucket) do update set
    hits=case when l.starts_at < now()-make_interval(secs=>window_seconds) then 1 else l.hits+1 end,
    starts_at=case when l.starts_at < now()-make_interval(secs=>window_seconds) then now() else l.starts_at end
  returning hits into count_now;
  delete from public.night_market_limits where starts_at < now()-interval '1 day';
  return count_now<=max_hits;
end;
$$;
revoke all on function public.night_market_commit(bigint,jsonb,jsonb),public.night_market_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.night_market_commit(bigint,jsonb,jsonb),public.night_market_limit(text,integer,integer) to service_role;
