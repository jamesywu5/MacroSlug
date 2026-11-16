insert into public.food_db
  (dining_hall, meal_type, name, calories, allergens, total_fat, total_carb, protein, scraped_at)
values
  ('Crown/Merrill',    'Breakfast', 'Scrambled Eggs',  180, '["egg"]',          12, 2,  14, '2026-11-01T08:00:00Z'),
  ('Crown/Merrill',    'Lunch',     'Grilled Chicken', 220, '[]',                6, 0,  38, '2026-11-01T08:00:00Z'),
  ('Porter/Kresge',    'Dinner',    'Cheese Pizza',    290, '["milk","wheat"]', 11, 35, 12, '2026-11-01T08:00:00Z'),
  ('Cowell/Stevenson', 'Dinner',    'Tofu Stir Fry',   240, '["soy"]',           9, 26, 15, '2026-11-01T08:00:00Z');
