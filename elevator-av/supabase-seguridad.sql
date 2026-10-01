-- ELEVATOR AV — parche de seguridad (incluye el anti-trampa anterior).
-- Pegar en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez. No borra datos.

-- ── Límite de pedidos por IP ────────────────────────────────────────────────
-- Generoso a propósito: en un evento muchos celulares comparten el mismo Wi-Fi.
create table if not exists public.rate_events (
  id    bigserial primary key,
  ip    text not null,
  kind  text not null,
  at    timestamptz not null default now()
);
create index if not exists rate_events_idx on public.rate_events (kind, ip, at);
alter table public.rate_events enable row level security;
revoke all on public.rate_events from anon, authenticated;

create or replace function public.client_ip() returns text
language plpgsql stable as $fn$
declare
  h json;
  v_ip text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    h := null;
  end;
  if h is not null then
    v_ip := nullif(btrim(split_part(coalesce(h->>'cf-connecting-ip', h->>'x-real-ip', h->>'x-forwarded-for', ''), ',', 1)), '');
  end if;
  return left(coalesce(v_ip, 'desconocida'), 64);
end $fn$;

create or replace function public.rate_ok(p_kind text, p_max int, p_window interval) returns boolean
language plpgsql security definer set search_path = public as $fn$
declare
  v_ip text := public.client_ip();
  n int;
begin
  -- sin IP conocida no limitamos (si no, todo el evento compartiría el mismo cupo)
  if v_ip = 'desconocida' then
    return true;
  end if;
  if random() < 0.02 then
    delete from public.rate_events where at < now() - interval '1 day';
  end if;
  select count(*) into n from public.rate_events r
  where r.kind = p_kind and r.ip = v_ip and r.at > now() - p_window;
  if n >= p_max then
    return false;
  end if;
  insert into public.rate_events (ip, kind) values (v_ip, p_kind);
  return true;
end $fn$;

-- ── Reglas del juego del lado del servidor (mantener sincronizado con CONFIG) ──
-- Tope de aciertos creíble. Subilo si alguien muy bueno lo alcanza de verdad.
create or replace function public.max_plausible_score() returns int
language sql immutable as $fn$ select 80 $fn$;

-- Duración mínima para un score: se exige el 90% del mínimo teórico.
create or replace function public.min_duration_ms(p_score int) returns int
language plpgsql immutable as $fn$
declare
  start_speed  numeric := 1.6;
  speed_mult   numeric := 1.09;
  max_speed    numeric := 9;
  min_gap0     int     := 3;
  max_gap0     int     := 6;
  growth_every int     := 5;
  gap_cap      int     := 10;
  tol0         numeric := 0.30;
  tol_min      numeric := 0.18;
  tol_step     numeric := 0.006;
  transition   numeric := 1100;
  margin       numeric := 0.9;
  ms numeric := 0;
  speed numeric; mx int; mn int; tol numeric;
begin
  for r in 0 .. greatest(p_score, 0) - 1 loop
    speed := least(max_speed, start_speed * power(speed_mult, r));
    mx := least(gap_cap, max_gap0 + r / growth_every);
    mn := least(mx, min_gap0 + r / growth_every);
    tol := greatest(tol_min, tol0 - r * tol_step);
    ms := ms + ((mn - tol) / speed) * 1000 + transition;
  end loop;
  return floor(ms * margin);
end $fn$;

-- Rango de pisos posible para un score.
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

-- ── Partidas iniciadas por el servidor ──────────────────────────────────────
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  event_id    text not null check (char_length(event_id) between 1 and 60),
  started_at  timestamptz not null default now(),
  used        boolean not null default false
);
alter table public.games add column if not exists ip text;
create index if not exists games_started_idx on public.games (started_at);
alter table public.games enable row level security;
revoke all on public.games from anon, authenticated;

create or replace function public.start_game(p_event_id text) returns uuid
language plpgsql security definer set search_path = public as $fn$
declare
  gid uuid;
begin
  if not public.rate_ok('start_game', 120, interval '10 minutes') then
    raise exception 'rate limit' using errcode = 'check_violation';
  end if;
  if random() < 0.02 then
    delete from public.games where used = false and started_at < now() - interval '1 day';
  end if;
  insert into public.games (event_id, ip)
  values (left(coalesce(p_event_id, ''), 60), public.client_ip())
  returning id into gid;
  return gid;
end $fn$;
revoke all on function public.start_game(text) from public;
grant execute on function public.start_game(text) to anon, authenticated;

