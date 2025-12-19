# PantryCycle

**PantryCycle** is a comprehensive machine learning platform that provides personalized recipe recommendations based on menstrual cycle phases. The system uses advanced decision tree classification to categorize recipes into four menstrual phases (Menstrual, Follicular, Ovulation, Luteal) based on nutritional features, helping users optimize their nutrition throughout their cycle.

🌐 **Live Demo**: [https://pantry-cycle.vercel.app/](https://pantry-cycle.vercel.app/)

## 🌟 Overview

PantryCycle combines nutritional science with machine learning to create a smart recipe classification system. By analyzing 14 nutritional features, the platform automatically categorizes recipes to match the specific nutritional needs of different menstrual cycle phases, promoting better health and well-being.

## 🎯 Key Features

- **Intelligent Recipe Classification**: Automatically categorizes recipes into 4 menstrual phases using Decision Tree ML model
- **High Accuracy**: 92.86% test accuracy with balanced distribution across all phases
- **Comprehensive Dataset**: 2,030+ recipes with complete nutritional information
- **Scientific Approach**: Based on evidence-based nutritional requirements for each cycle phase
- **Preference & Allergy Detection**: Automatically identifies dietary preferences and allergies
- **Meal Time Classification**: Categorizes recipes as breakfast, lunch, or dinner
- **Database Integration**: PostgreSQL database support for scalable deployment

## 📊 Project Structure

```
PantryCycle/
├── decision-tree-model/          # Decision Tree ML Model Branch
│   ├── README.md                # Model documentation
│   ├── train_with_balanced_rules.py  # Training script
│   ├── CLASSIFICATION_LOGIC_README.md  # Detailed classification logic
│   ├── All_Recipes_Classified.xlsx    # Classified dataset
│   └── visualizations/          # Model performance visualizations
│
├── data/                        # Recipe datasets
│   ├── Health.xlsx              # 55 recipes
│   ├── test100recipes.xlsx      # 100 recipes
│   └── Health_3000recipes.xlsx  # 3,000 recipes (1,875 unique)
│
└── database/                    # Database scripts
    ├── upload_to_railway.py     # Database upload utility
    ├── check_database_simple.py # Database inspection
    └── reorder_id_column.py     # Schema management
```

## 🔬 Model Performance

### Decision Tree Classifier

- **Algorithm**: Decision Tree Classifier (scikit-learn)
- **Max Depth**: 5
- **Criterion**: Gini Impurity
- **Total Dataset**: 2,030 recipes
  - Health.xlsx: 55 recipes (manual)
  - test100recipes.xlsx: 100 recipes (web scraped)
  - Health_3000recipes.xlsx: 1,875 recipes (AI-generated, deduplicated)
- **Training Set**: 1,624 recipes (80%)
- **Test Set**: 406 recipes (20%)
- **Training Accuracy**: 93.60%
- **Test Accuracy**: 92.86%
- **Overall Metrics**: Precision 0.93 | Recall 0.93 | F1-Score 0.93

### Phase Distribution

The model achieves balanced distribution across all four phases (target: 15-30% per phase):

| Phase | Training Set | Test Set | Precision | Recall | F1-Score |
|-------|-------------|---------|-----------|--------|----------|
| **Menstrual** | 22.97% (373) | 21.43% (87) | 1.00 | 1.00 | 1.00 |
| **Follicular** | 27.40% (445) | 23.40% (95) | 0.82 | 0.99 | 0.90 |
| **Ovulation** | 18.90% (307) | 22.17% (90) | 0.95 | 0.82 | 0.88 |
| **Luteal** | 30.73% (499) | 33.00% (134) | 0.96 | 0.91 | 0.93 |

**Key Nutrients by Phase:**
- **Menstrual**: Iron ≥ 4mg, Vitamin C ≥ 25mg (Perfect 100% accuracy!)
- **Follicular**: Iron 1.5-3.5mg, Vitamin C ≥ 15mg, Zinc ≥ 1.0mg
- **Ovulation**: Zinc ≥ 1.5mg, Vitamin C ≥ 20mg, Magnesium < 80mg
- **Luteal**: Magnesium ≥ 100mg OR Fiber ≥ 9g

## 🚀 Getting Started

### Live Application

Visit the live application at: **[https://pantry-cycle.vercel.app/](https://pantry-cycle.vercel.app/)**

### Prerequisites

- Python 3.7+
- Required packages:
  ```bash
  pip install pandas scikit-learn matplotlib seaborn numpy openpyxl sqlalchemy psycopg2-binary
  ```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yixtk/PantryCycle.git
   cd PantryCycle
   ```

2. **Checkout the decision tree model branch**
   ```bash
   git checkout decision-tree-model
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Training the Model

```bash
python train_with_balanced_rules.py
```

This will:
- Load and preprocess recipe data
- Apply balanced classification rules
- Train the Decision Tree model
- Generate performance metrics and visualizations
- Save confusion matrices and decision tree visualization

### Using the Classified Dataset

The classified dataset (`All_Recipes_Classified.xlsx`) contains:
- **Menstrual Phase Tags**: Menstrual, Follicular, Ovulation, Luteal
- **Preference Flags**: Vegetarian, vegan, low carb, keto
- **Allergy Flags**: No dairy, no tree nuts, no peanuts, no gluten
- **Meal Time**: Breakfast, lunch, dinner
- **Complete Nutrition Data**: 14 nutritional features per recipe

## 📚 Documentation

- **[Model README](README.md)**: Detailed model documentation, performance metrics, and usage
- **[Classification Logic](CLASSIFICATION_LOGIC_README.md)**: Comprehensive explanation of classification rules, scientific basis, and implementation details

## 🗄️ Database Integration

The project includes PostgreSQL database integration for production deployment:

- **Table**: `recipes_classified`
- **Connection**: Railway PostgreSQL
- **Scripts**: 
  - `upload_to_railway.py`: Upload classified recipes to database
  - `check_database_simple.py`: Inspect database content
  - `reorder_id_column.py`: Manage database schema

## 📈 Data Sources

### Recipe Datasets

| Source | Count | Origin | Processing |
|--------|-------|--------|------------|
| Health.xlsx | 55 | Manual annotation | Direct use with nutritional analysis |
| test100recipes.xlsx | 100 | The Meal DB Free API | Unit conversion, USDA nutrition calculation, Claude API refinement |
| Health_3000recipes.xlsx | 1,875 (deduplicated from 3,000) | ChatGPT-generated | Deduplication by recipe title, unit conversion, USDA nutrition calculation |
| **Total** | **2,030** | **Combined** | **80/20 train-test split** |

### Data Processing Pipeline

1. **Collection**: Recipes from ChatGPT and The Meal DB API
2. **Cleaning**: Unit conversion, weight calculation, serving size determination
3. **Nutrition Calculation**: USDA Food Central database integration
4. **Quality Refinement**: Claude API for advanced nutrient refinement (sodium, cholesterol)
5. **Deduplication**: Removed duplicates from Health_3000recipes.xlsx

## 🔍 Classification Logic

The classification system uses a priority-based approach with nutrient thresholds:

### Primary Rules

1. **Menstrual Phase**: `Iron ≥ 4 mg` AND `Vitamin C ≥ 25 mg`
2. **Ovulation Phase**: `Zinc ≥ 1.5 mg` AND `Vitamin C ≥ 20 mg` AND `Magnesium < 80 mg`
3. **Follicular Phase**: `Iron 1.5–3.5 mg` AND `Vitamin C ≥ 15 mg` AND `Zinc ≥ 1.0 mg`
4. **Luteal Phase**: `Magnesium ≥ 100 mg` OR `Fiber ≥ 9 g`

See [CLASSIFICATION_LOGIC_README.md](CLASSIFICATION_LOGIC_README.md) for detailed rules and scientific rationale.

## 🛠️ Technology Stack

- **Machine Learning**: scikit-learn (Decision Tree Classifier)
- **Data Processing**: pandas, numpy
- **Visualization**: matplotlib, seaborn
- **Database**: PostgreSQL (Railway)
- **ORM**: SQLAlchemy
- **Data Format**: Excel (.xlsx), JSON

## 📊 Visualizations

The project includes comprehensive visualizations:

- **Confusion Matrices**: Training and test set performance
- **Decision Tree Visualization**: Model structure and decision paths
- **Phase Distribution**: Pie chart showing balanced distribution across phases

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is for educational/research purposes.

## 🙏 Acknowledgments

- **USDA Food Central**: Nutrition database
- **The Meal DB**: Recipe API
- **ChatGPT & Claude API**: Data generation and refinement
- **scikit-learn**: Machine learning framework

## 📞 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Note**: This project is part of a Data Science course (DSP 2025 Fall) focusing on supervised learning and decision tree classification.

