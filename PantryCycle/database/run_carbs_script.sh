#!/bin/bash
# ============================================
# Run add_carbohydrates.sql on Railway Database
# ============================================

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set it first:"
  echo "  export DATABASE_URL='postgresql://postgres:password@host:5432/railway'"
  echo ""
  echo "You can find your DATABASE_URL in Railway Dashboard:"
  echo "  1. Open your PostgreSQL service"
  echo "  2. Click 'Connect' or 'Variables'"
  echo "  3. Copy the DATABASE_URL value"
  exit 1
fi

echo "🔗 Connecting to Railway database..."
echo "📝 Running add_carbohydrates.sql..."
echo ""

# Run the SQL script
psql "$DATABASE_URL" -f add_carbohydrates.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ SUCCESS! Carbohydrates data has been added."
  echo ""
  echo "Next steps:"
  echo "  1. Check the output above for sample results"
  echo "  2. Test your app to see carbs data"
  echo "  3. (Optional) Run verification queries if needed"
else
  echo ""
  echo "❌ ERROR: Script failed. Check the error message above."
  exit 1
fi