-- ── Scores ──────────────────────────────────────────────────────────────────
alter table public.scores add column if not exists ip text;

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
  if not public.rate_ok('score', 60, interval '10 minutes') then
    raise exception 'rate limit' using errcode = 'check_violation';
  end if;
  -- la partida tiene que haber sido iniciada por el servidor, en este evento, y no usada
  select * into g from public.games where id = new.game_id for update;
  if not found or g.used or g.event_id <> new.event_id then
    raise exception 'unknown game' using errcode = 'check_violation';
  end if;
  if new.score > public.max_plausible_score() then
    raise exception 'score not plausible' using errcode = 'check_violation';
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
  -- 1 envío cada 5 s por nickname y evento
  if exists (
    select 1 from public.scores
    where event_id = new.event_id and nickname = new.nickname
      and created_at > now() - interval '5 seconds'
  ) then
    raise exception 'too many submissions' using errcode = 'check_violation';
  end if;
  new.ip := g.ip;
  update public.games set used = true where id = new.game_id;
  return new;
end $fn$;

drop trigger if exists scores_before_insert on public.scores;
create trigger scores_before_insert before insert on public.scores
  for each row execute function public.scores_before_insert();

-- La tabla ya no se puede leer desde afuera: el ranking sale solo por get_ranking.
revoke all on public.scores from anon, authenticated;
grant insert on public.scores to anon, authenticated;
drop policy if exists scores_select on public.scores;
drop policy if exists scores_insert on public.scores;
create policy scores_insert on public.scores for insert to anon, authenticated with check (true);

create or replace function public.get_ranking(p_event_id text, p_game_id uuid default null)
returns json language sql stable security definer set search_path = public as $fn$
  with best as (
    select distinct on (nickname) nickname, score, created_at
    from public.scores
    where event_id = p_event_id
    order by nickname, score desc, created_at asc
  ), ranked as (
    select row_number() over (order by score desc, created_at asc)::int as pos, nickname, score
    from best
  ), mine as (
    select nickname from public.scores where game_id = p_game_id and event_id = p_event_id
  )
  select json_build_object(
    'top',   coalesce((select json_agg(t order by t.pos) from (select pos, nickname, score from ranked where pos <= 10) t), '[]'::json),
    'me',    (select row_to_json(m) from (select pos, nickname, score from ranked where nickname = (select nickname from mine)) m),
    'total', (select count(*) from best)
  )
$fn$;
revoke all on function public.get_ranking(text, uuid) from public;
grant execute on function public.get_ranking(text, uuid) to anon, authenticated;

-- ── Leads ───────────────────────────────────────────────────────────────────
create or replace function public.submit_lead(
  p_event_id text, p_whatsapp text, p_nombre text default null,
  p_nickname text default null, p_score int default 0
) returns boolean
language plpgsql security definer set search_path = public as $fn$
declare
  wa text;
  nm text;
  nk text;
begin
  if not public.rate_ok('lead', 40, interval '1 hour') then
    raise exception 'rate limit' using errcode = 'check_violation';
  end if;
  wa := btrim(coalesce(p_whatsapp, ''));
  wa := case when left(wa, 1) = '+' then '+' else '' end || regexp_replace(wa, '[^0-9]', '', 'g');
  if wa !~ '^\+?[0-9]{8,15}\Z' then
    raise exception 'invalid whatsapp' using errcode = 'check_violation';
  end if;
  -- sin caracteres de control ni fórmulas de Excel al exportar a CSV (= + - @ al inicio)
  nm := regexp_replace(coalesce(p_nombre, ''), '[[:cntrl:]<>]', '', 'g');
  nm := regexp_replace(btrim(nm), '^[=+@\-]+', '');
  nk := regexp_replace(coalesce(p_nickname, ''), '[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ]', '', 'g');
  insert into public.leads (event_id, whatsapp, nombre, nickname, score)
  values (
    left(coalesce(p_event_id, ''), 60),
    wa,
    nullif(left(btrim(nm), 40), ''),
    nullif(left(btrim(nk), 12), ''),
    least(greatest(coalesce(p_score, 0), 0), 200)
  )
  on conflict (event_id, whatsapp) do nothing;
  return true;
end $fn$;
revoke all on function public.submit_lead(text, text, text, text, int) from public;
grant execute on function public.submit_lead(text, text, text, text, int) to anon, authenticated;

-- ── Funciones internas: no se pueden llamar desde afuera ────────────────────
revoke all on function public.fold_text(text) from public, anon, authenticated;
revoke all on function public.moderate_nickname(text) from public, anon, authenticated;
revoke all on function public.min_duration_ms(int) from public, anon, authenticated;
revoke all on function public.floor_range_ok(int, int) from public, anon, authenticated;
revoke all on function public.max_plausible_score() from public, anon, authenticated;
revoke all on function public.client_ip() from public, anon, authenticated;
revoke all on function public.rate_ok(text, int, interval) from public, anon, authenticated;
revoke all on function public.scores_before_insert() from public, anon, authenticated;
