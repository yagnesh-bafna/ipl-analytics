from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time


seasons = {
    "2023": "https://www.espncricinfo.com/series/indian-premier-league-2023-1345038/match-schedule-fixtures-and-results",
    "2024": "https://www.espncricinfo.com/series/indian-premier-league-2024-1410320/match-schedule-fixtures-and-results",
    "2025": "https://www.espncricinfo.com/series/ipl-2025-1449924/match-schedule-fixtures-and-results"
}


driver = webdriver.Chrome()

all_matches = []

for season, url in seasons.items():

    print(f"\nScraping IPL {season}...")

    driver.get(url)

    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "a")))

    links = driver.find_elements(By.TAG_NAME, "a")

    season_matches = []

    for link in links:

        href = link.get_attribute("href")

        if href and "full-scorecard" in href:

            season_matches.append({
                "season": season,
                "match_url": href
            })

    unique_matches = list({m["match_url"]: m for m in season_matches}.values())

    print("Matches found:", len(unique_matches))

    all_matches.extend(unique_matches)

    time.sleep(2)

driver.quit()


with open("data/raw/all_match_urls.json", "w") as f:
    json.dump(all_matches, f, indent=4)

print("\nTotal Matches Saved:", len(all_matches))