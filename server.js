import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT
      )
    `);

    // Create saved_games table
    db.run(`
      CREATE TABLE IF NOT EXISTS saved_games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        game_title TEXT,
        game_url TEXT,
        game_image TEXT,
        played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  }
});

// Routes

// Register
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email or username already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ 
          message: 'User created successfully', 
          user: { id: this.lastID, username, email } 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    
    if (match) {
      // In a real app, you'd generate a JWT here. 
      // For simplicity, we just return the user data.
      res.json({ 
        message: 'Login successful', 
        user: { id: user.id, username: user.username, email: user.email } 
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  });
});

// Save a clicked game
app.post('/save-game', (req, res) => {
  const { userId, gameTitle, gameUrl, gameImage } = req.body;

  if (!userId || !gameTitle || !gameUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO saved_games (user_id, game_title, game_url, game_image) VALUES (?, ?, ?, ?)',
    [userId, gameTitle, gameUrl, gameImage || null],
    function (err) {
      if (err) {
        console.error('Error saving game:', err);
        return res.status(500).json({ error: 'Database error while saving game' });
      }
      res.status(201).json({ message: 'Game saved successfully', id: this.lastID });
    }
  );
});

// Get user's played games
app.get('/user-games/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.all(
    'SELECT * FROM saved_games WHERE user_id = ? ORDER BY played_at DESC LIMIT 50',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
