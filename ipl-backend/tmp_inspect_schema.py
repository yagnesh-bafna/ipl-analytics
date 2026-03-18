from database.connect_db import get_connection

def inspect_schema():
    conn = get_connection()
    if not conn:
        print("Failed to connect")
        return
    
    cur = conn.cursor()
    
    # 1. List all tables
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = [r[0] for r in cur.fetchall()]
    print(f"Tables: {tables}")
    
    # 2. For each table, get columns and identify SERIAL-like columns
    for table in tables:
        print(f"\n--- Table: {table} ---")
        cur.execute(f"SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = '{table}'")
        cols = cur.fetchall()
        for col in cols:
            print(f"  Column: {col[0]}, Type: {col[1]}, Default: {col[2]}")
            
    # 3. Check for foreign keys
    print("\n--- Foreign Keys ---")
    cur.execute("""
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY';
    """)
    fks = cur.fetchall()
    for fk in fks:
        print(f"  {fk[0]}.{fk[1]} -> {fk[2]}.{fk[3]}")
        
    conn.close()

if __name__ == "__main__":
    inspect_schema()
