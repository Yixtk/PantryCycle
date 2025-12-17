import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Get recipes request:', req.query);

    const { 
      phase,           // 'Menstrual', 'Follicular', 'Ovulation', 'Luteal'
      mealType,        // 'breakfast', 'lunch', 'dinner'
      dietary,         // comma-separated: 'vegetarian,gluten-free'
      allergens,       // comma-separated: 'dairy,eggs'
      limit = 10       // how many recipes to return
    } = req.query;

    // Build the WHERE clause dynamically
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Filter by cycle phase
    if (phase) {
      conditions.push(`menstrual_phase_tag = $${paramIndex}`);
      params.push(phase);
      paramIndex++;
    }

    // Filter by meal type (breakfast, lunch, or dinner)
    if (mealType) {
      const mealColumn = mealType.toLowerCase();
      conditions.push(`${mealColumn} = TRUE`);
    }

    // Filter by dietary preferences (user must match ALL their preferences)
    if (dietary) {
      const dietaryPrefs = dietary.split(',').map(d => d.trim());
      
      for (const pref of dietaryPrefs) {
        switch (pref) {
          case 'Vegetarian':
            conditions.push('is_vegetarian = TRUE');
            break;
          case 'Vegan':
            conditions.push('is_vegetarian = TRUE'); // Vegan recipes should be marked vegetarian
            break;
          case 'Gluten-Free':
            conditions.push('is_gluten_free = TRUE');
            break;
          case 'Dairy-Free':
            conditions.push('no_dairy = TRUE');
            break;
          case 'Low-Carb':
            conditions.push('is_low_carb = TRUE');
            break;
          case 'High-Protein':
            conditions.push('is_high_protein = TRUE');
            break;
          case 'Pescatarian':
            conditions.push('is_pescatarian = TRUE');
            break;
          case 'Keto':
            conditions.push('is_keto = TRUE');
            break;
        }
      }
    }

    // Filter OUT recipes containing allergens
    if (allergens) {
      const allergenList = allergens.split(',').map(a => a.trim());
      
      for (const allergen of allergenList) {
        switch (allergen) {
          case 'Dairy':
            conditions.push('(no_dairy = TRUE OR no_dairy IS NULL)');
            break;
          case 'Eggs':
            conditions.push('(no_eggs = TRUE OR no_eggs IS NULL)');
            break;
          case 'Peanuts':
            conditions.push('(no_peanuts = TRUE OR no_peanuts IS NULL)');
            break;
          case 'Tree Nuts':
            conditions.push('(no_treenuts = TRUE OR no_treenuts IS NULL)');
            break;
          case 'Wheat':
            conditions.push('(no_wheat = TRUE OR no_wheat IS NULL)');
            break;
          case 'Soy':
            conditions.push('(no_soy = TRUE OR no_soy IS NULL)');
            break;
          case 'Shellfish':
            conditions.push('(no_shellfish = TRUE OR no_shellfish IS NULL)');
            break;
        }
      }
    }

    // Build the query
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT 
        id,
        recipe_title,
        ingredients,
        cooking_instructions,
        category,
        nutrition_calories,
        serving_size,
        nutrition_per_serving,
        breakfast,
        lunch,
        dinner,
        menstrual_phase_tag
      FROM recipes_classified
      ${whereClause}
      ORDER BY RANDOM()
      LIMIT $${paramIndex}
    `;
    
    params.push(parseInt(limit));

    console.log('Recipe query:', query);
    console.log('Query params:', params);

    const result = await pool.query(query, params);

    // Transform to frontend format with safe JSON parsing
    const recipes = result.rows.map(row => {
      // Safe JSON parse function
      const safeJsonParse = (value, fallback = {}) => {
        if (!value) return fallback;
        if (typeof value === 'object') return value;
        try {
          return JSON.parse(value);
        } catch (error) {
          console.warn(`JSON parse error for recipe ${row.id}:`, error.message);
          return fallback;
        }
      };

      return {
        id: row.id,
        name: row.recipe_title,
        description: row.category || '',
        ingredients: safeJsonParse(row.ingredients, {}),
        instructions: safeJsonParse(row.cooking_instructions, []),
        prepTime: 0,
        cookTime: 0,
        servings: row.serving_size || 1,
        calories: row.nutrition_calories || 0,
        nutritionPerServing: safeJsonParse(row.nutrition_per_serving, {}),
        imageUrl: '',
        phase: row.menstrual_phase_tag,
        mealTypes: {
          breakfast: row.breakfast,
          lunch: row.lunch,
          dinner: row.dinner
        }
      };
    });

    return res.status(200).json({ recipes, count: recipes.length });

  } catch (error) {
    console.error('Get recipes error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to get recipes',
      details: error.message 
    });
  }
}
