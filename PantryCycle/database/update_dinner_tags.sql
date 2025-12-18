-- Batch update: Mark non-salad, non-light lunch recipes as dinner-suitable
-- Excludes: salad, yogurt, smoothie, bowl, toast (light meals)

-- Step 1: Preview how many records will be updated
SELECT 
  COUNT(*) as will_be_updated,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM recipes_classified), 1) as percentage
FROM recipes_classified 
WHERE lunch = TRUE 
  AND dinner = FALSE
  AND LOWER(recipe_title) NOT LIKE '%salad%'
  AND LOWER(recipe_title) NOT LIKE '%yogurt%'
  AND LOWER(recipe_title) NOT LIKE '%smoothie%'
  AND LOWER(recipe_title) NOT LIKE '%bowl%'
  AND LOWER(recipe_title) NOT LIKE '%toast%';

-- Step 2: Execute the update
UPDATE recipes_classified 
SET dinner = TRUE 
WHERE lunch = TRUE 
  AND dinner = FALSE
  AND LOWER(recipe_title) NOT LIKE '%salad%'
  AND LOWER(recipe_title) NOT LIKE '%yogurt%'
  AND LOWER(recipe_title) NOT LIKE '%smoothie%'
  AND LOWER(recipe_title) NOT LIKE '%bowl%'
  AND LOWER(recipe_title) NOT LIKE '%toast%';

-- Step 3: Verify the results
SELECT 
  COUNT(*) as total_recipes,
  COUNT(*) FILTER (WHERE breakfast = TRUE) as breakfast,
  COUNT(*) FILTER (WHERE lunch = TRUE) as lunch,
  COUNT(*) FILTER (WHERE dinner = TRUE) as dinner,
  ROUND(100.0 * COUNT(*) FILTER (WHERE breakfast = TRUE) / COUNT(*), 1) as breakfast_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE lunch = TRUE) / COUNT(*), 1) as lunch_pct,
  ROUND(100.0 * COUNT(*) FILTER (WHERE dinner = TRUE) / COUNT(*), 1) as dinner_pct
FROM recipes_classified;

