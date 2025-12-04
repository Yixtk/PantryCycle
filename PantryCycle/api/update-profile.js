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
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, dietaryPreferences, allergies, selectedMeals, lastPeriodStart, lastPeriodEnd, weekBlocks } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    console.log('Updating profile for user:', userId);

    const setParts = [];
    const values = [];
    let valueIndex = 1;

    // Handle dietary preferences as booleans
    if (dietaryPreferences !== undefined) {
      const dietaryColumns = {
        'Vegetarian': 'is_vegetarian',
        'Vegan': 'is_vegan',
        'Gluten-Free': 'is_gluten_free',
        'Dairy-Free': 'is_dairy_free',
        'Low-Carb': 'is_low_carb',
        'High-Protein': 'is_high_protein',
        'Pescatarian': 'is_pescatarian',
        'Keto': 'is_keto'
      };

      Object.entries(dietaryColumns).forEach(([prefName, columnName]) => {
        setParts.push(`${columnName} = $${valueIndex++}`);
        values.push(dietaryPreferences.includes(prefName));
      });
    }

    // Handle allergies as booleans
    if (allergies !== undefined) {
      const allergyColumns = {
        'Dairy': 'no_dairy',
        'Eggs': 'no_eggs',
        'Peanuts': 'no_peanuts',
        'Tree Nuts': 'no_treenuts',
        'Wheat': 'no_wheat',
        'Soy': 'no_soy',
        'Shellfish': 'no_shellfish'
      };

      Object.entries(allergyColumns).forEach(([allergyName, columnName]) => {
        setParts.push(`${columnName} = $${valueIndex++}`);
        values.push(allergies.includes(allergyName));
      });

      // Store other allergies in JSON
      const otherAllergies = allergies.filter(a => !allergyColumns[a]);
      setParts.push(`other = $${valueIndex++}`);
      values.push(otherAllergies.length > 0 ? JSON.stringify({ allergies: otherAllergies }) : '{}');
    }

    // Selected meals (JSON) - default schedule
    if (selectedMeals !== undefined) {
      setParts.push(`selected_meals = $${valueIndex++}`);
      values.push(JSON.stringify(selectedMeals));
    }

    // Week blocks (JSON) - custom weekly schedules
    if (weekBlocks !== undefined) {
      setParts.push(`week_blocks = $${valueIndex++}`);
      values.push(JSON.stringify(weekBlocks));
    }

    // Period dates
    if (lastPeriodStart !== undefined) {
      setParts.push(`start_date = $${valueIndex++}`);
      values.push(lastPeriodStart);
    }

    if (lastPeriodEnd !== undefined) {
      setParts.push(`end_date = $${valueIndex++}`);
      values.push(lastPeriodEnd);
    }

    if (setParts.length === 0) {
      return res.status(400).json({ error: 'No data to update' });
    }

    values.push(userId);

    const query = `
      UPDATE user_data 
      SET ${setParts.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id
    `;

    console.log('Executing update');
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile updated successfully');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
}
