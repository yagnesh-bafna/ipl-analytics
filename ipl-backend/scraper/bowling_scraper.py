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
all_bowling_data = []

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

            bowling_table_count = 0
            tables = driver.find_elements(By.TAG_NAME, "table")

            for table in tables:

                header_cells = table.find_elements(By.TAG_NAME, "th")
                headers = [h.text.strip().upper() for h in header_cells]

                required_headers = {"O", "M", "R", "W", "ECO"}
                match_count = len(required_headers.intersection(set(headers)))

                if match_count < 3:
                    continue

                bowling_table_count += 1

                # Bowling table corresponds to opposite batting team
                if bowling_table_count == 1:
                    team_name = team2
                else:
                    team_name = team1

                rows = table.find_elements(By.TAG_NAME, "tr")

                for row in rows[1:]:

                    cols = row.find_elements(By.TAG_NAME, "td")

                    if len(cols) >= 6:

                        bowler = cols[0].text.strip()
                        overs = cols[1].text.strip()
                        maiden = cols[2].text.strip()
                        runs = cols[3].text.strip()
                        wickets = cols[4].text.strip()
                        economy = cols[5].text.strip()

                        dots = cols[6].text.strip() if len(cols) > 6 else "0"
                        fours = cols[7].text.strip() if len(cols) > 7 else "0"
                        sixes = cols[8].text.strip() if len(cols) > 8 else "0"
                        wides = cols[9].text.strip() if len(cols) > 9 else "0"
                        no_balls = cols[10].text.strip() if len(cols) > 10 else "0"

                        if bowler != "" and wickets.isdigit():

                            all_bowling_data.append({
                                "season": season,
                                "match": match_title,
                                "team": team_name,
                                "bowler": bowler,
                                "overs": overs,
                                "maidens": int(maiden) if maiden.isdigit() else 0,
                                "runs_conceded": int(runs) if runs.isdigit() else 0,
                                "wickets": int(wickets),
                                "economy": float(economy) if economy.replace('.', '', 1).isdigit() else 0,
                                "dot_balls": int(dots) if dots.isdigit() else 0,
                                "fours_conceded": int(fours) if fours.isdigit() else 0,
                                "sixes_conceded": int(sixes) if sixes.isdigit() else 0,
                                "wides": int(wides) if wides.isdigit() else 0,
                                "no_balls": int(no_balls) if no_balls.isdigit() else 0
                            })

        except Exception as e:
            print("Skipped match due to error:", e)
            continue

    driver.quit()

    # Save progress
    with open("data/processed/bowling_data.json", "w", encoding="utf-8") as f:
        json.dump(all_bowling_data, f, indent=4, ensure_ascii=False)

    print("Batch saved. Total bowling records:", len(all_bowling_data))

print("\nAll matches processed successfully.")