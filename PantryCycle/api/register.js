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
  // Enable CORS
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
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: 'Email, password, first name, and last name are required' 
      });
    }

    console.log('Registration attempt for:', email);

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM user_data WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Insert new user (no username column - using email)
    const result = await pool.query(
      `INSERT INTO user_data 
       (first_name, last_name, email, phone, password, other) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, first_name, last_name, email, phone`,
      [firstName, lastName, email, phone || null, password, '{}']
    );

    const newUser = result.rows[0];

    console.log('User registered successfully:', newUser.id);

    // Return user data (using email as username for compatibility)
    return res.status(201).json({
      id: newUser.id.toString(),
      username: newUser.email,  // Use email as username
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      email: newUser.email,
      phone: newUser.phone?.toString()
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Registration failed',
      details: error.message 
    });
  }
}
