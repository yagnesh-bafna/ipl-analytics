from flask import Blueprint, jsonify
import pandas as pd
from database.connect_db import get_connection

auction_bp = Blueprint("auction", __name__)

# -----------------------------
# HELPERS
# -----------------------------

def get_auction_data():
    conn = get_connection()
    
    # We need player age from the players table and 3-year stats from batting/bowling
    players = pd.read_sql("SELECT player_name, age, cricket_country as nationality FROM players", conn)
    batting = pd.read_sql("SELECT * FROM batting_stats", conn)
    bowling = pd.read_sql("SELECT * FROM bowling_stats", conn)
    
    conn.close()
    
    return players, batting, bowling

def calculate_trajectory(df, entity_col, metric_col):
    """
    Calculates if a player's performance across recent seasons is improving, stable, or declining.
    Requires a dataframe with 'season', entity_col (e.g., 'player'), and the metric to track.
    """
    grouped = df.groupby([entity_col, "season"])[metric_col].mean().reset_index()
    
    trajectories = []
    
    for player in grouped[entity_col].unique():
        player_data = grouped[grouped[entity_col] == player].sort_values("season")
        
        if len(player_data) < 2:
            trajectories.append({"player": player, "trajectory": "Insufficient Data"})
            continue
            
        metrics = player_data[metric_col].tolist()
        
        # Simple slope calculation between first and last available season
        first = metrics[0]
        last = metrics[-1]
        
        if last > first * 1.10: # > 10% improvement
            trajectories.append({"player": player, "trajectory": "Improving"})
        elif last < first * 0.90: # > 10% decline
            trajectories.append({"player": player, "trajectory": "Declining"})
        else:
            trajectories.append({"player": player, "trajectory": "Stable"})
            
    return pd.DataFrame(trajectories)
    

# -----------------------------
# AUCTION RECOMMENDATION & RISK
# -----------------------------

@auction_bp.route("/auction_recommendation")
def auction_recommendation():
    players, batting, bowling = get_auction_data()
    
    # Analyze batters strike rate trajectory as a proxy for impact
    bat_traj = calculate_trajectory(batting, "player", "strike_rate")
    
    # Evaluate bowler economy trajectory (note: for economy, going DOWN is Improving)
    bowl_traj = calculate_trajectory(bowling, "bowler", "economy")
    # Invert trajectory strings for bowlers since lower is better
    bowl_traj['trajectory'] = bowl_traj['trajectory'].replace({'Improving': 'Declining', 'Declining': 'Improving'})
    bowl_traj.rename(columns={"bowler": "player"}, inplace=True)
    
    # Combine trajectories (prioritizing whichever was available, defaulting to Stable)
    all_traj = pd.concat([bat_traj, bowl_traj]).drop_duplicates(subset=["player"], keep='first')
    
    # Merge with player profiles to apply Age Risk Logic
    merged = pd.merge(players, all_traj, left_on="player_name", right_on="player", how="left")
    
    # Default trajectory for missing data
    merged["trajectory"] = merged["trajectory"].fillna("Stable")
    
    recommendations = []
    
    for _, row in merged.iterrows():
        # Age-based Risk Assessment
        age = row["age"]
        if pd.isna(age):
            risk = "Unknown"
        elif age < 25:
            risk = "Future Investment (High Reward)"
        elif age <= 32:
            risk = "Peak Prime (Low Risk)"
        else:
            risk = "Veteran (High Risk)"
            
        # Matrix Rule Logic for Recommendation
        traj = row["trajectory"]
        rec = "Hold"
        
        if risk == "Peak Prime (Low Risk)" and traj == "Improving":
            rec = "Must Buy / High Priority"
        elif risk == "Future Investment (High Reward)" and (traj == "Improving" or traj == "Stable"):
            rec = "Strong Buy / Retain"
        elif risk == "Veteran (High Risk)" and traj == "Declining":
            rec = "Do Not Buy / Release"
        elif risk == "Peak Prime (Low Risk)" and traj == "Stable":
            rec = "Good Value Buy"
        else:
            rec = "Situational Buy"
            
        recommendations.append({
            "player": row["player_name"],
            "age": str(row["age"]),
            "nationality": row["nationality"] if pd.notna(row["nationality"]) else "Unknown",
            "risk_profile": risk,
            "performance_3yr_trajectory": traj,
            "auction_recommendation": rec
        })
        
    # Return recommendations sorted by value (Custom sorting implementation)
    sort_order = {
        "Must Buy / High Priority": 1,
        "Strong Buy / Retain": 2,
        "Good Value Buy": 3,
        "Situational Buy": 4,
        "Hold": 5,
        "Do Not Buy / Release": 6
    }
    
    recommendations = sorted(recommendations, key=lambda x: sort_order.get(x["auction_recommendation"], 99))
    
    return jsonify(recommendations)
