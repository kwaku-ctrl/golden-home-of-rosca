const Database = require('better-sqlite3');
const path = require('path');

// Create SQLite database file
const db = new Database(path.join(__dirname, '../local.db'));

// Initialize users table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('✅ SQLite database initialized at local.db');

module.exports = {
  addUser: (user) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, full_name, email, phone_number, password, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(user.id, user.full_name, user.email.toLowerCase(), user.phone_number, user.password, user.role, user.created_at, user.updated_at);
    console.log('📝 User added to SQLite:', user.email);
    return user;
  },

  findUserByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
    const user = stmt.get(email);
    console.log('🔍 Looking for user:', email.toLowerCase(), user ? '✅ Found' : '❌ Not found');
    return user;
  },

  findUserById: (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  updateUser: (id, updates) => {
    const user = module.exports.findUserById(id);
    if (!user) return null;

    const keys = Object.keys(updates);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);

    const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);

    return module.exports.findUserById(id);
  }
};
