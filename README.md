# RecipeBox — Simple, Interactive Recipe Organizer
**Cook • Collect • Create**

A friendly, modern, and interactive digital cookbook application featuring a signature snake-like cooking timeline.

## Quick Start (Run Locally)

1. Make sure you have **Node.js** installed (version 18+ recommended).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local Vite development server:
   ```bash
   npm run dev
   ```
4. Open the displayed local URL (typically `http://localhost:5173`) in your web browser.

## Features Included
- **Sticky Header & Fast Smooth Navigation**: Home, Explore Recipes, Cooking Mode, Favorites, Shopping List, Meal Planner.
- **Hero Section**: Appetizing food photography, chef highlight badges, floating vegetables.
- **Explore & Filter Recipes**: Working search by name & ingredients, cuisine filter, dietary type (Veg / Non-Veg), duration, difficulty, and sorting.
- **Recipe Details Modal**: Scalable serving sizes (with automatic ingredient math), ingredients checklist with strikethrough, chef's tips, and quick actions.
- **Signature Snake Cooking Timeline**:
  - Serpentine SVG progress curve connecting checkpoints.
  - Active step highlighted with green pulsing glow.
  - Step checkpoints with checkmarks upon completion.
  - Real-time step timer with audio-visual notifications.
  - Previous / Next / Reset controls (with confirmation).
  - Celebratory finish state.
  - LocalStorage persistence per recipe!
- **Saved Favorites**: Persistent recipe bookmarking with live counts.
- **Grocery Shopping List**: Custom ingredient add, item strikethrough, clear completed, and recipe ingredient auto-import.
- **Weekly Meal Planner**: 7-day Monday–Sunday planner for Breakfast, Lunch, and Dinner.
- **Custom Desktop Cursor**: Gentle trailing dot that enlarges on interactive elements (disabled on mobile).
- **Sound Effects**: Synthesized Web Audio API musical chimes with mute toggle.
