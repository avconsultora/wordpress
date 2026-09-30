-- ELEVATOR AV — Supabase
-- Pegá todo esto en Supabase → SQL Editor → New query → Run.
-- Se puede correr más de una vez: no borra datos.

create extension if not exists pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════
-- Moderación: palabras prohibidas (editable desde Table Editor → banned_words)
-- Se comparan sin acentos, sin espacios y con 0→o 1→i 3→e 4→a 5→s 7→t 8→b.
-- Las de 3 letras o menos solo matchean como palabra entera.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.banned_words (
  word text primary key check (word = lower(word) and char_length(word) between 2 and 40)
);
alter table public.banned_words enable row level security;
revoke all on public.banned_words from anon, authenticated;

insert into public.banned_words (word) values
  ('puto'),('puta'),('putita'),('trolo'),('trola'),('forro'),('forra'),('pelotudo'),('pelotuda'),
  ('boludo'),('boluda'),('concha'),('conchuda'),('chota'),('pija'),('verga'),('garcha'),('poronga'),
  ('orto'),('culo'),('culiado'),('cogida'),('coger'),('mogolico'),('mogolica'),('idiota'),('imbecil'),
  ('tarado'),('tarada'),('pajero'),('pajera'),('sorete'),('mierda'),('cagon'),('cagona'),('hdp'),
  ('hijodeputa'),('malparido'),('gil'),('gila'),('villero'),('sidoso'),('nazi'),
  ('hitler'),('marica'),('maricon'),('puton'),('teta'),('tetas'),('pene'),('vagina'),('porno'),('sexo'),
  ('fuck'),('shit'),('bitch'),('dick'),('cunt'),('nigger'),('nigga'),('faggot')
on conflict do nothing;

create or replace function public.fold_text(t text) returns text
language sql immutable as $fn$
  select translate(lower(t),
    'áàäâéèëêíìïîóòöôúùüûñ0134578',
    'aaaaeeeeiiiioooouuuunoieastb')
$fn$;

create or replace function public.moderate_nickname(raw text) returns text
language plpgsql stable security definer set search_path = public as $fn$
declare
  nick text;
  folded text;
  compact text;
  bad boolean;
begin
  nick := regexp_replace(coalesce(raw, ''), '[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ]', '', 'g');
  nick := btrim(regexp_replace(nick, '\s+', ' ', 'g'));
  nick := upper(left(nick, 12));
  nick := btrim(nick);
  folded := public.fold_text(nick);
  compact := regexp_replace(folded, '[^a-z]', '', 'g');
  select exists (
    select 1 from public.banned_words b
    where (char_length(b.word) <= 3 and b.word = any (regexp_split_to_array(folded, '[^a-z]+')))
       or (char_length(b.word) > 3 and position(regexp_replace(public.fold_text(b.word), '[^a-z]', '', 'g') in compact) > 0)
  ) into bad;
  if nick = '' or bad then
    nick := 'JUGADOR' || lpad((floor(random() * 10000))::int::text, 4, '0');
  end if;
  return nick;
end $fn$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Anti-trampa: duración mínima teórica para un score.
-- Mantener sincronizado con CONFIG en config.js. Se aplica con 40% de margen.
-- ═══════════════════════════════════════════════════════════════════════════
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
  margin       numeric := 0.6;   -- exigimos el 60% del mínimo teórico
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

-- ═══════════════════════════════════════════════════════════════════════════
-- Scores
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null unique,                       -- una partida = un envío
  event_id    text not null check (char_length(event_id) between 1 and 60),
  nickname    text not null check (char_length(nickname) between 1 and 12),
  score       int  not null check (score between 0 and 200),
  max_floor   int  not null check (max_floor between 1 and 3000),
  duration_ms int  not null check (duration_ms between 0 and 7200000),
  created_at  timestamptz not null default now()
);
create index if not exists scores_event_score_idx on public.scores (event_id, score desc, created_at);
create index if not exists scores_event_nick_idx on public.scores (event_id, nickname, created_at desc);

