import sys
import os
import pandas as pd

# ------------------------------------------------
# Fix project path
# ------------------------------------------------

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))

if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from database.connect_db import get_connection


# ------------------------------------------------
# LOAD DATA
# ------------------------------------------------

def load_data():

    conn = get_connection()

    if conn is None:
        raise Exception("Database connection failed")

    batting = pd.read_sql("SELECT * FROM batting_stats", conn)
    bowling = pd.read_sql("SELECT * FROM bowling_stats", conn)
    players = pd.read_sql("SELECT * FROM players", conn)

    conn.close()

    return batting, bowling, players


# ------------------------------------------------
# BATTING METRICS
# ------------------------------------------------

def batting_metrics(batting):

    # Aggregation dictionary
    agg_dict = {
        "matches": ("match_title", "nunique"),
        "runs": ("runs", "sum"),
        "balls": ("balls", "sum"),
        "fours": ("fours", "sum"),
        "sixes": ("sixes", "sum")
    }
    
    # Preserve cricket_country if present (it's added in the DB join)
    if "cricket_country" in batting.columns:
        agg_dict["cricket_country"] = ("cricket_country", "first")

    df = batting.groupby("player").agg(**agg_dict).reset_index()

    df["strike_rate"] = (df["runs"] / df["balls"]) * 100
    df["avg"] = (df["runs"] / df["matches"])

    df["boundary_runs"] = df["fours"]*4 + df["sixes"]*6
    df["boundary_pct"] = (df["boundary_runs"] / df["runs"]) * 100

    df["consistency"] = df["runs"] / df["matches"]

    return df


# ------------------------------------------------
# BOWLING METRICS
# ------------------------------------------------

def bowling_metrics(bowling):

    # Aggregation dictionary
    agg_dict = {
        "matches": ("match_title", "nunique"),
        "wickets": ("wickets", "sum"),
        "runs_conceded": ("runs_conceded", "sum"),
        "overs": ("overs", "sum")
    }
    
    # Preserve cricket_country if present
    if "cricket_country" in bowling.columns:
        agg_dict["cricket_country"] = ("cricket_country", "first")

    df = bowling.groupby("player" if "player" in bowling.columns else "bowler").agg(**agg_dict).reset_index()
    
    # Standardize column name to 'player' for cross-metric compatibility
    if "bowler" in df.columns:
        df = df.rename(columns={"bowler": "player"})

    df["balls"] = df["overs"] * 6
    df["economy"] = df["runs_conceded"] / df["overs"]
    df["strike_rate"] = df["balls"] / df["wickets"].replace(0,1)

    return df


# ------------------------------------------------
# ROLE CLASSIFICATION
# ------------------------------------------------

def classify_roles(df):

    roles = []

    for _, row in df.iterrows():

        if row["strike_rate"] > 150 and row["boundary_pct"] > 50:
            roles.append("Finisher")

        elif row["strike_rate"] > 135:
            roles.append("Opener")

        else:
            roles.append("Middle Order")

    df["role"] = roles

    return df


# ------------------------------------------------
# NORMALIZE HELPER
# ------------------------------------------------

def normalize(series):
    # Min-Max Scaling to 0-100 range
    min_val = series.min()
    max_val = series.max()
    if max_val == min_val:
        return pd.Series(50, index=series.index) # Default to 50 if all values are same
    return ((series - min_val) / (max_val - min_val)) * 100

# ------------------------------------------------
# OPENERS SCORE
# ------------------------------------------------

def score_openers(df):
    openers = df[df["role"]=="Opener"].copy()
    
    # Normalize stats before applying weights
    openers["norm_runs"] = normalize(openers["runs"])
    openers["norm_sr"] = normalize(openers["strike_rate"])
    openers["norm_bp"] = normalize(openers["boundary_pct"])
    openers["norm_cons"] = normalize(openers["consistency"])

    openers["score"] = (
        openers["norm_runs"]*0.40 +
        openers["norm_sr"]*0.30 +
        openers["norm_bp"]*0.15 +
        openers["norm_cons"]*0.15
    )

    return openers.sort_values("score",ascending=False)

# ------------------------------------------------
# MIDDLE ORDER SCORE
# ------------------------------------------------

def score_middle(df):
    middle = df[df["role"]=="Middle Order"].copy()

    middle["norm_runs"] = normalize(middle["runs"])
    middle["norm_avg"] = normalize(middle["avg"])
    middle["norm_sr"] = normalize(middle["strike_rate"])
    middle["norm_cons"] = normalize(middle["consistency"])

    middle["score"] = (
        middle["norm_runs"]*0.40 +
        middle["norm_avg"]*0.25 +
        middle["norm_sr"]*0.20 +
        middle["norm_cons"]*0.15
    )

    return middle.sort_values("score",ascending=False)

# ------------------------------------------------
# FINISHERS SCORE
# ------------------------------------------------

