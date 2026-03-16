from flask import Blueprint, request, jsonify
from database.connect_db import get_connection

contact_bp = Blueprint('contact', __name__)

def init_db():
    conn = get_connection()
    if conn is None: return
    
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize DB on load
init_db()

@contact_bp.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.json
    
    if not data or 'name' not in data or 'email' not in data or 'message' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
        
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute(
            'INSERT INTO contact_messages (name, email, message) VALUES (%s, %s, %s)',
            (data['name'], data['email'], data['message'])
        )
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Message saved successfully'}), 201
    except Exception as e:
        print(f"Error saving contact msg: {e}")
        return jsonify({'error': 'Internal server error'}), 500
