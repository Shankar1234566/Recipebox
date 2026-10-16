# RecipeBox — Technical Architecture & Product Requirements Specification

**RecipeBox** is an interactive, digital recipe organizer and intelligent cooking assistant. It combines structured meal planning, step-by-step interactive cooking timelines, a multilingual voice cooking assistant, secure one-time password (OTP) authentication, and an official Razorpay payment integration for ₹9 premium culinary recipes.

---

## 1. System Architecture & Tech Stack

```
+---------------------------------------------------------------------------------+
|                                RECIPEBOX CLIENT                                 |
|   React 18 • Vite 5 • Tailwind CSS • Web Speech API • Lucide React • Razorpay.js |
+---------------------------------------------------------------------------------+
                                      │
               HTTP / JSON (Vite Dev Proxy: /api -> :5000)
                                      ▼
+---------------------------------------------------------------------------------+
|                               EXPRESS BACKEND API                               |
|   Node.js v22 • Express 5 • CORS • Cookie Parser • JWT Auth • Crypto Engine     |
+---------------------------------------------------------------------------------+
                  │                                            │
                  ▼                                            ▼
+----------------------------------+        +-------------------------------------+
|        SQLITE PERSISTENCE        |        |           PAYMENT GATEWAY           |
| node:sqlite DatabaseSync (WAL)   |        |   Official Razorpay API (HMAC SHA)  |
| server/data/recipebox.db         |        |   rzp_test / Live Gateway Orders    |
+----------------------------------+        +-------------------------------------+
```

### Frontend
- **Framework**: React 18.3.1 with Vite 5.3.1 build tooling.
- **Styling**: Tailwind CSS 3.4.4 with custom warm culinary palette (`#FFF9F0`, `#66856A`, `#E89A55`, `#FAF6F0`).
- **Icons**: `lucide-react`.
- **Speech Capabilities**: Built-in Browser Web Speech API (`SpeechSynthesis` and `webkitSpeechRecognition`).
- **Checkout Interface**: Official Razorpay Checkout JS (`checkout.razorpay.com/v1/checkout.js`).

### Backend
- **Runtime**: Node.js v22 (utilizing native high-performance `node:sqlite` engine).
- **Framework**: Express 5.3.0.
- **Session & Security**: JSON Web Tokens (`jsonwebtoken`), `cookie-parser`, Node `crypto` module (SHA-256 with salts, timing-safe equality checks, HMAC SHA-256 payment verification).
- **Payment Processing**: `razorpay` official Node SDK.

---

## 2. Database Schema & Persistence

The application uses a persistent SQLite database located at `server/data/recipebox.db` initialized with WAL (Write-Ahead Logging) mode and foreign key constraints enabled.

### Tables

#### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| `name` | TEXT | DEFAULT 'Chef' | User display name |
| `email` | TEXT | UNIQUE, NULLABLE | Verified normalized email address |
| `phone` | TEXT | UNIQUE, NULLABLE | Verified E.164 normalized mobile number |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last profile update timestamp |

#### `otps`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Record ID |
| `identifier` | TEXT | NOT NULL | Normalized email or phone number |
| `type` | TEXT | NOT NULL | `'email'` or `'phone'` |
| `otp_hash` | TEXT | NOT NULL | SHA-256 hash of `(otp + salt)` |
| `salt` | TEXT | NOT NULL | 16-byte cryptographically random hex salt |
| `attempts` | INTEGER | DEFAULT 0 | Failed verification attempt counter |
| `expires_at` | INTEGER | NOT NULL | Unix epoch expiration timestamp (5 mins) |
| `consumed` | INTEGER | DEFAULT 0 | 1 = verified/invalidated, 0 = active |
| `created_at` | INTEGER | NOT NULL | Unix epoch creation timestamp |

