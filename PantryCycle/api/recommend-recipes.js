import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// Calculate menstrual cycle phase
function calculatePhase(startDate, cycleLength = 28) {
  if (!startDate) return null;
  
  const today = new Date();
  const periodStart = new Date(startDate);
  const daysSinceLastPeriod = Math.floor((today - periodStart) / (1000 * 60 * 60 * 24));
  const cycleDay = (daysSinceLastPeriod % cycleLength) + 1;
  
  // Determine phase
  if (cycleDay >= 1 && cycleDay <= 5) return 'Menstrual';
  if (cycleDay >= 6 && cycleDay <= 13) return 'Follicular';
  if (cycleDay >= 14 && cycleDay <= 16) return 'Ovulation';
  return 'Luteal';
}

export default async function handler(req, res) {
  // CORS headers
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
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    console.log('Recommend recipes for user:', userId);

    // Get user data - all relevant columns
    const userResult = await pool.query(
      `SELECT 
        start_date,
        end_date,
        no_dairy,
        no_eggs,
        no_peanuts,
        no_treenuts,
        no_wheat,
        no_soy,
        no_shellfish,
        is_vegetarian,
        is_vegan,
        is_gluten_free,
        is_dairy_free,
        is_low_carb,
        is_high_protein,
        is_pescatarian,
        is_keto
      FROM user_data 
      WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userResult.rows[0];
    
    // Calculate current phase from start_date
    const currentPhase = calculatePhase(userData.start_date);
    
    // Build list of user's allergens (TRUE = user HAS this allergen)
    const userAllergens = [];
    if (userData.no_dairy) userAllergens.push('Dairy');
    if (userData.no_eggs) userAllergens.push('Eggs');
    if (userData.no_peanuts) userAllergens.push('Peanuts');
    if (userData.no_treenuts) userAllergens.push('Tree Nuts');
    if (userData.no_wheat) userAllergens.push('Wheat');
    if (userData.no_soy) userAllergens.push('Soy');
    if (userData.no_shellfish) userAllergens.push('Shellfish');

    // Build list of dietary preferences
    const dietaryPreferences = [];
    if (userData.is_vegetarian) dietaryPreferences.push('Vegetarian');
    if (userData.is_vegan) dietaryPreferences.push('Vegan');
    if (userData.is_gluten_free) dietaryPreferences.push('Gluten-Free');
    if (userData.is_dairy_free) dietaryPreferences.push('Dairy-Free');
    if (userData.is_low_carb) dietaryPreferences.push('Low-Carb');
    if (userData.is_high_protein) dietaryPreferences.push('High-Protein');
    if (userData.is_pescatarian) dietaryPreferences.push('Pescatarian');
    if (userData.is_keto) dietaryPreferences.push('Keto');
    
    console.log('User info:', {
      phase: currentPhase,
      dietary: dietaryPreferences,
      allergens: userAllergens
    });

    // Build query conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Filter by phase if available
    if (currentPhase) {
      conditions.push(`menstrual_phase_tag = $${paramIndex}`);
      params.push(currentPhase);
      paramIndex++;
    }

    // Filter by dietary preferences (match ALL preferences)
    if (userData.is_vegetarian) {
      conditions.push('is_vegetarian = TRUE');
    }
    if (userData.is_vegan) {
      conditions.push('is_vegetarian = TRUE'); // Vegan recipes should be vegetarian
    }
    if (userData.is_gluten_free) {
      conditions.push('is_gluten_free = TRUE');
    }
    if (userData.is_dairy_free) {
      conditions.push('no_dairy = TRUE');
    }
    if (userData.is_low_carb) {
      conditions.push('is_low_carb = TRUE');
    }
    if (userData.is_high_protein) {
      conditions.push('is_high_protein = TRUE');
    }
    if (userData.is_pescatarian) {
      conditions.push('is_pescatarian = TRUE');
    }
    if (userData.is_keto) {
      conditions.push('is_keto = TRUE');
    }

    // Filter OUT allergens (exclude recipes containing user's allergens)
    // In recipes_classified table: no_dairy=TRUE means recipe does NOT contain dairy
    // If user has no_dairy=TRUE (allergic to dairy), we only show recipes with no_dairy=TRUE
    if (userData.no_dairy) {
      conditions.push('(no_dairy = TRUE OR no_dairy IS NULL)');
    }
    if (userData.no_eggs) {
      conditions.push('(no_eggs = TRUE OR no_eggs IS NULL)');
    }
    if (userData.no_peanuts) {
      conditions.push('(no_peanuts = TRUE OR no_peanuts IS NULL)');
    }
    if (userData.no_treenuts) {
      conditions.push('(no_treenuts = TRUE OR no_treenuts IS NULL)');
    }
    if (userData.no_wheat) {
      conditions.push('(no_wheat = TRUE OR no_wheat IS NULL)');
    }
    if (userData.no_soy) {
      conditions.push('(no_soy = TRUE OR no_soy IS NULL)');
    }
    if (userData.no_shellfish) {
      conditions.push('(no_shellfish = TRUE OR no_shellfish IS NULL)');
    }

    // Build final query
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
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
        menstrual_phase_tag,
        prep_time,
        cook_time
      FROM recipes_classified
      ${whereClause}
      ORDER BY RANDOM()
      LIMIT 5
    `;

    console.log('Query:', query);
    console.log('Params:', params);

    const recipesResult = await pool.query(query, params);

    // Format recipes for frontend with safe JSON parsing
    const recipes = recipesResult.rows.map(row => {
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
        prepTime: row.prep_time || 0,
        cookTime: row.cook_time || 0,
        servings: row.serving_size || 1,
        calories: row.nutrition_calories || 0,
        nutritionPerServing: safeJsonParse(row.nutrition_per_serving, {}),
        imageUrl: '',
        phase: row.menstrual_phase_tag,
        mealTypes: {
          breakfast: row.breakfast || false,
          lunch: row.lunch || false,
          dinner: row.dinner || false
        }
      };
    });

    console.log(`Recommended ${recipes.length} recipes for phase: ${currentPhase}`);

    return res.status(200).json({
      recipes,
      phase: currentPhase,
      count: recipes.length
    });

  } catch (error) {
    console.error('Recommend recipes error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Failed to get recommendations',
      details: error.message 
    });
  }
}
