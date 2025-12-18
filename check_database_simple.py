"""
简单检查数据库内容的脚本
"""
import os
import sys
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("=" * 60)
    print("错误: 未找到 DATABASE_URL")
    print("=" * 60)
    print("\n请使用以下方式之一运行:")
    print("\n1. 使用 Railway CLI:")
    print("   railway run --service postgresmvct python3 check_database_simple.py")
    print("\n2. 手动设置环境变量:")
    print("   export DATABASE_URL='postgresql://...'")
    print("   python3 check_database_simple.py")
    sys.exit(1)

print("=" * 60)
print("检查数据库内容")
print("=" * 60)
print(f"\n数据库连接: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else '已连接'}")

try:
    # 尝试使用 SSL 连接（Railway 通常需要）
    if 'railway' in DATABASE_URL or 'rlwy.net' in DATABASE_URL:
        # 添加 SSL 参数
        if '?' not in DATABASE_URL:
            DATABASE_URL += '?sslmode=require'
        else:
            DATABASE_URL += '&sslmode=require'
    
    engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'} if 'railway' in DATABASE_URL or 'rlwy.net' in DATABASE_URL else {})
    with engine.connect() as conn:
        # 1. 检查数据库名称
        result = conn.execute(text("SELECT current_database();"))
        db_name = result.fetchone()[0]
        print(f"\n✓ 数据库名称: {db_name}")
        
        # 2. 列出所有表
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result]
        
        if not tables:
            print("\n📭 数据库是空的（没有表）")
            print("   可以直接上传数据")
        else:
            print(f"\n📊 现有表 ({len(tables)} 个):")
            print("-" * 60)
            
            for table in tables:
                # 检查记录数
                try:
                    count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = count_result.fetchone()[0]
                    
                    # 检查列
                    cols_result = conn.execute(text(f"""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = '{table}'
                        ORDER BY ordinal_position;
                    """))
                    columns = [row[0] for row in cols_result]
                    
                    print(f"\n表名: {table}")
                    print(f"  记录数: {count}")
                    print(f"  列数: {len(columns)}")
                    print(f"  列名: {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''}")
                    
                    # 如果是 recipes 相关表，显示样本数据
                    if 'recipe' in table.lower() and count > 0:
                        sample = conn.execute(text(f"SELECT * FROM {table} LIMIT 3"))
                        print(f"\n  样本数据 (前3条):")
                        for i, row in enumerate(sample, 1):
                            print(f"    {i}. {dict(row._mapping)}")
                            
                except Exception as e:
                    print(f"  ⚠ 无法读取表 {table}: {e}")
        
        # 3. 检查是否有 recipes 相关表
        recipe_tables = [t for t in tables if 'recipe' in t.lower()]
        if recipe_tables:
            print(f"\n✓ 找到菜谱相关表: {recipe_tables}")
            print("   如果这些表已有数据，上传时会替换（使用 if_exists='replace'）")
        else:
            print("\n✓ 没有菜谱相关表，将创建新表")
            
except Exception as e:
    print(f"\n✗ 连接失败: {e}")
    print("\n请检查:")
    print("1. DATABASE_URL 是否正确")
    print("2. 数据库服务是否运行")
    print("3. 网络连接是否正常")
    sys.exit(1)

print("\n" + "=" * 60)

