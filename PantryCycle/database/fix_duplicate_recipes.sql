-- ============================================
-- Fix Duplicate Recipes and Add Primary Key
-- ============================================
-- This script:
-- 1. Shows duplicate statistics
-- 2. Removes duplicate rows (keeps first occurrence)
-- 3. Adds PRIMARY KEY constraint to prevent future duplicates
-- ============================================

-- Step 1: Show current state
SELECT '=== BEFORE CLEANUP ===' AS info;

SELECT 
  'Total rows' AS metric, 
  COUNT(*)::text AS value
FROM recipes_classified
UNION ALL
SELECT 
  'Unique recipe IDs', 
  COUNT(DISTINCT id)::text
FROM recipes_classified
UNION ALL
SELECT 
  'Duplicate rows (to be deleted)', 
  (COUNT(*) - COUNT(DISTINCT id))::text
FROM recipes_classified;

-- Step 2: Show examples of duplicates before deletion
SELECT '=== SAMPLE DUPLICATES ===' AS info;

SELECT id, recipe_title, COUNT(*) as count
FROM recipes_classified 
GROUP BY id, recipe_title
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 5;

-- Step 3: Delete duplicates (keep the first ctid for each ID)
DELETE FROM recipes_classified a
USING (
  SELECT 
    id,
    MIN(ctid) as first_ctid
  FROM recipes_classified
  GROUP BY id
  HAVING COUNT(*) > 1
) b
WHERE a.id = b.id
  AND a.ctid != b.first_ctid;

-- Step 4: Verify cleanup
SELECT '=== AFTER CLEANUP ===' AS info;

SELECT 
  'Total rows' AS metric, 
  COUNT(*)::text AS value
FROM recipes_classified
UNION ALL
SELECT 
  'Unique recipe IDs', 
  COUNT(DISTINCT id)::text
FROM recipes_classified
UNION ALL
SELECT 
  'Remaining duplicates', 
  (COUNT(*) - COUNT(DISTINCT id))::text
FROM recipes_classified;

-- Step 5: Add PRIMARY KEY constraint
ALTER TABLE recipes_classified 
ADD CONSTRAINT recipes_classified_pkey PRIMARY KEY (id);

SELECT '=== PRIMARY KEY ADDED ===' AS info;

-- Step 6: Verify primary key
SELECT 
  constraint_name, 
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'recipes_classified' 
  AND constraint_type = 'PRIMARY KEY';

-- Step 7: Show final statistics
SELECT '=== FINAL STATISTICS ===' AS info;

SELECT 
  'Total unique recipes' AS category,
  COUNT(*) AS count
FROM recipes_classified
UNION ALL
SELECT 
  'Vegetarian',
  COUNT(*) FILTER (WHERE is_vegetarian = TRUE)
FROM recipes_classified
UNION ALL
SELECT 
  'Vegan',
  COUNT(*) FILTER (WHERE is_vegan = TRUE)
FROM recipes_classified
UNION ALL
SELECT 
  'Pescatarian',
  COUNT(*) FILTER (WHERE is_pescatarian = TRUE)
FROM recipes_classified
UNION ALL
SELECT 
  'High Protein',
  COUNT(*) FILTER (WHERE is_high_protein = TRUE)
FROM recipes_classified
UNION ALL
SELECT 
  'Low Carb',
  COUNT(*) FILTER (WHERE is_low_carb = TRUE)
FROM recipes_classified
UNION ALL
SELECT 
  'Keto',
  COUNT(*) FILTER (WHERE is_keto = TRUE)
FROM recipes_classified;

