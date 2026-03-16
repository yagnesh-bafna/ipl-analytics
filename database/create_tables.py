from connect_db import get_connection

conn = get_connection()
cursor = conn.cursor()

# PLAYERS TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS players (
    player_id SERIAL PRIMARY KEY,
    player_name TEXT UNIQUE,
    age INT,
    birth_country TEXT,
    cricket_country TEXT
);
""")

# BATTING TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS batting_stats (
    id SERIAL PRIMARY KEY,
    season INT,
    match_title TEXT,
    team TEXT,
    batting_position INT,
    player TEXT,
    dismissal TEXT,
    runs INT,
    balls INT,
    fours INT,
    sixes INT,
    strike_rate FLOAT
);
""")

# BOWLING TABLE
cursor.execute("""
CREATE TABLE IF NOT EXISTS bowling_stats (
    id SERIAL PRIMARY KEY,
    season INT,
    match_title TEXT,
    team TEXT,
    bowler TEXT,
    overs FLOAT,
    maidens INT,
    runs_conceded INT,
    wickets INT,
    economy FLOAT,
    dot_balls INT,
    fours_conceded INT,
    sixes_conceded INT,
    wides INT,
    no_balls INT
);
""")

conn.commit()

print("Tables created successfully")

cursor.close()
conn.close()