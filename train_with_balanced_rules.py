import pandas as pd
import ast
import matplotlib.pyplot as plt
from sklearn import tree
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import seaborn as sns
import numpy as np
from collections import Counter

# --- Final Balanced Classification Function ---
def classify_menstrual_phase_final(row):
    """
    Final balanced classification rules, targeting 15-30% distribution for each phase
    """
    iron = row.get('iron', 0)
    vitamin_c = row.get('vitamin C', 0)
    zinc = row.get('zinc', 0)
    magnesium = row.get('magnesium', 0)
    fiber = row.get('fiber', 0)
    calcium = row.get('calcium', 0)
    
    # 1. Menstrual: Increased threshold Iron≥4 AND VitC≥25
    menstrual_condition = (iron >= 4 and vitamin_c >= 25)
    
    # 2. Ovulation: Maintain conditions, but higher priority (after Menstrual)
    ovulation_condition = (zinc >= 1.5 and vitamin_c >= 20 and magnesium < 80)
    
    # 3. Follicular: Moderately relaxed conditions
    follicular_condition = (1.5 <= iron < 3.5 and vitamin_c >= 15 and zinc >= 1.0) and not menstrual_condition
    
    # 4. Luteal: Further increased threshold Mg≥100 OR Fiber≥9
    luteal_condition = (magnesium >= 100 or fiber >= 9) and not menstrual_condition and not ovulation_condition
    
    # Classify by priority
    if menstrual_condition:
        return 'Menstrual'
    
    if ovulation_condition:
        return 'Ovulation'
    
    if follicular_condition:
        return 'Follicular'
    
    if luteal_condition:
        return 'Luteal'
    
    # Secondary rules
    if 1.5 <= iron < 3.5 and vitamin_c >= 12 and not menstrual_condition:
        return 'Follicular'
    
    if zinc >= 1.4 and vitamin_c >= 18 and magnesium < 85 and not menstrual_condition:
        return 'Ovulation'
    
    if magnesium >= 105 or fiber >= 10:
        return 'Luteal'
    
    # Default fallback rules
    if zinc >= 1.2 and vitamin_c >= 15 and magnesium < 85:
        return 'Ovulation'
    elif magnesium >= 100 or fiber >= 9:
        return 'Luteal'
    elif iron >= 1.5 and vitamin_c >= 12:
        return 'Follicular'
    else:
        return 'Ovulation'

# Feature columns
feature_cols = [
    'calories', 'protein', 'unsaturated fat', 'trans fat', 'saturated fat',
    'omega 3', 'fiber', 'vitamin C', 'iron', 'magnesium', 'iodine',
    'zinc', 'vitamin K', 'calcium'
]

print("=" * 60)
print("Label Training Set with Balanced Classification Rules and Train Decision Tree")
print("=" * 60)

# --- Step 1: Load Health.xlsx (55 recipes) ---
print("\nSTEP 1: Loading Health.xlsx (55 recipes)")
health_file = '/Users/yixiangtiankai/Documents/DSP_2025Fall/Primary Decsion Tree/Health.xlsx'
df_health = pd.read_excel(health_file, header=None)
df_health.columns = df_health.iloc[1]
df_health = df_health.drop(df_health.index[0:2]).reset_index(drop=True)
nutrition_col = [col for col in df_health.columns if 'calories' in str(col).lower() or 'nutrition' in str(col).lower()]
if nutrition_col:
    df_health = df_health.rename(columns={nutrition_col[0]: 'Nutrition Label'})
nutrition_dicts = df_health['Nutrition Label'].apply(ast.literal_eval)
df_nutrition = pd.json_normalize(nutrition_dicts)
df_health = pd.concat([df_health.drop('Nutrition Label', axis=1), df_nutrition], axis=1)

