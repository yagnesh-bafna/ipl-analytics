from flask import Blueprint, jsonify, request, redirect
import sqlite3
import hashlib
import os
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from database.connect_db import get_connection

# Load environment variables
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

auth_bp = Blueprint("auth", __name__)

def init_users_table():
    conn = get_connection()
    if conn is None:
        print("Warning: Could not connect to database to initialize users table.")
        return
        
    c = conn.cursor()
    # Ensure users table exists
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    conn.commit()
    
    # Try adding the role, dream_team, and is_suspended columns for existing systems
    try:
        c.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT \'user\'')
        conn.commit()
    except: conn.rollback()
        
    try:
        c.execute('ALTER TABLE users ADD COLUMN dream_team TEXT DEFAULT \'[]\'')
        conn.commit()
    except: conn.rollback()

    try:
        c.execute('ALTER TABLE users ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE')
        conn.commit()
    except: conn.rollback()

    try:
        c.execute('ALTER TABLE users ADD COLUMN last_login TIMESTAMP')
        conn.commit()
    except: conn.rollback()

    try:
        c.execute('ALTER TABLE users ADD COLUMN otp_code TEXT')
        conn.commit()
    except: conn.rollback()

    try:
        c.execute('ALTER TABLE users ADD COLUMN otp_expiry TIMESTAMP')
        conn.commit()
    except: conn.rollback()

    conn.close()

# Initialize the table when module is loaded
init_users_table()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

ADMIN_SECRET_KEY = "IPL_ADMIN_2026"

@auth_bp.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")
    admin_key = data.get("admin_key", "")
    
    if not username or not email or not password:
         return jsonify({"error": "Missing required fields"}), 400
         
    # Secure Admin Registration Logic
    if role == "admin":
        if admin_key != ADMIN_SECRET_KEY:
            return jsonify({"error": "Invalid Admin Invite Key. Registration denied."}), 403
            
    password_hash = hash_password(password)
    
    conn = get_connection()
    if conn is None:
         return jsonify({"error": "Database connection failed"}), 500
         
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s)", 
                  (username, email, password_hash, role))
        conn.commit()
        success = True
    except Exception as e:
        success = False
        print(f"Signup error: {e}")
    finally:
        conn.close()
        
    if success:
         return jsonify({"message": "User created successfully"}), 201
    else:
         return jsonify({"error": "Username or email already exists"}), 409

@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    role_req = data.get("role", "user")
    admin_key = data.get("admin_key")
    
    if not username or not password:
         return jsonify({"error": "Missing required fields"}), 400
         
    # Enforce Admin Passkey for Admin Role Login
    if role_req == "admin":
        if admin_key != ADMIN_SECRET_KEY:
            return jsonify({"error": "Invalid Admin Passkey. Access denied."}), 403
            
    password_hash = hash_password(password)
    
    conn = get_connection()
    if conn is None:
         return jsonify({"error": "Database connection failed"}), 500
         
    c = conn.cursor()
    c.execute("SELECT id, username, email, role, is_suspended FROM users WHERE username = %s AND password_hash = %s", 
              (username, password_hash))
    
    user_row = c.fetchone()
    
    if user_row:
         # Verify role match
         actual_role = user_row[3]
         if role_req == "admin" and actual_role != "admin":
             conn.close()
             return jsonify({"error": "Identity mismatch. This account does not have Admin privileges."}), 403
             
         user_data = {
             "id": user_row[0],
             "username": user_row[1],
             "email": user_row[2],
             "role": actual_role if actual_role else "user"
         }
         
         # Update last_login timestamp
         c.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user_row[0],))
         conn.commit()

         is_suspended = user_row[4]
         conn.close()
         
         if is_suspended:
             return jsonify({"error": "Your account has been suspended. Please contact the administrator."}), 403
             
         return jsonify({
             "message": "Login successful",
             "user": user_data
         }), 200
    else:
         conn.close()
         return jsonify({"error": "Invalid username or password"}), 401

# -----------------------------
# USER MANAGEMENT (ADMIN)
# -----------------------------

from datetime import datetime, timedelta

