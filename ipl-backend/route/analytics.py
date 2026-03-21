from flask import Blueprint, jsonify
import pandas as pd
from database.connect_db import get_connection

analytics_bp = Blueprint("analytics", __name__)


# -----------------------------
# LOAD DATA
# -----------------------------

def load_data():

    conn = get_connection()

    batting_query = """
    SELECT b.*, p.cricket_country 
    FROM batting_stats b
    LEFT JOIN players p ON b.player = p.player_name
    """
    bowling_query = """
    SELECT b.*, p.cricket_country 
    FROM bowling_stats b
    LEFT JOIN players p ON b.bowler = p.player_name
    """
    
    batting = pd.read_sql(batting_query, conn)
    bowling = pd.read_sql(bowling_query, conn)

    conn.close()

    return batting, bowling


# -----------------------------
# IMPORT ANALYSIS METRICS
# -----------------------------
from analysis.player_metrics import (
    batting_metrics,
    bowling_metrics,
    classify_roles,
    score_openers,
    score_middle,
    score_finishers,
    score_bowlers,
    score_allrounders,
    team_of_tournament as tot_func,
    normalize
)

import random

# -----------------------------
# MAGIC FILL (SMART SQUAD GENERATOR)
# -----------------------------

@analytics_bp.route("/api/magic_fill")
def magic_fill():
    try:
        conn = get_connection()
        print("[Magic Fill] Database connected...")
        
        # 1. Load active data (2024/2025) in a single pass
        # This is much faster than loading all players and then filtering
        batting_query = """
        SELECT b.*, p.cricket_country 
        FROM batting_stats b
        LEFT JOIN players p ON b.player = p.player_name
        WHERE b.season IN (2024, 2025)
        """
        bowling_query = """
        SELECT b.*, p.cricket_country 
        FROM bowling_stats b
        LEFT JOIN players p ON b.bowler = p.player_name
        WHERE b.season IN (2024, 2025)
        """
        
        batting = pd.read_sql(batting_query, conn)
        bowling = pd.read_sql(bowling_query, conn)
        conn.close()
        print(f"[Magic Fill] Data loaded: {len(batting)} batting, {len(bowling)} bowling rows")

        if batting.empty and bowling.empty:
            print("[Magic Fill] No active data found for 2024/2025")
            return jsonify([])

        # 2. Process metrics
        bat_m = batting_metrics(batting)
        bowl_m = bowling_metrics(bowling)
        print(f"[Magic Fill] Metrics calculated: {len(bat_m)} batters, {len(bowl_m)} bowlers")
        
        bat_m = classify_roles(bat_m)
        
        # 3. Get role-specific candidates (Top 15 for each)
        def safe_get_top(df_func, data, count=15):
            try:
                res = df_func(data)
                if res.empty:
                    print(f"[Magic Fill] No candidates found for function: {df_func.__name__}")
                    return pd.DataFrame()
                return res.head(count)
            except Exception as e:
                print(f"[Magic Fill] Error in scoring function {df_func.__name__}: {e}")
                return pd.DataFrame()

        def safe_get_allr(bat, bowl, count=15):
            try:
                res = score_allrounders(bat, bowl)
                if res.empty:
                    print("[Magic Fill] No All-Rounders found in current season")
                    return pd.DataFrame()
                return res.head(count)
            except Exception as e:
                print(f"[Magic Fill] Error in all-rounder scoring: {e}")
                return pd.DataFrame()

        openers_df = safe_get_top(score_openers, bat_m)
        middle_df = safe_get_top(score_middle, bat_m)
        finishers_df = safe_get_top(score_finishers, bat_m)
        bowlers_df = safe_get_top(score_bowlers, bowl_m)
        allrounders_df = safe_get_allr(bat_m, bowl_m)

        squad = []
        overseas_count = 0
        selected_names = set()

        def pick_player(df, count, role_label):
            nonlocal overseas_count
            if df is None or df.empty: return
            picks = 0
            
            # Shuffle the top candidates for randomness
            # Ensure we have enough candidates to sample
            n_samples = min(len(df), len(df))
            candidates = df.sample(n=n_samples).to_dict(orient="records")
            
            for p in candidates:
                if picks >= count: break
                if p["player"] in selected_names: continue
                
                is_overseas = str(p.get("cricket_country", "India")).lower() != "india"
                
                # Enforce overseas limit (max 4)
                if is_overseas and overseas_count >= 4:
                    continue
                
                # Add player to squad
                player_entry = {
                    "name": p["player"],
                    "roles": [role_label],
                    "type": "batting" if role_label in ["Opener", "Middle Order", "Finisher"] else "bowling" if role_label == "Bowler" else "all_rounder",
                    "country": p.get("cricket_country", "India")
                }
                squad.append(player_entry)
                selected_names.add(p["player"])
                if is_overseas: overseas_count += 1
                picks += 1

        # Build balanced squad: 2 Openers, 3 Middle, 1 Finisher, 2 Allrounders, 3 Bowlers
        print(f"[Magic Fill] Starting selection. Openers: {len(openers_df)}, Middle: {len(middle_df)}, Finishers: {len(finishers_df)}, Allrounders: {len(allrounders_df)}, Bowlers: {len(bowlers_df)}")
        
        pick_player(openers_df, 2, "Opener")
        pick_player(middle_df, 3, "Middle Order")
        pick_player(finishers_df, 1, "Finisher")
        pick_player(allrounders_df, 2, "All-Rounder")
        pick_player(bowlers_df, 3, "Bowler")

        # Fallback: If for some reason we didn't get 11 players
        if len(squad) < 11:
            print(f"[Magic Fill] Squad only has {len(squad)} players. Attempting fallback.")
            dfs_to_concat = [df for df in [openers_df, middle_df, finishers_df, allrounders_df, bowlers_df] if df is not None and not df.empty]
            if dfs_to_concat:
                all_candidates = pd.concat(dfs_to_concat, sort=False).drop_duplicates("player")
                # Shuffle all candidates
                all_candidates = all_candidates.sample(frac=1).to_dict(orient="records")
                for p in all_candidates:
                    if len(squad) >= 11: break
                    if p["player"] in selected_names: continue
                    is_overseas = str(p.get("cricket_country", "India")).lower() != "india"
                    if is_overseas and overseas_count >= 4: continue
                    
                    squad.append({
                        "name": p["player"],
                        "roles": ["Squad Member"],
                        "type": "all_rounder", # Default fallback type
                        "country": p.get("cricket_country", "India")
                    })
                    selected_names.add(p["player"])
                    if is_overseas: overseas_count += 1

        print(f"[Magic Fill] Squad generation complete. Final size: {len(squad)}")

        # Final check for NaN/Inf in the list of dicts (JSON safety)
        import json
        def clean_json(obj):
            if isinstance(obj, float):
                if np.isnan(obj) or np.isinf(obj): return 0.0
            if isinstance(obj, dict):
                return {k: clean_json(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [clean_json(x) for x in obj]
            return obj

        return jsonify(clean_json(squad))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# -----------------------------
# BEST OPENERS
# -----------------------------

@analytics_bp.route("/api/best_openers")
def best_openers():
    batting, _ = load_data()
    bat_metrics = batting_metrics(batting)
    bat_metrics = classify_roles(bat_metrics)
    openers = score_openers(bat_metrics)
    
    # Format for JSON response
    top = openers.head(5).copy()
    top["impact"] = top["score"] 
    return jsonify(top.to_dict(orient="records"))


# -----------------------------
# BEST FINISHERS
# -----------------------------

@analytics_bp.route("/api/best_finishers")
def best_finishers():
    batting, _ = load_data()
    bat_metrics = batting_metrics(batting)
    bat_metrics = classify_roles(bat_metrics)
    finishers = score_finishers(bat_metrics)
    
    top = finishers.head(5).copy()
    top["impact"] = top["score"]
    return jsonify(top.to_dict(orient="records"))


# -----------------------------
# BEST BOWLERS
# -----------------------------

@analytics_bp.route("/api/best_bowlers")
def best_bowlers():
    _, bowling = load_data()
    bowl_metrics = bowling_metrics(bowling)
    bowlers = score_bowlers(bowl_metrics)
    
    top = bowlers.head(5).copy()
    top["impact"] = top["score"]
    return jsonify(top.to_dict(orient="records"))


# -----------------------------
# BEST ALLROUNDERS
# -----------------------------

@analytics_bp.route("/api/best_allrounders")
def best_allrounders():
    batting, bowling = load_data()
    bat_metrics = batting_metrics(batting)
    bowl_metrics = bowling_metrics(bowling)
    
    allrounders = score_allrounders(bat_metrics, bowl_metrics)
    
    top = allrounders.head(5).copy()
    top["impact"] = top["score"]
    return jsonify(top.to_dict(orient="records"))


# -----------------------------
# TEAM OF THE TOURNAMENT
# -----------------------------

@analytics_bp.route("/api/team_of_tournament")
def team_of_tournament():
    # Use the comprehensive logic built in analysis/player_metrics.py
    team_df = tot_func()
    
    batters = team_df[team_df["role"].notna()].copy()
    bowlers = team_df[team_df["role"].isna()].copy()
    
    # Replace NaN with None for JSON serialization
    batters = batters.where(pd.notnull(batters), None)
    bowlers = bowlers.where(pd.notnull(bowlers), None)

    team = {
        "batters": batters.to_dict(orient="records"),
        "bowlers": bowlers.to_dict(orient="records")
    }

    return jsonify(team)

# -----------------------------
# PLAYER IMPACT MATRIX (STANDOUT FEATURE)
# -----------------------------

@analytics_bp.route("/api/matrix")
def player_matrix():
    try:
        conn = get_connection()
        print("[Matrix] Database connected...")
        
        # 1. Load active data (2024/2025)
        # Using a PARTICIPATION FILTER (min 30 balls faced OR 12 overs bowled)
        # to remove noise and cameos.
        batting_query = """
        SELECT b.*, p.cricket_country 
        FROM batting_stats b
        LEFT JOIN players p ON b.player = p.player_name
        WHERE b.season IN (2024, 2025)
        """
        bowling_query = """
        SELECT b.*, p.cricket_country 
        FROM bowling_stats b
        LEFT JOIN players p ON b.bowler = p.player_name
        WHERE b.season IN (2024, 2025)
        """
        
        batting = pd.read_sql(batting_query, conn)
        bowling = pd.read_sql(bowling_query, conn)
        conn.close()

        # 2. Process metrics
        bat_m = batting_metrics(batting)
        bowl_m = bowling_metrics(bowling)
        
        # ELITE PARTICIPATION FILTER:
        # Min 50 runs OR 5 wickets to be considered for the Matrix
        bat_m = bat_m[bat_m["runs"] >= 50].copy()
        bowl_m = bowl_m[bowl_m["wickets"] >= 5].copy()
        
        # 3. SMART ROLE DETECTION (Batter, Bowler, or All-Rounder)
        # Merge both to find overlaps
        all_players = pd.merge(
            bat_m[["player", "runs", "strike_rate", "consistency", "boundary_pct"]],
            bowl_m[["player", "wickets", "economy", "strike_rate", "dot_ball_pct"]],
            on="player",
            how="outer",
            suffixes=("_bat", "_bowl")
        ).fillna(0)

        def determine_type(row):
            if row["runs"] >= 100 and row["wickets" ] >= 5:
                return "All-Rounder"
            if row["wickets"] >= 5:
                return "Bowler"
            return "Batter"

        all_players["type"] = all_players.apply(determine_type, axis=1)

        # 4. WEIGHTED SCORING & HIGHER BENCHMARKS
        # Higher benchmarks push "average" players down the chart
        def custom_normalize(series, benchmark):
            return (series / benchmark * 100).clip(upper=100)

        # BATTER SCORES
        all_players["bat_cons"] = custom_normalize(all_players["consistency"], 50) # 50 runs/match benchmark
        all_players["bat_exp"] = (
            custom_normalize(all_players["strike_rate_bat"], 180) * 0.7 +
            custom_normalize(all_players["boundary_pct"], 60) * 0.3
        )

        # BOWLER SCORES (Consistency = Low Economy, Explosiveness = Wickets/Match + Dots)
        # Economy benchmark of 7.5 (15 - 7.5 = 7.5 target)
        all_players["bowl_cons"] = custom_normalize((15 - all_players["economy"]).clip(lower=0), 7.5)
        # Wickets benchmark (e.g., 2 per match)
        all_players["bowl_exp"] = (
            custom_normalize(all_players["wickets"], 15) * 0.6 + # 15 wickets in a season benchmark
            custom_normalize(all_players["dot_ball_pct"], 45) * 0.4 # 45% dot balls benchmark
        )

        # FINAL MATRIX COORDINATES
        def calc_coords(row):
            if row["type"] == "Batter":
                return row["bat_cons"], row["bat_exp"]
            if row["type"] == "Bowler":
                return row["bowl_cons"], row["bowl_exp"]
            # All-Rounder: Average of both
            return (row["bat_cons"] + row["bowl_cons"]) / 2, (row["bat_exp"] + row["bowl_exp"]) / 2

        all_players["norm_cons"], all_players["norm_exp"] = zip(*all_players.apply(calc_coords, axis=1))

        # 5. CATEGORIZATION (Based on the new spread-out data)
        # Dynamic Median Lines
        median_cons = all_players["norm_cons"].mean()
        median_exp = all_players["norm_exp"].mean()

        def categorize(row):
            cons = row["norm_cons"]
            exp = row["norm_exp"]
            if cons >= median_cons and exp >= median_exp: return "Superstar"
            if cons >= median_cons: return "Anchor"
            if exp >= median_exp: return "Wildcard"
            return "Replacement Level"

        all_players["matrix_category"] = all_players.apply(categorize, axis=1)

        # 6. JSON CLEANUP & RETURN
        cols = ["player", "type", "runs", "strike_rate_bat", "wickets", "matrix_category", "norm_cons", "norm_exp"]
        result = all_players[cols].rename(columns={"strike_rate_bat": "strike_rate"}).to_dict(orient="records")
        
        # Clean numeric values for JSON
        import numpy as np
        def clean_val(v):
            if isinstance(v, float) and (np.isnan(v) or np.isinf(v)): return 0.0
            return v
        
        final_result = [{k: clean_val(v) for k, v in r.items()} for r in result]
        return jsonify(final_result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# -----------------------------
# ADMIN DASHBOARD ROUTES
# -----------------------------

@analytics_bp.route("/api/admin/stats")
def admin_stats():
    conn = get_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
        
    c = conn.cursor()
    try:
        # Get count of total users
        c.execute("SELECT COUNT(*) FROM users")
        total_users = c.fetchone()[0]
        
        # Admin stats overview
        c.execute("SELECT COUNT(*) FROM batting_stats")
        total_records_batting = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM bowling_stats")
        total_records_bowling = c.fetchone()[0]
        
        # Unique players count
        c.execute("SELECT COUNT(DISTINCT player) FROM batting_stats")
        unique_batters = c.fetchone()[0]
        
        c.execute("SELECT COUNT(DISTINCT bowler) FROM bowling_stats")
        unique_bowlers = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        admin_count = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM contact_messages")
        total_messages = c.fetchone()[0]
        
        # System health check (basic)
        health = "100%"
        status_msg = "Stable"
        
        return jsonify({
            "total_users": total_users,
            "admin_count": admin_count,
            "total_records": total_records_batting + total_records_bowling,
            "unique_players": max(unique_batters, unique_bowlers), 
            "total_messages": total_messages
        })
    except Exception as e:
        print(f"Error fetching admin stats: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@analytics_bp.route("/api/admin/trending")
def trending_players():
    conn = get_connection()
    if conn is None: return jsonify([])
    c = conn.cursor()
    try:
        c.execute("""
            SELECT player_name, COUNT(*) as view_count 
            FROM player_scout_logs 
            GROUP BY player_name 
            ORDER BY view_count DESC 
            LIMIT 10
        """)
        rows = c.fetchall()
        result = [{"player": r[0], "views": r[1]} for r in rows]
        return jsonify(result)
    except:
        return jsonify([])
    finally:
        conn.close()

@analytics_bp.route("/api/admin/logs")
def admin_logs():
    conn = get_connection()
    if conn is None:
         return jsonify({"error": "Database connection failed"}), 500
         
    c = conn.cursor()
    try:
        c.execute("SELECT name, email, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 50")
        logs = c.fetchall()
        
        log_list = []
        for row in logs:
            log_list.append({
                "name": row[0],
                "email": row[1],
                "message": row[2],
                "created_at": row[3].isoformat() if row[3] else None
            })
            
        return jsonify(log_list)
    except Exception as e:
        print(f"Error fetching logs (table might not exist yet): {e}")
        conn.rollback() # Important for Postgres
        return jsonify([])
    finally:
        conn.close()


@analytics_bp.route("/api/squad_rating", methods=["POST"])
def squad_rating():
    try:
        from flask import request
        data = request.json
        squad = data.get("squad", [])
        if not squad: return jsonify({"rating": 0})
        
        roles = [p.get("type", "batting") for p in squad]
        bat = roles.count("batting")
        bowl = roles.count("bowling")
        ar = roles.count("all_rounder")
        
        score = min(len(squad) * 7.5, 75)
        balance = 0
        if bat >= 3: balance += 10
        if bowl >= 3: balance += 10
        if ar >= 1: balance += 5
        
        total = min(score + balance, 100)
        return jsonify({"rating": int(total)})
    except Exception as e:
        print(f"Rating Error: {e}")
        return jsonify({"error": str(e)}), 500

# Admin dashboard configuration removal