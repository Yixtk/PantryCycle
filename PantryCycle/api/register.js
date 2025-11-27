import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
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
    const { username, password, firstName, lastName } = req.body;

    // Only validate required fields
    if (!username || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Username, password, first name, and last name are required' 
      });
    }

    console.log('Registration attempt for:', username);

    // Check if username already exists
    const existingUsername = await pool.query(
      'SELECT id FROM user_data WHERE username = $1',
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Insert new user (only required fields)
    const result = await pool.query(
      `INSERT INTO user_data 
       (username, first_name, last_name, password, other) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, first_name, last_name`,
      [username, firstName, lastName, password, '{}']
    );

    const newUser = result.rows[0];

    console.log('User registered successfully:', newUser.id);

    return res.status(201).json({
      id: newUser.id.toString(),
      username: newUser.username,
      firstName: newUser.first_name,
      lastName: newUser.last_name
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Registration failed',
      details: error.message 
    });
  }
}
