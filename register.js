import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password, firstName, lastName, email } = req.body;

    // Insert new user
    const result = await pool.query(
      `INSERT INTO users (username, password, first_name, last_name, email) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, username, first_name, last_name, email`,
      [username, password, firstName, lastName, email]
    );

    const user = result.rows[0];

    return res.status(201).json({
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
}