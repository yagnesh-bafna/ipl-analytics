from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time

# Load match URLs
with open("data/processed/ipl_match_urls.json", "r", encoding="utf-8") as f:
    match_urls = json.load(f)

BATCH_SIZE = 8
all_batting_data = []

for batch_start in range(0, len(match_urls), BATCH_SIZE):

    batch_end = min(batch_start + BATCH_SIZE, len(match_urls))
    batch = match_urls[batch_start:batch_end]

    print(f"\nProcessing matches {batch_start+1} to {batch_end}")

    driver = webdriver.Chrome()
    driver.maximize_window()
    wait = WebDriverWait(driver, 10)

    for match in batch:

        url = match["match_url"]
        season = match["season"]

        print("Scraping:", url)

        try:
            driver.get(url)

            wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
            time.sleep(2)

            match_title = driver.find_element(By.TAG_NAME, "h1").text.strip()

            # Extract teams
            title_part = match_title.split(",")[0]
            teams = title_part.split(" vs ")

            team1 = teams[0].strip()
            team2 = teams[1].strip() if len(teams) > 1 else "Unknown"

            innings_count = 0

            tables = driver.find_elements(By.TAG_NAME, "table")

            for table in tables:

                headers = [h.text.strip() for h in table.find_elements(By.TAG_NAME, "th")]

                # Only batting tables contain SR column
                if "SR" not in headers:
                    continue

                innings_count += 1
                team_name = team1 if innings_count == 1 else team2

                rows = table.find_elements(By.TAG_NAME, "tr")

                batting_position = 1

                for row in rows[1:]:

                    cols = row.find_elements(By.TAG_NAME, "td")

                    if len(cols) >= 8:

                        batsman = cols[0].text.strip()
                        dismissal = cols[1].text.strip()
                        runs = cols[2].text.strip()
                        balls = cols[3].text.strip()
                        fours = cols[5].text.strip()
                        sixes = cols[6].text.strip()
                        strike_rate = cols[7].text.strip()

                        if batsman != "" and runs.isdigit() and balls.isdigit():

                            all_batting_data.append({
                                "season": season,
                                "match": match_title,
                                "team": team_name,
                                "batting_position": batting_position,
                                "player": batsman,
                                "dismissal": dismissal,
                                "runs": int(runs),
                                "balls": int(balls),
                                "fours": int(fours) if fours.isdigit() else 0,
                                "sixes": int(sixes) if sixes.isdigit() else 0,
                                "strike_rate": float(strike_rate)
                            })

                            batting_position += 1

        except Exception as e:
            print("Skipped match due to error:", e)
            continue

    driver.quit()

    # Save progress after every batch
    with open("data/processed/batting_data.json", "w", encoding="utf-8") as f:
        json.dump(all_batting_data, f, indent=4, ensure_ascii=False)

    print("Batch saved. Total batting records:", len(all_batting_data))

print("\nAll matches processed successfully.")