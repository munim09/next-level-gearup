# 🏋️ GearUp API

A robust and scalable RESTful backend API for **GearUp**, a sports and outdoor equipment rental platform. Customers can browse and rent sports gear, providers can manage their inventory and rental orders, and administrators can oversee the entire platform.

---

## 🚀 Live Demo

> _Coming Soon_

---

## 📖 Project Overview

GearUp is an online sports & outdoor gear rental platform where:

- Customers can rent sports and outdoor equipment.
- Providers can list and manage rental gear.
- Admins can manage users, categories, and monitor the platform.

The backend is built using **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**, following a layered architecture for maintainability and scalability.

---

# ✨ Features

## 🔓 Public Features

- Browse all available gear
- View gear details
- Search gear by name
- Filter by:
  - Category
  - Brand
  - Price
  - Availability

---

## 👤 Authentication

- User Registration
- User Login
- JWT Authentication
- Password Hashing (bcrypt)
- Role-based Authorization

### Roles

- Customer
- Provider
- Admin

---

## 🛍 Customer Features

- Browse rental gear
- Place rental orders
- Rent multiple items from a single provider
- Cancel placed orders
- View rental history
- Track rental status
- Submit one review per rented gear after successful return

---

## 🏪 Provider Features

- Create Gear
- Update Gear
- Delete Gear
- Manage Inventory
- View Provider Orders
- Update Rental Status

Supported Status Flow:

```
PLACED
   │
   ├──► CONFIRMED
   │         │
   │         ▼
   │       PAID
   │         │
   │         ▼
   │     PICKED_UP
   │         │
   │         ▼
   │      RETURNED
   │
   └──► CANCELLED
```

---

## 👨‍💼 Admin Features

- Manage Users
- Manage Categories
- View All Orders
- Monitor Platform

---

## 💳 Payments

Supported payment gateways:

- Stripe
- SSLCommerz

Features:

- Secure Payment
- Payment Verification
- Payment History
- Payment Status Tracking

---

## ⭐ Reviews

Customers can review a gear only if:

- Rental status is **RETURNED**
- Customer rented the gear
- Only one review per customer per gear

---

## 📦 Inventory Management

- Automatic stock deduction after order placement
- Automatic stock restoration after cancellation
- Prevent renting unavailable items
- Inventory validation before order confirmation

---

# 🛠 Tech Stack

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- JWT
- bcrypt

## Validation

- Zod

## Payment

- Stripe
- SSLCommerz

## Development Tools

- ESLint
- Prettier
- ts-node-dev

---

# 📁 Project Structure

```
src/
│
├── app/
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── gear/
│   │   ├── category/
│   │   ├── rental/
│   │   ├── payment/
│   │   ├── review/
│   │   └── admin/
│   │
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   ├── config/
│   └── errors/
│
├── prisma/
│
├── server.ts
└── app.ts
```

---

# 🗄 Database

Main entities:

- User
- Category
- Gear
- RentalOrder
- RentalOrderItem
- Payment
- Review

---

# 🔐 Authentication

All protected routes require:

```
Authorization: Bearer <JWT_TOKEN>
```

---

# 📌 API Endpoints


---

## 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh-token` | Refresh access token |
| GET | `/api/auth/me` | Get authenticated user's profile |

---

## 📂 Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/category` | Create category |
| PUT | `/api/admin/category/:id` | Update category |
| DELETE | `/api/admin/category/:id` | Delete category |

---

## 🏋️ Gear

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gear` | Get all gear with filters & pagination |
| GET | `/api/gear/:id` | Get gear details |
| GET | `/api/gear/provider/:providerId` | Get all gear by provider |

### Provider

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/provider/gear` | Add new gear |
| PUT | `/api/provider/gear/:gearId` | Update gear information |
| PATCH | `/api/provider/gear/:gearId` | Update gear stock |
| DELETE | `/api/provider/gear/:gearId` | Remove gear |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/gear` | View all gear |

---

## 📦 Rental Orders

### Customer

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rentals` | Place a rental order |
| GET | `/api/rentals` | Get customer's rental history |
| GET | `/api/rentals/:id` | Get rental order details |
| PATCH | `/api/rentals/cancel/:id` | Cancel a placed rental order |

### Provider

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/provider/orders` | View incoming rental orders |
| PATCH | `/api/provider/orders/:id` | Update rental order status |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/rentals` | View all rental orders |

---

## 💳 Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create/:orderId` | Initiate payment |
| GET | `/api/payments/confirm/success` | Payment success callback |
| GET | `/api/payments/check/:paymentId` | Check payment status |
| GET | `/api/payments/:orderId` | Get payment information for an order |
| GET | `/api/payments` | Get payment history |

---

## ⭐ Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews/:gearId` | Submit a review for a gear |
| GET | `/api/reviews/:gearId` | Get all reviews for a gear |

---

## 👨‍💼 Admin - Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users |
| PATCH | `/api/admin/users/:id` | Update user status |

---

# 🔍 Common Query Parameters

### Gear Listing

| Parameter | Description |
|-----------|-------------|
| `search` | Search by gear name |
| `categoryId` | Filter by category |
| `brand` | Filter by brand |
| `minPrice` | Minimum rental price |
| `maxPrice` | Maximum rental price |
| `page` | Page number |
| `limit` | Number of items per page |

### Rental Orders

| Parameter | Description |
|-----------|-------------|
| `page` | Page number |
| `limit` | Number of items per page |

### Users

| Parameter | Description |
|-----------|-------------|
| `page` | Page number |
| `limit` | Number of items per page |

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/munim09/next-level-gearup
```

Move into the project

```bash
cd next-level-gearup
```

Install dependencies

```bash
npm install
```

---

# ⚙️ Environment Variables

Create a `.env` file

```env
NODE_ENV=development

PORT=5000

DATABASE_URL=DATABASE_URL

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRES_IN=7d

JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

BCRYPT_SALT_ROUNDS=10

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

SSL_STORE_ID=your_store_id
SSL_STORE_PASSWORD=your_store_password
```

---

# ▶️ Running the Project

Generate Prisma Client

```bash
npx prisma generate
```

Run Database Migration

```bash
npx prisma migrate dev
```

Start Development Server

```bash
npm run dev
```

Build

```bash
npm run build
```

Production

```bash
npm start
```

---

# 🧪 Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run lint:fix
npm run format
```

---

# 📖 Business Rules

- One rental order can contain multiple gear items.
- All gear in a rental order must belong to the same provider.
- Rental start date cannot be in the past.
- Rental end date must be on or after the rental start date.
- Stock must be available before placing an order.
- Stock decreases after order placement.
- Stock is restored if the order is cancelled.
- Only customers can place rental orders.
- Only providers can manage their own gear.
- Customers can review only after the rental has been returned.
- Only one review is allowed per customer per gear.

---

# 📈 Future Improvements

- Email Notifications
- Wishlist
- Coupons & Discounts
- Provider Analytics Dashboard
- Image Upload
- Chat Between Customer & Provider
- Advanced Search
- Recommendation System

---


---

⭐ If you like this project, don't forget to give it a **star** on GitHub!