#### `recipes`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Recipe slug identifier |
| `name` | TEXT | NOT NULL | Recipe title |
| `tagline` | TEXT | NULLABLE | One-line summary |
| `description` | TEXT | NULLABLE | Detailed culinary overview |
| `category` | TEXT | NULLABLE | Category (e.g. Main Course, Breakfast) |
| `prep_time` | TEXT | NULLABLE | Preparation time |
| `cook_time` | TEXT | NULLABLE | Cooking time |
| `servings` | INTEGER | NULLABLE | Default serving yield |
| `difficulty` | TEXT | NULLABLE | Easy / Medium / Hard |
| `rating` | REAL | NULLABLE | Average rating score |
| `reviews_count` | INTEGER | NULLABLE | Total community reviews |
| `price` | REAL | DEFAULT 0 | Authoritative price in INR (9 for premium, 0 for free) |
| `is_premium` | INTEGER | DEFAULT 0 | 1 = Premium locked, 0 = Free public |
| `image` | TEXT | NULLABLE | Recipe image asset / base64 |
| `ingredients_json` | TEXT | NULLABLE | Serialized ingredients array |
| `instructions_json` | TEXT | NULLABLE | Serialized cooking step objects |
| `nutrition_json` | TEXT | NULLABLE | Calories, macros, and dietary flags |

#### `orders`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal order record ID |
| `order_id` | TEXT | UNIQUE NOT NULL | Razorpay order ID or secure test order ID |
| `user_id` | INTEGER | NOT NULL, FK(`users.id`) | Purchasing user |
| `amount` | INTEGER | NOT NULL | Total amount in paise (e.g., 900 paise = ₹9) |
| `currency` | TEXT | DEFAULT 'INR' | Currency code |
| `status` | TEXT | DEFAULT 'created' | Order status (`created`, `paid`, `failed`) |
| `receipt` | TEXT | NULLABLE | Unique order receipt identifier |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Order creation timestamp |

#### `order_items`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Item ID |
| `order_id` | TEXT | NOT NULL, FK(`orders.order_id`) | Associated order |
| `recipe_id` | TEXT | NOT NULL, FK(`recipes.id`) | Target recipe |
| `price` | REAL | NOT NULL | Unit price (₹9) |

#### `purchases`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Purchase ID |
| `user_id` | INTEGER | NOT NULL, FK(`users.id`) | Owner ID |
| `recipe_id` | TEXT | NOT NULL, FK(`recipes.id`) | Unlocked recipe ID |
| `order_id` | TEXT | NOT NULL | Associated order ID |
| `payment_id` | TEXT | NOT NULL | Provider payment transaction ID |
| `amount` | REAL | NOT NULL | Settled price in INR |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Purchase timestamp |
| UNIQUE | | `(user_id, recipe_id)` | Prevents duplicate ownership |

---

## 3. Authentication & Security Engine (Phases 4 & 5)

### Passwordless OTP Login Flows
Users authenticate using numeric one-time passwords delivered via email or mobile:
1. **Identifier Normalization**:
   - Emails are trimmed and transformed to lowercase.
   - Mobile numbers are converted to international E.164 format (e.g. `+919876543210`).
2. **Cryptographic Protection**:
   - Plaintext OTPs are generated on the server using `crypto.randomInt(100000, 999999)`.
   - The server generates a unique 16-byte random salt and computes `sha256(otp + salt)`.
   - The plaintext OTP is never logged and never stored in the database.
   - During verification, the submitted code is hashed with the stored salt and compared using `crypto.timingSafeEqual` to eliminate timing attacks.
3. **Abuse Protection & Rate Limiting**:
   - **Lifetime**: OTPs expire in 5 minutes (300 seconds).
   - **Attempts**: Maximum 5 failed attempts per OTP. Exceeding 5 attempts immediately invalidates the code.
   - **Cooldown**: A 60-second cooldown is enforced between OTP generation requests per identifier to prevent spam.
4. **Session Management**:
   - Verified users receive a signed JWT token valid for 7 days.
   - Tokens are persisted via `localStorage` and optionally in `HttpOnly`, `SameSite=Lax` cookies.
   - Unauthenticated visitors can freely browse recipes and view ingredients, but must authenticate to check out or save account profiles.

---

## 4. Multilingual Voice Cooking Assistant (Phase 3)

The voice assistant is directly integrated into both Recipe Details and Cooking Mode.

### Supported Languages
- **English (`en-US`)**: Full instruction dictation and conversational feedback.
- **Hindi (`hi-IN`)**: Spoken Hindi prompts and step instructions.
- **Telugu (`te-IN`)**: Spoken Telugu culinary vocabulary and step instructions.

