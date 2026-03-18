from flask import Blueprint, jsonify, request
import pandas as pd
from database.connect_db import get_connection
from analysis.player_metrics import batting_metrics

batting_bp = Blueprint("batting", __name__)

@batting_bp.route("/api/batting")
def batting():
    min_runs = request.args.get("min_runs", 0, type=int)
    min_sr = request.args.get("min_sr", 0.0, type=float)
    min_avg = request.args.get("min_avg", 0.0, type=float)

    conn = get_connection()
    query = """
    SELECT b.*, p.cricket_country 
    FROM batting_stats b
    LEFT JOIN players p ON b.player = p.player_name
    """
    raw_df = pd.read_sql(query, conn)
    conn.close()

    if raw_df.empty:
        return jsonify([])

    metrics = batting_metrics(raw_df).fillna(0)

    # Apply dynamic filters
    filtered = metrics[
        (metrics["runs"] >= min_runs) & 
        (metrics["strike_rate"] >= min_sr) & 
        (metrics["avg"] >= min_avg)
    ]

    result = []
    
    season_df = raw_df.groupby(["player", "season"]).agg(
        runs=("runs", "sum"), 
        balls=("balls", "sum"),
        strike_rate=("strike_rate", "mean"),
        cricket_country=("cricket_country", "first")
    ).reset_index().fillna(0)

    for _, row in filtered.iterrows():
        player_name = row["player"]
        player_seasons = season_df[season_df["player"] == player_name]
        
        season_stats = []
        for _, s_row in player_seasons.iterrows():
            season_stats.append({
                "season": int(s_row["season"]),
                "runs": int(s_row["runs"]),
                "strike_rate": round(float(s_row["strike_rate"]), 2)
            })

        result.append({
            "player": player_name,
            "cricket_country": row["cricket_country"] if "cricket_country" in row and row["cricket_country"] else "India",
            "matches": int(row["matches"]),
            "runs": int(row["runs"]),
            "strike_rate": round(float(row["strike_rate"]), 2),
            "avg": round(float(row["avg"]), 2),
            "boundary_pct": round(float(row["boundary_pct"]), 2),
            "season_history": season_stats
        })

    # Sort by runs by default
    result = sorted(result, key=lambda x: x["runs"], reverse=True)
    return jsonify(result)