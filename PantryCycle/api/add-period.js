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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, startDate, endDate, duration } = req.body;

    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'User ID, start date, and end date are required' 
      });
    }

    // Insert into period_records table
    const periodResult = await pool.query(
      `INSERT INTO period_records (user_id, start_date, end_date, duration)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, startDate, endDate, duration]
    );

    // Also update user_data table with most recent period
    await pool.query(
      `UPDATE user_data
       SET start_date = $1, end_date = $2
       WHERE id = $3`,
      [startDate, endDate, userId]
    );

    console.log('Period record added for user:', userId);

    return res.status(201).json({
      success: true,
      period: periodResult.rows[0]
    });

  } catch (error) {
    console.error('Add period error:', error);
    return res.status(500).json({ 
      error: 'Failed to add period record',
      details: error.message 
    });
  }
}
