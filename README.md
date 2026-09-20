# 🔐 Auth-Cart Demo
### *Session-Based Authentication + Shopping Cart with Node.js & SQLite*

> *"I wanted to understand how session auth ACTUALLY works under the hood — no frameworks hiding the logic. So I built this from scratch."*

---

## 🤔 What is this?

A clean, minimal project that demonstrates:
- **Session-based authentication** using `express-session` (not JWT this time!)
- **bcrypt** password hashing
- **SQLite** as the database
- A simple **shopping cart** that only works when you're logged in

This is a learning project built alongside [Scrimba's Backend Course](https://scrimba.com).

---

## ✨ Features

| Feature | How it works |
|---------|-------------|
| 🔑 **Register** | Hash password with bcrypt, store in SQLite |
| 🚪 **Login** | Create a server-side session, set `connect.sid` cookie |
| 👤 **Profile (`/me`)** | Read session → fetch user from DB |
| 🛒 **Add to Cart** | Only if session exists, insert into `cart_items` |
| 🛍️ **View Cart** | Shows items, total count, and total price |
| 🚪 **Logout** | Destroy session + clear cookie |
| 🔒 **Protected Routes** | Middleware blocks unauthenticated requests |

---

## 🏗️ Project Structure
auth-cart-demo/  
├── .env  
├── src/  
│ ├── app.js # Express config + session setup  
│ ├── index.js # Server entry point  
│ ├── db/  
│ │ ├── index.js # SQLite connection  
│ │ └── schema.js # Table definitions  
│ ├── middlewares/  
│ │ └── auth.middleware.js # Session checker  
│ ├── controllers/  
│ │ ├── auth.controller.js # Register/Login/Logout/Profile  
│ │ └── cart.controller.js # Add to Cart / View Cart  
│ └── routes/  
│ ├── auth.routes.js # Auth endpoints  
│ └── cart.routes.js # Cart endpoints

    text---## 🗄️ Database Schema

┌──────────────────┐ ┌──────────────────┐  
│ users │ │ cart\_items │  
├──────────────────┤ ├──────────────────┤  
│ id (PK) │──┐ │ id (PK) │  
│ username (UNIQUE)│ │ │ user\_id (FK) ────┘  
│ email (UNIQUE) │ │ │ product\_name │  
│ password\_hash │ │ │ quantity │  
│ created\_at │ └────│ price │  
└──────────────────┘ │ created\_at │  
└──────────────────┘  
ON DELETE CASCADE (delete user → wipe cart)

    text---## 🛠️ Tech Stack| Tech | Purpose ||------|---------|| **Node.js** | Runtime || **Express.js** | HTTP framework || **SQLite** | Database (via `sqlite3` driver) || **express-session** | Server-side session management || **bcryptjs** | Password hashing || **dotenv** | Environment variables |---## 🚀 Quick Start### 1. Clone & Install```bashgit clone <your-repo-url>cd auth-cart-demonpm install

### 2. Create `.env`

    envPORT=8000SESSION_SECRET=change_this_to_something_random

### 3. Run

    Bashnode src/index.js

### 4. Test

Open **Postman** or **Thunder Client** and follow the steps below.

* * *

## 🧪 API Endpoints & Testing

### Auth Endpoints

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | `{ username, email, password }` | Create account |
| `POST` | `/api/v1/auth/login` | `{ email, password }` | Login & start session |
| `GET` | `/api/v1/auth/me` | — | Get profile (🔒 protected) |
| `POST` | `/api/v1/auth/logout` | — | End session (🔒 protected) |

### Cart Endpoints

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/cart/add` | `{ product_name, quantity, price }` | Add item (🔒 protected) |
| `GET` | `/api/v1/cart` | — | View cart + totals (🔒 protected) |

### Quick Test Flow

    text1. POST /register → 201 Created2. POST /login → 200 OK (cookie set!)3. POST /cart/add → 201 Created4. GET /cart → 200 OK (cartCount, cartTotal, items)5. POST /logout → 200 OK6. GET /cart → 401 Unauthorized 🔒

* * *

## 🧠 What I Learned

- ✅ How `express-session` stores data server-side vs JWT's stateless approach
- ✅ Why `httpOnly` cookies prevent XSS attacks
- ✅ How `req.session.destroy()` instantly revokes access (no waiting for token expiry!)
- ✅ `ON DELETE CASCADE` keeps database clean when users are deleted
- ✅ bcrypt's cost factor and why 10 rounds is the sweet spot

* * *
