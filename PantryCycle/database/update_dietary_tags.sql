-- ============================================
-- Update Dietary Tags Based on Nutrition Data
-- ============================================
-- This script updates is_low_carb, is_high_protein, 
-- is_pescatarian, and is_keto tags based on actual 
-- nutrition values and ingredients.
-- ============================================

-- Step 1: Update is_low_carb (carbs < 20g per serving)
UPDATE recipes_classified
SET is_low_carb = TRUE
WHERE (nutrition_per_serving::jsonb->>'carbohydrates')::numeric < 20
  AND nutrition_per_serving IS NOT NULL
  AND nutrition_per_serving != '';

-- Step 2: Update is_high_protein (protein >= 25g per serving)
UPDATE recipes_classified
SET is_high_protein = TRUE
WHERE (nutrition_per_serving::jsonb->>'protein')::numeric >= 25
  AND nutrition_per_serving IS NOT NULL
  AND nutrition_per_serving != '';

-- Step 3: Update is_keto (carbs < 10g AND fat > protein)
UPDATE recipes_classified
SET is_keto = TRUE
WHERE (nutrition_per_serving::jsonb->>'carbohydrates')::numeric < 10
  AND (
    COALESCE((nutrition_per_serving::jsonb->>'saturated fat')::numeric, 0) 
    + COALESCE((nutrition_per_serving::jsonb->>'unsaturated fat')::numeric, 0)
  ) > (nutrition_per_serving::jsonb->>'protein')::numeric
  AND nutrition_per_serving IS NOT NULL
  AND nutrition_per_serving != '';

-- Step 4: Update is_pescatarian (no meat, but fish is OK)
-- Pescatarian = no beef, pork, chicken, lamb, turkey, but fish/seafood is allowed
UPDATE recipes_classified
SET is_pescatarian = TRUE
WHERE (
  -- Must not contain common meat keywords
  LOWER(recipe_title) NOT LIKE '%beef%'
  AND LOWER(recipe_title) NOT LIKE '%pork%'
  AND LOWER(recipe_title) NOT LIKE '%chicken%'
  AND LOWER(recipe_title) NOT LIKE '%turkey%'
  AND LOWER(recipe_title) NOT LIKE '%lamb%'
  AND LOWER(recipe_title) NOT LIKE '%bacon%'
  AND LOWER(recipe_title) NOT LIKE '%sausage%'
  AND LOWER(recipe_title) NOT LIKE '%steak%'
  AND LOWER(recipe_title) NOT LIKE '%ribs%'
  
  -- Check ingredients too
  AND LOWER(ingredients::text) NOT LIKE '%beef%'
  AND LOWER(ingredients::text) NOT LIKE '%pork%'
  AND LOWER(ingredients::text) NOT LIKE '%chicken%'
  AND LOWER(ingredients::text) NOT LIKE '%turkey%'
  AND LOWER(ingredients::text) NOT LIKE '%lamb%'
  AND LOWER(ingredients::text) NOT LIKE '%bacon%'
  AND LOWER(ingredients::text) NOT LIKE '%sausage%'
  AND LOWER(ingredients::text) NOT LIKE '%ground meat%'
);

-- Step 5: Show summary statistics
SELECT 
  'Low Carb' AS tag,
  COUNT(*) FILTER (WHERE is_low_carb = TRUE) AS true_count,
  COUNT(*) FILTER (WHERE is_low_carb = FALSE OR is_low_carb IS NULL) AS false_count,
  ROUND(COUNT(*) FILTER (WHERE is_low_carb = TRUE) * 100.0 / COUNT(*), 1) AS percentage
FROM recipes_classified
UNION ALL
SELECT 
  'High Protein' AS tag,
  COUNT(*) FILTER (WHERE is_high_protein = TRUE),
  COUNT(*) FILTER (WHERE is_high_protein = FALSE OR is_high_protein IS NULL),
  ROUND(COUNT(*) FILTER (WHERE is_high_protein = TRUE) * 100.0 / COUNT(*), 1)
FROM recipes_classified
UNION ALL
SELECT 
  'Keto' AS tag,
  COUNT(*) FILTER (WHERE is_keto = TRUE),
  COUNT(*) FILTER (WHERE is_keto = FALSE OR is_keto IS NULL),
  ROUND(COUNT(*) FILTER (WHERE is_keto = TRUE) * 100.0 / COUNT(*), 1)
FROM recipes_classified
UNION ALL
SELECT 
  'Pescatarian' AS tag,
  COUNT(*) FILTER (WHERE is_pescatarian = TRUE),
  COUNT(*) FILTER (WHERE is_pescatarian = FALSE OR is_pescatarian IS NULL),
  ROUND(COUNT(*) FILTER (WHERE is_pescatarian = TRUE) * 100.0 / COUNT(*), 1)
FROM recipes_classified;

-- Step 6: Show sample recipes for each tag
SELECT '=== LOW CARB RECIPES ===' AS info;
SELECT recipe_title, 
       nutrition_per_serving::jsonb->>'carbohydrates' AS carbs,
       nutrition_per_serving::jsonb->>'protein' AS protein
FROM recipes_classified 
WHERE is_low_carb = TRUE 
LIMIT 5;

SELECT '=== HIGH PROTEIN RECIPES ===' AS info;
SELECT recipe_title,
       nutrition_per_serving::jsonb->>'protein' AS protein,
       nutrition_per_serving::jsonb->>'carbohydrates' AS carbs
FROM recipes_classified 
WHERE is_high_protein = TRUE 
LIMIT 5;

SELECT '=== KETO RECIPES ===' AS info;
SELECT recipe_title,
       nutrition_per_serving::jsonb->>'carbohydrates' AS carbs,
       (
         COALESCE((nutrition_per_serving::jsonb->>'saturated fat')::numeric, 0) 
         + COALESCE((nutrition_per_serving::jsonb->>'unsaturated fat')::numeric, 0)
       ) AS total_fat,
       nutrition_per_serving::jsonb->>'protein' AS protein
FROM recipes_classified 
WHERE is_keto = TRUE 
LIMIT 5;

SELECT '=== PESCATARIAN RECIPES ===' AS info;
SELECT recipe_title
FROM recipes_classified 
WHERE is_pescatarian = TRUE 
LIMIT 10;

