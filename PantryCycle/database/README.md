# Database Scripts

## add_cooking_times.sql

### Purpose
Adds estimated preparation and cooking times to the `recipes_classified` table using rule-based imputation.

### Usage

#### Option 1: Railway Dashboard (Recommended)
1. Log in to Railway: https://railway.app
2. Select your PostgreSQL database
3. Click **"Query"** tab
4. Copy and paste the contents of `add_cooking_times.sql`
5. Click **"Run"** or press Ctrl/Cmd + Enter
6. Wait for completion (may take 30-60 seconds)

#### Option 2: psql Command Line
```bash
# Connect to your Railway database
psql "postgresql://postgres:password@host.railway.app:5432/railway"

# Run the script
\i add_cooking_times.sql

# Or pipe it directly
psql "postgresql://..." < add_cooking_times.sql
```

---

## Estimation Methodology

### Prep Time Estimation
Based on **ingredient count** and **recipe complexity**:

| Ingredients | Prep Time | Reasoning |
|------------|-----------|-----------|
| ≤ 5        | 10 min    | Simple recipes, minimal chopping |
| 6-10       | 15 min    | Standard complexity |
| 11-15      | 20 min    | More ingredients to prepare |
| > 15       | 25 min    | Complex recipes, extensive prep |

**Adjustments based on recipe type:**

| Recipe Type | Adjustment | Reasoning |
|------------|------------|-----------|
| **Salads** | Set to 10 min | Just washing and chopping vegetables |
| **Breakfast** | Max 12 min | Quick morning prep |
| **Soups/Stews** | +5 min | More chopping for multiple vegetables |
| **Baked goods** | +8 min | Mixing, kneading dough/batter |
| **Stir-fry** | 10-15 min | Pre-cut ingredients, quick prep |
| **Meat/Protein** | +5 min | Trimming, cutting, handling raw meat |

### Cook Time Estimation
Based on **cooking method** inferred from recipe title and category:

| Cooking Method | Cook Time | Examples |
|---------------|-----------|----------|
| No-cook / Salad | 5 min | Salads, smoothies, overnight oats |
| Breakfast | 12 min | Eggs, toast, quick breakfast items |
| Stir-fry / Sauté | 18 min | Quick pan-fried dishes |
| Grilled | 18 min | Grilled chicken, vegetables |
| Pasta / Rice | 22 min | Standard boiling/cooking time |
| Baked / Roasted | 35 min | Oven-baked dishes |
| Soup / Stew | 35 min | Simmered dishes |
| Slow-cooked | 50 min | Braised, slow-cooked recipes |

---

## Verification

After running the script, verify the results:

```sql
-- Check distribution
SELECT 
  prep_time, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recipes_classified), 1) as percentage
FROM recipes_classified
GROUP BY prep_time
ORDER BY prep_time;

SELECT 
  cook_time, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM recipes_classified), 1) as percentage
FROM recipes_classified
GROUP BY cook_time
ORDER BY cook_time;

-- Check some examples
SELECT 
  recipe_title,
  prep_time,
  cook_time,
  (prep_time + cook_time) as total_time,
  category
FROM recipes_classified
ORDER BY RANDOM()
LIMIT 10;
```

---

## Expected Results

After running the script:
- ✅ All recipes have `prep_time` between 10-30 minutes
- ✅ All recipes have `cook_time` between 5-60 minutes
- ✅ Distribution should be reasonable:
  - Most recipes: 15-25 min prep, 15-35 min cook
  - Quick recipes: 10 min prep, 5-12 min cook
  - Complex recipes: 25+ min prep, 40+ min cook

---

## Limitations & Assumptions

### This is an **approximation**, not exact timing:
- ✅ Suitable for meal planning and time estimation
- ✅ Consistent and reproducible
- ✅ Based on typical cooking patterns
- ❌ Not measured for each individual recipe
- ❌ May vary based on skill level and equipment

### Assumptions:
1. **Prep time** correlates with ingredient count
2. **Cook time** correlates with cooking method
3. Standard home cooking equipment and medium skill level
4. Does not account for simultaneous tasks (e.g., boiling while chopping)

---

## Methodology Statement (for Reports)

> Preparation and cooking times were estimated using a rule-based imputation method. 
> Prep time was calculated based on ingredient count (10-25 minutes), with adjustments 
> for protein handling. Cook time was inferred from recipe categories and typical 
> cooking methods (5-50 minutes). While these are approximations rather than measured 
> values, they provide consistent and reasonable estimates suitable for meal planning 
> and time management purposes.

---

## Troubleshooting

### Error: `jsonb_array_length does not exist`
**Solution:** Your ingredients might be stored as TEXT instead of JSONB. Modify the script to:
```sql
-- Replace jsonb_array_length with a simpler count
UPDATE recipes_classified
SET prep_time = 10
WHERE array_length(regexp_split_to_array(ingredients, ','), 1) <= 5;
```

### Error: `column already exists`
**Solution:** The script uses `ADD COLUMN IF NOT EXISTS`, so this shouldn't happen. But if it does:
```sql
-- Drop and recreate
ALTER TABLE recipes_classified DROP COLUMN IF EXISTS prep_time, DROP COLUMN IF EXISTS cook_time;
-- Then rerun the script
```

### Times seem unreasonable
**Solution:** Adjust the rules in the SQL script based on your specific recipe collection.

---

## API Integration

The frontend and API already expect these fields:

### API Response
```json
{
  "id": 1,
  "name": "Lentil Soup",
  "prepTime": 15,
  "cookTime": 35,
  ...
}
```

### Frontend Display
The `RecipeDetailPage` component displays:
- **Prep:** 15m
- **Cook:** 35m
- **Total:** 50m (calculated)

---

## Next Steps

After running this script:

1. ✅ **Deploy updated API** (already done - API reads `prep_time` and `cook_time`)
2. ✅ **Test frontend** - Recipe detail pages will show real times
3. ✅ **Document in report** - Use the methodology statement above
4. 🔄 **(Optional) Refine** - Adjust rules if needed based on your recipes

---

**Last Updated:** December 2024
**Status:** Production Ready ✅

