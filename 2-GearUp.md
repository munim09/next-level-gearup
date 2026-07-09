# GearUp 🏋️
**"Rent Sports & Outdoor Gear Instantly"**

---

## Project Overview

GearUp is a backend API for a sports and outdoor equipment rental service. Customers can browse available gear, place rental orders, and return equipment. Providers manage their gear inventory and fulfill rental orders. Admins oversee the platform, manage users, and moderate listings.

---

## Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Customer** | Users who rent sports gear | Browse gear, place rental orders, track status, leave reviews |
| **Provider** | Gear vendors/rental shops | Manage gear inventory, view orders, update order status |
| **Admin** | Platform moderators | Manage all users, oversee all rentals, manage categories |

> 💡 **Note**: Users select their role during registration.

---

## Tech Stack

🛠️ **See [README.md](./README.md#-tech-stack) for complete technology specifications.**

---

## Features

### Public Features
- Browse all available sports & outdoor gear
- Search and filter by category, price, brand, and availability
- View gear details with specifications

### Customer Features
- Register and login as customer
- Place rental orders (select dates + items)
- **Make payments via Stripe or SSLCommerz when placing or confirming an order**
- **View payment history and payment status**
- Track rental order status
- Leave reviews after returning gear
- Manage profile

### Provider Features
- Register and login as provider
- Add, edit, and remove gear from inventory
- Manage stock and availability
- View incoming rental orders
- Update order status (confirm, mark picked up, mark returned)

### Admin Features
- View all users (customers and providers)
- Manage user status (suspend/activate)
- View all gear listings and rental orders
- Manage gear categories

---

## API Endpoints

> ⚠️ **Note**: These endpoints are examples. You may add, edit, or remove endpoints based on your implementation needs.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (customer/provider) |
| POST | `/api/auth/login` | Login user, return JWT |
| GET | `/api/auth/me` | Get current authenticated user |

### Gear (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gear` | Get all gear with filters (category, price, brand) |
| GET | `/api/gear/:id` | Get gear details |
| GET | `/api/categories` | Get all gear categories |

### Rental Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rentals` | Create new rental order |
| GET | `/api/rentals` | Get user's rental orders |
| GET | `/api/rentals/:id` | Get rental order details |

### Payments (Stripe / SSLCommerz)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create` | Create a payment intent/session for a rental order |
| POST | `/api/payments/confirm` | Confirm/verify payment (webhook or callback) |
| GET | `/api/payments` | Get user's payment history |
| GET | `/api/payments/:id` | Get payment details |

### Provider Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/provider/gear` | Add gear to inventory |
| PUT | `/api/provider/gear/:id` | Update gear listing |
| DELETE | `/api/provider/gear/:id` | Remove gear from inventory |
| GET | `/api/provider/orders` | Get provider's incoming orders |
| PATCH | `/api/provider/orders/:id` | Update rental order status |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Create review (after rental return) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users |
| PATCH | `/api/admin/users/:id` | Update user status (suspend/activate) |
| GET | `/api/admin/gear` | Get all gear listings |
| GET | `/api/admin/rentals` | Get all rental orders |

---

## Database Tables

Design your own schema for the following tables:

- **Users** - Store user information, authentication details, and role
- **GearItems** - Sports/outdoor gear listings (linked to provider)
- **Categories** - Gear categories (cycling, camping, fitness, water sports, etc.)
- **RentalOrders** - Rental orders with items, dates, and status
- **Payments** - Payment transactions (transactionId, rentalOrderId, amount, method, provider [Stripe/SSLCommerz], status [pending/completed/failed], paidAt, etc.)
- **Reviews** - Customer reviews for gear items

> 💡 *Think about what fields each table needs based on the features above.*

---

## Flow Diagrams

### 🏋️ Customer Journey

```
                              ┌──────────────┐
                              │   Register   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Browse Gear  │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  View Gear   │
                              │   Details    │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Place Rental │
                              │    Order     │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Make Payment│
                              │(Stripe/SSLC) │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   Pick Up    │
                              │    Gear      │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Return Gear  │
                              │ Leave Review │
                              └──────────────┘
```

### 🏪 Provider Journey

```
                              ┌──────────────┐
                              │   Register   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Add Gear    │
                              │  Inventory   │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Manage Stock │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ View Orders  │
                              └──────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │Update Status │
                              └──────────────┘
```

### 📊 Rental Order Status

```
                              ┌──────────────┐
                              │    PLACED    │
                              └──────────────┘
                               /            \
                              /              \
                       (provider)       (customer)
                        confirms         cancels
                            /                \
                           ▼                  ▼
                    ┌──────────────┐   ┌──────────────┐
                    │  CONFIRMED   │   │  CANCELLED   │
                    └──────────────┘   └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    PAID      │
                    │  (Stripe/    │
                    │  SSLCommerz) │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PICKED_UP   │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  RETURNED    │
                    └──────────────┘
```

---

## Submission

📋 **See [README.md](./README.md) for submission guidelines, timeline, and marks.**