@auth_bp.route("/api/admin/users", methods=["GET"])
def get_all_users():
    conn = get_connection()
    if conn is None: return jsonify({"error": "DB error"}), 500
    c = conn.cursor()
    c.execute("SELECT id, username, email, role, last_login FROM users ORDER BY id ASC")
    users = c.fetchall()
    conn.close()
    
    user_list = []
    for u in users:
        is_active = (datetime.now() - u[4]) < timedelta(days=2) if u[4] else False
        user_list.append({
            "id": u[0],
            "username": u[1],
            "email": u[2],
            "role": u[3],
            "status": "Active" if is_active else "Inactive"
        })
    return jsonify(user_list)

@auth_bp.route("/api/admin/user/remove", methods=["POST"])
def remove_user():
    data = request.json
    uid = data.get("user_id")
    
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE id = %s", (uid,))
    conn.commit()
    conn.close()
    return jsonify({"message": "User removed"})

from flask_mail import Message
from app import mail
import random

@auth_bp.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = c.fetchone()

    if not user:
        conn.close()
        # Still return success to prevent user enumeration
        return jsonify({"message": "If an account with that email exists, a password reset OTP has been sent."}), 200

    otp = str(random.randint(100000, 999999))
    otp_expiry = datetime.now() + timedelta(minutes=10)

    c.execute("UPDATE users SET otp_code = %s, otp_expiry = %s WHERE email = %s", (otp, otp_expiry, email))
    conn.commit()
    conn.close()

    try:
        msg = Message("Your IPL Think Tank Password Reset Code", recipients=[email])
        msg.body = f"Your password reset OTP is: {otp}. It will expire in 10 minutes."
        mail.send(msg)
    except Exception as e:
        print(f"Mail Error: {e}")
        # Don't expose mail errors to the client
        return jsonify({"error": "Could not send reset email."}), 500

    return jsonify({"message": "If an account with that email exists, a password reset OTP has been sent."}), 200

@auth_bp.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required"}), 400

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT otp_code, otp_expiry FROM users WHERE email = %s", (email,))
    user = c.fetchone()

    if not user or user[0] != otp:
        conn.close()
        return jsonify({"error": "Invalid OTP"}), 400

    if datetime.now() > user[1]:
        conn.close()
        return jsonify({"error": "OTP has expired"}), 400

    conn.close()
    return jsonify({"message": "OTP verified successfully"}), 200

@auth_bp.route("/api/reset-password", methods=["POST"])
def reset_password_with_otp():
    data = request.json
    email = data.get("email")
    otp = data.get("otp")
    new_password = data.get("new_password")

    if not email or not otp or not new_password:
        return jsonify({"error": "Email, OTP, and new password are required"}), 400

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT otp_code, otp_expiry FROM users WHERE email = %s", (email,))
    user = c.fetchone()

    if not user or user[0] != otp:
        conn.close()
        return jsonify({"error": "Invalid OTP"}), 400

    if datetime.now() > user[1]:
        conn.close()
        return jsonify({"error": "OTP has expired"}), 400

    password_hash = hash_password(new_password)
    c.execute("UPDATE users SET password_hash = %s, otp_code = NULL, otp_expiry = NULL WHERE email = %s", (password_hash, email))
    conn.commit()
    conn.close()

    return jsonify({"message": "Password has been reset successfully"}), 200

@auth_bp.route("/api/admin/user/reset_password", methods=["POST"])
def reset_password():
    data = request.json
    uid = data.get("user_id")
    new_pass = data.get("new_password")
    
    hash_p = hash_password(new_pass)
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hash_p, uid))
    conn.commit()
    conn.close()
    return jsonify({"message": "Password reset successfully"})

