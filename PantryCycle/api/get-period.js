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
      `SELECT id, start_date, end_date, duration, created_at
       FROM period_records
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [userId]
    );

    const periods = result.rows.map(p => ({
      id: p.id.toString(),
      userId: userId,
      startDate: p.start_date,
      endDate: p.end_date,
      duration: p.duration
    }));

    return res.status(200).json({ periods });

  } catch (error) {
    console.error('Get periods error:', error);
    return res.status(500).json({ 
      error: 'Failed to get period history',
      details: error.message 
    });
  }
}