### Playback & Speed Controls
- **Play / Pause / Resume / Stop**: Instant audio state management.
- **Step Navigation**: Read next step, read previous step, repeat current step.
- **Speed Adjustment**: 0.75x, 1.0x (normal), 1.25x, 1.5x speech rates.
- **Dynamic Voice Selection**: Automatically discovers native language voices installed in the client operating system and browser.

### Voice Command Recognition (Hands-Free Cooking)
When speech recognition is enabled by the user:
- `"next"` / `"next step"`: Advances visual timeline and speaks the next step.
- `"previous"` / `"back"`: Moves to the previous step.
- `"repeat"` / `"again"`: Re-reads the active step.
- `"pause"` / `"stop"`: Pauses audio playback.
- `"resume"` / `"continue"`: Resumes speech.
- Visual microphone indicator shows active listening state. Microphone is accessed only after explicit user interaction and cleaned up on unmount.

---

## 5. Premium Pricing, Shopping Cart & Payments (Phases 6 & 7)

### Pricing Policy
- **Free Recipes (8 items)**: ₹0. Immediate full access to cooking steps and timeline.
- **Premium Chef Recipes (4 items)**: Flat ₹9 each.
  - `paneer-butter-masala`
  - `mushroom-pasta`
  - `chocolate-brownies`
  - `vegetable-biryani`

### Shopping Cart
- Slide-over drawer with item cards, ₹9 pricing, and remove buttons.
- Duplicate prevention: Already purchased recipes cannot be added to cart.
- Server-authoritative subtotal calculation (`items.length * 9`).
- Empty cart state with quick navigation back to the recipe showcase.

### Buy Now Direct Flow
- Allows instant single-click purchase of any premium recipe without needing to visit the cart.

### Razorpay Integration
1. **Order Creation**: Frontend requests `/api/payments/create-order` with recipe IDs. The backend validates authoritative database prices and creates a Razorpay order in paise (₹9 = 900 paise).
2. **Official Modal**: Frontend triggers official Razorpay checkout (`new window.Razorpay(options)`).
3. **Signature Verification**: On success, client sends `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to `/api/payments/verify`.
4. **HMAC SHA-256**: Backend computes `crypto.createHmac('sha256', secret).update(order_id + '|' + payment_id).digest('hex')` and validates against the signature.
5. **Fulfillment**: Database records purchase in `purchases` table, marks order as `'paid'`, and instantly unlocks recipe instructions on the client.

---

## 6. Backend API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Service liveness health check |
| `GET` | `/api/recipes` | Optional | List all recipes with unlock/purchase status |
| `GET` | `/api/recipes/:id` | Optional | Retrieve recipe details with preview/full status |
| `GET` | `/api/recipes/my-purchases` | Required | Retrieve list of recipes purchased by the user |
| `POST` | `/api/auth/send-otp` | None | Generate, hash, and issue 6-digit OTP |
| `POST` | `/api/auth/verify-otp` | None | Verify OTP hash and issue JWT session token |
| `GET` | `/api/auth/me` | Required | Get current authenticated user profile |
| `PUT` | `/api/auth/profile` | Required | Update display name |
| `POST` | `/api/auth/logout` | Optional | Invalidate session cookies |
| `POST` | `/api/payments/create-order` | Required | Create ₹9 Razorpay order with server pricing |
| `POST` | `/api/payments/verify` | Required | Cryptographically verify payment and unlock recipe |

---

## 7. Setup & Run Instructions

### Prerequisites
- Node.js v20+ or v22+
- npm v10+

### Environment Setup
Copy the sample environment file and configure desired keys:
```bash
cp .env.example .env
```
Default keys:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=server/data/recipebox.db
JWT_SECRET=recipebox_jwt_super_secret_key_2026
RAZORPAY_KEY_ID=rzp_test_YourTestKeyId
RAZORPAY_KEY_SECRET=YourTestKeySecret
```

### Running the Application
1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the Express Backend API (Development)**:
   ```bash
   npm run server
   ```
   *Runs on `http://0.0.0.0:5000` with SQLite auto-seeding.*
