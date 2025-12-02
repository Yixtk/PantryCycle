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
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const result = await pool.query(
      `SELECT 
        id,
        start_date,
        end_date,
        selected_meals,
        is_vegetarian,
        is_vegan,
        is_gluten_free,
        is_dairy_free,
        is_low_carb,
        is_high_protein,
        is_pescatarian,
        is_keto,
        no_dairy,
        no_eggs,
        no_peanuts,
        no_treenuts,
        no_wheat,
        no_soy,
        no_shellfish,
        other
      FROM user_data 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Build dietary preferences array from booleans
    const dietaryPreferences = [];
    if (user.is_vegetarian) dietaryPreferences.push('Vegetarian');
    if (user.is_vegan) dietaryPreferences.push('Vegan');
    if (user.is_gluten_free) dietaryPreferences.push('Gluten-Free');
    if (user.is_dairy_free) dietaryPreferences.push('Dairy-Free');
    if (user.is_low_carb) dietaryPreferences.push('Low-Carb');
    if (user.is_high_protein) dietaryPreferences.push('High-Protein');
    if (user.is_pescatarian) dietaryPreferences.push('Pescatarian');
    if (user.is_keto) dietaryPreferences.push('Keto');

    // Build allergies array from booleans
    const allergies = [];
    if (user.no_dairy) allergies.push({ type: 'Dairy' });
    if (user.no_eggs) allergies.push({ type: 'Eggs' });
    if (user.no_peanuts) allergies.push({ type: 'Peanuts' });
    if (user.no_treenuts) allergies.push({ type: 'Tree Nuts' });
    if (user.no_wheat) allergies.push({ type: 'Wheat' });
    if (user.no_soy) allergies.push({ type: 'Soy' });
    if (user.no_shellfish) allergies.push({ type: 'Shellfish' });

    // Add other allergies
    if (user.other) {
      try {
        const otherData = typeof user.other === 'string' ? JSON.parse(user.other) : user.other;
        if (otherData.allergies) {
          otherData.allergies.forEach(a => allergies.push({ type: a }));
        }
      } catch (e) {
        console.error('Error parsing other allergies:', e);
      }
    }

    // Build period history
    const periodHistory = [];
    if (user.start_date && user.end_date) {
      const duration = Math.ceil(
        (new Date(user.end_date) - new Date(user.start_date)) / (1000 * 60 * 60 * 24)
      );
      periodHistory.push({
        id: '1',
        userId: userId,
        startDate: user.start_date,
        endDate: user.end_date,
        duration: duration
      });
    }

    const profile = {
      userId: userId,
      lastPeriodStart: user.start_date,
      lastPeriodEnd: user.end_date,
      periodHistory: periodHistory,
      dietaryPreferences: dietaryPreferences,
      allergies: allergies,
      selectedMeals: user.selected_meals || {},
      recipesPerWeek: 7
    };

    return res.status(200).json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ 
      error: 'Failed to get profile',
      details: error.message 
    });
  }
}
