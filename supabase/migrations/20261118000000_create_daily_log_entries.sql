create table public.daily_log_entries (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  food_name text not null check (length(trim(food_name)) > 0),
  serving_quantity numeric not null check (serving_quantity > 0 and serving_quantity < 'Infinity'::numeric),
  consumption_date date not null,
  calories numeric check (calories >= 0 and calories < 'Infinity'::numeric),
  protein numeric check (protein >= 0 and protein < 'Infinity'::numeric),
  carbohydrate numeric check (carbohydrate >= 0 and carbohydrate < 'Infinity'::numeric),
  fat numeric check (fat >= 0 and fat < 'Infinity'::numeric),
  created_at timestamptz not null default now()
);

create index daily_log_entries_owner_date_idx on public.daily_log_entries (owner_id, consumption_date);

alter table public.daily_log_entries enable row level security;
create policy "Users manage their own daily log entries" on public.daily_log_entries
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
