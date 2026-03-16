from database.connect_db import get_connection

def resequence_table(cursor, table, id_column, sequence_name):
    print(f"Resequencing {table}...")
    
    # 1. Get all current records ordered by current ID
    cursor.execute(f"SELECT {id_column} FROM {table} ORDER BY {id_column}")
    rows = cursor.fetchall()
    
    # 2. Update each record with a new sequential ID
    # Note: We use a temporary high ID range to avoid collisions during the update if needed,
    # but since we are re-assigning all, we can just do it sequentially.
    # To be safest with SERIAL/Sequences, we can use a temp table or just direct updates if IDs are unique.
    
    for i, (old_id,) in enumerate(rows, start=1):
        if old_id != i:
            # If this is the 'users' table, we must update dependent tables first
            if table == 'users':
                cursor.execute("UPDATE player_scout_logs SET user_id = %s WHERE user_id = %s", (i, old_id))
            
            cursor.execute(f"UPDATE {table} SET {id_column} = %s WHERE {id_column} = %s", (i, old_id))
            
    # 3. Reset the sequence to the new max ID
    cursor.execute(f"SELECT setval('{sequence_name}', (SELECT COALESCE(MAX({id_column}), 0) FROM {table}) + 1, false)")
    print(f"  Finished {table}. Sequence reset.")

def run_maintenance():
    conn = get_connection()
    if not conn:
        print("Failed to connect")
        return
    
    cur = conn.cursor()
    try:
        # Table mapping: (table_name, id_column, sequence_name)
        tables = [
            ('users', 'id', 'users_id_seq'),
            ('players', 'player_id', 'players_player_id_seq'),
            ('batting_stats', 'id', 'batting_stats_id_seq'),
            ('bowling_stats', 'id', 'bowling_stats_id_seq'),
            ('contact_messages', 'id', 'contact_messages_id_seq'),
            ('player_scout_logs', 'id', 'player_scout_logs_id_seq')
        ]
        
        for table, id_col, seq in tables:
            resequence_table(cur, table, id_col, seq)
            
        conn.commit()
        print("\nAll tables re-sequenced successfully!")
    except Exception as e:
        conn.rollback()
        print(f"\nError during re-sequencing: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_maintenance()
