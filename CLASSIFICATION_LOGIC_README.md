# Menstrual Phase Classification Logic

## Overview

This document describes the nutrient-based classification logic used to categorize recipes into four menstrual phases: **Menstrual**, **Follicular**, **Ovulation**, and **Luteal**. The classification is based on scientific understanding of nutritional needs during different phases of the menstrual cycle.

## Decision Tree Model Performance

The balanced classification rules were used to manually label all recipes in the training set, and a Decision Tree Classifier (max_depth=4) was trained on the labeled data.

### Training Dataset
- **Training Set Size**: 685 recipes
  - Health.xlsx: 55 recipes (100%)
  - test100recipes.xlsx: 30 recipes (30% randomly sampled)
  - Health_3000recipes.xlsx: 600 recipes (20% randomly sampled)
- **Test Set Size**: 2470 recipes

### Model Accuracy
- **Training Set Accuracy**: **87.01%**
- **Test Set Accuracy**: **85.43%**

### Training Set Distribution (After Balanced Classification Rules)
- **Menstrual**: 163 recipes (23.80%) ✓
- **Follicular**: 188 recipes (27.45%) ✓
- **Ovulation**: 162 recipes (23.65%) ✓
- **Luteal**: 172 recipes (25.11%) ✓

All phases are within the target range of 15-30%.

### Test Set Performance (Real Labels)
- **Menstrual**: 639 recipes (25.87%) - Precision: 1.00, Recall: 1.00, F1: 1.00
- **Follicular**: 623 recipes (25.22%) - Precision: 0.71, Recall: 0.87, F1: 0.78
- **Ovulation**: 486 recipes (19.68%) - Precision: 0.85, Recall: 0.84, F1: 0.85
- **Luteal**: 722 recipes (29.23%) - Precision: 0.88, Recall: 0.72, F1: 0.79

### Full Dataset Distribution (Health_3000recipes.xlsx - 3000 recipes)
- **Menstrual**: 792 recipes (26.40%) ✓
- **Follicular**: 778 recipes (25.93%) ✓
- **Ovulation**: 551 recipes (18.37%) ✓
- **Luteal**: 879 recipes (29.30%) ✓

All phases are within the target range of 15-30%.

## Classification Rules (Balanced Version)

### Goal
The classification rules are designed to achieve a balanced distribution where each menstrual phase accounts for **15-30%** of the dataset.

### Priority Order

The classification follows a priority-based approach, checking conditions in order from most specific to most general:

### 1. Menstrual Phase (Highest Priority)
**Primary Condition**: `Iron ≥ 4 mg` AND `Vitamin C ≥ 25 mg`

**Rationale**: 
- High iron requirement due to blood loss during menstruation
- Vitamin C enhances iron absorption
- **Increased thresholds** (from Iron≥3/VitC≥20) to reduce Menstrual phase samples and achieve better balance
- Highest priority to ensure proper recovery

**Example Recipes**: Iron-rich foods with high vitamin C sources (e.g., red meat with citrus, spinach with bell peppers)

---

### 2. Ovulation Phase (Second Priority)
**Primary Condition**: `Zinc ≥ 1.5 mg` AND `Vitamin C ≥ 20 mg` AND `Magnesium < 80 mg`

**Rationale**:
- Zinc is crucial for egg maturation and release
- Vitamin C supports reproductive health
- Lower magnesium distinguishes from Luteal phase
- All three conditions must be met simultaneously

**Example Recipes**: Zinc-rich foods (seafood, nuts, seeds) with moderate magnesium and vitamin C

---

### 3. Follicular Phase (Third Priority)
**Primary Condition**: `Iron 1.5–3.5 mg` AND `Vitamin C ≥ 15 mg` AND `Zinc ≥ 1.0 mg` AND NOT Menstrual

