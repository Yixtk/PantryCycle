import os
import psycopg2
from psycopg2 import Error
import pandas as pd

def create_connection():
    """Create database connection using environment variables"""
    try:
        connection = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT'),
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
    
    # Your SQL query here
    query = """
        SELECT *
        FROM user_data;
    """
    
    print("\n" + "="*50)
    print("EXECUTING QUERY:")
    print("="*50)
    print(query)
    print("="*50 + "\n")
    
    # Execute query and get results as DataFrame
    df = query_to_dataframe(conn, query)
    
    if df is not None:
        print("QUERY RESULTS:")
        print("-"*50)
        print(df.to_string(index=False))  # Print full dataframe without index
        print("-"*50)
        print(f"\nTotal rows returned: {len(df)}")
    else:
        print("No results returned or query failed")
    
    # Close connection
    conn.close()
    print("\nDatabase connection closed")

if __name__ == "__main__":
    main()