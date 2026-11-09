"""Unit tests for menu_parser.py.

The HTML below is hand-written to look like the UCSC pages (a labelrecipe
name div, a bold "Calories N", label/value <font> pairs inside <td>, legend
<img> icons). It is NOT a copy of a real page. test_real_fixtures.py covers
saved real pages once capture_fixtures.py has been run.

Run from apps/scraper:  python -m unittest discover -s tests -t . -v
"""
import unittest
from datetime import date

from menu_parser import menu_url, parse_food_page, parse_menu_links


def label_html(
    name="Test Food",
    calories="115",
    fat="0.9g",
    carb="24.8g",
    protein="1.8g",
    allergens=("Vegan", "Wheat"),
    extra="",
):
    """Build a nutrition-label page. Pass None to leave a macro/calorie out."""
    rows = []
    for label, value in (("Total Fat", fat), ("Tot. Carb", carb), ("Protein", protein)):
        if value is not None:
            rows.append(
                f'<tr><td><font size="3"><b>{label}</b></font>'
                f'<font size="3">{value}</font></td></tr>'
            )
    cal = f"<b>Calories {calories}</b>" if calories is not None else ""
    imgs = "".join(
        f'<img alt="{a}" src="LegendImages/{a.lower()}.gif" width="25"/>'
        for a in allergens
    )
    return (
        "<html><body>"
        f'<div class="labelrecipe">{name}</div>'
        f"<table><tr><td>{cal}</td></tr>{''.join(rows)}</table>"
        f"{imgs}{extra}</body></html>"
    )


class ParseFoodPageTests(unittest.TestCase):
    def test_parses_a_complete_item(self):
        self.assertEqual(
            parse_food_page(label_html()),
            {
                "name": "Test Food",
                "calories": "115",
                "allergens": ["Vegan", "Wheat"],
                "macros": {"Total Fat": "0.9", "Tot. Carb": "24.8", "Protein": "1.8"},
            },
        )

    def test_decimal_and_whole_number_macros_keep_their_text(self):
        item = parse_food_page(label_html(fat="12g", carb="0.2g", protein="38.5g"))
        self.assertEqual(
            item["macros"], {"Total Fat": "12", "Tot. Carb": "0.2", "Protein": "38.5"}
        )

    def test_allergen_order_is_preserved(self):
        item = parse_food_page(label_html(allergens=("Soy", "Egg", "Vegan")))
        self.assertEqual(item["allergens"], ["Soy", "Egg", "Vegan"])

    def test_no_allergen_icons_gives_empty_list(self):
        self.assertEqual(parse_food_page(label_html(allergens=()))["allergens"], [])

    def test_image_without_alt_is_ignored(self):
        item = parse_food_page(label_html(extra='<img src="spacer.gif"/>'))
        self.assertEqual(item["allergens"], ["Vegan", "Wheat"])

    def test_zero_calorie_item_is_skipped(self):
        self.assertIsNone(parse_food_page(label_html(calories="0")))

    def test_missing_calories_is_skipped_not_a_crash(self):
        self.assertIsNone(parse_food_page(label_html(calories=None)))

    def test_missing_name_is_skipped(self):
        html = label_html().replace('<div class="labelrecipe">Test Food</div>', "")
        self.assertIsNone(parse_food_page(html))

    def test_blank_name_is_skipped(self):
        self.assertIsNone(parse_food_page(label_html(name="   ")))

    def test_missing_macro_is_left_out_not_zero(self):
        item = parse_food_page(label_html(carb=None))
        self.assertEqual(item["macros"], {"Total Fat": "0.9", "Protein": "1.8"})

    def test_all_macros_missing_gives_empty_dict(self):
        item = parse_food_page(label_html(fat=None, carb=None, protein=None))
        self.assertEqual(item["macros"], {})

    def test_html_entities_in_name_are_decoded(self):
        self.assertEqual(
            parse_food_page(label_html(name="Mac &amp; Cheese"))["name"],
            "Mac & Cheese",
        )

    def test_name_whitespace_is_trimmed(self):
        self.assertEqual(
            parse_food_page(label_html(name="  Scrambled Eggs \n"))["name"],
            "Scrambled Eggs",
        )

    def test_nbsp_inside_a_macro_label_still_matches(self):
        html = label_html().replace("Tot. Carb", "Tot.&nbsp;Carb")
        self.assertEqual(parse_food_page(html)["macros"]["Tot. Carb"], "24.8")

    def test_unrelated_nutrients_are_ignored(self):
        extra = (
            '<table><tr><td><font size="3"><b>Sodium</b></font>'
            '<font size="3">150mg</font></td></tr></table>'
        )
        item = parse_food_page(label_html(extra=extra))
        self.assertEqual(set(item["macros"]), {"Total Fat", "Tot. Carb", "Protein"})

    def test_cells_without_exactly_two_fonts_are_ignored(self):
        extra = (
            '<table><tr><td><font>Protein</font><font>99g</font><font>x</font>'
            "</td></tr></table>"
        )
        item = parse_food_page(label_html(extra=extra))
        self.assertEqual(item["macros"]["Protein"], "1.8")

    def test_first_calories_line_wins(self):
        extra = "<b>Calories from Fat 8</b>"
        html = label_html(extra=extra)
        self.assertEqual(parse_food_page(html)["calories"], "115")

    def test_empty_and_garbage_input_return_none(self):
        for html in ("", "   ", "not html at all", "<html></html>"):
            with self.subTest(html=html):
                self.assertIsNone(parse_food_page(html))


class ParseMenuLinksTests(unittest.TestCase):
    def test_returns_only_label_links(self):
        html = (
            '<a href="label.aspx?RecNumAndPort=1">Eggs</a>'
            '<a href="shortmenu.aspx?x=1">Back</a>'
            '<a href="label.aspx?RecNumAndPort=2">Rice</a>'
        )
        self.assertCountEqual(
            parse_menu_links(html),
            ["label.aspx?RecNumAndPort=1", "label.aspx?RecNumAndPort=2"],
        )

    def test_anchors_without_href_are_ignored(self):
        html = '<a name="top">Top</a><a href="label.aspx?RecNumAndPort=1">Eggs</a>'
        self.assertEqual(parse_menu_links(html), ["label.aspx?RecNumAndPort=1"])

    def test_items_after_the_all_day_header_are_left_out(self):
        html = (
            '<a href="label.aspx?RecNumAndPort=1">Before</a>'
            '<div class="longmenucolmenucat">-- All Day --</div>'
            '<a href="label.aspx?RecNumAndPort=2">After</a>'
        )
        self.assertEqual(parse_menu_links(html), ["label.aspx?RecNumAndPort=1"])

    def test_empty_page_gives_no_links(self):
        self.assertEqual(parse_menu_links("<html></html>"), [])


class MenuUrlTests(unittest.TestCase):
    def test_includes_hall_date_and_meal(self):
        url = menu_url(20, "Dinner", date(2026, 11, 9))
        self.assertIn("locationNum=20", url)
        self.assertIn("dtdate=11%2f09%2f26", url)
        self.assertTrue(url.endswith("&mealName=Dinner"))

    def test_single_digit_month_and_day_are_zero_padded(self):
        self.assertIn("dtdate=01%2f05%2f27", menu_url(5, "Lunch", date(2027, 1, 5)))

    def test_every_configured_hall_builds_a_url(self):
        for dh in (5, 20, 25, 30, 40):
            with self.subTest(dh=dh):
                self.assertIn(f"locationNum={dh:02d}", menu_url(dh, "Lunch", date(2026, 11, 9)))


if __name__ == "__main__":
    unittest.main()