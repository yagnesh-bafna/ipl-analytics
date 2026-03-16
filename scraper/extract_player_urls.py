from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time

# Load match URLs
with open("data/processed/ipl_match_urls.json", "r") as f:
    matches = json.load(f)

BATCH_SIZE = 8
player_urls = {}

for batch_start in range(0, len(matches), BATCH_SIZE):

    batch_end = min(batch_start + BATCH_SIZE, len(matches))
    batch = matches[batch_start:batch_end]

    print(f"\nProcessing matches {batch_start+1} to {batch_end}")

    driver = webdriver.Chrome()
    driver.maximize_window()
    wait = WebDriverWait(driver, 10)

    for match in batch:

        url = match["match_url"]
        print("Opening:", url)

        try:

            driver.get(url)

            wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
            time.sleep(2)

            links = driver.find_elements(By.TAG_NAME, "a")

            for link in links:

                href = link.get_attribute("href")
                name = link.text.strip()

                # Clean names
                name = name.replace("(c)", "").replace("†", "").replace(",", "").strip()

                if href and "/cricketers/" in href and name != "":

                    if name not in player_urls:
                        player_urls[name] = href

        except Exception as e:

            print("Skipped match:", e)

    driver.quit()

    # Save progress after each batch
    with open("data/processed/player_urls.json", "w") as f:
        json.dump(player_urls, f, indent=4)

    print("Batch saved. Total players collected:", len(player_urls))


print("\nPlayer URL extraction completed.")
print("Total unique players:", len(player_urls))