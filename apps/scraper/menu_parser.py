"""Pure parsing and URL-building helpers for the UCSC dining pages.

Nothing in here touches the network, so it can be unit tested with saved or
hand-written HTML. web_scraper.py does the fetching and calls these.
"""
import re
from datetime import date

from bs4 import BeautifulSoup

from dh_headers import urls

# Nutrition fields we keep, exactly as the site labels them.
MACROS = ["Protein", "Total Fat", "Tot. Carb"]

_NUMBER = re.compile(r"\d+(?:\.\d+)?")
_INTEGER = re.compile(r"\d+")


def menu_url(dh: int, meal: str, day: date) -> str:
    """Long-menu URL for one dining hall, meal, and day."""
    return (
        urls[dh]
        + "&WeeksMenus=UCSC+-+This+Week%27s+Menus"
        + f"&dtdate={day:%m}%2f{day:%d}%2f{day:%y}"
        + f"&mealName={meal}"
    )


def parse_menu_links(html: str) -> list[str]:
    """Return the label.aspx links for the food items on a long-menu page.

    If the page has an "-- All Day --" section header, only links that appear
    BEFORE it are returned (matching the scraper's existing behavior, which
    leaves out the all-day items). Otherwise every label link is returned.
    """
    soup = BeautifulSoup(html, "lxml")
    all_day = soup.find("div", class_="longmenucolmenucat", string="-- All Day --")
    anchors = all_day.find_all_previous("a") if all_day else soup.find_all("a")

    links = []
    for a in anchors:
        href = a.get("href")
        if href and "label.aspx" in href:
            links.append(href)
    return links


def parse_food_page(html: str) -> dict | None:
    """Parse one nutrition-label page into a food record.

    Returns None (the item is skipped) when the page has no name, no calorie
    value, or 0 calories. A macro the page doesn't show is left out of
    "macros" rather than being filled in as 0.
    """
    soup = BeautifulSoup(html, "lxml")

    name_div = soup.find("div", class_="labelrecipe")
    if name_div is None:
        return None
    name = name_div.get_text(strip=True)  # also decodes &amp; and friends
    if not name:
        return None

    calories = None
    for b in soup.find_all("b"):
        text = b.get_text()
        if "Calories" in text:
            m = _INTEGER.search(text)
            if m:
                calories = int(m.group(0))
                break
    if not calories:  # missing, or 0
        return None

    macros = {}
    for td in soup.find_all("td"):
        fonts = td.find_all("font")
        if len(fonts) != 2:
            continue
        label = " ".join(fonts[0].get_text().split())  # normalizes &nbsp; too
        for macro in MACROS:
            if macro in label:
                m = _NUMBER.search(fonts[1].get_text())
                if m:
                    macros[macro] = m.group(0)

    allergens = [img["alt"] for img in soup.find_all("img") if img.get("alt")]

    return {
        "name": name,
        "calories": str(calories),
        "allergens": allergens,
        "macros": macros,
    }