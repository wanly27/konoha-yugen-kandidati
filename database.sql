-- КОНОХА: схема выдвижения кандидатов на пост Хокаге
create extension if not exists pgcrypto;

create table if not exists public.nomination_settings (
  id boolean primary key default true check (id = true),
  nominations_open boolean not null default true
);

insert into public.nomination_settings (id, nominations_open)
values (true, true)
on conflict (id) do nothing;

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(trim(nickname)) between 3 and 24),
  nickname_normalized text generated always as (lower(trim(nickname))) stored,
  steam_id text not null check (
    upper(trim(steam_id)) ~ '^(STEAM_[0-5]:[01]:[0-9]{1,12}|7656119[0-9]{10})$'
  ),
  steam_id_normalized text generated always as (upper(trim(steam_id))) stored,
  rank text not null check (char_length(trim(rank)) between 2 and 40),
  speech text not null check (char_length(trim(speech)) between 30 and 1500),
  created_at timestamptz not null default now(),
  constraint candidates_one_per_nickname unique (nickname_normalized),
  constraint candidates_one_per_steam_id unique (steam_id_normalized)
);

-- Проверка статуса приёма заявок внутри БД
create or replace function public.nominations_are_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select nominations_open from public.nomination_settings where id = true), false);
$$;

revoke all on function public.nominations_are_open() from public;
grant execute on function public.nominations_are_open() to anon, authenticated;

alter table public.candidates enable row level security;
alter table public.nomination_settings enable row level security;

drop policy if exists "Public can submit nominations" on public.candidates;
create policy "Public can submit nominations"
on public.candidates
for insert
to anon, authenticated
with check (public.nominations_are_open());

-- Посетители могут только отправлять заявки, но не читать чужие
revoke all on public.candidates from anon, authenticated;
grant insert (nickname, steam_id, rank, speech) on public.candidates to anon, authenticated;
revoke all on public.nomination_settings from anon, authenticated;

-- Управление приёмом заявок (для организатора в SQL Editor):
-- Закрыть приём:
-- update public.nomination_settings set nominations_open = false where id = true;
--
-- Открыть приём:
-- update public.nomination_settings set nominations_open = true where id = true;
--
-- Посмотреть все заявки:
-- select nickname, steam_id, rank, speech, created_at
-- from public.candidates
-- order by created_at asc;
