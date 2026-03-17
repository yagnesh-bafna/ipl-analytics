from flask import Blueprint, jsonify
import pandas as pd
from database.connect_db import get_connection

profile_bp = Blueprint("profile", __name__)

@profile_bp.route("/player/<player_name>")
def player_profile(player_name):
    from flask import request
    user_id = request.args.get("user_id")

    conn = get_connection()

    player_query = """
    SELECT
        player_name,
        age,
        birth_country,
        cricket_country
    FROM players
    WHERE player_name = %s
    """

    player_df = pd.read_sql(player_query, conn, params=[player_name])

    # LOG SEARCH FOR TRENDING ANALYTICS
    try:
        c = conn.cursor()
        if user_id:
            c.execute("INSERT INTO player_scout_logs (player_name, user_id) VALUES (%s, %s)", (player_name, user_id))
        else:
            c.execute("INSERT INTO player_scout_logs (player_name) VALUES (%s)", (player_name,))
        conn.commit()
    except Exception as e:
        print(f"Logging error: {e}")

    batting_query = """
    SELECT
        season,
        SUM(runs) AS runs,
        SUM(balls) AS balls,
        COUNT(DISTINCT match_title) AS matches,
        AVG(strike_rate) AS strike_rate
    FROM batting_stats
    WHERE player = %s
    GROUP BY season
    ORDER BY season
    """

    batting_df = pd.read_sql(batting_query, conn, params=[player_name])

    bowling_query = """
    SELECT
        season,
        SUM(wickets) AS wickets,
        SUM(dot_balls) AS dot_balls,
        COUNT(DISTINCT match_title) AS matches,
        AVG(economy) AS economy
    FROM bowling_stats
    WHERE bowler = %s
    GROUP BY season
    ORDER BY season
    """

    bowling_df = pd.read_sql(bowling_query, conn, params=[player_name])

    conn.close()

    profile = {
        "player_info": player_df.to_dict(orient="records"),
        "batting": batting_df.to_dict(orient="records"),
        "bowling": bowling_df.to_dict(orient="records")
    }

    return jsonify(profile)