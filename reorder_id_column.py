"""
Reorder database table to move id column to the first position
"""

from sqlalchemy import create_engine, text
import sys

DATABASE_URL = 'postgresql://postgres:zuuLhISPQdEATGIoOSPyQoaBptNQufoq@caboose.proxy.rlwy.net:30953/railway'

print('=' * 60)
print('Reorder database table to move id column to the first position')
print('=' * 60)

try:
    engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'})
    
    with engine.connect() as conn:
        # Create new table with id in the first column
        print('\nStep 1: Creating new table (id in first column)...')
        
        create_table_sql = """
        CREATE TABLE recipes_classified_new (
            id INTEGER,
            recipe_title TEXT,
            ingredients TEXT,
            cooking_instructions TEXT,
            category TEXT,
            nutrition_calories DOUBLE PRECISION,
            serving_size BIGINT,
            nutrition_per_serving TEXT,
            breakfast BOOLEAN,
            lunch BOOLEAN,
            dinner BOOLEAN,
            is_vegetarian BOOLEAN,
            is_pescatarian BOOLEAN,
            is_gluten_free BOOLEAN,
            is_low_carb BOOLEAN,
            is_high_protein BOOLEAN,
            is_keto BOOLEAN,
            no_dairy BOOLEAN,
            no_eggs BOOLEAN,
            no_peanuts BOOLEAN,
            no_treenuts BOOLEAN,
            no_wheat BOOLEAN,
            no_soy BOOLEAN,
            no_shellfish BOOLEAN,
            menstrual_phase_tag TEXT
        );
        """
        
        conn.execute(text(create_table_sql))
        conn.commit()
        print('✓ New table created successfully')
        
        # Copy data (id in first column)
        print('\nStep 2: Copying data to new table...')
        copy_sql = """
        INSERT INTO recipes_classified_new 
        SELECT id, recipe_title, ingredients, cooking_instructions, category,
               nutrition_calories, serving_size, nutrition_per_serving,
               breakfast, lunch, dinner,
               is_vegetarian, is_pescatarian, is_gluten_free, is_low_carb,
               is_high_protein, is_keto,
               no_dairy, no_eggs, no_peanuts, no_treenuts, no_wheat, no_soy, no_shellfish,
               menstrual_phase_tag
        FROM recipes_classified
        ORDER BY id;
        """
        
        conn.execute(text(copy_sql))
        conn.commit()
        print('✓ Data copied successfully')
        
        # Verify data
        result = conn.execute(text('SELECT COUNT(*) FROM recipes_classified_new'))
        count = result.fetchone()[0]
        print(f'  New table record count: {count}')
        
        # Drop old table
        print('\nStep 3: Dropping old table...')
        conn.execute(text('DROP TABLE recipes_classified'))
        conn.commit()
        print('✓ Old table dropped successfully')
        
        # Rename new table
        print('\nStep 4: Renaming new table...')
        conn.execute(text('ALTER TABLE recipes_classified_new RENAME TO recipes_classified'))
        conn.commit()
        print('✓ Table renamed successfully')
        
        # Verify
        print('\nStep 5: Verifying results...')
        result = conn.execute(text("""
            SELECT column_name, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'recipes_classified'
            ORDER BY ordinal_position
            LIMIT 5;
        """))
        
        print('\nFirst 5 columns:')
        for col_name, pos in result:
            print(f'  {pos}. {col_name}')
        
        result = conn.execute(text('SELECT COUNT(*) FROM recipes_classified'))
        count = result.fetchone()[0]
        print(f'\nTotal record count: {count}')
        
        # Check "red onion pickle"
        result = conn.execute(text("""
            SELECT id, recipe_title 
            FROM recipes_classified 
            WHERE recipe_title ILIKE '%red onion pickle%'
        """))
        
        print('\n"Red onion pickle" record:')
        for row in result:
            print(f'  ID: {row[0]} | Title: {row[1]}')
        
        # Show first 5 records
        result = conn.execute(text("""
            SELECT id, recipe_title 
            FROM recipes_classified 
            ORDER BY id 
            LIMIT 5
        """))
        
        print('\nFirst 5 records (sorted by id):')
        for row in result:
            print(f'  ID: {row[0]} | {row[1][:50]}...')
        
except Exception as e:
    print(f'\n✗ Operation failed: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('\n' + '=' * 60)
print('Completed!')
print('=' * 60)
