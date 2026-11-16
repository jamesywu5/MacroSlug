create table public.food_db (
  id          bigint generated always as identity primary key,
  dining_hall text        not null,
  meal_type   text        not null,
  name        text        not null,
  calories    integer     not null,
  allergens   jsonb       not null default '[]'::jsonb,
  total_fat   real        not null default 0,
  total_carb  real        not null default 0,
  protein     real        not null default 0,
  scraped_at  timestamptz not null
);

create table public.food_json (
  id          bigint generated always as identity primary key,
  raw         jsonb       not null,
  uploaded_at timestamptz not null
);

-- No policies: only the service role key can read or write these tables.
alter table public.food_db enable row level security;
alter table public.food_json enable row level security;
