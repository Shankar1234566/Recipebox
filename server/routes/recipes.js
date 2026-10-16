import express from 'express';
import db from '../db.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to format a recipe row
function formatRecipeRow(row, purchasedSet = new Set()) {
  const isPurchased = purchasedSet.has(row.id);
  const isUnlocked = row.is_premium === 0 || isPurchased;

  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    category: row.category,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    difficulty: row.difficulty,
    rating: row.rating,
    reviewsCount: row.reviews_count,
    price: row.price,
    isPremium: Boolean(row.is_premium),
    isPurchased,
    isUnlocked,
    image: row.image,
    ingredients: row.ingredients_json ? JSON.parse(row.ingredients_json) : [],
    instructions: isUnlocked
      ? (row.instructions_json ? JSON.parse(row.instructions_json) : [])
      : (row.instructions_json ? JSON.parse(row.instructions_json).slice(0, 1) : []), // preview only 1st step if locked
    nutrition: row.nutrition_json ? JSON.parse(row.nutrition_json) : {},
    totalStepsCount: row.instructions_json ? JSON.parse(row.instructions_json).length : 0
  };
}

// 1. Get all recipes
router.get('/', optionalAuth, (req, res) => {
  try {
    const purchasedSet = new Set();

    if (req.user) {
      const purchaseRows = db.prepare('SELECT recipe_id FROM purchases WHERE user_id = ?').all(req.user.id);
      for (const p of purchaseRows) {
        purchasedSet.add(p.recipe_id);
      }
    }

    const recipes = db.prepare('SELECT * FROM recipes ORDER BY is_premium DESC, id ASC').all();
    const formatted = recipes.map(r => formatRecipeRow(r, purchasedSet));

    return res.json({
      success: true,
      count: formatted.length,
      recipes: formatted
    });
  } catch (err) {
    console.error('Error in GET /api/recipes:', err);
    return res.status(500).json({ error: 'Failed to retrieve recipes' });
  }
});

// 2. Get user's purchased recipes list
router.get('/my-purchases', requireAuth, (req, res) => {
  try {
    const purchases = db.prepare(`
      SELECT p.recipe_id, p.payment_id, p.order_id, p.amount, p.created_at, r.name, r.price, r.image
      FROM purchases p
      JOIN recipes r ON p.recipe_id = r.id
      WHERE p.user_id = ?
      ORDER BY p.id DESC
    `).all(req.user.id);

    return res.json({
      success: true,
      purchases
    });
  } catch (err) {
    console.error('Error in /my-purchases:', err);
    return res.status(500).json({ error: 'Failed to retrieve purchases' });
  }
});

// 3. Get single recipe by ID
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const purchasedSet = new Set();
    if (req.user) {
      const isPurchased = db.prepare('SELECT 1 FROM purchases WHERE user_id = ? AND recipe_id = ?').get(req.user.id, recipe.id);
      if (isPurchased) {
        purchasedSet.add(recipe.id);
      }
    }

    return res.json({
      success: true,
      recipe: formatRecipeRow(recipe, purchasedSet)
    });
  } catch (err) {
    console.error('Error in GET /api/recipes/:id:', err);
    return res.status(500).json({ error: 'Failed to retrieve recipe' });
  }
});

export default router;