**Rationale**:
- Balanced nutrition for follicle development
- Moderate iron for tissue repair
- **Relaxed thresholds** (from Iron 1.8-3.5/VitC≥18/Zinc≥1.2) to increase Follicular phase samples
- Must NOT meet Menstrual criteria

**Example Recipes**: Balanced meals with moderate levels of key nutrients

---

### 4. Luteal Phase (Fourth Priority)
**Primary Condition**: (`Magnesium ≥ 100 mg` OR `Fiber ≥ 9 g`) AND NOT Menstrual AND NOT Ovulation

**Rationale**:
- High magnesium helps alleviate PMS symptoms (bloating, mood swings)
- High fiber stabilizes blood sugar and reduces cravings
- **Increased thresholds** (from Mg≥90/Fiber≥7) to reduce Luteal phase samples
- Must NOT meet Menstrual or Ovulation criteria

**Example Recipes**: Whole grains, leafy greens, legumes, high-fiber foods

---

## Secondary Classification Rules

If a recipe doesn't match the primary conditions, secondary rules are applied in order:

1. **Follicular (Relaxed)**: If `Iron 1.5-3.5 mg` AND `Vitamin C ≥ 12 mg` AND NOT Menstrual
2. **Ovulation (Relaxed)**: If `Zinc ≥ 1.4 mg` AND `Vitamin C ≥ 18 mg` AND `Magnesium < 85 mg` AND NOT Menstrual
3. **Luteal (Very High)**: If `Magnesium ≥ 105 mg` OR `Fiber ≥ 10 g`

## Default Fallback

If no conditions are met, the classification follows this priority:
1. **Ovulation**: If `Zinc ≥ 1.2 mg` AND `Vitamin C ≥ 15 mg` AND `Magnesium < 85 mg`
2. **Luteal**: If `Magnesium ≥ 100 mg` OR `Fiber ≥ 9 g`
3. **Follicular**: If `Iron ≥ 1.5 mg` AND `Vitamin C ≥ 12 mg`
4. **Ovulation**: Default fallback (to avoid over-classification as Follicular)

---

## Target Distribution

The rules are designed to achieve a balanced distribution across all four phases:
- **Target**: 15-30% per phase
- **Ideal**: ~20-25% per phase for a dataset of 55 recipes

---

## Key Nutrients by Phase

| Phase | Primary Nutrients | Key Functions |
|-------|------------------|---------------|
| **Menstrual** | Iron, Vitamin C | Blood loss recovery, iron absorption |
| **Follicular** | Iron, Vitamin C, Zinc | Follicle development, tissue repair |
| **Ovulation** | Zinc, Vitamin C | Egg maturation and release |
| **Luteal** | Magnesium, Fiber | PMS symptom relief, blood sugar stability |

---

## Implementation Notes

1. **Nutrient Units**: All values are in milligrams (mg) per serving, except fiber which is in grams (g)
2. **Priority**: Menstrual > Ovulation > Luteal > Follicular (in terms of specificity)
3. **Exclusivity**: Luteal condition explicitly excludes Ovulation to reduce confusion
4. **Balance**: Rules are tuned to achieve approximately equal distribution across phases

---

## Example Classifications

### Example 1: High Iron Recipe
- Iron: 4.2 mg, Vitamin C: 25 mg
- **Classification**: Menstrual ✓

### Example 2: High Zinc Recipe
- Zinc: 2.1 mg, Vitamin C: 22 mg, Magnesium: 65 mg
- **Classification**: Ovulation ✓

### Example 3: High Magnesium Recipe
- Magnesium: 95 mg, Fiber: 8 g, Zinc: 1.2 mg
- **Classification**: Luteal ✓

### Example 4: Balanced Recipe
- Iron: 2.5 mg, Vitamin C: 20 mg, Zinc: 1.4 mg
- **Classification**: Follicular ✓

---

## Scientific Basis

### Menstrual Phase (Days 1-5)
- **Iron Loss**: Average 30-40 mg iron lost during menstruation
- **Need**: High iron intake (≥3 mg) with vitamin C for absorption
- **Symptoms**: Fatigue, weakness (iron deficiency)

