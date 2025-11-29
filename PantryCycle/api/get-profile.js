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

    // Get user data
    const userResult = await pool.query(
      `SELECT 
        id, 
        dietary_preferences, 
        selected_meals,
        start_date,
        end_date,
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

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get period history
    const periodsResult = await pool.query(
      `SELECT id, start_date, end_date, duration, created_at
       FROM period_records
       WHERE user_id = $1
       ORDER BY start_date DESC
       LIMIT 10`,
      [userId]
    );

    // Map allergies from boolean columns
    const allergies = [];
    if (user.no_dairy) allergies.push({ type: 'Dairy' });
    if (user.no_eggs) allergies.push({ type: 'Eggs' });
    if (user.no_peanuts) allergies.push({ type: 'Peanuts' });
    if (user.no_treenuts) allergies.push({ type: 'Tree Nuts' });
    if (user.no_wheat) allergies.push({ type: 'Wheat' });
    if (user.no_soy) allergies.push({ type: 'Soy' });
    if (user.no_shellfish) allergies.push({ type: 'Shellfish' });

    // Add other allergies from JSON
    if (user.other) {
      try {
        const otherData = JSON.parse(user.other);
        if (otherData.allergies) {
          otherData.allergies.forEach(a => allergies.push({ type: a }));
        }
      } catch (e) {
        console.error('Error parsing other allergies:', e);
      }
    }

    // Build profile response
    const profile = {
      userId: userId,
      lastPeriodStart: user.start_date,
      lastPeriodEnd: user.end_date,
      periodHistory: periodsResult.rows.map(p => ({
        id: p.id.toString(),
        userId: userId,
        startDate: p.start_date,
        endDate: p.end_date,
        duration: p.duration
      })),
      dietaryPreferences: user.dietary_preferences || [],
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
