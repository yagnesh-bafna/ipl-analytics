from flask import Flask, jsonify, render_template
from flask_cors import CORS

# Import all route blueprints
from route.players import players_bp
from route.batting import batting_bp
from route.bowling import bowling_bp
from route.player_profile import profile_bp
from route.analytics import analytics_bp
from route.auction import auction_bp
from route.contact import contact_bp
from route.auth import auth_bp
from route.all_rounder import all_rounder_bp

app = Flask(__name__)
CORS(app)

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


# -----------------------------
# HOME PAGE (WEB APP)
# -----------------------------
@app.route("/")
def home():
    return render_template("index.html")


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
    app.run(debug=True)