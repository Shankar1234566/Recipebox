import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine SQLite database storage path
let configuredDbPath = process.env.DATABASE_URL || process.env.DB_PATH;

if (!configuredDbPath || configuredDbPath.startsWith('postgres://') || configuredDbPath.startsWith('postgresql://')) {
  configuredDbPath = path.join(__dirname, 'data', 'recipebox.db');
} else if (!path.isAbsolute(configuredDbPath)) {
  configuredDbPath = path.resolve(process.cwd(), configuredDbPath);
}

// Ensure database parent directory exists
const parentDir = path.dirname(configuredDbPath);
if (!fs.existsSync(parentDir)) {
  fs.mkdirSync(parentDir, { recursive: true });
}

console.log(`[Database] Initializing SQLite database at: ${configuredDbPath}`);
const db = new DatabaseSync(configuredDbPath);

// Enable WAL mode for better concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT 'Chef',
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    type TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at INTEGER NOT NULL,
    consumed INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    category TEXT,
    prep_time TEXT,
    cook_time TEXT,
    servings INTEGER,
    difficulty TEXT,
    rating REAL,
    reviews_count INTEGER,
    price REAL DEFAULT 0,
    is_premium INTEGER DEFAULT 0,
    image TEXT,
    ingredients_json TEXT,
    instructions_json TEXT,
    nutrition_json TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'created',
    receipt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    recipe_id TEXT NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(order_id),
    FOREIGN KEY(recipe_id) REFERENCES recipes(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipe_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, recipe_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(recipe_id) REFERENCES recipes(id)
  );
`);

// Check if recipes need to be seeded
const countStmt = db.prepare('SELECT COUNT(*) as count FROM recipes');
const { count } = countStmt.get();

if (count === 0) {
  try {
    const recipesJsonPath = path.join(__dirname, '../src/data/recipes.json');
    if (fs.existsSync(recipesJsonPath)) {
      const recipesRaw = fs.readFileSync(recipesJsonPath, 'utf8');
      const recipes = JSON.parse(recipesRaw);

      // Define premium recipe IDs (priced at ₹9)
      const premiumIds = new Set([
        'paneer-butter-masala',
        'mushroom-pasta',
        'chocolate-brownies',
        'vegetable-biryani',
      ]);

      const insertRecipeStmt = db.prepare(`
        INSERT INTO recipes (
          id, name, tagline, description, category, prep_time, cook_time,
          servings, difficulty, rating, reviews_count, price, is_premium,
          image, ingredients_json, instructions_json, nutrition_json
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      for (const r of recipes) {
        const isPremium = premiumIds.has(r.id) ? 1 : 0;
        const price = isPremium ? 9 : 0;

        insertRecipeStmt.run(
          r.id,
          r.name,
          r.tagline || '',
          r.description || '',
          r.category || 'General',
          r.prepTime || '15 mins',
          r.cookTime || '20 mins',
          r.servings || 2,
          r.difficulty || 'Easy',
          r.rating || 4.8,
          r.reviewsCount || 100,
          price,
          isPremium,
          r.image || '',
          JSON.stringify(r.ingredients || []),
          JSON.stringify(r.instructions || []),
          JSON.stringify(r.nutrition || {})
        );
      }
      console.log(`[Database] Successfully seeded ${recipes.length} recipes (4 premium, 8 free).`);
    }
  } catch (err) {
    console.error('[Database] Failed to seed recipes:', err);
  }
}

export default db;
