from flask import Blueprint, jsonify
import pandas as pd
from database.connect_db import get_connection

players_bp = Blueprint("players", __name__)

@players_bp.route("/players")
def players():

    conn = get_connection()

    query = """
    SELECT
        player_name,
        age,
        birth_country,
        cricket_country
    FROM players
    ORDER BY player_name ASC
    """

    df = pd.read_sql(query, conn)
    conn.close()

    return jsonify(df.to_dict(orient="records"))