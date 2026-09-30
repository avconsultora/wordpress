-- ELEVATOR AV — parche anti-trampa (pegar en SQL Editor → New query → Run).
-- Se puede correr más de una vez. No borra datos.
-- 1) El servidor registra cuándo arranca cada partida y mide él la duración.
-- 2) El piso alcanzado tiene que ser coherente con la cantidad de aciertos.

create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  event_id    text not null check (char_length(event_id) between 1 and 60),
  started_at  timestamptz not null default now(),
  used        boolean not null default false
);
create index if not exists games_started_idx on public.games (started_at);
alter table public.games enable row level security;
revoke all on public.games from anon, authenticated;

-- El juego llama a esto al tocar JUGAR; devuelve el id de la partida.
create or replace function public.start_game(p_event_id text) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare
  gid uuid;
begin
  insert into public.games (event_id) values (left(coalesce(p_event_id, ''), 60)) returning id into gid;
  return gid;
end $fn$;
revoke all on function public.start_game(text) from public;
grant execute on function public.start_game(text) to anon, authenticated;

-- Rango de pisos posible para un score (mantener sincronizado con CONFIG).
create or replace function public.floor_range_ok(p_score int, p_floor int) returns boolean
language plpgsql immutable as $fn$
declare
  min_gap0 int := 3; max_gap0 int := 6; growth_every int := 5; gap_cap int := 10;
  lo int := 1; hi int := 1; mx int; mn int;
begin
  for r in 0 .. greatest(p_score, 0) loop
    mx := least(gap_cap, max_gap0 + r / growth_every);
    mn := least(mx, min_gap0 + r / growth_every);
    if r < p_score then lo := lo + mn; end if;
    hi := hi + mx;
  end loop;
  return p_floor between lo and hi + 2;
end $fn$;

create or replace function public.scores_before_insert() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare
  g record;
  elapsed_ms int;
begin
  new.id := gen_random_uuid();
  new.created_at := now();
  new.nickname := public.moderate_nickname(new.nickname);
  -- reintento de una partida ya guardada: dejamos que el unique responda 409
  if exists (select 1 from public.scores where game_id = new.game_id) then
    return new;
  end if;
  -- la partida tiene que haber sido iniciada por el servidor, en este evento, y no usada
  select * into g from public.games where id = new.game_id for update;
  if not found or g.used or g.event_id <> new.event_id then
    raise exception 'unknown game' using errcode = 'check_violation';
  end if;
  -- duración medida por el servidor (se ignora la que manda el cliente)
  elapsed_ms := floor(extract(epoch from (now() - g.started_at)) * 1000);
  if elapsed_ms > 7200000 then
    raise exception 'game expired' using errcode = 'check_violation';
  end if;
  new.duration_ms := elapsed_ms;
  if elapsed_ms < public.min_duration_ms(new.score) then
    raise exception 'duration too short for score' using errcode = 'check_violation';
  end if;
  if not public.floor_range_ok(new.score, new.max_floor) then
    raise exception 'floor does not match score' using errcode = 'check_violation';
  end if;
  -- rate limit: 1 envío cada 5 s por nickname y evento
  if exists (
    select 1 from public.scores
    where event_id = new.event_id and nickname = new.nickname
      and created_at > now() - interval '5 seconds'
  ) then
    raise exception 'too many submissions' using errcode = 'check_violation';
  end if;
  update public.games set used = true where id = new.game_id;
  return new;
end $fn$;
revoke all on function public.scores_before_insert() from public, anon, authenticated;