### Follicular Phase (Days 1-13)
- **Development**: Follicles mature in ovaries
- **Need**: Balanced nutrition for growth
- **Key Nutrients**: Moderate iron, zinc, vitamin C

### Ovulation Phase (Days 13-15)
- **Process**: Egg release from ovary
- **Need**: High zinc for egg quality and release
- **Key Nutrients**: Zinc ≥1.5 mg, vitamin C, lower magnesium

### Luteal Phase (Days 15-28)
- **PMS Symptoms**: Bloating, mood swings, cravings
- **Need**: High magnesium for symptom relief, fiber for blood sugar stability
- **Key Nutrients**: Magnesium ≥90 mg or Fiber ≥7 g

---

## Usage

To apply this classification to recipes:

```python
from classify_menstrual_phase import classify_menstrual_phase

# Recipe nutrition data (as dictionary)
recipe_nutrition = {
    'iron': 2.5,
    'vitamin C': 20,
    'zinc': 1.4,
    'magnesium': 75,
    'fiber': 5
}

# Classify
phase = classify_menstrual_phase(recipe_nutrition)
print(f"Recipe phase: {phase}")
```

---

## File Output

After classification, recipes are saved to `Health_Classified.xlsx` with an additional column:
- **Menstrual Phase Tag**: Contains the classified phase (Menstrual, Follicular, Ovulation, or Luteal)

---

## References

- Iron requirements during menstruation: WHO guidelines
- Zinc role in ovulation: Reproductive health research
- Magnesium for PMS: Clinical studies on PMS symptom management
- Fiber and blood sugar: Endocrinology research

---

## Model Training Details

### Decision Tree Parameters
- **Algorithm**: Decision Tree Classifier (scikit-learn)
- **Max Depth**: 4
- **Random State**: 42
- **Split Criterion**: Gini impurity
- **Training Method**: All training samples are manually labeled using the balanced classification rules before training

### Features Used
The model uses 14 nutritional features:
1. Calories
2. Protein
3. Unsaturated Fat
4. Trans Fat
5. Saturated Fat
6. Omega 3
7. Fiber
8. Vitamin C
9. Iron
10. Magnesium
11. Iodine
12. Zinc
13. Vitamin K
14. Calcium

### Training Process
1. **Manual Labeling**: All recipes in the training set are classified using the balanced classification rules (not model predictions)
2. **Feature Extraction**: Nutritional data is extracted and normalized from all three data sources
3. **Model Training**: Decision tree is trained on manually labeled data (685 recipes)
4. **Evaluation**: Model is evaluated on a separate test set (2470 recipes)

### Performance Summary
The model achieves **85.43% accuracy** on the test set, demonstrating:
1. The balanced classification rules create meaningful and learnable patterns
2. The decision tree effectively learns these patterns across a larger, more diverse dataset
3. The balanced distribution (15-30% per phase) ensures the model learns patterns for all four phases
4. Menstrual phase shows perfect precision and recall (1.00), indicating strong pattern recognition

---

## Preference and Allergy Detection Logic

In addition to menstrual phase classification, the system automatically detects dietary preferences and allergies based on recipe ingredients and nutritional information.

### Meal Time Detection (Breakfast/Lunch/Dinner)

Meal time classification is based on calorie content per serving:

- **Breakfast**: Calories < 300
  - Rationale: Breakfast meals are typically lighter and lower in calories
  - Example: Light meals, smoothies, simple dishes

- **Lunch**: Calories 300-600
  - Rationale: Moderate calorie intake for midday meals
  - Example: Balanced meals, salads with protein, moderate portions

- **Dinner**: Calories > 600
  - Rationale: Higher calorie intake for evening meals
  - Example: Hearty meals, larger portions, main courses

### Dietary Preference Detection

Preferences are detected by analyzing ingredients and nutritional values:

#### Vegetarian Detection
- **Condition**: No meat, poultry, or fish ingredients
- **Keywords Checked**: beef, pork, chicken, turkey, lamb, duck, goat, meat, bacon, sausage, ham
- **Result**: `Is_vegetarian = True` if no meat/poultry keywords found

#### Pescatarian Detection
- **Condition**: Contains fish but no meat or poultry
- **Fish Keywords**: fish, salmon, tuna, cod, sardine, mackerel, trout, tilapia
- **Result**: `is_pescatarian = True` if fish present but no meat/poultry

#### Gluten-Free Detection
- **Condition**: No wheat, flour, bread, pasta, or gluten-containing ingredients
- **Keywords Checked**: wheat, flour, bread, pasta, noodle, gluten, barley, rye
- **Result**: `is_gluten_free = True` if no gluten keywords found

#### High Protein Detection
- **Condition**: Protein content > 20g per serving
- **Calculation**: Based on `protein` value in nutrition data
- **Result**: `is_high_protein = True` if protein > 20g

#### Low Carb Detection
- **Condition**: Carbohydrates < 20g per serving
- **Calculation**: Based on `carbs` or `carbohydrates` value in nutrition data
- **Result**: `is_low_carb = True` if carbs < 20g
- **Note**: Requires carbs data in nutrition_per_serving

#### Keto Detection
- **Condition**: Low carbs (< 20g) AND moderate-high fat (> 10g)
- **Calculation**: Based on `carbs` and `fat` values in nutrition data
- **Result**: `is_keto = True` if both conditions met
- **Note**: Requires carbs and fat data in nutrition_per_serving

### Allergy Detection

Allergy detection analyzes ingredients to identify potential allergens. The system checks for the presence of allergens and sets the corresponding `no_*` flags to `False` if the allergen is present, `True` if absent.

#### Dairy Detection (`no_dairy`)
- **Keywords**: milk, cheese, butter, cream, yogurt, yoghurt, dairy, whey, casein
- **Logic**: `no_dairy = False` if any dairy keyword found, `True` otherwise

#### Egg Detection (`no_eggs`)
- **Keywords**: egg, eggs, mayonnaise, mayo
- **Logic**: `no_eggs = False` if any egg keyword found, `True` otherwise

#### Peanut Detection (`no_peanuts`)
- **Keywords**: peanut, peanuts, peanut butter
- **Logic**: `no_peanuts = False` if any peanut keyword found, `True` otherwise

#### Tree Nut Detection (`no_treenuts`)
- **Keywords**: almond, walnut, cashew, pistachio, pecan, hazelnut, macadamia, brazil nut, pine nut
- **Logic**: `no_treenuts = False` if any tree nut keyword found, `True` otherwise

#### Wheat/Gluten Detection (`no_wheat`)
- **Keywords**: wheat, flour, bread, pasta, noodle, gluten, barley, rye
- **Logic**: `no_wheat = False` if any wheat/gluten keyword found, `True` otherwise

#### Soy Detection (`no_soy`)
- **Keywords**: soy, soya, tofu, tempeh, edamame, miso
- **Logic**: `no_soy = False` if any soy keyword found, `True` otherwise

#### Shellfish Detection (`no_shellfish`)
- **Keywords**: shrimp, prawn, crab, lobster, scallop, mussel, clam, oyster, squid, octopus
- **Logic**: `no_shellfish = False` if any shellfish keyword found, `True` otherwise

### Implementation Details

1. **Ingredient Parsing**: 
   - Ingredients can be in dictionary format (JSON string) or plain text
   - Dictionary format: `{"ingredient1": "amount1", "ingredient2": "amount2"}`
   - System extracts ingredient names from dictionary keys for analysis

2. **Keyword Matching**:
   - All keyword matching is case-insensitive
   - Partial word matching is used (e.g., "cheese" matches "cream cheese")
   - Multiple keywords checked for each category

