# 🚀 Vercel Deployment Guide

## ✅ Feature Overview

New intelligent recipe recommendation API:
- 📍 `/api/recommend-recipes?userId=xxx`
- Recommends 5 recipes based on user's allergens, dietary preferences, and menstrual cycle
- Automatically calculates current cycle phase (Menstrual/Follicular/Ovulation/Luteal)

---

## 📋 Pre-Deployment Checklist

### 1. Confirm Database Structure

**user_data table** contains these columns:

**Menstrual Dates**:
- `start_date` DATE - Last period start date
- `end_date` DATE - Last period end date

**Allergens** (TRUE = user HAS this allergy):
- `no_dairy` BOOLEAN
- `no_eggs` BOOLEAN  
- `no_peanuts` BOOLEAN
- `no_treenuts` BOOLEAN
- `no_wheat` BOOLEAN
- `no_soy` BOOLEAN
- `no_shellfish` BOOLEAN

**Dietary Preferences** (TRUE = user HAS this preference):
- `is_vegetarian` BOOLEAN
- `is_vegan` BOOLEAN
- `is_gluten_free` BOOLEAN
- `is_dairy_free` BOOLEAN
- `is_low_carb` BOOLEAN
- `is_high_protein` BOOLEAN
- `is_pescatarian` BOOLEAN
- `is_keto` BOOLEAN

**recipes_classified table** needs:
- `menstrual_phase_tag` - 'Menstrual', 'Follicular', 'Ovulation', 'Luteal'
- `is_vegetarian`, `is_gluten_free` etc. - dietary tags
- `no_dairy`, `no_eggs` etc. - allergen tags (TRUE = recipe does NOT contain this allergen)

---

## 🚀 Vercel Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd /Users/yixiangtiankai/PantryCycle/PantryCycle

git add .
git commit -m "Add recommend recipes API"
git push origin main
```

### Step 2: Create Project on Vercel

1. Visit https://vercel.com/new
2. Select your GitHub repository `Yixtk/PantryCycle`
3. **Important Settings**:
   ```
   Root Directory: PantryCycle
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   ```

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DB_HOST = your-database.railway.app
DB_PORT = 5432
DB_NAME = railway
DB_USER = postgres
DB_PASSWORD = your-password
```

### Step 4: Deploy

Click "Deploy" button and wait 2-3 minutes

---

## ✅ Test API

### Test Recommendation API
```bash
# Replace with your Vercel URL and actual userId
curl "https://your-app.vercel.app/api/recommend-recipes?userId=1"
```

**Success Response**:
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Quinoa Buddha Bowl",
      "phase": "Follicular",
      ...
    }
  ],
  "phase": "Follicular",
  "count": 5
}
```

---

## 🎯 Frontend Integration

Code is already integrated - recommendations load automatically after login:

```typescript
// In App.tsx loadUserData function
const loadUserData = async (userId: string) => {
  const profile = await api.getUserProfile(userId);
  setUserProfile(profile);
  
  // Auto-load recommended recipes
  const recommended = await api.getRecommendedRecipes(userId);
  setRecommendedRecipes(recommended);
};
```

---

## 🐛 Common Issues

### Issue 1: API Returns Empty Array

**Cause**: No recipes match the criteria in database

**Solution**:
```sql
-- Check if data exists
SELECT menstrual_phase_tag, COUNT(*) 
FROM recipes_classified 
GROUP BY menstrual_phase_tag;

-- Should have data for each phase
```

### Issue 2: Returns 500 Error

**Cause**: Database connection failed

**Solution**:
1. Check Vercel environment variables are correct
2. Test database connection:
   ```bash
   psql "postgresql://user:pass@host:5432/dbname"
   ```

### Issue 3: user_data Data Setup

**Set all information at once**:
```sql
UPDATE user_data 
SET 
  -- Menstrual dates
  start_date = '2024-12-01',
  end_date = '2024-12-05',
  
  -- Allergens (TRUE = user has this allergy)
  no_dairy = TRUE,
  no_eggs = FALSE,
  no_wheat = TRUE,
  
  -- Dietary preferences (TRUE = user has this preference)
  is_vegetarian = TRUE,
  is_gluten_free = TRUE,
  is_high_protein = FALSE
  
WHERE id = 1;
```

---

## 📊 Recommendation Logic

### Menstrual Cycle Phase Calculation

```javascript
// Based on last period start date
Day 1-5:   Menstrual   → Recommend iron-rich foods
Day 6-13:  Follicular  → Recommend high-protein foods
Day 14-16: Ovulation   → Recommend omega-3 foods
Day 17-28: Luteal      → Recommend complex carbs
```

### Filter Priority

1. ✅ **Menstrual Cycle Phase** - Match current phase
2. ✅ **Dietary Preferences** - Must satisfy ALL preferences
3. ✅ **Allergens** - Exclude ALL allergens
4. ✅ **Random 5** - Different recommendations each time

---

## 🔧 Local Testing

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Visit
http://localhost:5173
```

---

## 📝 Database Structure Reference

### user_data Table Complete Structure:

```sql
id                INTEGER PRIMARY KEY
username          VARCHAR
start_date        DATE         -- Last period start date
end_date          DATE         -- Last period end date

-- Allergens (TRUE = has this allergy)
no_dairy          BOOLEAN
no_eggs           BOOLEAN
no_peanuts        BOOLEAN
no_treenuts       BOOLEAN
no_wheat          BOOLEAN
no_soy            BOOLEAN
no_shellfish      BOOLEAN

-- Dietary Preferences (TRUE = has this preference)
is_vegetarian     BOOLEAN
is_vegan          BOOLEAN
is_gluten_free    BOOLEAN
is_dairy_free     BOOLEAN
is_low_carb       BOOLEAN
is_high_protein   BOOLEAN
is_pescatarian    BOOLEAN
is_keto           BOOLEAN
```

**Example Data**:
```sql
-- User: allergic to dairy, vegetarian, period started Dec 1
UPDATE user_data SET
  start_date = '2024-12-01',
  end_date = '2024-12-05',
  no_dairy = TRUE,
  is_vegetarian = TRUE
WHERE id = 1;
```

### recipes_classified Table Required Fields:

```sql
menstrual_phase_tag VARCHAR(50)  -- Required
is_vegetarian BOOLEAN
is_gluten_free BOOLEAN
is_high_protein BOOLEAN
no_dairy BOOLEAN     -- TRUE = recipe does NOT contain dairy
no_eggs BOOLEAN      -- TRUE = recipe does NOT contain eggs
...
```

---

## 🎉 Success Criteria

### ✅ Backend API Working
- [ ] `/api/recommend-recipes` returns 200 status
- [ ] Returns JSON array of recipes
- [ ] Filter parameters work correctly

### ✅ Frontend Working
- [ ] Can register and login
- [ ] Onboarding flow complete
- [ ] Calendar page displays recommended recipes
- [ ] Recipe detail page opens
- [ ] Recommendations match current cycle phase

### ✅ Data Flow Working
```
User Login 
  ↓
Load profile (start_date) 
  ↓
Calculate current phase (Menstrual/Follicular/Ovulation/Luteal)
  ↓
Call API to get recommended recipes
  ↓
Display in Calendar page
```

---

**Deployment Time**: ~5 minutes  
**Last Updated**: 2024-12-16

Happy deploying! 🎉
