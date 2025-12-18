-- ============================================
-- Update is_vegan Tag Based on Strict Criteria
-- ============================================
-- Vegan = No meat, fish, eggs, dairy, or honey
-- Most strict dietary preference
-- ============================================

-- Step 0: Add is_vegan column if it doesn't exist
ALTER TABLE recipes_classified 
ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT FALSE;

-- Step 1: Update is_vegan
-- A recipe is vegan if:
-- 1. It's vegetarian (no meat)
-- 2. No dairy (no_dairy = TRUE)
-- 3. No eggs (no_eggs = TRUE)
-- 4. Does not contain honey in ingredients
UPDATE recipes_classified
SET is_vegan = TRUE
WHERE 
  -- Must be vegetarian
  is_vegetarian = TRUE
  
  -- Must not contain dairy
  AND no_dairy = TRUE
  
  -- Must not contain eggs
  AND no_eggs = TRUE
  
  -- Must not contain honey
  AND LOWER(ingredients::text) NOT LIKE '%honey%'
  
  -- Double-check: no fish/seafood keywords
  AND LOWER(recipe_title) NOT LIKE '%fish%'
  AND LOWER(recipe_title) NOT LIKE '%salmon%'
  AND LOWER(recipe_title) NOT LIKE '%tuna%'
  AND LOWER(recipe_title) NOT LIKE '%shrimp%'
  AND LOWER(recipe_title) NOT LIKE '%crab%'
  AND LOWER(recipe_title) NOT LIKE '%lobster%'
  AND LOWER(recipe_title) NOT LIKE '%sardine%'
  AND LOWER(recipe_title) NOT LIKE '%cod%'
  
  AND LOWER(ingredients::text) NOT LIKE '%fish%'
  AND LOWER(ingredients::text) NOT LIKE '%salmon%'
  AND LOWER(ingredients::text) NOT LIKE '%tuna%'
  AND LOWER(ingredients::text) NOT LIKE '%shrimp%'
  AND LOWER(ingredients::text) NOT LIKE '%crab%'
  AND LOWER(ingredients::text) NOT LIKE '%lobster%'
  AND LOWER(ingredients::text) NOT LIKE '%sardine%'
  AND LOWER(ingredients::text) NOT LIKE '%seafood%';

-- Step 2: Set is_vegan = FALSE for recipes that don't meet criteria
UPDATE recipes_classified
SET is_vegan = FALSE
WHERE is_vegan IS NULL OR (
  is_vegetarian = FALSE
  OR no_dairy = FALSE
  OR no_eggs = FALSE
  OR LOWER(ingredients::text) LIKE '%honey%'
);

-- Step 3: Show summary statistics
SELECT 
  'Vegan Recipes' AS category,
  COUNT(*) FILTER (WHERE is_vegan = TRUE) AS vegan_count,
  COUNT(*) FILTER (WHERE is_vegan = FALSE) AS non_vegan_count,
  ROUND(COUNT(*) FILTER (WHERE is_vegan = TRUE) * 100.0 / COUNT(*), 1) AS percentage
FROM recipes_classified;

-- Step 4: Show comparison with other dietary tags
SELECT 
  'Vegetarian' AS tag,
  COUNT(*) FILTER (WHERE is_vegetarian = TRUE) AS true_count,
  ROUND(COUNT(*) FILTER (WHERE is_vegetarian = TRUE) * 100.0 / COUNT(*), 1) AS percentage
FROM recipes_classified
UNION ALL
SELECT 
  'Vegan' AS tag,
  COUNT(*) FILTER (WHERE is_vegan = TRUE),
  ROUND(COUNT(*) FILTER (WHERE is_vegan = TRUE) * 100.0 / COUNT(*), 1)
FROM recipes_classified
UNION ALL
SELECT 
  'Pescatarian' AS tag,
  COUNT(*) FILTER (WHERE is_pescatarian = TRUE),
  ROUND(COUNT(*) FILTER (WHERE is_pescatarian = TRUE) * 100.0 / COUNT(*), 1)
FROM recipes_classified;

-- Step 5: Show sample vegan recipes
SELECT '=== SAMPLE VEGAN RECIPES ===' AS info;
SELECT 
  recipe_title,
  CASE WHEN no_dairy THEN '✓' ELSE '✗' END AS no_dairy,
  CASE WHEN no_eggs THEN '✓' ELSE '✗' END AS no_eggs,
  CASE WHEN is_vegetarian THEN '✓' ELSE '✗' END AS vegetarian
FROM recipes_classified 
WHERE is_vegan = TRUE 
LIMIT 15;

-- Step 6: Verify no animal products in vegan recipes
SELECT '=== VERIFYING VEGAN RECIPES (should be empty if correct) ===' AS info;
SELECT 
  recipe_title,
  CASE 
    WHEN LOWER(ingredients::text) LIKE '%egg%' THEN 'Contains eggs'
    WHEN LOWER(ingredients::text) LIKE '%milk%' THEN 'Contains milk'
    WHEN LOWER(ingredients::text) LIKE '%cheese%' THEN 'Contains cheese'
    WHEN LOWER(ingredients::text) LIKE '%butter%' THEN 'Contains butter'
    WHEN LOWER(ingredients::text) LIKE '%cream%' THEN 'Contains cream'
    WHEN LOWER(ingredients::text) LIKE '%yogurt%' THEN 'Contains yogurt'
    WHEN LOWER(ingredients::text) LIKE '%honey%' THEN 'Contains honey'
    ELSE 'ERROR: Unknown issue'
  END AS issue
FROM recipes_classified 
WHERE is_vegan = TRUE 
  AND (
    LOWER(ingredients::text) LIKE '%egg%'
    OR LOWER(ingredients::text) LIKE '%milk%'
    OR LOWER(ingredients::text) LIKE '%cheese%'
    OR LOWER(ingredients::text) LIKE '%butter%'
    OR LOWER(ingredients::text) LIKE '%cream%'
    OR LOWER(ingredients::text) LIKE '%yogurt%'
    OR LOWER(ingredients::text) LIKE '%honey%'
  )
LIMIT 10;

