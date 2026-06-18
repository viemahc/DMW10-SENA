import MySQLdb

try:
    # Connect to MariaDB without specifying a database
    conn = MySQLdb.connect(
        host='localhost',
        user='root',
        passwd='',
        port=3306
    )
    cursor = conn.cursor()
    
    # Create database
    cursor.execute("""
        CREATE DATABASE IF NOT EXISTS sena_auth_db 
        CHARACTER SET utf8mb4 
        COLLATE utf8mb4_unicode_ci
    """)
    
    print("✓ Database 'sena_auth_db' created successfully!")
    
    cursor.close()
    conn.close()
    
except MySQLdb.Error as e:
    print(f"Error: {e}")
