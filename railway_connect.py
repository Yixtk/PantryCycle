import os
import psycopg2
from psycopg2 import Error
import pandas as pd

def create_connection():
    """Create database connection using environment variables"""
    try:
        connection = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT', '5432'),  # Default to 5432 if not set
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD')
        )
        print("Successfully connected to the database")
        return connection
    except Error as e:
        print(f"Error connecting to database: {e}")
        return None

def execute_query(connection, query):
    """Execute a SELECT query and return results"""
    try:
        cursor = connection.cursor()
        cursor.execute(query)
        
        # Fetch all results
        results = cursor.fetchall()
        
        # Get column names
        column_names = [desc[0] for desc in cursor.description]
        
        cursor.close()
        return results, column_names
    except Error as e:
        print(f"Error executing query: {e}")
        return None, None

def query_to_dataframe(connection, query):
    """Execute query and return results as pandas DataFrame"""
    try:
        df = pd.read_sql_query(query, connection)
        return df
    except Error as e:
        print(f"Error executing query: {e}")
        return None

def main():
    # Create database connection
    conn = create_connection()
    
    if conn is None:
        print("Failed to connect to database")
        return
    
    # Example Query 1: Simple SELECT
    query1 = "SELECT * FROM users LIMIT 10;"
    results, columns = execute_query(conn, query1)
    
    if results:
        print(f"\nColumns: {columns}")
        print(f"Results: {results}")
    
    # Example Query 2: Using pandas (recommended for analysis)
    query2 = """
        SELECT 
            category, 
            COUNT(*) as count, 
            AVG(price) as avg_price
        FROM products
        GROUP BY category
        ORDER BY count DESC;
    """
    df = query_to_dataframe(conn, query2)
    
    if df is not None:
        print("\nQuery Results as DataFrame:")
        print(df)
        
        # Save to CSV
        df.to_csv('query_results.csv', index=False)
        print("Results saved to query_results.csv")
    
    # Close connection
    conn.close()
    print("\nDatabase connection closed")

if __name__ == "__main__":
    main()