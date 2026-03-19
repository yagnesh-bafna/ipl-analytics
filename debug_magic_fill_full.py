
import pandas as pd
import numpy as np
import sys
import os

# Add ipl-backend to path
backend_path = os.path.join(os.getcwd(), "ipl-backend")
if backend_path not in sys.path:
    sys.path.append(backend_path)

from database.connect_db import get_connection
from analysis.player_metrics import (
    batting_metrics,
    bowling_metrics,
    classify_roles,
    score_openers,
    score_middle,
    score_finishers,
    score_bowlers,
    score_allrounders,
    normalize
)

def debug_magic_fill():
    try:
        conn = get_connection()
        print("Connected to DB")
        
        recent_batting = pd.read_sql("SELECT * FROM batting_stats WHERE season IN (2024, 2025)", conn)
        recent_bowling = pd.read_sql("SELECT * FROM bowling_stats WHERE season IN (2024, 2025)", conn)
        active_players = set(recent_batting["player"].unique()) | set(recent_bowling["bowler"].unique())
        print(f"Active players: {len(active_players)}")
        
        active_players_list = list(active_players)
        if not active_players_list:
            print("No active players found")
            return

        # Simplified query for debugging
        batting_query = f"SELECT b.* FROM batting_stats b WHERE b.player IN ({','.join(['%s']*len(active_players_list))})"
        bowling_query = f"SELECT b.* FROM bowling_stats b WHERE b.bowler IN ({','.join(['%s']*len(active_players_list))})"
        
        print("Executing queries...")
        batting = pd.read_sql(batting_query, conn, params=active_players_list)
        bowling = pd.read_sql(bowling_query, conn, params=active_players_list)
        print(f"Loaded {len(batting)} batting and {len(bowling)} bowling rows")
        
        conn.close()

        print("Step 1: Metrics calculation...")
        bat_m = batting_metrics(batting)
        bowl_m = bowling_metrics(bowling)
        print(f"Metrics: {len(bat_m)} bat, {len(bowl_m)} bowl")

        print("Step 2: Role classification...")
        bat_m = classify_roles(bat_m)
        print("Role counts:")
        print(bat_m['role'].value_counts())

        print("Step 3: Role-specific scoring...")
        try:
            op = score_openers(bat_m)
            print(f"Openers scored: {len(op)}")
        except Exception as e: print(f"ERROR scoring openers: {e}")

        try:
            mid = score_middle(bat_m)
            print(f"Middle scored: {len(mid)}")
        except Exception as e: print(f"ERROR scoring middle: {e}")

        try:
            fin = score_finishers(bat_m)
            print(f"Finishers scored: {len(fin)}")
        except Exception as e: print(f"ERROR scoring finishers: {e}")

        try:
            bow = score_bowlers(bowl_m)
            print(f"Bowlers scored: {len(bow)}")
        except Exception as e: print(f"ERROR scoring bowlers: {e}")

        try:
            allr = score_allrounders(bat_m, bowl_m)
            print(f"Allrounders scored: {len(allr)}")
        except Exception as e: 
            print(f"ERROR scoring allrounders: {e}")
            import traceback
            traceback.print_exc()

        print("Debug finished")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_magic_fill()
