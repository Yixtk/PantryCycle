-- ============================================
-- Add Carbohydrates to nutrition_per_serving
-- ============================================
-- This script calculates carbohydrates based on:
-- Carbs (g) = (Total Calories - Protein×4 - Fat×9) ÷ 4
-- 
-- Nutritional facts:
-- - 1g Protein = 4 calories
-- - 1g Carbohydrate = 4 calories  
-- - 1g Fat = 9 calories
-- ============================================

-- Step 1: Add carbohydrates field to all recipes
UPDATE recipes_classified
SET nutrition_per_serving = jsonb_set(
  COALESCE(nutrition_per_serving::jsonb, '{}'::jsonb),
  '{carbohydrates}',
  (
    -- Calculate: (calories - protein*4 - total_fat*9) / 4
    -- Ensure result is at least 0
    to_jsonb(
      GREATEST(
        ROUND(
          CAST(
            (
              COALESCE((nutrition_per_serving::jsonb->>'calories')::numeric, nutrition_calories::numeric, 0) 
              - COALESCE((nutrition_per_serving::jsonb->>'protein')::numeric, 0) * 4
              - (
                  COALESCE((nutrition_per_serving::jsonb->>'saturated fat')::numeric, 0) 
                  + COALESCE((nutrition_per_serving::jsonb->>'unsaturated fat')::numeric, 0)
                ) * 9
            ) / 4.0
          AS numeric), 1)  -- Cast to numeric, then round to 1 decimal place
        , 0   -- Minimum value is 0
      )
    )
  ),
  true  -- Create if not exists
)
WHERE nutrition_per_serving IS NOT NULL
  AND nutrition_per_serving != '';

-- Step 2: Verify the update
-- Show sample results
SELECT 
  recipe_title,
  nutrition_per_serving::jsonb->>'calories' AS calories,
  nutrition_per_serving::jsonb->>'protein' AS protein,
  (
    COALESCE((nutrition_per_serving::jsonb->>'saturated fat')::numeric, 0) 
    + COALESCE((nutrition_per_serving::jsonb->>'unsaturated fat')::numeric, 0)
  ) AS total_fat,
  nutrition_per_serving::jsonb->>'carbohydrates' AS carbohydrates,
  nutrition_per_serving::jsonb->>'fiber' AS fiber
FROM recipes_classified
WHERE nutrition_per_serving IS NOT NULL
  AND nutrition_per_serving != ''
LIMIT 10;

-- Step 3: Show summary statistics
SELECT 
  COUNT(*) AS total_recipes,
  COUNT(nutrition_per_serving::jsonb->>'carbohydrates') AS recipes_with_carbs,
  ROUND(AVG((nutrition_per_serving::jsonb->>'carbohydrates')::numeric), 1) AS avg_carbs,
  ROUND(MIN((nutrition_per_serving::jsonb->>'carbohydrates')::numeric), 1) AS min_carbs,
  ROUND(MAX((nutrition_per_serving::jsonb->>'carbohydrates')::numeric), 1) AS max_carbs
FROM recipes_classified
WHERE nutrition_per_serving IS NOT NULL
  AND nutrition_per_serving != ''
  AND nutrition_per_serving::jsonb->>'carbohydrates' IS NOT NULL;

