import json
import requests
import time
import random
from datetime import datetime
from bs4 import BeautifulSoup

INPUT_FILE = "data/processed/player_urls.json"
OUTPUT_FILE = "data/processed/players_master.json"

BATCH_SIZE = 10

headers = {
    "User-Agent": "Mozilla/5.0"
}

countries = [
    "India","Australia","England","South Africa","New Zealand",
    "Pakistan","Sri Lanka","Bangladesh","Afghanistan",
    "West Indies","Ireland","Zimbabwe","Netherlands",
    "Scotland","Namibia"
]


def get_player_data(player):

    player_page = player.replace(" ", "_")
    url = f"https://en.wikipedia.org/wiki/{player_page}"

    r = requests.get(url, headers=headers)

    if r.status_code != 200:
        return None, None, None

    soup = BeautifulSoup(r.text, "html.parser")

    age = None
    birth_country = None
    cricket_country = None

    # AGE
    birth = soup.find("span", {"class": "bday"})

    if birth:
        birth_year = int(birth.text.split("-")[0])
        age = datetime.now().year - birth_year

    table = soup.find("table", {"class": "infobox"})

    if table:

        rows = table.find_all("tr")

        for row in rows:

            header = row.find("th")
            value = row.find("td")

            if header and value:

                text = value.text

                # BIRTH COUNTRY
                if "born" in header.text.lower():

                    for c in countries:
                        if c in text:
                            birth_country = c
                            break

                # CRICKET COUNTRY (international team / nationality)
                if "national side" in header.text.lower() or "nationality" in header.text.lower():

                    for c in countries:
                        if c in text:
                            cricket_country = c
                            break

    # fallback if cricket_country missing
    if cricket_country is None:
        cricket_country = birth_country

    return age, birth_country, cricket_country


# LOAD PLAYERS
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    players = json.load(f)

players_list = list(players.keys())

results = []

print("Total players:", len(players_list))


for batch_start in range(0, len(players_list), BATCH_SIZE):

    batch_end = min(batch_start + BATCH_SIZE, len(players_list))
    batch = players_list[batch_start:batch_end]

    print(f"\nProcessing players {batch_start+1} to {batch_end}")

    for player in batch:

        try:

            print("Fetching:", player)

            age, birth_country, cricket_country = get_player_data(player)

            print("AGE:", age, "| BIRTH:", birth_country, "| CRICKET:", cricket_country)

            results.append({
                "player": player,
                "age": age,
                "birth_country": birth_country,
                "cricket_country": cricket_country
            })

        except Exception:

            print("FAILED:", player)

            results.append({
                "player": player,
                "age": None,
                "birth_country": None,
                "cricket_country": None
            })

        time.sleep(random.uniform(0.5,1.2))


    # SAVE PROGRESS
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)

    print("Batch saved")

    time.sleep(2)


print("\nAll players processed successfully.")