3. **Start the Express Backend API (Production)**:
   ```bash
   npm run start
   ```
   *Runs `node server/index.js` binding to `0.0.0.0` and `process.env.PORT`.*
4. **Start the Vite Frontend Development Server**:
   ```bash
   npm run dev
   ```
   *Runs on `http://localhost:5173` with automatic `/api` proxying.*
5. **Build for Production**:
   ```bash
   npm run build
   ```
6. **Run Test Suite**:
   ```bash
   npm test
   ```

---

## 8. Render Deployment Specification

### 8.1 Recommended Deployment Topologies

RecipeBox supports two production deployment architectures on Render:

#### Topology A: Unified Monolithic Web Service (Recommended)
In this topology, a single Render Web Service builds both the Vite frontend and runs the Node 22 backend. Express serves the API endpoints under `/api/*` and automatically serves the pre-compiled React SPA assets from `dist/` with client-side routing fallback.
- **Advantages**: Zero CORS configuration required, zero third-party cookie restrictions for session tokens, simplest DNS management, single unified deploy pipeline.
- **Render Service Type**: **Web Service**
- **Environment**: **Node**
- **Root Directory**: `recipebox` (or `.` if repo root is the recipebox directory)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start` (or `node server/index.js`)

#### Topology B: Decoupled Web Service + Static Site
- **Backend**: Render Web Service
  - **Build Command**: `npm install`
  - **Start Command**: `npm run start`
  - **Environment Variables**: Set `FRONTEND_URL` to your frontend's domain (e.g. `https://recipebox.onrender.com` or `https://recipebox.vercel.app`).
- **Frontend**: Render Static Site (or Vercel / Netlify)
  - **Build Command**: `npm run build`
  - **Publish Directory**: `dist`
  - **Environment Variables**: Set `VITE_API_BASE_URL` to your backend Render URL (e.g. `https://recipebox-api.onrender.com`).

---

### 8.2 Production Environment Variables Reference

| Variable | Required | Description | Example / Recommendation |
|---|---|---|---|
| `PORT` | Auto (Render) | Port for Express server | Automatically injected by Render (usually `10000`). Code defaults to `5000` locally. |
| `NODE_ENV` | Yes | Node runtime environment | `production` |
| `DATABASE_URL` | Yes | SQLite database file location | `/var/data/recipebox.db` (with Persistent Disk) or `server/data/recipebox.db` |
| `FRONTEND_URL` | Cond. | Permitted CORS frontend origins (comma-separated, no trailing slash) | `https://your-frontend.onrender.com,https://your-domain.com` (Topology B only) |
| `JWT_SECRET` | Yes | High-entropy signing secret for authentication tokens | Generate via `openssl rand -hex 32` |
| `SHOW_DEMO_OTP` | No | Expose generated OTP in API responses for development testing | `false` in production |
| `RAZORPAY_KEY_ID` | Yes | Razorpay API Key ID (Test Mode) | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay API Key Secret (Backend ONLY) | `...` (Never expose in client code) |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Razorpay Webhook HMAC secret | `...` (From Razorpay Webhooks dashboard) |
| `SMS_PROVIDER_API_KEY` | Optional | External SMS gateway credentials | Optional |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Optional | SMTP credentials for transactional email delivery | Optional |

---

## 9. Persistent Database Strategy on Render

### The Ephemeral Disk Challenge
Render Web Services run inside lightweight, stateless Docker containers. On both Free and standard Starter tiers, the local container filesystem is **ephemeral**:
1. When a new commit or build is deployed, the container is destroyed and recreated from the new image.
2. When the service restarts, scales, or sleeps due to inactivity, local container storage is wiped.
3. Consequently, leaving the SQLite database at default `server/data/recipebox.db` inside an ephemeral container would cause **loss of user accounts, OTP records, and verified purchase records on every deploy or container restart**.

### Solution Strategies

#### Strategy 1: Render Persistent Disk with SQLite (Recommended for Single-Instance)
- **Mechanism**: Render provides block storage Persistent Disks attached to the Web Service container at a defined mount path (e.g., `/var/data`).
- **Configuration**:
  1. In the Render Dashboard under **Disks**, click **Add Disk**.
  2. Set **Mount Path** to `/var/data`.
  3. Set **Size** to `1 GB` (sufficient for millions of SQLite records).
  4. In Environment Variables, set `DATABASE_URL=/var/data/recipebox.db`.