create or replace function public.scores_before_insert() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  -- el cliente no elige id ni fecha
  new.id := gen_random_uuid();
  new.created_at := now();
  new.nickname := public.moderate_nickname(new.nickname);
  if new.duration_ms < public.min_duration_ms(new.score) then
    raise exception 'duration too short for score' using errcode = 'check_violation';
  end if;
  -- reintento de una partida ya guardada: dejamos que el unique responda 409
  if exists (select 1 from public.scores where game_id = new.game_id) then
    return new;
  end if;
  -- rate limit: 1 envío cada 5 s por nickname y evento
  if exists (
    select 1 from public.scores
    where event_id = new.event_id and nickname = new.nickname
      and created_at > now() - interval '5 seconds'
  ) then
    raise exception 'too many submissions' using errcode = 'check_violation';
  end if;
  return new;
end $fn$;

drop trigger if exists scores_before_insert on public.scores;
create trigger scores_before_insert before insert on public.scores
  for each row execute function public.scores_before_insert();

alter table public.scores enable row level security;
revoke all on public.scores from anon, authenticated;
grant select, insert on public.scores to anon, authenticated;

drop policy if exists scores_insert on public.scores;
create policy scores_insert on public.scores for insert to anon, authenticated with check (true);
drop policy if exists scores_select on public.scores;
create policy scores_select on public.scores for select to anon, authenticated using (true);
-- Sin políticas de UPDATE ni DELETE: nadie puede modificar ni borrar con la anon key.

-- Ranking: top 10 del evento (mejor score por nickname) + puesto de una partida.
create or replace function public.get_ranking(p_event_id text, p_game_id uuid default null)
returns json language sql stable set search_path = public as $fn$
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
grant execute on function public.get_ranking(text, uuid) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Leads (consulta gratis) — anon NO puede leer, modificar ni borrar.
-- La única forma de escribir es la función submit_lead, que inserta y siempre
-- responde OK (aunque el WhatsApp ya estuviera cargado, para no revelarlo).
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  event_id    text not null check (char_length(event_id) between 1 and 60),
  whatsapp    text not null check (whatsapp ~ '^\+?[0-9]{8,15}\Z'),
  nombre      text check (nombre is null or char_length(nombre) <= 40),
  nickname    text check (nickname is null or char_length(nickname) <= 12),
  score       int  not null default 0 check (score between 0 and 200),
  status      text not null default 'nuevo',
  created_at  timestamptz not null default now(),
  unique (event_id, whatsapp)
);

alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
-- Sin políticas: con RLS activo y sin grants, anon no ve ni toca nada.

create or replace function public.submit_lead(
  p_event_id text, p_whatsapp text, p_nombre text default null,
  p_nickname text default null, p_score int default 0
) returns boolean
language plpgsql security definer set search_path = public as $fn$
declare
  wa text;
begin
  wa := btrim(coalesce(p_whatsapp, ''));
  wa := case when left(wa, 1) = '+' then '+' else '' end || regexp_replace(wa, '[^0-9]', '', 'g');
  if wa !~ '^\+?[0-9]{8,15}\Z' then
    raise exception 'invalid whatsapp' using errcode = 'check_violation';
  end if;
  insert into public.leads (event_id, whatsapp, nombre, nickname, score)
  values (
    left(p_event_id, 60),
    wa,
    nullif(left(btrim(regexp_replace(coalesce(p_nombre, ''), '[<>\n\r\t]', '', 'g')), 40), ''),
    nullif(left(btrim(coalesce(p_nickname, '')), 12), ''),
    least(greatest(coalesce(p_score, 0), 0), 200)
  )
  on conflict (event_id, whatsapp) do nothing;
  return true;
end $fn$;

revoke all on function public.submit_lead(text, text, text, text, int) from public;
grant execute on function public.submit_lead(text, text, text, text, int) to anon, authenticated;

-- Las funciones internas no se exponen por la API.
revoke all on function public.moderate_nickname(text) from public, anon, authenticated;
revoke all on function public.scores_before_insert() from public, anon, authenticated;

-- ═══ Anti-trampa: partidas iniciadas por el servidor (incluido en supabase-anti-trampa.sql) ═══
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
