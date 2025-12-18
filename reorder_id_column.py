"""
重新排列数据库表，将 id 列移到第一列
"""

from sqlalchemy import create_engine, text
import sys

DATABASE_URL = 'postgresql://postgres:zuuLhISPQdEATGIoOSPyQoaBptNQufoq@caboose.proxy.rlwy.net:30953/railway'

print('=' * 60)
print('重新排列数据库表，将 id 列移到第一列')
print('=' * 60)

try:
    engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'})
    
    with engine.connect() as conn:
        # 创建新表，id 在第一列
        print('\n步骤 1: 创建新表（id 在第一列）...')
        
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
        print('✓ 新表创建成功')
        
        # 复制数据（id 在第一列）
        print('\n步骤 2: 复制数据到新表...')
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
        print('✓ 数据复制成功')
        
        # 验证数据
        result = conn.execute(text('SELECT COUNT(*) FROM recipes_classified_new'))
        count = result.fetchone()[0]
        print(f'  新表记录数: {count}')
        
        # 删除旧表
        print('\n步骤 3: 删除旧表...')
        conn.execute(text('DROP TABLE recipes_classified'))
        conn.commit()
        print('✓ 旧表删除成功')
        
        # 重命名新表
        print('\n步骤 4: 重命名新表...')
        conn.execute(text('ALTER TABLE recipes_classified_new RENAME TO recipes_classified'))
        conn.commit()
        print('✓ 表重命名成功')
        
        # 验证
        print('\n步骤 5: 验证结果...')
        result = conn.execute(text("""
            SELECT column_name, ordinal_position
            FROM information_schema.columns 
            WHERE table_name = 'recipes_classified'
            ORDER BY ordinal_position
            LIMIT 5;
        """))
        
        print('\n前5列:')
        for col_name, pos in result:
            print(f'  {pos}. {col_name}')
        
        result = conn.execute(text('SELECT COUNT(*) FROM recipes_classified'))
        count = result.fetchone()[0]
        print(f'\n总记录数: {count}')
        
        # 检查 "red onion pickle"
        result = conn.execute(text("""
            SELECT id, recipe_title 
            FROM recipes_classified 
            WHERE recipe_title ILIKE '%red onion pickle%'
        """))
        
        print('\n"Red onion pickle" 记录:')
        for row in result:
            print(f'  ID: {row[0]} | Title: {row[1]}')
        
        # 显示前5个记录
        result = conn.execute(text("""
            SELECT id, recipe_title 
            FROM recipes_classified 
            ORDER BY id 
            LIMIT 5
        """))
        
        print('\n前5个记录（按 id 排序）:')
        for row in result:
            print(f'  ID: {row[0]} | {row[1][:50]}...')
        
except Exception as e:
    print(f'\n✗ 操作失败: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)

print('\n' + '=' * 60)
print('完成！')
print('=' * 60)