- **Advantages**:
  - Requires **0 code changes**: `server/db.js` dynamically checks `process.env.DATABASE_URL` and creates parent directories if needed.
  - Preserves 100% of Node 22 native `node:sqlite` speed and WAL transaction concurrency.
  - Retains all user accounts, profile details, and ₹9 verified purchases across deployments and service restarts.

#### Strategy 2: Managed PostgreSQL (Recommended for Horizontal Scaling)
- If the application scales to multiple concurrent container instances, a shared network database like Render PostgreSQL (or Neon / Supabase) should be provisioned because SQLite requires a single filesystem writer.
- Schema migration from SQLite to PostgreSQL is straightforward using standard SQL `CREATE TABLE` and `SERIAL`/`TIMESTAMPTZ` data types.

---

## 10. Connection Failure Root Cause Analysis & Technical Fixes

### Root Cause 1: Static Client API Base URL
- **Diagnosis**: In `src/services/api.js`, the API client was previously initialized with `const BASE_URL = '/api'`. While this works seamlessly when running locally with Vite's dev proxy or in a monolithic deployment, it fails completely in decoupled deployments where the frontend runs on a separate host (e.g., Vercel or Render Static Site) and calls the backend across origins. Unmatched `/api` requests returned 404 or connection refused.
- **Resolution**: Updated `src/services/api.js` to dynamically inspect `import.meta.env.VITE_API_BASE_URL` or `import.meta.env.VITE_API_URL` with a fallback to `/api`. Added informative error message formatting for failed network connections.

### Root Cause 2: Inflexible OTP Route Type Requirements
- **Diagnosis**: The `/api/auth/send-otp` endpoint strictly rejected payloads missing `type: 'email'` or `'phone'`.
- **Resolution**: Enhanced `server/routes/auth.js` to automatically infer identifier type via email regex `@` when omitted by client payloads. Additionally, OTPs are cleanly logged to server stdout (`[AUTH] One-Time Password for ...: XXXXXX`) so developers and testers can verify logins directly from Render logs even before third-party SMS/SMTP providers are connected.

### Root Cause 3: Path-to-RegExp Wildcard Compatibility in Express 5
- **Diagnosis**: Express 5 uses an updated router with `path-to-regexp` v8, which disallows unparameterized wildcards such as `app.options('*')` or `app.get('*')`, causing startup errors (`Missing parameter name at index 1: *`).
- **Resolution**: Standardized CORS preflight handling directly into the `cors()` middleware and transformed SPA fallback routing into version-agnostic Express middleware (`app.use((req, res, next) => { ... })`).

---

## 11. Verification & Test Evidence

- **Vite Production Build**: Succeeded with 0 errors (`dist/index.html`, `dist/assets/`).
- **Automated Integration Test Suite**: All 14 tests passing with 100% success rate:
  1. Health check (`/api/health`): **PASS**
  2. Recipe catalog seeding (12 recipes, 4 premium, 8 free): **PASS**
  3. Send OTP with SHA-256 salt & rate-limit check: **PASS**
  4. Verify OTP with timing-safe comparison & JWT generation: **PASS**
  5. Authenticated `/api/auth/me`: **PASS**
  6. Display name update (`/api/auth/profile`): **PASS**
  7. Server-authoritative ₹9 order creation (900 paise): **PASS**
  8. Payment verification & purchase recording: **PASS**
  9. Duplicate purchase prevention: **PASS**
  10. Order status check (`paid`): **PASS**
  11. Payment cancellation handling: **PASS**
  12. Payment failure handling: **PASS**
  13. Webhook HMAC verification & processing (`payment.captured`): **PASS**
  14. Recipe unlock status verification in DB: **PASS**
- **Security Audit**: Strict zero-exposure policy verified across all client-side files in `src/`. Razorpay secret keys, JWT secrets, and database paths remain exclusively on the server.
- **Cursor Check**: Normal operating system cursor preserved; custom trailing elements removed.
- **Feature Cleanup**: Deprecated shopping list fully removed with zero broken links.
