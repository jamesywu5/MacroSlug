import asyncio
import json
import os
from datetime import date

import aiohttp

from dh_headers import headers
from menu_parser import menu_url, parse_food_page, parse_menu_links

# List of meals
MEALS = ["Breakfast", "Lunch", "Dinner"]


def make_session() -> aiohttp.ClientSession:
    """HTTP session. Set SCRAPER_INSECURE_SSL=1 to skip certificate checks.

    Only needed if your machine can't verify nutrition.sa.ucsc.edu's
    certificate. This is for local development; the scraper only reads
    public menu pages.
    """
    if os.getenv("SCRAPER_INSECURE_SSL") == "1":
        print("WARNING: SSL certificate verification is disabled.")
        return aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=False))
    return aiohttp.ClientSession()


# Function to asynchronously get a singular food item's data
async def fetch_food_data(session, url, headers):
    try:
        async with session.get(url, headers=headers) as response:
            if response.status != 200:
                print(f"Failed to fetch the page. Status code: {response.status}")
                return None
            return parse_food_page(await response.text())
    except (aiohttp.ClientError, asyncio.TimeoutError) as err:
        # One bad item shouldn't abort the whole run.
        print(f"Failed to fetch {url}: {err}")
        return None


# Function to asynchronously get the menu data
async def fetch_and_process_menu_data(session, dh, meal, day, menu_json):
    menu_json[dh][meal] = []

    async with session.get(menu_url(dh, meal, day), headers=headers[dh]) as long_menu:
        if long_menu.status != 200:
            print(f"Failed to fetch the page. Status code: {long_menu.status}")
            return
        hrefs = parse_menu_links(await long_menu.text())

    tasks = [
        fetch_food_data(session, "https://nutrition.sa.ucsc.edu/" + href, headers[dh])
        for href in hrefs
    ]
    food_items = await asyncio.gather(*tasks)
    menu_json[dh][meal].extend(item for item in food_items if item)


async def main():
    today = date.today()
    menu_json = {}

    async with make_session() as session:
        tasks = []
        for dh in headers.keys():
            menu_json[dh] = {}
            for meal in MEALS:
                tasks.append(
                    fetch_and_process_menu_data(session, dh, meal, today, menu_json)
                )
        await asyncio.gather(*tasks)

    with open("food.json", "w") as outfile:
        json.dump(menu_json, outfile)


def testFcn():
    asyncio.run(main())


if __name__ == "__main__":
    asyncio.run(main())