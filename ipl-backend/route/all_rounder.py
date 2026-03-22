from flask import Blueprint, jsonify, request
import pandas as pd
from database.connect_db import get_connection
from analysis.player_metrics import batting_metrics, bowling_metrics, score_allrounders

all_rounder_bp = Blueprint("all_rounder", __name__)

@all_rounder_bp.route("/api/all_rounder")
def all_rounder():
    try:
        min_runs = request.args.get("min_runs", 0, type=int)
        min_wickets = request.args.get("min_wickets", 0, type=int)

        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

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
        
        batting_df = pd.read_sql(batting_query, conn)
        bowling_df = pd.read_sql(bowling_query, conn)
        conn.close()

        if batting_df.empty or bowling_df.empty:
            return jsonify([])

        # Pre-process columns to ensure numeric types before aggregation
        for col in ["runs", "balls", "strike_rate", "batting_position"]:
            if col in batting_df.columns:
                batting_df[col] = pd.to_numeric(batting_df[col], errors="coerce").fillna(0)

        for col in ["wickets", "runs_conceded", "overs", "economy"]:
            if col in bowling_df.columns:
                bowling_df[col] = pd.to_numeric(bowling_df[col], errors="coerce").fillna(0)

        bat_metrics = batting_metrics(batting_df).fillna(0)
        bowl_metrics = bowling_metrics(bowling_df).fillna(0)

        # Use existing scoring logic
        metrics = score_allrounders(bat_metrics, bowl_metrics).fillna(0)

        if metrics.empty:
            return jsonify([])

        # Apply dynamic filters
        # Ensure columns exist before filtering
        filter_mask = pd.Series(True, index=metrics.index)
        if "runs" in metrics.columns:
            filter_mask &= (metrics["runs"] >= min_runs)
        if "wickets" in metrics.columns:
            filter_mask &= (metrics["wickets"] >= min_wickets)
            
        filtered = metrics[filter_mask]

        result = []
        
        # Season aggregate for batting history
        bat_season = batting_df.groupby(["player", "season"]).agg({
            "runs": "sum",
            "strike_rate": "mean",
            "cricket_country": "first"
        }).reset_index().fillna(0)
        
        # Season aggregate for bowling history
        bowl_season = bowling_df.groupby(["bowler", "season"]).agg({
            "wickets": "sum",
            "economy": "mean",
            "cricket_country": "first"
        }).reset_index().fillna(0)

        for _, row in filtered.iterrows():
            player_name = row["player"]
            
            # Merge player's batting and bowling histories into one timeline
            p_bat = bat_season[bat_season["player"] == player_name]
            p_bowl = bowl_season[bowl_season["bowler"] == player_name]
            
            history_map = {}
            for _, s_row in p_bat.iterrows():
                history_map[s_row["season"]] = {
                    "season": int(s_row["season"]),
                    "runs": int(s_row["runs"]),
                    "strike_rate": round(float(s_row["strike_rate"]), 2)
                }
                
            for _, s_row in p_bowl.iterrows():
                season = s_row["season"]
                if season not in history_map:
                    history_map[season] = {"season": int(season)}
                history_map[season]["wickets"] = int(s_row["wickets"])
                history_map[season]["economy"] = round(float(s_row["economy"]), 2)
                
            season_history = sorted(list(history_map.values()), key=lambda x: x["season"])

            # Safely get values from row with fallbacks
            result.append({
                "player": player_name,
                "cricket_country": str(p_bat["cricket_country"].iloc[0]) if not p_bat.empty and "cricket_country" in p_bat.columns else "India",
                "matches": int(row.get("matches_bat", 0)),
                "runs": int(row.get("runs", 0)),
                "strike_rate": round(float(row.get("strike_rate_bat", 0)), 2),
                "avg": round(float(row.get("avg_bat", 0)), 2),
                "wickets": int(row.get("wickets", 0)),
                "economy": round(float(row.get("economy", 0)), 2),
                "score": round(float(row.get("score", 0)), 2),
                "season_history": season_history
            })

        # Sort by score by default
        result = sorted(result, key=lambda x: x["score"], reverse=True)
        return jsonify(result)
    except Exception as e:
        import traceback
        print(f"All-Rounder API Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