# --- Step 2: Load test100recipes.xlsx (100 recipes) ---
print("STEP 2: Loading test100recipes.xlsx (100 recipes)")
test100_file = '/Users/yixiangtiankai/Documents/DSP_2025Fall/Primary Decsion Tree/test100recipes.xlsx'
df_test100 = pd.read_excel(test100_file, header=0)
if 'nutrition_per_serving' in df_test100.columns:
    nutrition_dicts = df_test100['nutrition_per_serving'].apply(ast.literal_eval)
    df_nutrition = pd.json_normalize(nutrition_dicts)
    mapped_nutrition = pd.DataFrame()
    mapped_nutrition['calories'] = df_nutrition.get('calories', 0)
    mapped_nutrition['protein'] = df_nutrition.get('protein', 0)
    mapped_nutrition['fiber'] = df_nutrition.get('fiber', 0)
    mapped_nutrition['saturated fat'] = df_nutrition.get('saturated_fat', 0)
    mono_fat = df_nutrition.get('monounsaturated_fat', 0)
    poly_fat = df_nutrition.get('polyunsaturated_fat', 0)
    mapped_nutrition['unsaturated fat'] = mono_fat + poly_fat
    mapped_nutrition['trans fat'] = df_nutrition.get('trans_fat', 0)
    mapped_nutrition['omega 3'] = df_nutrition.get('omega_3', 0)
    mapped_nutrition['vitamin C'] = df_nutrition.get('vitamin_c_mg', df_nutrition.get('vitamin_c', 0))
    mapped_nutrition['iron'] = df_nutrition.get('iron_mg', df_nutrition.get('iron', 0))
    mapped_nutrition['magnesium'] = df_nutrition.get('magnesium_mg', df_nutrition.get('magnesium', 0))
    mapped_nutrition['zinc'] = df_nutrition.get('zinc_mg', df_nutrition.get('zinc', 0))
    mapped_nutrition['iodine'] = df_nutrition.get('iodine', 0)
    mapped_nutrition['vitamin K'] = df_nutrition.get('vitamin_k', 0)
    mapped_nutrition['calcium'] = df_nutrition.get('calcium', 0)
    df_test100 = pd.concat([df_test100, mapped_nutrition], axis=1)
if 'recipe title' in df_test100.columns:
    df_test100 = df_test100.rename(columns={'recipe title': 'Recipe'})

# --- Step 3: Load Health_3000recipes.xlsx (3000 recipes) ---
print("STEP 3: Loading Health_3000recipes.xlsx (3000 recipes)")
health3000_file = '/Users/yixiangtiankai/Documents/DSP_2025Fall/Primary Decsion Tree/Health_3000recipes.xlsx'
df_health3000 = pd.read_excel(health3000_file, header=0)
if 'Nutrition Label' in df_health3000.columns:
    nutrition_dicts = df_health3000['Nutrition Label'].apply(ast.literal_eval)
    df_nutrition = pd.json_normalize(nutrition_dicts)
    mapped_nutrition = pd.DataFrame()
    for col in feature_cols:
        if col in df_nutrition.columns:
            mapped_nutrition[col] = df_nutrition[col]
        else:
            mapped_nutrition[col] = 0
    df_health3000 = pd.concat([df_health3000.drop('Nutrition Label', axis=1), mapped_nutrition], axis=1)

# Remove duplicates from Health_3000recipes
print(f"  Before deduplication: {len(df_health3000)} recipes")
# Try to find recipe title column
recipe_col = None
for col in df_health3000.columns:
    if 'recipe' in str(col).lower() or 'title' in str(col).lower():
        recipe_col = col
        break
if recipe_col:
    df_health3000 = df_health3000.drop_duplicates(subset=[recipe_col], keep='first').reset_index(drop=True)
else:
    # If no recipe column, use all feature columns for deduplication
    df_health3000 = df_health3000.drop_duplicates(subset=feature_cols, keep='first').reset_index(drop=True)
print(f"  After deduplication: {len(df_health3000)} unique recipes")

# Ensure all feature columns exist
for col in feature_cols:
    if col not in df_health.columns:
        df_health[col] = 0
    if col not in df_test100.columns:
        df_test100[col] = 0
    if col not in df_health3000.columns:
        df_health3000[col] = 0

