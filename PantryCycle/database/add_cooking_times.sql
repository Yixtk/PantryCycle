-- ============================================
-- Add prep_time and cook_time to recipes_classified
-- ============================================
-- Author: PantryCycle Team
-- Purpose: Estimate preparation and cooking times based on recipe characteristics
-- Estimation Method: Rule-based imputation using ingredients count, category, and meal type
-- ============================================

-- Step 1: Add columns
ALTER TABLE recipes_classified
ADD COLUMN IF NOT EXISTS prep_time INT DEFAULT 15,
ADD COLUMN IF NOT EXISTS cook_time INT DEFAULT 20;

-- ============================================
-- Step 2: PREP TIME Estimation
-- Based on ingredient count and complexity
-- ============================================

-- Default: 15 minutes for all recipes
UPDATE recipes_classified
SET prep_time = 15
WHERE prep_time IS NULL;

-- Simple recipes (≤5 ingredients): 10 minutes
UPDATE recipes_classified
SET prep_time = 10
WHERE jsonb_array_length(
  CASE 
    WHEN jsonb_typeof(ingredients) = 'object' THEN jsonb_object_keys_array(ingredients)
    ELSE ingredients
  END
) <= 5;

-- Medium complexity (6-10 ingredients): 15 minutes (already default)

-- More complex (11-15 ingredients): 20 minutes
UPDATE recipes_classified
SET prep_time = 20
WHERE jsonb_array_length(
  CASE 
    WHEN jsonb_typeof(ingredients) = 'object' THEN jsonb_object_keys_array(ingredients)
    ELSE ingredients
  END
) BETWEEN 11 AND 15;

-- Very complex (>15 ingredients): 25 minutes
UPDATE recipes_classified
SET prep_time = 25
WHERE jsonb_array_length(
  CASE 
    WHEN jsonb_typeof(ingredients) = 'object' THEN jsonb_object_keys_array(ingredients)
    ELSE ingredients
  END
) > 15;

-- Additional +5 minutes for meat/protein dishes (more handling required)
UPDATE recipes_classified
SET prep_time = prep_time + 5
WHERE LOWER(recipe_title) ~ '(chicken|beef|pork|fish|salmon|shrimp|turkey|lamb|tofu)'
   OR LOWER(category) ~ '(chicken|beef|pork|fish|salmon|shrimp|turkey|lamb)';

-- Reduce prep time for simple dishes
-- Salads: usually just washing and chopping (10 min)
UPDATE recipes_classified
SET prep_time = 10
WHERE LOWER(recipe_title) ~ '(salad|smoothie)'
   OR LOWER(category) ~ 'salad';

-- Breakfast dishes: typically quick prep (8-12 min)
UPDATE recipes_classified
SET prep_time = LEAST(prep_time, 12)
WHERE breakfast = TRUE;

-- Soups and stews: more chopping required (+5 min)
UPDATE recipes_classified
SET prep_time = prep_time + 5
WHERE LOWER(recipe_title) ~ '(soup|stew|chowder)'
   OR LOWER(category) ~ '(soup|stew)';

-- Baked goods: mixing and prep (+8 min for dough, batter)
UPDATE recipes_classified
SET prep_time = prep_time + 8
WHERE LOWER(recipe_title) ~ '(bake|baked|bread|cake|muffin|cookie|pie|pastry)'
   OR LOWER(category) ~ '(bake|bread|pastry)';

-- Stir-fry: usually pre-cut ingredients (keep at 15 or reduce)
UPDATE recipes_classified
SET prep_time = GREATEST(LEAST(prep_time, 15), 10)
WHERE LOWER(recipe_title) ~ '(stir.?fry|sauté)';

-- ============================================
-- Step 3: COOK TIME Estimation
-- Based on cooking method and meal type
-- ============================================

-- Default: 20 minutes
UPDATE recipes_classified
SET cook_time = 20
WHERE cook_time IS NULL;

-- Breakfast dishes: typically faster (10-15 minutes)
UPDATE recipes_classified
SET cook_time = 12
WHERE breakfast = TRUE;

-- Salads and no-cook dishes: 5 minutes
UPDATE recipes_classified
SET cook_time = 5
WHERE LOWER(recipe_title) ~ '(salad|smoothie|no-cook|overnight|raw)'
   OR LOWER(category) ~ '(salad|smoothie|raw)';

-- Stir-fry / Sauté: 15-20 minutes
UPDATE recipes_classified
SET cook_time = 18
WHERE LOWER(recipe_title) ~ '(stir.?fry|sauté|sauteed|pan.?fry|quick)'
   OR LOWER(category) ~ '(stir.?fry|sauté|sauteed)';

-- Pasta / Rice dishes: 20-25 minutes
UPDATE recipes_classified
SET cook_time = 22
WHERE LOWER(recipe_title) ~ '(pasta|spaghetti|linguine|rice|risotto|noodle)'
   OR LOWER(category) ~ '(pasta|rice|noodle)';

-- Soups and Stews: 30-45 minutes
UPDATE recipes_classified
SET cook_time = 35
WHERE LOWER(recipe_title) ~ '(soup|stew|chowder|bisque|broth)'
   OR LOWER(category) ~ '(soup|stew|chowder)';

-- Baked / Oven dishes: 30-40 minutes
UPDATE recipes_classified
SET cook_time = 35
WHERE LOWER(recipe_title) ~ '(bake|baked|roast|roasted|casserole|gratin)'
   OR LOWER(category) ~ '(bake|roast|casserole)';

-- Slow-cooked / Braised: 45-60 minutes
UPDATE recipes_classified
SET cook_time = 50
WHERE LOWER(recipe_title) ~ '(slow.?cook|braised|braise|simmer)'
   OR LOWER(category) ~ '(slow.?cook|braised)';

-- Grilled dishes: 15-20 minutes
UPDATE recipes_classified
SET cook_time = 18
WHERE LOWER(recipe_title) ~ '(grill|grilled|barbecue|bbq)'
   OR LOWER(category) ~ '(grill|barbecue)';

-- ============================================
-- Step 4: Verification Query
-- ============================================

-- Check the distribution of times
SELECT 
  'Prep Time Distribution' as metric,
  prep_time,
  COUNT(*) as recipe_count
FROM recipes_classified
GROUP BY prep_time
ORDER BY prep_time

UNION ALL

SELECT 
  'Cook Time Distribution' as metric,
  cook_time,
  COUNT(*) as recipe_count
FROM recipes_classified
GROUP BY cook_time
ORDER BY cook_time;

-- Show some examples
SELECT 
  recipe_title,
  prep_time,
  cook_time,
  prep_time + cook_time as total_time,
  category,
  breakfast,
  lunch,
  dinner
FROM recipes_classified
LIMIT 20;

-- ============================================
-- EXPLANATION (for documentation)
-- ============================================
-- 
-- Prep Time Estimation:
-- - Based on ingredient count (more ingredients = more prep)
-- - Adjusted for protein/meat dishes (+5 min for handling)
-- - Assumption: More ingredients require more chopping and setup
--
-- Cook Time Estimation:
-- - Based on cooking method inferred from recipe title/category
-- - Typical cooking times for common methods:
--   * Quick methods: 5-20 minutes (salad, stir-fry, breakfast)
--   * Standard methods: 20-30 minutes (pasta, rice, grilled)
--   * Slow methods: 30-60 minutes (soup, stew, baked, braised)
-- - Assumption: Cooking method determines time more than ingredients
--
-- Limitations:
-- - These are approximations, not exact measured times
-- - Actual time may vary based on skill level and equipment
-- - Suitable for meal planning and time estimation purposes
--
-- ============================================