@auth_bp.route("/api/team/save", methods=["POST"])
def save_team():
    data = request.json
    user_id = data.get("user_id")
    dream_team = data.get("dream_team", "[]") # stringified json array
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
        
    conn = get_connection()
    if conn is None:
        return jsonify({"error": "Database error"}), 500
        
    try:
        c = conn.cursor()
        c.execute("UPDATE users SET dream_team = %s WHERE id = %s", (dream_team, user_id))
        conn.commit()
        return jsonify({"message": "Dream Team saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@auth_bp.route("/api/team/load", methods=["GET"])
def load_team():
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "User ID required"}), 400
        
    conn = get_connection()
    if conn is None:
        return jsonify({"error": "Database error"}), 500
        
    try:
        c = conn.cursor()
        c.execute("SELECT dream_team FROM users WHERE id = %s", (user_id,))
        row = c.fetchone()
        
        team_data = row[0] if row and row[0] else "[]"
        return jsonify({"dream_team": team_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
@auth_bp.route("/api/user/stats", methods=["GET"])
def get_user_stats():
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"saved_squads": 0, "analytics_explored": 0}), 200
        
    conn = get_connection()
    if conn is None:
        return jsonify({"error": "Database error"}), 500
        
    try:
        c = conn.cursor()
        
        # 1. Count Saved Squads
        # Current logic: dream_team column stores the squad. 
        # If it's not empty/default, we count it as 1 saved squad.
        c.execute("SELECT dream_team FROM users WHERE id = %s", (user_id,))
        row = c.fetchone()
        saved_squads = 0
        if row and row[0] and row[0] != '[]' and row[0] != 'null':
            saved_squads = 1
            
        # 2. Count Analytics Explored (Unique players scouted)
        c.execute("SELECT COUNT(DISTINCT player_name) FROM player_scout_logs WHERE user_id = %s", (user_id,))
        analytics_explored = c.fetchone()[0] or 0
        
        return jsonify({
            "saved_squads": saved_squads,
            "analytics_explored": analytics_explored
        }), 200
    except Exception as e:
        print(f"Stats Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@auth_bp.route("/redirect")
def google_redirect():
    # If using ux_mode='redirect', Google returns here with params.
    # However, since we are a SPA, it's usually better to redirect to the frontend.
    # We can just redirect the user back to the frontend Auth page.
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return redirect(f"{frontend_url}/auth")

@auth_bp.route("/api/google-login", methods=["POST"])
def google_login():
    data = request.json
    token = data.get("token")
    
    if not token:
        return jsonify({"error": "Google token missing"}), 400
        
    try:
        # Verify the Google ID Token
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        # ID token is valid. Get user details from Google
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        conn = get_connection()
        if conn is None:
            return jsonify({"error": "Database error"}), 500
            
        c = conn.cursor()
        
        # Check if user already exists
        c.execute("SELECT id, username, email, role, is_suspended FROM users WHERE email = %s", (email,))
        user_row = c.fetchone()
        
        if user_row:
            # User exists, log them in
            user_data = {
                "id": user_row[0],
                "username": user_row[1],
                "email": user_row[2],
                "role": user_row[3] or "user"
            }
            is_suspended = user_row[4]
            conn.close()
            
            if is_suspended:
                return jsonify({"error": "Account suspended"}), 403
                
            return jsonify({"message": "Login successful", "user": user_data}), 200
        else:
            # User doesn't exist, create new one with role 'user'
            # For simplicity, we use email as a starting point for username if it's unique
            username = email.split('@')[0]
            
            # Check if username is taken, append random if needed (keeping it simple here)
            c.execute("SELECT id FROM users WHERE username = %s", (username,))
            if c.fetchone():
                username = f"{username}_{google_id[:5]}"
                
            # Random password hash for Google users (they won't use it, but column is NOT NULL)
            dummy_hash = hash_password(os.urandom(16).hex())
            
            try:
                c.execute(
                    "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id",
                    (username, email, dummy_hash, "user")
                )
                new_id = c.fetchone()[0]
                conn.commit()
                
                user_data = {
                    "id": new_id,
                    "username": username,
                    "email": email,
                    "role": "user"
                }
                conn.close()
                return jsonify({"message": "User created via Google", "user": user_data}), 201
            except Exception as e:
                conn.rollback()
                conn.close()
                return jsonify({"error": f"Failed to create user: {str(e)}"}), 500
                
    except ValueError as e:
        # Invalid token
        return jsonify({"error": "Invalid Google token"}), 401
    except Exception as e:
        print(f"Google Login error: {e}")
        return jsonify({"error": "Internal server error"}), 500