df_health[feature_cols] = df_health[feature_cols].fillna(0)
df_test100[feature_cols] = df_test100[feature_cols].fillna(0)
df_health3000[feature_cols] = df_health3000[feature_cols].fillna(0)

# --- Step 4: Classify all recipes using balanced rules ---
print("\nSTEP 4: Labeling all recipes with balanced classification rules")
for idx, row in df_health.iterrows():
    df_health.at[idx, 'Menstrual Phase Tag'] = classify_menstrual_phase_final(row)
for idx, row in df_test100.iterrows():
    df_test100.at[idx, 'Menstrual Phase Tag'] = classify_menstrual_phase_final(row)
for idx, row in df_health3000.iterrows():
    df_health3000.at[idx, 'Menstrual Phase Tag'] = classify_menstrual_phase_final(row)

print("✓ All recipes labeled")

# Show distribution
print("\nDataset distributions:")
print("\nHealth.xlsx:")
health_dist = Counter(df_health['Menstrual Phase Tag'])
for phase in ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']:
    count = health_dist.get(phase, 0)
    print(f"  {phase:12s}: {count:3d} ({count/len(df_health)*100:5.2f}%)")

print("\ntest100recipes.xlsx:")
test100_dist = Counter(df_test100['Menstrual Phase Tag'])
for phase in ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']:
    count = test100_dist.get(phase, 0)
    print(f"  {phase:12s}: {count:3d} ({count/len(df_test100)*100:5.2f}%)")

print("\nHealth_3000recipes.xlsx:")
health3000_dist = Counter(df_health3000['Menstrual Phase Tag'])
for phase in ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']:
    count = health3000_dist.get(phase, 0)
    print(f"  {phase:12s}: {count:4d} ({count/len(df_health3000)*100:5.2f}%)")

# --- Step 5: Combine all data and split 80/20 ---
print("\nSTEP 5: Combining all data and splitting 80/20")
common_cols = ['Recipe', 'Menstrual Phase Tag'] + feature_cols
available_cols = [col for col in common_cols if col in df_health.columns and col in df_test100.columns and col in df_health3000.columns]

# Combine all data
df_all = pd.concat([
    df_health[available_cols],
    df_test100[available_cols],
    df_health3000[available_cols]
], ignore_index=True)

print(f"✓ Total data: {len(df_all)} recipes")

# 80/20 split
np.random.seed(42)
train_size = int(len(df_all) * 0.8)
train_indices = np.random.choice(len(df_all), size=train_size, replace=False)
test_indices = np.setdiff1d(np.arange(len(df_all)), train_indices)

df_train = df_all.iloc[train_indices].reset_index(drop=True)
df_test = df_all.iloc[test_indices].reset_index(drop=True)

print(f"✓ Training set: {len(df_train)} recipes (80%)")
print(f"✓ Test set: {len(df_test)} recipes (20%)")

# Show training set distribution
train_dist = Counter(df_train['Menstrual Phase Tag'])
print("\nTraining set distribution:")
for phase in ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']:
    count = train_dist.get(phase, 0)
    percentage = count / len(df_train) * 100
    status = "✓" if 15 <= percentage <= 30 else "✗"
    print(f"{status} {phase:12s}: {count:4d} ({percentage:5.2f}%)")

# --- Step 6: Train Decision Tree Model ---
print("\nSTEP 6: Training Decision Tree Model")
X_train = df_train[feature_cols]
y_train = df_train['Menstrual Phase Tag']

le = LabelEncoder()
y_train_encoded = le.fit_transform(y_train)
target_names = le.classes_

dtc = DecisionTreeClassifier(max_depth=5, random_state=42)
dtc.fit(X_train, y_train_encoded)

print("✓ Model training completed")

