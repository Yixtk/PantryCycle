import { Pool } from 'pg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Check environment variables
    const envVars = {
      DB_HOST: process.env.DB_HOST ? '✅ Set' : '❌ Missing',
      DB_PORT: process.env.DB_PORT ? '✅ Set' : '❌ Missing',
      DB_NAME: process.env.DB_NAME ? '✅ Set' : '❌ Missing',
      DB_USER: process.env.DB_USER ? '✅ Set' : '❌ Missing',
      DB_PASSWORD: process.env.DB_PASSWORD ? '✅ Set' : '❌ Missing',
    };

    // Try to create pool
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });

    // Try to query
    const result = await pool.query('SELECT NOW()');
    
    await pool.end();

    return res.status(200).json({
      status: '✅ SUCCESS',
      environmentVariables: envVars,
      databaseConnection: '✅ Connected',
      currentTime: result.rows[0].now,
      pgModuleLoaded: '✅ Yes'
    });

  } catch (error) {
    return res.status(500).json({
      status: '❌ ERROR',
      error: error.message,
      stack: error.stack,
      environmentVariables: {
        DB_HOST: process.env.DB_HOST ? '✅ Set' : '❌ Missing',
        DB_PORT: process.env.DB_PORT ? '✅ Set' : '❌ Missing',
        DB_NAME: process.env.DB_NAME ? '✅ Set' : '❌ Missing',
        DB_USER: process.env.DB_USER ? '✅ Set' : '❌ Missing',
        DB_PASSWORD: process.env.DB_PASSWORD ? '✅ Set' : '❌ Missing',
      }
    });
  }
}

