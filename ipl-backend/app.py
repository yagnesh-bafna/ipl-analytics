import os
from flask import Flask, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Import all route blueprints
from route.players import players_bp
from route.batting import batting_bp
from route.bowling import bowling_bp
from route.player_profile import profile_bp
from route.analytics import analytics_bp
from route.auction import auction_bp
from route.contact import contact_bp
from route.auth import auth_bp, init_users_table
from route.all_rounder import all_rounder_bp

# Initialize database tables
try:
    with app.app_context():
        init_users_table()
except Exception as e:
    print(f"Database Initialization Error: {e}")

# Configure CORS
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    allowed_origins = env_origins.split(",")
else:
    allowed_origins = []

# Add common origins
common_origins = [
    "http://localhost:5173",
    "https://ipl-analytics-ten.vercel.app",
    "https://ipl-analytics-ten.vercel.app/"
]
for origin in common_origins:
    if origin not in allowed_origins:
        allowed_origins.append(origin)

# If still empty, default to * (but without credentials support)
if not allowed_origins:
    CORS(app, resources={r"/*": {"origins": "*"}})
else:
    CORS(app, resources={r"/*": {"origins": allowed_origins}}, supports_credentials=True)

# Register routes
app.register_blueprint(players_bp)
app.register_blueprint(batting_bp)
app.register_blueprint(bowling_bp)
app.register_blueprint(all_rounder_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(analytics_bp)
app.register_blueprint(auction_bp)
app.register_blueprint(contact_bp)
app.register_blueprint(auth_bp)

@app.after_request
def add_header(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups'
    return response





# -----------------------------
# API STATUS (Legacy)
# -----------------------------
@app.route("/api/status")
def api_status():
    return jsonify({
        "project": "IPL Decision Analytics System",
        "status": "running"
    })


# -----------------------------
# RUN SERVER
# -----------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)