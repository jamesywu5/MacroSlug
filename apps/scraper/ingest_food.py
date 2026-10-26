import json, os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

DINING_HALL_MAP = {
    "20": "Crown/Merrill",
    "40": "Nine/Ten",
    "25": "Porter/Kresge",
    "30": "Oakes/RCC",
    "5": "Cowell/Stevenson"
}

with open("food.json", "r") as f:
    menu_json = json.load(f)

rows = []
scraped_time = datetime.now().isoformat()

for dh_id, meals in menu_json.items():
    dining_hall_name = DINING_HALL_MAP.get(dh_id, "Unknown")
    for meal, foods in meals.items():
        for food in foods:
            # Extract macros into separate columns
            macros = food.get("macros", {})
            
            row = {
                "dining_hall": dining_hall_name,
                "meal_type": meal,  # Changed from meal
                "name": food["name"],
                "calories": int(food["calories"]),
                "allergens": food["allergens"],  # jsonb array
                "total_fat": float(macros.get("Total Fat", 0)),  # Extract from macros
                "total_carb": float(macros.get("Tot. Carb", 0)),  # Extract from macros
                "protein": float(macros.get("Protein", 0)),  # Extract from macros
                "scraped_at": scraped_time
            }
            rows.append(row)

if rows:
    try:
        # Clear existing data before inserting new data
        supabase.table("food_db").delete().neq("id", 0).execute()
        print("✓ Cleared existing data from food_db")
        
        # Insert into main food_db table
        response = supabase.table("food_db").insert(rows).execute()
        print(f"✓ Successfully inserted {len(rows)} rows into food_db")
        
        # Insert raw JSON into food_json table for backup
        raw_json_row = {
            "raw": menu_json,
            "uploaded_at": scraped_time
        }
        backup_response = supabase.table("food_json").insert([raw_json_row]).execute()
        print(f"✓ Successfully backed up raw JSON to food_json")
        
    except Exception as e:
        print(f"✗ Error: {e}")
else:
    print("No rows to insert.")
