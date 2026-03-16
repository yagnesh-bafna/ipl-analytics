import os
import json
from connect_db import get_connection

# -----------------------------
# Get project root automatically
# -----------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

batting_file = os.path.join(BASE_DIR, "data", "processed", "batting_data.json")
bowling_file = os.path.join(BASE_DIR, "data", "processed", "bowling_data.json")
players_file = os.path.join(BASE_DIR, "data", "processed", "players_master.json")

# -----------------------------
# Connect to NeonDB
# -----------------------------

conn = get_connection()
cursor = conn.cursor()


# -----------------------------
# INSERT PLAYERS
# -----------------------------

print("Loading players...")

with open(players_file, "r", encoding="utf-8") as f:
    players = json.load(f)

for p in players:

    cursor.execute("""
    INSERT INTO players (player_name, age, birth_country, cricket_country)
    VALUES (%s,%s,%s,%s)
    ON CONFLICT (player_name) DO NOTHING
    """, (
        p["player"],
        p["age"],
        p["birth_country"],
        p["cricket_country"]
    ))

conn.commit()

print("Players inserted successfully")


# -----------------------------
# INSERT BATTING DATA
# -----------------------------

print("Loading batting data...")

with open(batting_file, "r", encoding="utf-8") as f:
    batting_data = json.load(f)

for b in batting_data:

    cursor.execute("""
    INSERT INTO batting_stats
    (season, match_title, team, batting_position, player, dismissal,
     runs, balls, fours, sixes, strike_rate)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        int(b["season"]),
        b["match"],
        b["team"],
        int(b["batting_position"]),
        b["player"],
        b["dismissal"],
        int(b["runs"]),
        int(b["balls"]),
        int(b["fours"]),
        int(b["sixes"]),
        float(b["strike_rate"])
    ))

conn.commit()

print("Batting data inserted successfully")


# -----------------------------
# INSERT BOWLING DATA
# -----------------------------

print("Loading bowling data...")

with open(bowling_file, "r", encoding="utf-8") as f:
    bowling_data = json.load(f)

for b in bowling_data:

    cursor.execute("""
    INSERT INTO bowling_stats
    (season, match_title, team, bowler,
     overs, maidens, runs_conceded, wickets,
     economy, dot_balls, fours_conceded,
     sixes_conceded, wides, no_balls)
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        int(b["season"]),
        b["match"],
        b["team"],
        b["bowler"],
        float(b["overs"]),
        int(b["maidens"]),
        int(b["runs_conceded"]),
        int(b["wickets"]),
        float(b["economy"]),
        int(b["dot_balls"]),
        int(b["fours_conceded"]),
        int(b["sixes_conceded"]),
        int(b["wides"]),
        int(b["no_balls"])
    ))

conn.commit()

print("Bowling data inserted successfully")


# -----------------------------
# CLOSE CONNECTION
# -----------------------------

cursor.close()
conn.close()

print("All data uploaded to Neon successfully 🚀")