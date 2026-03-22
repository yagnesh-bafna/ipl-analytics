from flask import Blueprint, jsonify, request
import pandas as pd
from database.connect_db import get_connection
from analysis.player_metrics import bowling_metrics

bowling_bp = Blueprint("bowling", __name__)

@bowling_bp.route("/api/bowling")
def bowling():
    try:
        min_wickets = request.args.get("min_wickets", 0, type=int)
        max_economy = request.args.get("max_economy", 99.0, type=float)
        max_sr = request.args.get("max_sr", 999.0, type=float)

        conn = get_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        query = """
        SELECT b.*, p.cricket_country 
        FROM bowling_stats b
        LEFT JOIN players p ON b.bowler = p.player_name
        """
        raw_df = pd.read_sql(query, conn)
        conn.close()

        if raw_df.empty:
            return jsonify([])

        # Ensure numeric types
        for col in ["wickets", "runs_conceded", "overs", "economy", "strike_rate"]:
            if col in raw_df.columns:
                raw_df[col] = pd.to_numeric(raw_df[col], errors="coerce").fillna(0)

        metrics = bowling_metrics(raw_df).fillna(0)

        # Apply dynamic filters
        filtered = metrics[
            (metrics["wickets"] >= min_wickets) & 
            (metrics["economy"] <= max_economy) & 
            (metrics["strike_rate"] <= max_sr)
        ]

        result = []
        
        for _, row in filtered.iterrows():
            bowler_name = row["player"]
            bowler_seasons = raw_df[raw_df["bowler"] == bowler_name]
            
            season_stats = []
            for _, s_row in bowler_seasons.iterrows():
                season_stats.append({
                    "season": int(s_row["season"]),
                    "wickets": int(s_row["wickets"]),
                    "economy": round(float(s_row["economy"]), 2)
                })

            result.append({
                "player": bowler_name,
                "cricket_country": str(row.get("cricket_country", "India")) if row.get("cricket_country") else "India",
                "matches": int(row.get("matches", 0)),
                "wickets": int(row.get("wickets", 0)),
                "economy": round(float(row.get("economy", 0)), 2),
                "strike_rate": round(float(row.get("strike_rate", 0)), 2),
                "avg": round(float(row.get("avg", 0)), 2),
                "dot_ball_pct": round(float(row.get("dot_ball_pct", 0)), 2),
                "season_history": season_stats
            })

        # Sort by wickets by default
        result = sorted(result, key=lambda x: x["wickets"], reverse=True)
        return jsonify(result)
    except Exception as e:
        import traceback
        print(f"Bowling API Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500