3. **Nutrition Data**:
   - Preferences requiring nutrition data (low_carb, keto) depend on available fields
   - If `carbs` or `carbohydrates` field is missing, these preferences cannot be detected

4. **Default Values**:
   - If ingredient data is missing or cannot be parsed, all allergy flags default to `False`
   - Preference flags default based on available data

### Example Detection

**Recipe**: "Grilled Chicken with Vegetables"
- **Ingredients**: `{"chicken": "200g", "broccoli": "1 cup", "olive oil": "2 tbsp"}`
- **Calories**: 450
- **Protein**: 35g

**Detected Values**:
- `breakfast = False`, `lunch = True`, `dinner = False` (calories 300-600)
- `Is_vegetarian = False` (contains "chicken")
- `is_pescatarian = False` (contains meat)
- `is_gluten_free = True` (no wheat/flour)
- `is_high_protein = True` (protein > 20g)
- `no_dairy = True` (no dairy keywords)
- `no_eggs = True` (no egg keywords)
- `no_wheat = True` (no wheat keywords)

---

## Database Data Format

### Overview
The `recipes_classified` table in PostgreSQL stores all recipe data with specific data types for each field category.

### Field Types

#### Text Fields (TEXT/VARCHAR)
- **Format**: Plain strings
- **Examples**:
  - `recipe_title`: "Lentil & Spinach Stew"
  - `cooking_instructions`: "["Sauté onion...", "Add lentils..."]"
  - `category`: "Main Course" (may be empty)
  - `menstrual_phase_tag`: "Menstrual", "Follicular", "Ovulation", or "Luteal"

#### JSON String Fields (TEXT)
- **Format**: JSON strings that require parsing
- **Fields**:
  - `ingredients`: `{"lentils":"1 cup","vegetable broth":"2 cups",...}`
  - `nutrition_per_serving`: `{"calories": 320, "protein": 18, "unsaturated fat": 6.5, ...}`
- **Usage**: Parse with `json.loads()` in application code
- **PostgreSQL Query**: Use `::json` or `->>` operators to extract values

#### Boolean Fields (BOOLEAN)
- **Format**: `true`/`false` in PostgreSQL, `True`/`False` in Python
- **Fields**:
  - Meal times: `breakfast`, `lunch`, `dinner`
  - Preferences: `is_vegetarian`, `is_pescatarian`, `is_gluten_free`, `is_low_carb`, `is_high_protein`, `is_keto`
  - Allergies: `no_dairy`, `no_eggs`, `no_peanuts`, `no_treenuts`, `no_wheat`, `no_soy`, `no_shellfish`

#### Numeric Fields
- **Format**: 
  - `nutrition_calories`: `DOUBLE PRECISION` (e.g., `320.0`)
  - `serving_size`: `BIGINT` (e.g., `1`)

### Example Usage

#### Python
```python
import json

# Read from database
recipe = get_recipe_from_db()

# Parse JSON fields
ingredients = json.loads(recipe['ingredients'])
nutrition = json.loads(recipe['nutrition_per_serving'])

# Use direct fields
phase = recipe['menstrual_phase_tag']  # "Luteal"
is_veg = recipe['is_vegetarian']  # True/False
```

#### SQL
```sql
-- Query by phase
SELECT * FROM recipes_classified 
WHERE menstrual_phase_tag = 'Menstrual';

-- Query with JSON extraction
SELECT 
    recipe_title,
    nutrition_per_serving::json->>'calories' as calories,
    nutrition_per_serving::json->>'protein' as protein
FROM recipes_classified
WHERE is_vegetarian = true;
```

### Notes
- JSON fields (`ingredients`, `nutrition_per_serving`) must be parsed before use
- Boolean values are stored as PostgreSQL `BOOLEAN` type
- All text fields use UTF-8 encoding
- Missing values may be empty strings (`''`) or `NULL`

---

**Last Updated**: December 2025
**Version**: 2.0

