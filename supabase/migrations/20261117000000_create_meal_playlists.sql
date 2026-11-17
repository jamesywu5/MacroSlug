create table public.meal_playlists (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.meal_playlist_items (
  id bigint generated always as identity primary key,
  playlist_id bigint not null references public.meal_playlists(id) on delete cascade,
  food_name text not null check (length(trim(food_name)) > 0),
  serving_quantity numeric not null check (serving_quantity > 0),
  calories numeric check (calories >= 0),
  protein numeric check (protein >= 0),
  carbohydrate numeric check (carbohydrate >= 0),
  fat numeric check (fat >= 0)
);

alter table public.meal_playlists enable row level security;
alter table public.meal_playlist_items enable row level security;

create policy "Users manage their own playlists" on public.meal_playlists
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users manage items in their own playlists" on public.meal_playlist_items
  for all to authenticated
  using (exists (select 1 from public.meal_playlists where id = playlist_id and owner_id = auth.uid()))
  with check (exists (select 1 from public.meal_playlists where id = playlist_id and owner_id = auth.uid()));
