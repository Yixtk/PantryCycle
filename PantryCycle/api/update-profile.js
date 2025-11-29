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
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, dietaryPreferences, allergies, selectedMeals } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Build update fields based on what's provided
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (dietaryPreferences) {
      updates.push(`dietary_preferences = $${paramCount++}`);
      values.push(dietaryPreferences);
    }

    if (allergies) {
      // Map allergies to boolean columns
      const allergyMap = {
        'Dairy': 'no_dairy',
        'Eggs': 'no_eggs',
        'Peanuts': 'no_peanuts',
        'Tree Nuts': 'no_treenuts',
        'Wheat': 'no_wheat',
        'Soy': 'no_soy',
        'Shellfish': 'no_shellfish'
      };

      Object.keys(allergyMap).forEach(allergy => {
        const column = allergyMap[allergy];
        updates.push(`${column} = $${paramCount++}`);
        values.push(allergies.includes(allergy));
      });

      // Store other allergies in JSON
      const otherAllergies = allergies.filter(a => !allergyMap[a]);
      if (otherAllergies.length > 0) {
        updates.push(`other = $${paramCount++}`);
        values.push(JSON.stringify({ allergies: otherAllergies }));
      }
    }

    if (selectedMeals) {
      updates.push(`selected_meals = $${paramCount++}`);
      values.push(JSON.stringify(selectedMeals));
    }

    values.push(userId); // Last parameter for WHERE clause

    const query = `
      UPDATE user_data 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile updated for user:', userId);

    return res.status(200).json({
      success: true,
      message: 'Profile updated'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
}
