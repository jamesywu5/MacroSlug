"""Build the manual-audit checklist for S1-1 Task 4.

Picks a representative sample of scraped items from food.json and writes
audit.md: a table to fill in while comparing each item to the live UCSC page.

Run from apps/scraper, on the same day you scraped:
    python audit_sample.py
Options: --date YYYY-MM-DD (the day food.json was scraped), --seed N, --out FILE
"""
import argparse
import json
import random
from datetime import date

HALL_NAMES = {
    "20": "Crown/Merrill",
    "40": "Nine/Ten",
    "25": "Porter/Kresge",
    "30": "Oakes/RCC",
    "5": "Cowell/Stevenson",
}


def pick_sample(menu_json: dict, seed: int) -> list[dict]:
    """One random item per hall+meal, plus the edge cases worth checking."""
    rng = random.Random(seed)
    items = [
        {"dh": dh, "meal": meal, **food}
        for dh, meals in menu_json.items()
        for meal, foods in meals.items()
        for food in foods
    ]

    chosen, why = {}, {}

    def add(item, reason):
        key = (item["dh"], item["meal"], item["name"])
        chosen.setdefault(key, item)
        why.setdefault(key, []).append(reason)

    groups = {}
    for it in items:
        groups.setdefault((it["dh"], it["meal"]), []).append(it)
    for key in sorted(groups):
        add(rng.choice(groups[key]), "random pick")

    if items:
        add(min(items, key=lambda i: int(i["calories"])), "lowest calories")
        add(max(items, key=lambda i: int(i["calories"])), "highest calories")
        add(max(items, key=lambda i: len(i["allergens"])), "most allergen/diet icons")
        no_icons = [i for i in items if not i["allergens"]]
        if no_icons:
            add(rng.choice(no_icons), "no allergen/diet icons")
        odd_names = [i for i in items if not i["name"].replace(" ", "").isalnum()]
        if odd_names:
            add(rng.choice(odd_names), "punctuation in name")
        for it in items:
            if len(it["macros"]) < 3:
                add(it, "missing a macro")

    return [{**chosen[k], "why": ", ".join(why[k])} for k in chosen]


def cell(text) -> str:
    return str(text).replace("|", "\\|")


def build_report(menu_json: dict, day: date, seed: int) -> str:
    sample = pick_sample(menu_json, seed)
    out = [
        "# Manual audit: scraped data vs. UCSC dining pages",
        "",
        f"- Scrape date: {day.isoformat()}  |  sample seed: {seed}  |  items: {len(sample)}",
        "- Auditor: ________   Audit date: ________",
        "",
        "## How to audit",
        "1. On nutrition.sa.ucsc.edu, open the item's hall, then click Nutrition Calculator",
        "   (the long menu) and choose the item's meal.",
        "2. Click the item's name to open its nutrition label.",
        "3. Compare calories, protein, total fat, total carbs, and the allergen/diet icons.",
        "4. Tick the box if everything matches. Otherwise write what the site shows in Notes.",
        "",
        "Do this the same day as the scrape: menus change daily.",
    ]

    by_group = {}
    for it in sample:
        by_group.setdefault((it["dh"], it["meal"]), []).append(it)

    for (dh, meal), group in by_group.items():
        hall = HALL_NAMES.get(dh, dh)
        out += [
            "",
            f"## {hall}: {meal}",
            "| OK | Item | Calories | Protein | Fat | Carbs | Icons | Why sampled | Notes |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
        ]
        for it in group:
            m = it["macros"]
            out.append(
                "| [ ] | {} | {} | {} | {} | {} | {} | {} |  |".format(
                    cell(it["name"]),
                    it["calories"],
                    m.get("Protein", "missing"),
                    m.get("Total Fat", "missing"),
                    m.get("Tot. Carb", "missing"),
                    cell(", ".join(it["allergens"]) or "none"),
                    it["why"],
                )
            )

    out += [
        "",
        "## Summary",
        "- Items checked: __ / __     Matched: __     Mismatched: __",
        "- Issues found (what the scraper got wrong, and how often):",
        "  - ",
    ]
    return "\n".join(out) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--date", default=date.today().isoformat())
    ap.add_argument("--seed", type=int, default=115)
    ap.add_argument("--out", default="audit.md")
    args = ap.parse_args()

    with open("food.json", encoding="utf-8") as f:
        menu_json = json.load(f)
    report = build_report(menu_json, date.fromisoformat(args.date), args.seed)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()