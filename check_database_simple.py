"""
Simple script to check database content
"""
import os
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("=" * 60)
    print("Error: DATABASE_URL not found")
    print("=" * 60)
    print("\nPlease use one of the following methods:")
    print("\n1. Using Railway CLI:")
    print("   railway run --service postgresmvct python3 check_database_simple.py")
    print("\n2. Manually set environment variable:")
    print("   export DATABASE_URL='postgresql://...'")
    print("   python3 check_database_simple.py")
    sys.exit(1)

print("=" * 60)
print("Checking database content")
print("=" * 60)
print(f"\nDatabase connection: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'Connected'}")

try:
    # Try using SSL connection (Railway usually requires this)
    if 'railway' in DATABASE_URL or 'rlwy.net' in DATABASE_URL:
        # Add SSL parameters
        if '?' not in DATABASE_URL:
            DATABASE_URL += '?sslmode=require'
        else:
            DATABASE_URL += '&sslmode=require'
    
    engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'} if 'railway' in DATABASE_URL or 'rlwy.net' in DATABASE_URL else {})
    with engine.connect() as conn:
        # 1. Check database name
        result = conn.execute(text("SELECT current_database();"))
        db_name = result.fetchone()[0]
        print(f"\n✓ Database name: {db_name}")
        
        # 2. List all tables
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result]
        
        if not tables:
            print("\n📭 Database is empty (no tables)")
            print("   You can upload data directly")
        else:
            print(f"\n📊 Existing tables ({len(tables)}):")
            print("-" * 60)
            
            for table in tables:
                # Check record count
                try:
                    count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = count_result.fetchone()[0]
                    
                    # Check columns
                    cols_result = conn.execute(text(f"""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = '{table}'
                        ORDER BY ordinal_position;
                    """))
                    columns = [row[0] for row in cols_result]
                    
                    print(f"\nTable name: {table}")
                    print(f"  Record count: {count}")
                    print(f"  Column count: {len(columns)}")
                    print(f"  Column names: {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''}")
                    
                    # If it's a recipe-related table, show sample data
                    if 'recipe' in table.lower() and count > 0:
                        sample = conn.execute(text(f"SELECT * FROM {table} LIMIT 3"))
                        print(f"\n  Sample data (first 3 records):")
                        for i, row in enumerate(sample, 1):
                            print(f"    {i}. {dict(row._mapping)}")
                            
                except Exception as e:
                    print(f"  ⚠ Unable to read table {table}: {e}")
        
        # 3. Check if there are recipe-related tables
        recipe_tables = [t for t in tables if 'recipe' in t.lower()]
        if recipe_tables:
            print(f"\n✓ Found recipe-related tables: {recipe_tables}")
            print("   If these tables already have data, upload will replace it (using if_exists='replace')")
        else:
            print("\n✓ No recipe-related tables found, will create new table")
            
except Exception as e:
    print(f"\n✗ Connection failed: {e}")
    print("\nPlease check:")
    print("1. Is DATABASE_URL correct?")
    print("2. Is the database service running?")
    print("3. Is the network connection normal?")
    sys.exit(1)

print("\n" + "=" * 60)
