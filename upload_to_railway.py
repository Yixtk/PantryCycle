"""
Upload All_Recipes_Classified.xlsx to Railway database

Usage:
1. Set environment variable or configure database connection in code
2. Run: python3 upload_to_railway.py
"""

import pandas as pd
import os
from sqlalchemy import create_engine, text
import sys

# ============================================
# Database Configuration
# ============================================
# Method 1: Read from environment variable (recommended, more secure)
# Railway automatically sets these environment variables
DATABASE_URL = os.getenv('DATABASE_URL')  # PostgreSQL format: postgresql://user:password@host:port/dbname

# Method 2: Manual configuration (if environment variable is not available)
# Using caboose.proxy.rlwy.net database
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:zuuLhISPQdEATGIoOSPyQoaBptNQufoq@caboose.proxy.rlwy.net:30953/railway"

# ============================================
# Configuration Check
# ============================================
if not DATABASE_URL:
    print("=" * 60)
    print("Error: DATABASE_URL environment variable not found")
    print("=" * 60)
    print("\nPlease choose one of the following methods:")
    print("\nMethod 1: Set environment variable")
    print("  export DATABASE_URL='postgresql://user:password@host:port/dbname'")
    print("\nMethod 2: Set DATABASE_URL directly in code (not recommended for production)")
    print("\nMethod 3: Use Railway CLI")
    print("  railway link")
    print("  railway run python3 upload_to_railway.py")
    sys.exit(1)

# ============================================
# Read Excel File
# ============================================
print("=" * 60)
print("Reading Excel file")
print("=" * 60)

excel_file = '/Users/yixiangtiankai/Documents/DSP_2025Fall/Primary Decsion Tree/All_Recipes_Classified.xlsx'

try:
    df = pd.read_excel(excel_file, header=0)
    print(f"✓ Successfully read: {len(df)} recipes")
    print(f"✓ Column count: {len(df.columns)}")
except Exception as e:
    print(f"✗ Failed to read file: {e}")
    sys.exit(1)

# ============================================
# Data Preprocessing
# ============================================
print("\n" + "=" * 60)
print("Data preprocessing")
print("=" * 60)

# Clean column names (remove spaces, convert to lowercase, replace with underscores)
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('(', '').str.replace(')', '')

# Handle null values
df = df.fillna('')

# Ensure all string columns are string type
for col in df.columns:
    if df[col].dtype == 'object':
        df[col] = df[col].astype(str)

print(f"✓ Data preprocessing completed")
print(f"  Column names: {list(df.columns)[:5]}... (total {len(df.columns)} columns)")

# ============================================
# Connect to Database
# ============================================
print("\n" + "=" * 60)
print("Connecting to database")
print("=" * 60)

try:
    # Create database engine (Railway requires SSL)
    if 'railway' in DATABASE_URL or 'rlwy.net' in DATABASE_URL:
        engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'})
    else:
        engine = create_engine(DATABASE_URL)
    
    # Test connection
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✓ Database connection successful")
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    print("\nPlease check:")
    print("1. Is DATABASE_URL correct?")
    print("2. Is the database service running?")
    print("3. Is the network connection normal?")
    sys.exit(1)

# ============================================
# Create Table (if not exists)
# ============================================
print("\n" + "=" * 60)
print("Creating data table")
print("=" * 60)

# Generate CREATE TABLE SQL
table_name = 'recipes_classified'  # New table name, won't affect existing recipes table

# Generate SQL type based on data type
def get_sql_type(dtype, col_name):
    if 'int' in str(dtype):
        return 'INTEGER'
    elif 'float' in str(dtype):
        return 'REAL'
    elif 'bool' in str(dtype):
        return 'BOOLEAN'
    else:
        # String type, determine length based on column name
        if 'nutrition' in col_name.lower():
            return 'TEXT'  # JSON string
        elif 'instructions' in col_name.lower() or 'ingredients' in col_name.lower():
            return 'TEXT'
        else:
            return 'VARCHAR(500)'

create_table_sql = f"""
CREATE TABLE IF NOT EXISTS {table_name} (
    id SERIAL PRIMARY KEY,
"""

for col in df.columns:
    sql_type = get_sql_type(df[col].dtype, col)
    create_table_sql += f"    {col} {sql_type},\n"

create_table_sql = create_table_sql.rstrip(',\n') + "\n);"

try:
    with engine.connect() as conn:
        conn.execute(text(create_table_sql))
        conn.commit()
    print(f"✓ Data table '{table_name}' created successfully (skipped if already exists)")
except Exception as e:
    print(f"✗ Failed to create table: {e}")
    # Continue trying to insert data (table may already exist)

# ============================================
# Upload Data
# ============================================
print("\n" + "=" * 60)
print("Uploading data to database")
print("=" * 60)

try:
    # Method 1: Use pandas to_sql (recommended, automatic handling)
    print(f"Uploading {len(df)} records to table '{table_name}'...")
    
    # If table already has data, you can choose to replace or append
    # if_exists options: 'fail', 'replace', 'append'
    df.to_sql(
        name=table_name,
        con=engine,
        if_exists='replace',  # Replace existing data, change to 'append' to append data
        index=False,
        method='multi',  # Batch insert for better performance
        chunksize=1000  # Insert 1000 records at a time
    )
    
    print(f"✓ Successfully uploaded {len(df)} records to table '{table_name}'")
    
except Exception as e:
    print(f"✗ Upload failed: {e}")
    print("\nTrying row-by-row insert method...")
    
    # Method 2: Row-by-row insert (fallback method)
    try:
        with engine.connect() as conn:
            # Clear table first
            conn.execute(text(f"TRUNCATE TABLE {table_name}"))
            
            # Insert row by row
            for idx, row in df.iterrows():
                columns = ', '.join(df.columns)
                values = ', '.join([f"'{str(val).replace("'", "''")}'" for val in row.values])
                insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({values})"
                conn.execute(text(insert_sql))
            
            conn.commit()
            print(f"✓ Successfully uploaded {len(df)} records (row-by-row method)")
    except Exception as e2:
        print(f"✗ Row-by-row insert also failed: {e2}")
        sys.exit(1)

# ============================================
# Verify Data
# ============================================
print("\n" + "=" * 60)
print("Verifying data")
print("=" * 60)

try:
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        count = result.fetchone()[0]
        print(f"✓ Record count in database: {count}")
        
        if count == len(df):
            print("✓ Data verification successful: record count matches")
        else:
            print(f"⚠ Warning: Record count mismatch (expected {len(df)}, actual {count})")
        
        # Show sample data
        result = conn.execute(text(f"SELECT recipe_title, menstrual_phase_tag FROM {table_name} LIMIT 5"))
        print("\nSample data:")
        for row in result:
            print(f"  - {row[0][:50]}... : {row[1]}")
            
except Exception as e:
    print(f"⚠ Error during verification: {e}")

print("\n" + "=" * 60)
print("Completed!")
print("=" * 60)
print(f"\nData successfully uploaded to Railway database")
print(f"Table name: {table_name}")
print(f"Record count: {len(df)}")
