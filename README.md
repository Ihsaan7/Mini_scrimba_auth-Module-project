# 🛒 Mini Auth & Cart Backend

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-v5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-v5.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![bcryptjs](https://img.shields.io/badge/Security-bcryptjs-E535AB?style=for-the-badge&logo=security&logoColor=white)](https://www.npmjs.com/package/bcryptjs)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>A lightweight, production-structured Node.js/Express REST API showcasing stateful session-based authentication, user-scoped shopping cart operations, and resilient SQLite persistence with Vercel serverless support.</b>
</p>

[Explore API Endpoints](#-api-reference) • [What I Learned](#-what-i-learned-as-a-backend-developer) • [Quick Start](#-quick-start) • [Deployment](#-vercel-deployment)

</div>

---

## 📌 Project Overview

This project was built to understand the core mechanics of backend web development without relying on high-level "magic" abstractions or external BaaS (Backend-as-a-Service) providers. It implements:

- **Stateful Authentication**: Secure user registration, password hashing, and cookie-backed session lifecycles using `express-session` and `bcryptjs`.
- **Relational Cart Storage**: User-scoped shopping cart management backed by SQLite with foreign key relationships.
- **Strict Middleware Guards**: Route-level access controllers (`isAuthenticated`) ensuring sensitive resources remain locked behind active sessions.
- **Serverless-Ready Architecture**: Configured with custom database initialization for both long-running Node.js servers and ephemeral Vercel/Lambda serverless functions.

---

## 🧠 What I Learned as a Backend Developer

Building this project provided hands-on experience solving fundamental backend engineering challenges. Here are the core concepts mastered:

### 1. 🔐 Stateful Session Authentication vs. Stateless Tokens
- **Session Lifecycle**: Learned how servers maintain user state across stateless HTTP requests. When a user logs in, Express creates a server-side session object and sets a cryptographically signed cookie (`connect.sid`) in the client's browser.
- **Cookie Security Attributes**:
  - `httpOnly: true`: Prevents malicious client-side JavaScript from accessing cookies (mitigating XSS attacks).
  - `sameSite`: Protects against Cross-Site Request Forgery (CSRF).
  - `secure`: Ensures cookies are only transmitted over HTTPS in production.
- **Dual-Mode Session Resolution**: Understood the challenges of third-party cookie restrictions in modern browsers and iframes, implementing a header-based fallback (`x-session-token`) to maintain session integrity across any client architecture.

### 2. 🛡️ Cryptographic Password Security with `bcryptjs`
- Learned why passwords **must never** be stored in plain text.
- Implemented salted password hashing with `bcrypt.hash(password, 10)`:
  - **Salting**: Adding random entropy to every password before hashing prevents rainbow-table lookup attacks.
  - **Work Factor (Cost)**: Tuned iteration rounds to balance security against server CPU overhead.
  - **Timing-Safe Verification**: Used `bcrypt.compare()` to resist side-channel timing attacks when validating user credentials.

### 3. 🗄️ Relational Database Modeling with SQLite
- Designed a normalized relational schema with two core entities:
  - `users` table: Holds account credentials (`id`, `username`, `email`, `password_hash`, `created_at`).
  - `cart_items` table: Tracks user products (`id`, `user_id`, `product_name`, `price`, `quantity`, `created_at`).
- **Data Integrity & Foreign Keys**: Enforced relational constraints so cart items are strictly bound to their respective `user_id`.
- **Aggregation Queries**: Structured SQL queries calculating live cart summaries (`SUM(quantity)` and `SUM(quantity * price)`) directly in the database layer.

### 4. 🧱 Express Middleware Pipeline & Separation of Concerns
- Structured the codebase using the **MVC / Layered Architecture**:
  ```text
  Request ──> Middleware (Logger / Auth Guard) ──> Router ──> Controller ──> Database (SQLite)
  ```
- **Guard Pattern**: Created custom middleware (`isAuthenticated.js`) that intercepts incoming requests, verifies session presence, attaches the authenticated user to the request context, or returns early with `401 Unauthorized`.
- **Centralized Error Handling**: Built consistent JSON error responses (`{ success: false, message: ... }`) preventing unhandled promise rejections from crashing the Node.js process.

### 5. ⚡ Adapting Stateful SQLite to Serverless Environments (Vercel)
- **The Challenge**: Serverless functions (AWS Lambda/Vercel) run in an ephemeral, read-only root environment (`/var/task`). Trying to write directly to a local SQLite database in the root folder results in `SQLITE_READONLY` errors.
- **The Solution**: 
  - Wrote dynamic database loader logic in `src/db/index.js` that detects `process.env.VERCEL`.
  - Automatically copies the initial SQLite template database to `/tmp/auth_demo.sqlite` (the writable scratch directory in serverless containers).
  - Created connection-caching middleware to handle lambda cold starts gracefully.

---

## 🏗️ System Architecture & Data Flow

```text
┌──────────────┐         POST /api/v1/auth/login          ┌─────────────────────┐
│              ├─────────────────────────────────────────►│  Express Router     │
│    Client    │                                          │  & Auth Controller  │
│  (Browser /  │◄─────────────────────────────────────────┤  - Validate Email   │
│   Postman)   │         Set-Cookie: connect.sid=s%3A...  │  - bcrypt.compare() │
└──────┬───────┘                                          └──────────┬──────────┘
       │                                                             │
       │                                                             ▼
       │ GET /api/v1/cart                                 ┌─────────────────────┐
       │ Cookie: connect.sid=...                          │  SQLite Database    │
       ├────────────────────────┐                         │  - users            │
       │                        ▼                         │  - cart_items       │
       │             ┌─────────────────────┐              └─────────────────────┘
       │             │  isAuthenticated    │                         ▲
       │             │  Middleware         │                         │
       │             └──┬───────────────┬──┘                         │
       │     Valid? ───►│ YES           │ NO ──► 401 Unauthorized    │
       │                ▼               └────────────────────────────┘
       │     ┌─────────────────────┐                                 │
       └────►│  Cart Controller    ├─────────────────────────────────┘
             │  - Fetch Items      │  SELECT * FROM cart_items WHERE user_id = ?
             │  - Calc Aggregates  │
             └─────────────────────┘
```

---

## 🔌 API Reference

### Base URL: `/api/v1`

### 🔑 Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/register` | Create a new user account | ❌ |
| `POST` | `/login` | Authenticate credentials & start session | ❌ |
| `GET` | `/me` | Get currently logged-in user profile | ✅ |
| `POST` | `/logout` | Terminate session & clear cookies | ✅ |
| `GET` | `/test` | Health test for authentication routing | ❌ |

<details>
<summary><b>View Authentication Payloads & Examples</b></summary>

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "alex",
  "email": "alex@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "alex@example.com",
  "password": "password123"
}
```
*Returns `200 OK` with a signed `connect.sid` cookie and JSON user profile.*

</details>

---

### 🛍️ Cart Endpoints (`/api/v1/cart`)

*All cart endpoints require an authenticated session or `x-session-token` header.*

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Fetch all cart items, total quantity, and sum total | ✅ |
| `POST` | `/add` | Add an item to the authenticated user's cart | ✅ |
| `DELETE` | `/:id` | Remove a specific item from cart by ID | ✅ |
| `DELETE` | `/clear` | Empty user's complete shopping cart | ✅ |

<details>
<summary><b>View Cart Payloads & Examples</b></summary>

#### Add Item to Cart
```http
POST /api/v1/cart/add
Content-Type: application/json

{
  "product_name": "Mechanical Keyboard",
  "price": 89.99,
  "quantity": 1
}
```

#### Response:
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cartItemId": 5,
    "product_name": "Mechanical Keyboard",
    "quantity": 1,
    "price": 89.99
  }
}
```

#### Fetch Cart:
```http
GET /api/v1/cart
```

#### Response:
```json
{
  "success": true,
  "message": "All cart fetched!",
  "data": {
    "cartCount": 1,
    "cartTotal": 89.99,
    "items": [
      {
        "id": 5,
        "user_id": 3,
        "product_name": "Mechanical Keyboard",
        "quantity": 1,
        "price": 89.99,
        "created_at": "2026-09-26 14:12:54"
      }
    ]
  }
}
```

</details>

---

## 📁 Project Directory Structure

```text
├── api/
│   └── index.js              # Serverless entrypoint for Vercel functions
├── public/
│   ├── app.js                # Frontend client logic & session management
│   ├── index.html            # User interface & interactive dashboard
│   └── style.css             # UI styling & animations
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js # Auth business logic (register, login, me, logout)
│   │   └── cart.controller.js # Cart business logic (CRUD operations & totals)
│   ├── db/
│   │   ├── index.js          # SQLite connection manager with /tmp fallback
│   │   └── schema.js         # Table definitions & DDL schema creation
│   ├── middleware/
│   │   └── auth.middleware.js # Session verification guard
│   ├── routes/
│   │   ├── auth.route.js     # Auth endpoint definitions
│   │   └── cart.route.js     # Cart endpoint definitions
│   ├── app.js                # Express app setup & global middleware
│   └── index.js              # Standalone Node.js server entrypoint
├── .env.example              # Environment variables template
├── auth_demo.sqlite          # Base SQLite database file
├── package.json              # Dependencies and run scripts
├── vercel.json               # Vercel deployment routes and rewrites configuration
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Ihsaan7/Mini_scrimba_auth-Module-project.git
cd Mini_scrimba_auth-Module-project
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Populate `.env`:
```env
PORT=3000
SESSION_SECRET=super_secret_session_key_change_me
NODE_ENV=development
```

### 4. Run the development server
```bash
npm run dev
```

Visit `http://localhost:3000` to interact with the web UI or use Postman/Curl at `http://localhost:3000/api/v1`.

---

## ☁️ Vercel Deployment

This project includes a dedicated `vercel.json` and `api/index.js` bridge allowing direct deployment to Vercel without manual refactoring.

### Deploy in 3 Steps:

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure production README & serverless setup"
   git push origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com) and import the repository.
   - Leave framework preset as **Other**.
   - Add environment variable `SESSION_SECRET` with your secret key.
3. **Deploy**:
   - Hit **Deploy**. Vercel will build and serve both the static frontend and the Express REST API.

---

## 🛠️ Tech Stack & Tools

- **Runtime**: [Node.js](https://nodejs.org) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com) v5
- **Database**: [SQLite3](https://github.com/TryGhost/node-sqlite3)
- **Authentication**: [express-session](https://github.com/expressjs/session)
- **Encryption**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Serverless Platform**: [Vercel](https://vercel.com)

---

## 👤 Author

Developed by **Ihsaan**  
- GitHub: [@Ihsaan7](https://github.com/Ihsaan7)

---

## 📄 License

This project is licensed under the MIT License — feel free to use it for learning and portfolio purposes.
