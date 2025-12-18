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

  console.log('========== GET RECIPES REQUEST ==========');
  console.log('Request query params:', req.query);

  try {
    const { 
      phase,           // 'Menstrual', 'Follicular', 'Ovulation', 'Luteal'
      mealType,        // 'breakfast', 'lunch', 'dinner'
      dietary,         // comma-separated: 'vegetarian,gluten-free'
      allergens,       // comma-separated: 'dairy,eggs'
      limit = 10       // how many recipes to return
    } = req.query;

    console.log('Parsed params:', { phase, mealType, dietary, allergens, limit });

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
            conditions.push('is_vegan = TRUE');
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
    // If user has allergen X, only show recipes where no_X = TRUE (meaning recipe is safe/free from X)
    if (allergens) {
      const allergenList = allergens.split(',').map(a => a.trim());
      
      for (const allergen of allergenList) {
        switch (allergen) {
          case 'Dairy':
            conditions.push('no_dairy = TRUE');
            break;
          case 'Eggs':
            conditions.push('no_eggs = TRUE');
            break;
          case 'Peanuts':
            conditions.push('no_peanuts = TRUE');
            break;
          case 'Tree Nuts':
            conditions.push('no_treenuts = TRUE');
            break;
          case 'Wheat':
            conditions.push('no_wheat = TRUE');
            break;
          case 'Soy':
            conditions.push('no_soy = TRUE');
            break;
          case 'Shellfish':
            conditions.push('no_shellfish = TRUE');
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
        serving_size,
        nutrition_calories,
        nutrition_per_serving,
        breakfast,
        lunch,
        dinner,
        menstrual_phase_tag,
        prep_time,
        cook_time
      FROM recipes_classified
      ${whereClause}
      ORDER BY RANDOM()
      LIMIT $${paramIndex}
    `;
    
    params.push(parseInt(limit));

    console.log('========== FINAL SQL QUERY ==========');
    console.log('Query:', query);
    console.log('Params:', params);
    console.log('=====================================');

    const result = await pool.query(query, params);
    
    console.log('Query result:', {
      rowCount: result.rows.length,
      firstRow: result.rows[0]
    });

    // Transform to frontend format
    const recipes = result.rows.map((row, index) => {
      console.log(`Processing recipe ${index + 1}:`, row.recipe_title);
      
      let ingredients = row.ingredients;
      let instructions = row.cooking_instructions;
      let nutritionPerServing = row.nutrition_per_serving;
      
      // Safely parse JSON fields
      try {
        if (typeof row.ingredients === 'string') {
          ingredients = JSON.parse(row.ingredients);
        }
      } catch (e) {
        console.error('Error parsing ingredients for recipe', row.id, e);
        ingredients = {};
      }
      
      try {
        if (typeof row.cooking_instructions === 'string') {
          instructions = JSON.parse(row.cooking_instructions);
        }
      } catch (e) {
        console.error('Error parsing instructions for recipe', row.id, e);
        instructions = [];
      }
      
      try {
        if (typeof row.nutrition_per_serving === 'string') {
          nutritionPerServing = JSON.parse(row.nutrition_per_serving);
        }
      } catch (e) {
        console.error('Error parsing nutrition for recipe', row.id, e);
        nutritionPerServing = {};
      }
      
      return {
        id: row.id,
        name: row.recipe_title,
        description: row.category || '',
        ingredients: ingredients,
        instructions: instructions,
        prepTime: row.prep_time || 0,
        cookTime: row.cook_time || 0,
        servings: row.serving_size || 1,
        calories: row.nutrition_calories || nutritionPerServing?.calories || 0,
        nutritionPerServing: nutritionPerServing,
        imageUrl: '',
        phase: row.menstrual_phase_tag,
        mealTypes: {
          breakfast: row.breakfast,
          lunch: row.lunch,
          dinner: row.dinner
        }
      };
    });

    console.log(`Successfully transformed ${recipes.length} recipes`);

    return res.status(200).json({ recipes, count: recipes.length });

  } catch (error) {
    console.error('========== ERROR IN GET RECIPES ==========');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    console.error('==========================================');
    return res.status(500).json({ 
      error: 'Failed to get recipes',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
