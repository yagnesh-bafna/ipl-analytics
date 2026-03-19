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
    score_finishers,
    score_bowlers,
    score_allrounders,
    team_of_tournament as tot_func,
    normalize
)

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
        # Only consider players who have played in recent seasons (2024 or 2025)
        recent_batting = pd.read_sql("SELECT * FROM batting_stats WHERE season IN (2024, 2025)", conn)
        recent_bowling = pd.read_sql("SELECT * FROM bowling_stats WHERE season IN (2024, 2025)", conn)
        
        # Also need full historical data for career stats if we want total impact, 
        # but the prompt specifically mentioned Ben Stokes (inactive).
        # Let's filter the final list to only include players active in 2024/2025.
        active_players = set(recent_batting["player"].unique()) | set(recent_bowling["bowler"].unique())

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

        bat_metrics = batting_metrics(batting)
        bowl_metrics = bowling_metrics(bowling)
        
        # Filter for active players only
        bat_active = bat_metrics[bat_metrics["player"].isin(active_players)]
        bowl_active = bowl_metrics[bowl_metrics["player"].isin(active_players)]
        
        # Fallback: if filter is too strict, show all players
        if bat_active.empty and bowl_active.empty:
            bat_active = bat_metrics
            bowl_active = bowl_metrics

        # Prepare Batter Data
        bat_metrics = bat_active.copy()
        if bat_metrics.empty:
            bat_part = pd.DataFrame(columns=["player", "runs", "strike_rate", "consistency", "boundary_pct", "type", "norm_cons", "norm_exp"])
        else:
            bat_part = bat_metrics[["player", "runs", "strike_rate", "consistency", "boundary_pct"]].copy()
            bat_part["type"] = "Batter"
            bat_part["cons_val"] = bat_part["consistency"]
            bat_part["exp_val"] = (bat_part["strike_rate"] * 0.7) + (bat_part["boundary_pct"] * 0.3)
            
            def custom_normalize(series, benchmark):
                return (series / benchmark * 100).clip(upper=100)

            bat_part["norm_cons"] = custom_normalize(bat_part["cons_val"], 60)
            bat_part["norm_exp"] = custom_normalize(bat_part["exp_val"], 160)
        
        # Prepare Bowler Data
        bowl_metrics = bowl_active.copy()
        if bowl_metrics.empty:
            bowl_part = pd.DataFrame(columns=["player", "wickets", "economy", "strike_rate", "runs", "type", "norm_cons", "norm_exp"])
        else:
            bowl_metrics["runs"] = 0
            bowl_part = bowl_metrics[["player", "wickets", "economy", "strike_rate", "runs"]].copy()
            bowl_part["type"] = "Bowler"
            bowl_part["cons_val"] = (12 - bowl_part["economy"]).clip(lower=0)
            bowl_part["exp_val"] = (35 - bowl_part["strike_rate"]).clip(lower=0)
            
            def custom_normalize(series, benchmark):
                return (series / benchmark * 100).clip(upper=100)
                
            bowl_part["norm_cons"] = custom_normalize(bowl_part["cons_val"], 8)
            bowl_part["norm_exp"] = custom_normalize(bowl_part["exp_val"], 25)
            
        df = pd.concat([bat_part, bowl_part], ignore_index=True)
        
        # Replace all non-finite values (NaN, Inf) with 0 before any further processing
        import numpy as np
        df = df.replace([np.inf, -np.inf], np.nan).fillna(0)

        if df.empty:
            return jsonify([])

        # Join with players table for real age and country
        conn = get_connection()
        players_df = pd.read_sql("SELECT player_name, age, birth_country, cricket_country FROM players", conn)
        conn.close()

        df = df.merge(players_df, left_on="player", right_on="player_name", how="left")
        
        # Replace NaN from merge
        df = df.fillna(0)

        # Deduplicate: Prioritize the row with higher overall metrics within its type
        df["impact_score"] = df["norm_cons"] + df["norm_exp"]
        df = df.sort_values("impact_score", ascending=False).drop_duplicates("player")
        
        # Dynamic Median Lines: Use the actual mean of the active dataset
        median_cons = df["norm_cons"].mean() if not df.empty else 50
        median_exp = df["norm_exp"].mean() if not df.empty else 50

        def matrix_category(row):
            cons = row["norm_cons"]
            exp = row["norm_exp"]
            if cons > median_cons and exp > median_exp: return "Superstar"
            elif cons > median_cons and exp <= median_exp: return "Anchor"
            elif cons <= median_cons and exp > median_exp: return "Wildcard"
            else: return "Replacement Level"
                
        df["matrix_category"] = df.apply(matrix_category, axis=1)
        
        # Return useful subset
        cols = ["player", "type", "runs", "strike_rate", "consistency", "norm_cons", "norm_exp", "matrix_category", "age", "birth_country", "cricket_country"]
        existing_cols = [c for c in cols if c in df.columns]
        result = df[existing_cols].copy()
        
        # Replace all non-finite values (NaN, Inf) with None for JSON compatibility
        import numpy as np
        result = result.replace({np.nan: None, np.inf: None, -np.inf: None})
        
        return jsonify(result.to_dict(orient="records"))
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