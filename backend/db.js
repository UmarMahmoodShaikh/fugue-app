const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

require('dotenv').config({
  path: fs.existsSync(path.join(__dirname, '.env')) ? path.join(__dirname, '.env') : undefined
});

const DEFAULT_INTERESTS = ['Gaming', 'Dancing', 'Singing', 'Foodie', 'Coding', 'Reading', 'Writing', 'Drawing', 'Painting', 'Photography', 'Traveling', 'Hiking', 'Camping', 'Fishing', 'Gardening', 'Cooking', 'Baking', 'Eating', 'Drinking', 'Partying', 'Socializing', 'Networking', 'Meeting new people', 'Making new friends', 'Making new connections'];

function buildPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL not set. Falling back to local postgres on fugue_app database.');
  }

  let sslConfig = false;
  const pgSslMode = (process.env.PGSSLMODE || '').toLowerCase();
  if (pgSslMode === 'require' || pgSslMode === 'verify-full') {
    sslConfig = { rejectUnauthorized: false };
  } else if (pgSslMode && pgSslMode !== 'disable') {
    sslConfig = { rejectUnauthorized: false };
  } else if ((process.env.DATABASE_SSL || '').toLowerCase() === 'true') {
    sslConfig = { rejectUnauthorized: false };
  }

  const poolConfig = connectionString
    ? { connectionString, ...(sslConfig ? { ssl: sslConfig } : {}) }
    : { host: 'localhost', port: 5432, database: 'fugue_app' };

  return new Pool(poolConfig);
}

const pool = buildPool();

async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS interests (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_interests (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        interest_id INTEGER NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, interest_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER REFERENCES users(id),
        user2_id INTEGER REFERENCES users(id),
        interest_id INTEGER REFERENCES interests(id),
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deleted_sessions (
        sid TEXT PRIMARY KEY,
        expired TIMESTAMPTZ NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid TEXT PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMPTZ NOT NULL
      )
    `);

    // Seed interests
    const existing = await client.query('SELECT name FROM interests');
    const existingNames = new Set(existing.rows.map((row) => row.name.toLowerCase()));
    for (const interest of DEFAULT_INTERESTS) {
      if (!existingNames.has(interest.toLowerCase())) {
        await client.query('INSERT INTO interests(name) VALUES ($1)', [interest]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database schema ensured');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to ensure schema', err);
    throw err;
  } finally {
    client.release();
  }
}

async function createUser(username, password) {
  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
    [username, hash]
  );
  return result.rows[0];
}

async function findUserByUsername(username) {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
}

async function findUserById(userId) {
  const result = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}

async function verifyPassword(user, candidate) {
  if (!user) return false;
  return bcrypt.compare(candidate, user.password_hash);
}

async function listInterests() {
  const result = await pool.query('SELECT id, name FROM interests ORDER BY name ASC');
  return result.rows;
}

async function getUserInterests(userId) {
  const result = await pool.query(
    `
      SELECT i.id, i.name
      FROM interests i
      INNER JOIN user_interests ui ON ui.interest_id = i.id
      WHERE ui.user_id = $1
      ORDER BY i.name ASC
    `,
    [userId]
  );
  return result.rows;
}

async function replaceUserInterests(userId, interestIds) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);

    if (Array.isArray(interestIds) && interestIds.length > 0) {
      const cleanedIds = interestIds.map((id) => Number(id)).filter((id) => Number.isInteger(id));
      if (cleanedIds.length > 0) {
        const params = [userId, ...cleanedIds];
        const placeholders = cleanedIds
          .map((_, idx) => `($1, $${idx + 2})`)
          .join(', ');
        await client.query(
          `INSERT INTO user_interests (user_id, interest_id) VALUES ${placeholders}`,
          params
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  ensureSchema,
  createUser,
  findUserByUsername,
  findUserById,
  verifyPassword,
  listInterests,
  getUserInterests,
  replaceUserInterests
};