# --- Step 7: Evaluate on training set ---
y_train_pred = dtc.predict(X_train)
train_accuracy = accuracy_score(y_train_encoded, y_train_pred)
train_cm = confusion_matrix(y_train_encoded, y_train_pred, labels=range(len(target_names)))

print(f"\nTraining set accuracy: {train_accuracy*100:.2f}%")

# --- Step 8: Evaluate on test set ---
print("\nSTEP 7: Evaluating test set")
X_test = df_test[feature_cols]
y_test = df_test['Menstrual Phase Tag']
y_test_encoded = le.transform(y_test)

y_test_pred = dtc.predict(X_test)
test_accuracy = accuracy_score(y_test_encoded, y_test_pred)
test_cm = confusion_matrix(y_test_encoded, y_test_pred, labels=range(len(target_names)))

print(f"Test set accuracy: {test_accuracy*100:.2f}%")
print(f"Test set size: {len(X_test)} recipes")

# Show test set distribution
test_dist = Counter(y_test)
print("\nTest set true label distribution:")
for phase in ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']:
    count = test_dist.get(phase, 0)
    percentage = count / len(y_test) * 100
    status = "✓" if 15 <= percentage <= 30 else "✗"
    print(f"{status} {phase:12s}: {count:4d} ({percentage:5.2f}%)")

# Show predictions
pred_dist = Counter(le.inverse_transform(y_test_pred))
print("\nTest set model prediction distribution:")
for phase in ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']:
    count = pred_dist.get(phase, 0)
    percentage = count / len(y_test_pred) * 100
    status = "✓" if 15 <= percentage <= 30 else "✗"
    print(f"{status} {phase:12s}: {count:4d} ({percentage:5.2f}%)")

# Classification report
print("\n" + "=" * 60)
print("Classification Report (Test Set)")
print("=" * 60)
print(classification_report(y_test_encoded, y_test_pred, target_names=target_names))

# --- Step 9: Visualize ---
print("\nSTEP 8: Generating visualizations")
plt.figure(figsize=(10, 8))
sns.heatmap(train_cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=target_names, yticklabels=target_names)
plt.title(f'Confusion Matrix - Training Set\n({len(X_train)} recipes, Accuracy: {train_accuracy*100:.2f}%)', 
          fontsize=14, fontweight='bold')
plt.ylabel('True Label', fontsize=12)
plt.xlabel('Predicted Label', fontsize=12)
plt.tight_layout()
plt.savefig('confusion_matrix_training_balanced.png', dpi=300, bbox_inches='tight')
plt.close()
print("✓ Saved: confusion_matrix_training_balanced.png")

plt.figure(figsize=(10, 8))
sns.heatmap(test_cm, annot=True, fmt='d', cmap='Greens', 
            xticklabels=target_names, yticklabels=target_names)
plt.title(f'Confusion Matrix - Test Set\n({len(X_test)} recipes, Accuracy: {test_accuracy*100:.2f}%)', 
          fontsize=14, fontweight='bold')
plt.ylabel('True Label', fontsize=12)
plt.xlabel('Predicted Label', fontsize=12)
plt.tight_layout()
plt.savefig('confusion_matrix_test_balanced.png', dpi=300, bbox_inches='tight')
plt.close()
print("✓ Saved: confusion_matrix_test_balanced.png")

plt.figure(figsize=(20, 12))
tree.plot_tree(dtc, feature_names=feature_cols, class_names=target_names, 
               filled=True, rounded=True, fontsize=8)
plt.title('Decision Tree Visualization (Balanced Rules)', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig('decision_tree_visualization_balanced.png', dpi=300, bbox_inches='tight')
plt.close()
print("✓ Saved: decision_tree_visualization_balanced.png")

print("\n" + "=" * 60)
print("Training Summary")
print("=" * 60)
print(f"Training set: {len(X_train)} recipes")
print(f"Test set: {len(X_test)} recipes")
print(f"Training set accuracy: {train_accuracy*100:.2f}%")
print(f"Test set accuracy: {test_accuracy*100:.2f}%")
print("\n✓ All tasks completed!")

