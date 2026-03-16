import json

with open("data/raw/all_match_urls.json") as f:
    data = json.load(f)

clean = []

for match in data:

    url = match["match_url"]

    if "indian-premier-league" in url or "ipl-2025" in url:
        clean.append(match)

print("Original:", len(data))
print("Clean IPL matches:", len(clean))

with open("data/processed/ipl_match_urls.json", "w") as f:
    json.dump(clean, f, indent=4)