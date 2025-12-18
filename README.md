# Menstrual Phase Recipe Classification with Decision Tree

A machine learning project that classifies recipes into four menstrual cycle phases (Menstrual, Follicular, Ovulation, Luteal) based on nutritional features using a Decision Tree Classifier.

## 📋 Overview

This project uses a nutrient-based classification system to categorize recipes according to their nutritional content, optimized for different phases of the menstrual cycle. The model achieves **85.43% accuracy** on the test set with a balanced distribution across all four phases.

## 🎯 Key Features

- **Multi-class Classification**: Categorizes recipes into 4 menstrual phases
- **Balanced Distribution**: Each phase accounts for 15-30% of the dataset
- **14 Nutritional Features**: Uses comprehensive nutrient data for classification
- **High Accuracy**: 85.43% test accuracy with Decision Tree (max_depth=4)
- **Complete Dataset**: 2,030 recipes classified and ready for use (after deduplication)

## 📊 Model Performance

### Training Dataset
- **Total Dataset**: 2,030 recipes (after removing duplicates from Health_3000recipes.xlsx)
  - Health.xlsx: 55 recipes
  - test100recipes.xlsx: 100 recipes
  - Health_3000recipes.xlsx: 1,875 unique recipes (deduplicated from 3,000)
- **Training Set**: 1,624 recipes (80% of total)
- **Test Set**: 406 recipes (20% of total)

### Accuracy Metrics
- **Training Set Accuracy**: **93.60%**
- **Test Set Accuracy**: **92.86%**

### Phase Distribution (Training Set - 1,624 recipes)
- Distribution across four phases is balanced within the target range of 15-30%

### Test Set Performance (406 recipes)
| Phase | Count | Precision | Recall | F1-Score |
|-------|-------|-----------|--------|----------|
| Menstrual | 87 (21.43%) | 1.00 | 1.00 | 1.00 |
| Follicular | 95 (23.40%) | 0.82 | 0.99 | 0.90 |
| Ovulation | 90 (22.17%) | 0.95 | 0.82 | 0.88 |
| Luteal | 134 (33.00%) | 0.96 | 0.91 | 0.93 |
| **Overall** | **406** | **0.93** | **0.93** | **0.93** |

## 🔬 Model Specifications

- **Algorithm**: Decision Tree Classifier
- **Max Depth**: 5
- **Criterion**: Gini Impurity
- **Splitting Method**: Information Gain
- **Random State**: 42 (for reproducibility)

### 14 Nutritional Features
- Calories, Protein, Unsaturated Fat, Trans Fat, Saturated Fat
- Omega 3, Fiber, Vitamin C, Iron, Magnesium
- Iodine, Zinc, Vitamin K, Calcium

## 📁 Data Sources

### Dataset Composition
| Source | Total | Origin |
|--------|-------|--------|
| Health.xlsx | 55 | ChatGPT-generated |
| test100recipes.xlsx | 100 | The Meal DB Free API |
| Health_3000recipes.xlsx | 1,875 (unique, deduplicated from 3,000) | ChatGPT-generated |

**Total**: 2,030 recipes → **80% training (1,624) / 20% testing (406)**

### Data Processing Pipeline

1. **Data Collection**
   - ChatGPT: Generated 3,055 recipes (55 + 3,000)
   - The Meal DB API: Downloaded 555 recipes (free tier)

2. **Data Cleaning & Preprocessing**
   - Unit conversion: Standardized measurement units
   - Weight calculation: Calculated ingredient weights
   - Serving size calculation: Determined per-serving portions
   - Nutrition calculation: Used USDA Food Central database

3. **Quality Refinement**
   - Base nutrients (fat, protein, calories): Accurate
   - Advanced nutrients (sodium, cholesterol): Refined via Claude API
   - API limitation: Claude API free tier processed 100 recipes → final test100recipes.xlsx

## 🚀 Usage

### Training the Model

```bash
python train_with_balanced_rules.py
```

This script will:
- Load recipes from `Health.xlsx`, `test100recipes.xlsx`, and `Health_3000recipes.xlsx`
- Apply balanced classification rules to label all recipes
- Split data into training (685) and test (2,470) sets
- Train Decision Tree Classifier with max_depth=4
- Generate confusion matrices and decision tree visualization
- Display accuracy metrics and classification reports

### Output Files