def score_finishers(df):
    finishers = df[df["role"]=="Finisher"].copy()

    finishers["norm_sr"] = normalize(finishers["strike_rate"])
    finishers["norm_bp"] = normalize(finishers["boundary_pct"])
    finishers["norm_runs"] = normalize(finishers["runs"])
    finishers["norm_cons"] = normalize(finishers["consistency"])

    finishers["score"] = (
        finishers["norm_sr"]*0.40 +
        finishers["norm_bp"]*0.30 +
        finishers["norm_runs"]*0.20 +
        finishers["norm_cons"]*0.10
    )

    return finishers.sort_values("score",ascending=False)

# ------------------------------------------------
# BOWLER SCORE
# ------------------------------------------------

def score_bowlers(df):
    bowlers = df.copy()

    # Inverse normalize economy and strike rate (lower is better)
    bowlers["norm_wickets"] = normalize(bowlers["wickets"])
    
    max_econ = bowlers["economy"].max()
    min_econ = bowlers["economy"].min()
    if max_econ != min_econ:
        bowlers["norm_econ"] = ((max_econ - bowlers["economy"]) / (max_econ - min_econ)) * 100
    else:
        bowlers["norm_econ"] = 50

    max_sr = bowlers["strike_rate"].max()
    min_sr = bowlers["strike_rate"].min()
    if max_sr != min_sr:
        bowlers["norm_sr"] = ((max_sr - bowlers["strike_rate"]) / (max_sr - min_sr)) * 100
    else:
        bowlers["norm_sr"] = 50

    bowlers["score"] = (
        bowlers["norm_wickets"]*0.45 +
        bowlers["norm_econ"]*0.30 +
        bowlers["norm_sr"]*0.25
    )

    return bowlers.sort_values("score",ascending=False)

# ------------------------------------------------
# ALL-ROUNDER SCORE
# ------------------------------------------------

def score_allrounders(bat, bowl):
    merged = pd.merge(
        bat,
        bowl,
        on="player",
        how="inner",
        suffixes=("_bat","_bowl")
    )
    
    # Batting metrics normalization
    merged["norm_sr_bat"] = normalize(merged["strike_rate_bat"])
    merged["norm_avg"] = normalize(merged["avg"])
    
    # Bowling metrics normalization
    merged["norm_wickets"] = normalize(merged["wickets"])
    
    max_econ = merged["economy"].max()
    min_econ = merged["economy"].min()
    if max_econ != min_econ:
        merged["norm_econ"] = ((max_econ - merged["economy"]) / (max_econ - min_econ)) * 100
    else:
        merged["norm_econ"] = 50

    merged["bat_impact"] = merged["norm_sr_bat"]*0.5 + merged["norm_avg"]*0.5
    merged["bowl_impact"] = merged["norm_wickets"]*0.6 + merged["norm_econ"]*0.4

    merged["score"] = (
        merged["bat_impact"]*0.5 +
        merged["bowl_impact"]*0.5
    )

    merged["player"] = merged["player"]

    return merged.sort_values("score",ascending=False)

# ------------------------------------------------
# TEAM OF TOURNAMENT
# ------------------------------------------------

def team_of_tournament():
    try:
        batting, bowling, players = load_data()
        
        if batting.empty or bowling.empty:
            return pd.DataFrame()

        bat_metrics = batting_metrics(batting)
        bowl_metrics = bowling_metrics(bowling)

        bat_metrics = classify_roles(bat_metrics)

        # Handle NaNs globally before scoring
        bat_metrics = bat_metrics.fillna(0)
        bowl_metrics = bowl_metrics.fillna(0)

        openers = score_openers(bat_metrics).head(2)
        middle = score_middle(bat_metrics).head(3)
        finishers = score_finishers(bat_metrics).head(2)
        bowlers = score_bowlers(bowl_metrics).head(3)
        allrounders = score_allrounders(bat_metrics, bowl_metrics).head(1)

        team_list = [openers, middle, finishers, allrounders, bowlers]
        valid_teams = []
        for t in team_list:
            if not t.empty:
                # Ensure identity column is named 'player' regardless of role
                if "player" not in t.columns and "bowler" in t.columns:
                    t = t.rename(columns={"bowler": "player"})
                valid_teams.append(t)
        
        if not valid_teams:
            return pd.DataFrame()
            
        team = pd.concat(valid_teams, sort=False, ignore_index=True)
        team = team.drop_duplicates(subset=["player"])
        
        # Join with players to get cricket_country
        team = pd.merge(team, players[["player_name", "cricket_country"]], left_on="player", right_on="player_name", how="left")
        
        # Final cleanup for JSON serialization
        team = team.where(pd.notnull(team), None)

        return team.head(11)
    except Exception as e:
        print(f"Error in team_of_tournament: {e}")
        return pd.DataFrame()


# ------------------------------------------------
# TEST
# ------------------------------------------------

if __name__ == "__main__":

    team = team_of_tournament()

    print("\nTEAM OF THE TOURNAMENT\n")
    print(team[["player","score"]])