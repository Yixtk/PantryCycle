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
    const { userId, dietaryPreferences, allergies, selectedMeals, lastPeriodStart, lastPeriodEnd } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    console.log('Updating profile for user:', userId);

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Add dietary preferences
    if (dietaryPreferences !== undefined) {
      updates.push(`dietary_preferences = $${paramCount++}`);
      values.push(dietaryPreferences);
    }

    // Add selected meals
    if (selectedMeals !== undefined) {
      updates.push(`selected_meals = $${paramCount++}`);
      values.push(JSON.stringify(selectedMeals));
    }

    // Add period dates
    if (lastPeriodStart !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(lastPeriodStart);
    }

    if (lastPeriodEnd !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(lastPeriodEnd);
    }

    // Handle allergies - map to boolean columns
    if (allergies !== undefined) {
      const allergyMap = {
        'Dairy': 'no_dairy',
        'Eggs': 'no_eggs',
        'Peanuts': 'no_peanuts',
        'Tree Nuts': 'no_treenuts',
        'Wheat': 'no_wheat',
        'Soy': 'no_soy',
        'Shellfish': 'no_shellfish'
      };

      // Set all to false first
      Object.values(allergyMap).forEach(column => {
        updates.push(`${column} = $${paramCount++}`);
        values.push(false);
      });

      // Then set selected ones to true
      allergies.forEach(allergy => {
        if (allergyMap[allergy]) {
          const column = allergyMap[allergy];
          // Find and update the value
          const index = Object.values(allergyMap).indexOf(column);
          if (index !== -1) {
            values[values.length - Object.values(allergyMap).length + index] = true;
          }
        }
      });

      // Store other allergies in JSON
      const otherAllergies = allergies.filter(a => !allergyMap[a]);
      if (otherAllergies.length > 0) {
        updates.push(`other = $${paramCount++}`);
        values.push(JSON.stringify({ allergies: otherAllergies }));
      } else {
        updates.push(`other = $${paramCount++}`);
        values.push('{}');
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(userId); // Last parameter for WHERE clause

    const query = `
      UPDATE user_data 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id
    `;

    console.log('Executing query:', query);
    console.log('With values:', values);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile updated successfully for user:', userId);

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