- `confusion_matrix_training_balanced.png` - Training set confusion matrix
- `confusion_matrix_test_balanced.png` - Test set confusion matrix
- `decision_tree_visualization_balanced.png` - Decision tree structure
- `menstrual_cycle_distribution_pie_chart.png` - Phase distribution visualization

### Using Classified Data

The final classified dataset is available in:
- **`All_Recipes_Classified.xlsx`**: Contains all classified recipes with menstrual phase tags, preferences, allergies, and meal time classifications

## 📂 Project Structure

```
.
├── README.md                          # This file
├── CLASSIFICATION_LOGIC_README.md     # Detailed classification logic
├── train_with_balanced_rules.py       # Main training script
├── All_Recipes_Classified.xlsx        # Final classified dataset (3,155 recipes)
├── upload_to_railway.py               # Database upload script
├── check_database_simple.py           # Database inspection script
├── reorder_id_column.py               # Database schema management
│
├── Data Files
│   ├── Health.xlsx                    # 55 recipes (training)
│   ├── test100recipes.xlsx             # 100 recipes (30 training, 70 test)
│   └── Health_3000recipes.xlsx        # 3,000 recipes (600 training, 2,400 test)
│
└── Visualizations
    ├── confusion_matrix_training_balanced.png
    ├── confusion_matrix_test_balanced.png
    ├── decision_tree_visualization_balanced.png
    └── menstrual_cycle_distribution_pie_chart.png
```

## 🔍 Classification Rules Overview

The classification follows a priority-based approach:

### 1. Menstrual Phase (Highest Priority)
- **Condition**: `Iron ≥ 4 mg` AND `Vitamin C ≥ 25 mg`
- **Rationale**: High iron requirement due to blood loss; Vitamin C enhances iron absorption

### 2. Ovulation Phase (Second Priority)
- **Condition**: `Zinc ≥ 1.5 mg` AND `Vitamin C ≥ 20 mg` AND `Magnesium < 80 mg`
- **Rationale**: Zinc crucial for egg maturation; lower magnesium distinguishes from Luteal

### 3. Follicular Phase (Third Priority)
- **Condition**: `Iron 1.5–3.5 mg` AND `Vitamin C ≥ 15 mg` AND `Zinc ≥ 1.0 mg` AND NOT Menstrual
- **Rationale**: Balanced nutrition for follicle development

### 4. Luteal Phase (Fourth Priority)
- **Condition**: (`Magnesium ≥ 100 mg` OR `Fiber ≥ 9 g`) AND NOT Menstrual AND NOT Ovulation
- **Rationale**: High magnesium alleviates PMS symptoms; fiber stabilizes blood sugar

For detailed classification logic, see [`CLASSIFICATION_LOGIC_README.md`](CLASSIFICATION_LOGIC_README.md).

## 🛠️ Technology Stack

- **Python 3.x**
- **scikit-learn**: Decision Tree Classifier
- **pandas**: Data manipulation
- **matplotlib/seaborn**: Visualization
- **PostgreSQL**: Database storage (Railway)
- **SQLAlchemy**: Database ORM

## 📈 Results Visualization

The project includes several visualizations:
- Confusion matrices for training and test sets
- Decision tree structure visualization
- Menstrual cycle phase distribution pie chart

## 📝 Additional Features

The classified dataset includes:
- **Menstrual Phase Tags**: Menstrual, Follicular, Ovulation, Luteal
- **Preference Flags**: Vegetarian, vegan, low carb, keto
- **Allergy Flags**: No dairy, no tree nuts, no peanuts, no gluten
- **Meal Time Classification**: Breakfast, lunch, dinner (based on calorie content and ingredients)

## 🔗 Database Integration

The classified recipes are stored in a PostgreSQL database on Railway:
- **Table**: `recipes_classified`
- **Total Records**: Classified recipes from the dataset
- **Connection**: See `upload_to_railway.py` for database connection details

## 📚 Documentation

- **`CLASSIFICATION_LOGIC_README.md`**: Comprehensive documentation of classification rules, model performance, data formats, and implementation details

## 📄 License

This project is for educational/research purposes.

## 🙏 Acknowledgments

- **USDA Food Central**: Nutrition database
- **The Meal DB**: Recipe API
- **ChatGPT & Claude API**: Data generation and refinement

---

**Note**: This project is part of a Data Science course (DSP 2025 Fall) focusing on supervised learning and decision tree classification.

