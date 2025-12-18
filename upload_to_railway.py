"""
将 All_Recipes_Classified.xlsx 上传到 Railway 数据库

使用方法：
1. 设置环境变量或直接在代码中配置数据库连接信息
2. 运行: python3 upload_to_railway.py
"""

import pandas as pd
import os
from sqlalchemy import create_engine, text
import sys

# ============================================
# 数据库配置
# ============================================
# 方式1: 从环境变量读取（推荐，更安全）
# Railway 会自动设置这些环境变量
DATABASE_URL = os.getenv('DATABASE_URL')  # PostgreSQL格式: postgresql://user:password@host:port/dbname

# 方式2: 手动配置（如果环境变量不可用）
# 使用 caboose.proxy.rlwy.net 数据库
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:zuuLhISPQdEATGIoOSPyQoaBptNQufoq@caboose.proxy.rlwy.net:30953/railway"

# ============================================
# 配置检查
# ============================================
if not DATABASE_URL:
    print("=" * 60)
    print("错误: 未找到 DATABASE_URL 环境变量")
    print("=" * 60)
    print("\n请选择以下方式之一:")
    print("\n方式1: 设置环境变量")
    print("  export DATABASE_URL='postgresql://user:password@host:port/dbname'")
    print("\n方式2: 在代码中直接设置 DATABASE_URL（不推荐用于生产环境）")
    print("\n方式3: 使用 Railway CLI")
    print("  railway link")
    print("  railway run python3 upload_to_railway.py")
    sys.exit(1)

# ============================================
# 读取 Excel 文件
# ============================================
print("=" * 60)
print("读取 Excel 文件")
print("=" * 60)

excel_file = '/Users/yixiangtiankai/Documents/DSP_2025Fall/Primary Decsion Tree/All_Recipes_Classified.xlsx'

try:
    df = pd.read_excel(excel_file, header=0)
    print(f"✓ 成功读取: {len(df)} 个菜谱")
    print(f"✓ 列数: {len(df.columns)}")
except Exception as e:
    print(f"✗ 读取文件失败: {e}")
    sys.exit(1)

# ============================================
# 数据预处理
# ============================================
print("\n" + "=" * 60)
print("数据预处理")
print("=" * 60)

# 清理列名（移除空格，转换为小写，用下划线替换）
df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('(', '').str.replace(')', '')

# 处理空值
df = df.fillna('')

# 确保所有字符串列都是字符串类型
for col in df.columns:
    if df[col].dtype == 'object':
        df[col] = df[col].astype(str)

print(f"✓ 数据预处理完成")
print(f"  列名: {list(df.columns)[:5]}... (共{len(df.columns)}列)")

# ============================================
# 连接数据库
# ============================================
print("\n" + "=" * 60)
print("连接数据库")
print("=" * 60)

try:
    # 创建数据库引擎（Railway 需要 SSL）
    if 'railway' in DATABASE_URL or 'rlwy.net' in DATABASE_URL:
        engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'})
    else:
        engine = create_engine(DATABASE_URL)
    
    # 测试连接
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✓ 数据库连接成功")
except Exception as e:
    print(f"✗ 数据库连接失败: {e}")
    print("\n请检查:")
    print("1. DATABASE_URL 是否正确")
    print("2. 数据库服务是否运行")
    print("3. 网络连接是否正常")
    sys.exit(1)

# ============================================
# 创建表（如果不存在）
# ============================================
print("\n" + "=" * 60)
print("创建数据表")
print("=" * 60)

# 生成 CREATE TABLE SQL
table_name = 'recipes_classified'  # 新表名，不会影响现有的 recipes 表

# 根据数据类型生成 SQL 类型
def get_sql_type(dtype, col_name):
    if 'int' in str(dtype):
        return 'INTEGER'
    elif 'float' in str(dtype):
        return 'REAL'
    elif 'bool' in str(dtype):
        return 'BOOLEAN'
    else:
        # 字符串类型，根据列名判断长度
        if 'nutrition' in col_name.lower():
            return 'TEXT'  # JSON 字符串
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
    print(f"✓ 数据表 '{table_name}' 创建成功（如果已存在则跳过）")
except Exception as e:
    print(f"✗ 创建表失败: {e}")
    # 继续尝试插入数据（表可能已存在）

# ============================================
# 上传数据
# ============================================
print("\n" + "=" * 60)
print("上传数据到数据库")
print("=" * 60)

try:
    # 方式1: 使用 pandas to_sql（推荐，自动处理）
    print(f"正在上传 {len(df)} 条记录到表 '{table_name}'...")
    
    # 如果表已存在数据，可以选择替换或追加
    # if_exists 选项: 'fail', 'replace', 'append'
    df.to_sql(
        name=table_name,
        con=engine,
        if_exists='replace',  # 替换现有数据，改为 'append' 可追加数据
        index=False,
        method='multi',  # 批量插入，提高速度
        chunksize=1000  # 每次插入1000条
    )
    
    print(f"✓ 成功上传 {len(df)} 条记录到表 '{table_name}'")
    
except Exception as e:
    print(f"✗ 上传失败: {e}")
    print("\n尝试使用逐条插入方式...")
    
    # 方式2: 逐条插入（备用方案）
    try:
        with engine.connect() as conn:
            # 先清空表
            conn.execute(text(f"TRUNCATE TABLE {table_name}"))
            
            # 逐条插入
            for idx, row in df.iterrows():
                columns = ', '.join(df.columns)
                values = ', '.join([f"'{str(val).replace("'", "''")}'" for val in row.values])
                insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({values})"
                conn.execute(text(insert_sql))
            
            conn.commit()
            print(f"✓ 成功上传 {len(df)} 条记录（逐条插入方式）")
    except Exception as e2:
        print(f"✗ 逐条插入也失败: {e2}")
        sys.exit(1)

# ============================================
# 验证数据
# ============================================
print("\n" + "=" * 60)
print("验证数据")
print("=" * 60)

try:
    with engine.connect() as conn:
        result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        count = result.fetchone()[0]
        print(f"✓ 数据库中的记录数: {count}")
        
        if count == len(df):
            print("✓ 数据验证成功：记录数匹配")
        else:
            print(f"⚠ 警告：记录数不匹配（预期 {len(df)}，实际 {count}）")
        
        # 显示样本数据
        result = conn.execute(text(f"SELECT recipe_title, menstrual_phase_tag FROM {table_name} LIMIT 5"))
        print("\n样本数据:")
        for row in result:
            print(f"  - {row[0][:50]}... : {row[1]}")
            
except Exception as e:
    print(f"⚠ 验证时出错: {e}")

print("\n" + "=" * 60)
print("完成！")
print("=" * 60)
print(f"\n数据已成功上传到 Railway 数据库")
print(f"表名: {table_name}")
print(f"记录数: {len(df)}")

