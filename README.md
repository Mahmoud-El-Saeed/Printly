<div align="center">

# Printly

**Multi-Tenant Print Shop Management SaaS**

[![Python 3.13+](https://img.shields.io/badge/Python-3.13%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F26?style=flat-square&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-8.6-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

<br/>

Printly is a comprehensive, multi-tenant SaaS platform designed to streamline and automate every aspect of print shop operations. From order creation with component-based pricing and material inventory management to customer balance tracking, expense reporting, and a self-service customer portal, Printly provides print shop owners with the tools they need to run their business efficiently. The system supports bilingual interfaces (Arabic/English) with full RTL support, role-based access control, and subscription-based plan management with activation codes.

<br/>

[Overview](#overview) &middot; [Architecture](#architecture) &middot; [System Design](#system-design) &middot; [Features](#features) &middot; [Tech Stack](#tech-stack) &middot; [Project Structure](#project-structure) &middot; [Getting Started](#getting-started) &middot; [Configuration](#configuration) &middot; [API Reference](#api-reference) &middot; [How It Works](#how-it-works)

</div>

---

## Overview

Printly is built around a modular layered architecture that separates concerns across four distinct layers: API routes handle HTTP concerns and input validation, services encapsulate all business logic and cross-domain orchestration, a data access layer (CRUD repositories) abstracts database interactions, and SQLAlchemy models define the persistence schema. This separation ensures that any layer can be modified or replaced independently without cascading changes.

The platform serves two distinct user groups with tailored experiences. Shop owners and their staff interact with a full-featured dashboard that covers order management, customer administration, material inventory tracking, pricing configuration, payment processing, expense logging, and analytics reporting. Customers (typically teachers, professors, or repeat clients) access a self-service portal where they can view their linked shops, track order status, manage their personal book library for reprinting, and monitor their account balance and payment history.

At its core, the system addresses the specific workflow of print shops: customers submit print jobs (books, documents, handouts), shop owners calculate pricing based on page count, paper type, binding options, and extra services like lamination, then track orders through a defined status lifecycle from creation to delivery. Payments are processed with support for cash, bank transfer, mobile wallet, and store balance, with automated balance tracking and batch settlement capabilities.

---

## Architecture

```
                              +-------------------+
                              |     Frontend      |
                              |   React 19 + Vite |
                              |   TailwindCSS 4   |
                              |   TypeScript 5.8  |
                              +--------+----------+
                                       |
                        REST (JSON)    |       i18n (AR / EN)
                        +---------------+---------------+
                        |                               |
               +--------v--------+             +--------v--------+
               |   FastAPI       |             |   React Router  |
               |   Routes        |             |   + React Query |
               |   (Deps/Auth)  |              |   + Axios       |
               +--------+--------+             +-----------------+
                        |
               +--------v--------+
               |   Services      |
               |   Business      |
               |   Logic         |
               +--------+--------+
                        |
               +--------v--------+
               |   CRUD Layer    |
               |   Repositories  |
               +--------+--------+
                        |
               +--------v--------+
               |   SQLAlchemy    |
               |   Async Models  |
               +--------+--------+
                        |
              +---------+---------+
              |                   |
     +--------v--------+  +------v------+
     |   PostgreSQL 18 |  |  Redis 8.6  |
     |   (Alembic)     |  |  (Cache +   |
     |                 |  |   Counters) |
     +-----------------+  +-------------+
```

---

## System Design

### Multi-Tenancy Model

Printly implements a shared-database, shared-schema multi-tenancy pattern where every tenant-scoped entity includes a `tenant_id` foreign key. Data isolation is enforced at three levels simultaneously:

| Layer | Mechanism | Description |
|-------|-----------|-------------|
| **Models** | `TenantMixin` | Every tenant-scoped model inherits this mixin, which adds a `tenant_id` column with a `NOT NULL` foreign key constraint pointing to the `tenants` table. Cascade deletes ensure tenant removal cleans up all associated data. |
| **Data Access** | `BaseCRUD[ModelType]` | The generic CRUD base class filters all queries by `tenant_id` automatically. Every `get`, `list`, `count`, and `exists` operation includes a tenant scope, making cross-tenant data leakage structurally impossible at the repository level. |
| **API Routes** | Dependency Injection | The `require_tenant_staff` dependency decodes the JWT token, extracts the `tenant_id`, and passes it to services. Customers access tenant data through approved membership links, with the system resolving their active tenant from the `customer_tenant_links` table. |

### Database Schema

The database is organized into 17 tables across three categories. Shared tables hold global data used across all tenants (subscription plans, activation codes). Relationship tables model the many-to-many connections between users and tenants (staff memberships, customer links). Tenant-scoped tables hold all operational data and always include `tenant_id`.

**Shared Tables (no tenant_id):**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `tenants` | Print shop registry | name, slug (unique), address, phone, email, logo_url |
| `users` | All user accounts (shop staff and customers) | email (unique), password_hash, full_name, phone, role, is_active |
| `subscription_plans` | Global plan definitions (Free, Basic, Pro) | name, price_monthly, max_users, max_customers, features (JSONB) |
| `activation_codes` | Redeemable codes for subscription upgrades | code (unique), plan_id, duration_days, max_uses, used_count |

**Relationship Tables:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `tenant_members` | Links staff users to their print shops | tenant_id, customer_user_id, display_name, balance, is_approved |
| `customer_tenant_links` | Tracks customer-to-shop link requests | tenant_id, customer_user_id, status (PENDING/APPROVED/REJECTED) |
| `walk_in_customers` | Non-registered customers per shop | tenant_id, name, phone, notes |

**Tenant-Scoped Tables:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `books` | Print job documents | customer_id, title, subject, total_pages, file_url, file_size |
| `orders` | Print job orders | order_number (unique per tenant), status, total_amount, paid_amount |
| `order_items` | Individual line items within orders | book_title, copies, pages_per_copy, printing_price, cover/binding/lamination prices, subtotal |
| `payments` | Payment transactions | amount, payment_method, reference, add_to_balance, split_cash_amount |
| `materials` | Inventory items | name, unit, current_stock, min_stock_alert, cost_per_unit |
| `material_transactions` | Stock movement history | material_id, quantity, transaction_type (RESTOCK/CONSUMPTION/ADJUSTMENT/RETURN) |
| `pricing_rules` | Component-based pricing | component_type, component_name, price, unit_type (per_page/per_unit) |
| `customer_pricing` | Per-customer price overrides | customer_id, pricing_rule_id, custom_price |
| `expenses` | Business expenses | category (RENT/SALARIES/MAINTENANCE/UTILITIES/SUPPLIES/OTHER), amount |
| `notifications` | In-app notifications | user_id, title, message, notification_type, is_read |
| `tenant_subscriptions` | Active subscriptions per shop | plan_id, starts_at, expires_at, is_active |
| `refresh_tokens` | Stored refresh tokens for rotation | user_id, token (unique), expires_at, is_revoked |

### Entity Relationships

```
tenants (central hub)
  |
  +-- 1:N -- tenant_members ----------- N:1 users (role = SHOP_OWNER/STAFF)
  |           (shop staff with balance tracking)
  |
  +-- 1:N -- customer_tenant_links ---- N:1 users (role = CUSTOMER)
  |           (approval workflow: PENDING -> APPROVED/REJECTED)
  |
  +-- 1:N -- walk_in_customers
  |           (non-registered customers, shop-scoped)
  |
  +-- 1:N -- books
  |           +-- ? -- customer_id ------- users (nullable)
  |           +-- ? -- created_by -------- users
  |
  +-- 1:N -- orders
  |           +-- ? -- customer_id ------- users (nullable)
  |           +-- ? -- walk_in_customer_id  walk_in_customers (nullable)
  |           +-- 1:N -- order_items
  |           +-- 1:N -- payments
  |
  +-- 1:N -- materials
  |           +-- 1:N -- material_transactions
  |
  +-- 1:N -- pricing_rules
  |           +-- 1:N -- customer_pricings -- N:1 users
  |
  +-- 1:N -- expenses
  +-- 1:N -- notifications ------------ N:1 users (nullable)
  +-- 1:N -- tenant_subscriptions ----- N:1 subscription_plans

subscription_plans -- 1:N -- activation_codes
users -- 1:N -- refresh_tokens
```

### Authentication Flow

The system uses JWT-based authentication with access/refresh token rotation. Two registration paths exist depending on user type:

**Shop Owner Registration:**
```
POST /auth/register/shop-owner
  --> Creates User (role=SHOP_OWNER) + Tenant + TenantMember (approved) + Free Plan Subscription
  --> Returns access_token + refresh_token
```

**Customer Registration:**
```
POST /auth/register/customer
  --> Creates User (role=CUSTOMER)
  --> Returns access_token + refresh_token
```

**Login and Token Rotation:**
```
POST /auth/login
  --> Validates credentials (email + password via Argon2)
  --> Creates access_token (30 min) + refresh_token (7 days, stored in DB)
  --> Returns both tokens

POST /auth/refresh
  --> Validates stored refresh_token (checks expiry + revocation)
  --> Rotates: invalidates old refresh_token, creates new pair
  --> Returns new access_token + refresh_token
```

### Order Status Lifecycle

Orders progress through a strictly validated state machine. The system enforces allowed transitions to prevent invalid state changes:

```
NEW --> PRINTING --> READY --> DELIVERED
  |                        |
  +----------> CANCELLED <--+
```

| From | Allowed Transitions |
|------|-------------------|
| `NEW` | PRINTING, CANCELLED |
| `PRINTING` | READY, CANCELLED |
| `READY` | DELIVERED |
| `DELIVERED` | (terminal state) |
| `CANCELLED` | (terminal state) |

---

## Features

### Order Management
- **Unique order numbers**: Auto-generated per tenant using Redis atomic counters (format: sequential increment)
- **Component-based pricing**: Orders are priced by combining page printing cost, cover type, binding type, lamination, and extra services, all with configurable per-page or per-unit pricing
- **Price snapshots**: Once an order is created, all pricing data is frozen into the order items, ensuring historical accuracy regardless of future price changes
- **Status lifecycle**: Validated state transitions from NEW through PRINTING, READY, and DELIVERED, with CANCELLED available from early states
- **Multiple sources**: Orders can originate from the web dashboard, WhatsApp, or walk-in customers
- **Customer types**: Supports both registered customers (with full portal access) and walk-in customers (simple name/phone records)

### Pricing System
- **Component-based rules**: Pricing is broken into five component types (PAGE_PRINT, COVER, BINDING, LAMINATION, EXTRA_SERVICE), each with its own price and unit type (per_page or per_unit)
- **Customer-specific overrides**: Individual customers can be assigned custom pricing that overrides the default rules, enabling negotiated rates for high-volume clients
- **Flexible unit types**: Each pricing component supports both per-page pricing (for page-based services) and per-unit pricing (for item-based services like binding or lamination)

### Payment Processing
- **Multiple payment methods**: Cash, bank transfer, mobile wallet, store balance, and other
- **Balance payments**: Customers can pay using their stored balance, with automatic tracking of running balances
- **Split payments**: When a customer's balance is insufficient, the system supports split payments using a combination of cash and balance
- **Excess handling**: Overpayments are automatically added to the customer's store balance for future use
- **Batch settlement**: Staff can settle all unpaid orders for a customer in a single operation, applying payments chronologically
- **Balance tracking**: Customer balance is computed as total unpaid order amounts minus total payments, with the ability to carry positive balances forward

### Material and Inventory Management
- **Stock tracking**: Real-time inventory levels with configurable low-stock alert thresholds
- **Transaction logging**: All stock movements are recorded with type classification (RESTOCK, CONSUMPTION, ADJUSTMENT, RETURN) and optional order association
- **Automatic updates**: Stock levels adjust automatically when transactions are created (restocks add, consumption subtracts, adjustments set)
- **Soft-delete protection**: Materials with existing transactions cannot be hard-deleted to maintain audit trail integrity

### Customer Management
- **Walk-in customers**: Quick creation of non-registered customers with just name and phone number
- **Customer members**: Registered users linked to a print shop through an approval workflow
- **Link requests**: Customers can request to join a print shop, staff can approve or reject, with automatic TenantMember creation on approval
- **Balance inquiries**: Real-time balance calculation for any customer, accounting for all orders and payments

### Book and Document Management
- **File upload**: Support for uploading book files (PDF) with type and size validation
- **Organized storage**: Files are organized by tenant ID folders with sanitized filenames
- **Reusable library**: Customers can save books for future reprinting without re-uploading
- **Subscription limits**: Book storage is constrained by the tenant's subscription plan limits

### Dashboard and Analytics
- **Revenue statistics**: Total revenue with period comparison (current vs previous period) and percentage change calculations
- **Expense tracking**: Total expenses broken down by category with category-level aggregation
- **Profit analysis**: Gross and net profit calculations with margin percentages, factoring in all expenses
- **Order analytics**: Order counts by status with status distribution breakdown
- **Top materials**: Most consumed materials by usage volume
- **Top customers**: Highest-spending customers by total payment amount

### Customer Portal
- **Self-service access**: Customers can view their profile, linked shops, and account balance without staff intervention
- **Order tracking**: Full visibility into order history with status filtering
- **Book management**: Upload, view, and delete personal books for quick reprinting
- **Notifications**: In-app notification system with read/unread tracking and batch mark-as-read

### Subscription and Activation
- **Tiered plans**: Three subscription tiers (Free, Basic, Pro) with different limits on users, customers, and book storage
- **Activation codes**: Admin-generated codes that customers can redeem for plan upgrades or extensions, with configurable duration and usage limits
- **Automatic provisioning**: New shop registrations automatically receive a 15-day free trial

### Notification System
- **In-app notifications**: Typed notifications (ORDER, PAYMENT, SYSTEM, ALERT) with read/unread tracking
- **User-targeted**: Notifications are scoped to individual users with tenant isolation
- **Batch operations**: Support for marking single notifications or all notifications as read in one request

### Internationalization
- **Bilingual interface**: Full Arabic and English translations for all UI labels, form validations, and status descriptions
- **RTL support**: Automatic right-to-left layout switching based on language selection
- **Persistent preference**: Language choice is stored in localStorage and auto-detected from browser settings

---

## Tech Stack

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Python 3.13+ | Core runtime environment |
| **Framework** | FastAPI 0.136+ | Async web framework with auto-generated API docs |
| **ORM** | SQLAlchemy 2.0 | Async ORM with mapped columns and relationship management |
| **Validation** | Pydantic v2 | Request/response schema validation with Rust-based core |
| **Database** | PostgreSQL 18 | Primary data store with JSONB support |
| **Caching** | Redis 8.6 | In-memory caching and atomic counters for order numbers |
| **Migrations** | Alembic | Database schema versioning and migration management |
| **Authentication** | PyJWT | JWT access and refresh token creation and verification |
| **Password Hashing** | Argon2 (pwdlib) | Secure password hashing with memory-hard algorithm |
| **HTTP Client** | httpx | Async HTTP client for external API integrations |
| **Background Tasks** | Celery | Distributed task queue for async processing |
| **File Handling** | aiofiles | Async file I/O for book document uploads and downloads |
| **Testing** | pytest + pytest-asyncio + factory-boy | Test framework with async support and fixture factories |

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 19 | Component-based UI with concurrent rendering |
| **Build Tool** | Vite 6 | Fast HMR and optimized production builds |
| **Language** | TypeScript 5.8 | Static type checking with strict mode |
| **Styling** | TailwindCSS 4 | Utility-first CSS with JIT compilation and dark mode |
| **Routing** | React Router 7 | Client-side routing with nested layouts |
| **Data Fetching** | TanStack React Query 5 | Server state management with caching and background refetching |
| **HTTP Client** | Axios | HTTP client with JWT interceptors and token refresh queue |
| **Forms** | React Hook Form + Zod | Performant form handling with schema validation |
| **Charts** | Recharts 3 | Declarative charting library for dashboard visualizations |
| **Icons** | Lucide React | Consistent icon set with tree-shaking support |
| **Toasts** | Sonner | Accessible toast notification system |
| **Date Formatting** | date-fns | Modern date utility with Arabic locale support |
| **UI Components** | shadcn/ui | Accessible, composable component primitives (Button, Card, Input, Badge, etc.) |
| **Linting** | Biome | Fast linter and formatter (100x faster than ESLint) |

### Infrastructure

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Containerization** | Docker + Docker Compose | PostgreSQL 18 and Redis 8.6 service orchestration |
| **Database** | PostgreSQL 18 (container) | Persistent data storage with volume mounts |
| **Cache** | Redis 8.6 (container) | In-memory data store with AOF persistence |

---

## Project Structure

```
Printly/
|
|-- docker-compose.yml                      # PostgreSQL 18 + Redis 8.6 infrastructure
|-- README.md
|
|-- Printly-backend/
|   |-- main.py                              # FastAPI application entry point with lifespan
|   |-- pyproject.toml                       # Python dependencies (uv package manager)
|   |-- alembic.ini                          # Alembic migration configuration
|   |-- uv.lock                              # Dependency lock file
|   |
|   |-- alembic/                             # Database migrations
|   |   |-- versions/                        # 20+ migration scripts
|   |   |-- env.py                           # Alembic environment configuration
|   |
|   |-- app/
|   |   |-- enums/                           # Application enumerations
|   |   |   |-- user_role.py                 # ADMIN, SHOP_OWNER, STAFF, CUSTOMER
|   |   |   |-- order_status.py              # NEW, PRINTING, READY, DELIVERED, CANCELLED
|   |   |   |-- link_status.py               # PENDING, APPROVED, REJECTED
|   |   |   |-- payment_method.py            # CASH, BANK_TRANSFER, MOBILE_WALLET, BALANCE, OTHER
|   |   |   |-- notification_type.py          # ORDER, PAYMENT, SYSTEM, ALERT
|   |   |   |-- expense_category.py          # RENT, SALARIES, MAINTENANCE, UTILITIES, SUPPLIES, OTHER
|   |   |   |-- material_transaction_type.py # RESTOCK, CONSUMPTION, ADJUSTMENT, RETURN
|   |   |   |-- pricing_component_type.py    # PAGE_PRINT, COVER, BINDING, LAMINATION, EXTRA_SERVICE
|   |   |   |-- pricing_unit_type.py          # PER_PAGE, PER_UNIT
|   |   |
|   |   |-- models/                          # SQLAlchemy ORM models (20 models)
|   |   |   |-- base.py                      # Base, TenantMixin, TimestampMixin
|   |   |   |-- users.py                     # User accounts
|   |   |   |-- tenants.py                   # Print shop entities
|   |   |   |-- tenant_members.py            # Staff-shop membership with balance
|   |   |   |-- customer_tenant_links.py     # Customer-shop link requests
|   |   |   |-- walk_in_customers.py         # Non-registered customers
|   |   |   |-- books.py                     # Print job documents
|   |   |   |-- orders.py                    # Order headers
|   |   |   |-- order_items.py               # Order line items with price snapshot
|   |   |   |-- payments.py                  # Payment transactions
|   |   |   |-- materials.py                 # Inventory items
|   |   |   |-- material_transactions.py     # Stock movement records
|   |   |   |-- pricing_rules.py             # Component-based pricing
|   |   |   |-- customer_pricing.py          # Per-customer price overrides
|   |   |   |-- subscription_plans.py        # Global plan definitions
|   |   |   |-- tenant_subscriptions.py      # Active shop subscriptions
|   |   |   |-- activation_codes.py          # Redeemable subscription codes
|   |   |   |-- notifications.py             # In-app notifications
|   |   |   |-- expenses.py                  # Business expenses
|   |   |   |-- refresh_tokens.py            # Stored refresh tokens
|   |   |
|   |   |-- schemas/                         # Pydantic request/response schemas (13 modules)
|   |   |   |-- auth.py                      # Token, login, register schemas
|   |   |   |-- book.py                      # Book CRUD + file upload schemas
|   |   |   |-- customer.py                  # Walk-in, member, link schemas
|   |   |   |-- customer_portal.py           # Portal profile/tenant schemas
|   |   |   |-- dashboard.py                 # Analytics aggregation schemas
|   |   |   |-- expense.py                   # Expense CRUD + filter schemas
|   |   |   |-- material.py                  # Material + transaction schemas
|   |   |   |-- notification.py              # Notification list + read schemas
|   |   |   |-- order.py                     # Order + item + status schemas
|   |   |   |-- payment.py                   # Payment + settlement + balance schemas
|   |   |   |-- pricing.py                   # Pricing rule + customer pricing schemas
|   |   |   |-- activation_code.py            # Code create + redeem schemas
|   |   |
|   |   |-- db/                              # Data access layer (CRUD repositories)
|   |   |   |-- base_crud.py                 # Generic async CRUD base class
|   |   |   |-- book_crud.py                 # Book search + stored count
|   |   |   |-- customer_tenant_link_crud.py # Link query helpers
|   |   |   |-- dashboard_db.py              # Raw SQL aggregation queries
|   |   |   |-- expense_crud.py              # Expense date/category filters
|   |   |   |-- material_crud.py             # Material + transaction CRUD
|   |   |   |-- notification_crud.py          # Unread count + batch read
|   |   |   |-- order_crud.py                # Eager-loaded orders + unpaid query
|   |   |   |-- payment_crud.py              # Payment CRUD + batch create
|   |   |   |-- pricing_crud.py              # Pricing rule search
|   |   |   |-- subscription_crud.py         # Active subscription lookup
|   |   |   |-- tenant_crud.py               # Tenant by slug
|   |   |   |-- tenant_member_crud.py        # Member search + approval
|   |   |   |-- user_crud.py                 # User by email
|   |   |   |-- walk_in_customer_crud.py      # Walk-in CRUD
|   |   |   |-- activation_code_crud.py       # Code lookup + atomic increment
|   |   |   |-- refresh_crud.py              # Refresh token CRUD
|   |   |   |-- seed.py                      # Default subscription plans data
|   |   |   |-- seed_runner.py               # CLI seed script (plans + admin)
|   |   |
|   |   |-- services/                        # Business logic layer (13 modules)
|   |   |   |-- auth.py                      # Registration, login, token rotation
|   |   |   |-- book.py                      # Book CRUD + file management
|   |   |   |-- customer.py                  # Walk-in, member, link workflow
|   |   |   |-- customer_portal.py           # Customer self-service operations
|   |   |   |-- dashboard.py                 # Revenue, expense, profit analytics
|   |   |   |-- expense.py                   # Expense CRUD
|   |   |   |-- material.py                  # Material + stock transaction logic
|   |   |   |-- notification.py              # Notification CRUD + batch read
|   |   |   |-- order.py                     # Order creation + status transitions
|   |   |   |-- payment.py                   # Payment processing + settlement
|   |   |   |-- pricing.py                   # Pricing rule + customer override CRUD
|   |   |   |-- activation_code.py            # Code generation + redemption logic
|   |   |
|   |   |-- routes/                          # API route handlers
|   |   |   |-- deps.py                      # Auth dependencies, role guards, DB/Redis sessions
|   |   |   |-- db.py                        # SQLAlchemy engine + async session factory
|   |   |   |-- redis_client.py              # Redis connection pool + client
|   |   |   |-- auth.py                      # Register + login + refresh (5 endpoints)
|   |   |   |-- book.py                      # Book CRUD + file ops (8 endpoints)
|   |   |   |-- customer.py                  # Walk-in + member + link (12 endpoints)
|   |   |   |-- customer_portal.py           # Customer self-service (10 endpoints)
|   |   |   |-- dashboard.py                 # Analytics (7 endpoints)
|   |   |   |-- expense.py                   # Expense CRUD (5 endpoints)
|   |   |   |-- material.py                  # Material + transaction CRUD (9 endpoints)
|   |   |   |-- notification.py              # List + read ops (3 endpoints)
|   |   |   |-- order.py                     # Order CRUD + status (6 endpoints)
|   |   |   |-- payment.py                   # Payment CRUD + settlement (7 endpoints)
|   |   |   |-- pricing.py                   # Rules + customer pricing (11 endpoints)
|   |   |   |-- activation_code.py            # Code admin + redeem (3 endpoints)
|   |   |
|   |   |-- core/                            # Core infrastructure
|   |   |   |-- config.py                    # Settings via pydantic-settings
|   |   |   |-- security.py                  # JWT creation + Argon2 hashing
|   |   |   |-- file_controller.py           # File upload/download/validation
|   |   |
|   |-- tests/                               # Test suite (10 test files, 65+ tests)
|       |-- conftest.py                       # Fixtures: DB, factories, async client
|       |-- test_auth.py                     # Registration, login, token rotation
|       |-- test_orders.py                   # Order CRUD, status flow, validation
|       |-- test_payments.py                  # Payment CRUD, settlement
|       |-- test_customers.py                 # Walk-in customer CRUD
|       |-- test_materials.py                 # Material CRUD + transactions
|       |-- test_expenses.py                  # Expense CRUD + category filtering
|       |-- test_dashboard.py                 # All analytics endpoints
|       |-- test_notifications.py            # List, read, batch read
|       |-- test_activation_codes.py           # Create, list, redeem
|       |-- test_customer_portal.py           # 20+ portal isolation tests
|
|-- Printly-frontend/
|   |-- package.json                         # Node.js dependencies
|   |-- vite.config.ts                        # Vite config with API proxy + path aliases
|   |-- tsconfig.json                         # TypeScript strict mode config
|   |-- biome.json                            # Biome linter/formatter config
|   |-- index.html                            # SPA entry (Arabic RTL default)
|   |
|   |-- src/
|       |-- main.tsx                          # React entry point
|       |-- App.tsx                           # Root component with providers + routes
|       |-- index.css                         # Tailwind v4 + CSS custom properties design system
|       |
|       |-- contexts/                          # React contexts
|       |   |-- AuthContext.tsx                # JWT auth state, login/logout, role guards
|       |   |-- LanguageContext.tsx             # i18n state, RTL/LTR, translation function
|       |
|       |-- components/
|       |   |-- layout/                       # Page layout components
|       |   |   |-- DashboardLayout.tsx        # Protected dashboard shell (sidebar + topbar)
|       |   |   |-- TopBar.tsx                 # Header with role, language, notifications
|       |   |   |-- Sidebar.tsx                # Collapsible navigation with nested menus
|       |   |   |-- PortalLayout.tsx           # Customer portal protected layout
|       |   |
|       |   |-- shared/                       # Shared UI components
|       |   |   |-- LanguageSwitcher.tsx        # AR/EN toggle
|       |   |   |-- StatusBadge.tsx            # Colored status pill badges
|       |   |
|       |   |-- ui/                           # shadcn/ui primitives
|       |       |-- button.tsx                  # Button with 6 variants + 4 sizes
|       |       |-- card.tsx                    # Card container components
|       |       |-- input.tsx                   # Styled form input
|       |       |-- label.tsx                   # Accessible form label
|       |       |-- badge.tsx                   # Tag/badge with 4 variants
|       |       |-- separator.tsx              # Horizontal/vertical divider
|       |
|       |-- pages/
|       |   |-- auth/                          # Authentication pages
|       |   |   |-- LoginPage.tsx               # Email/password login
|       |   |   |-- RegisterShopOwnerPage.tsx  # Shop owner registration
|       |   |   |-- RegisterCustomerPage.tsx   # Customer registration
|       |   |
|       |   |-- dashboard/                     # Dashboard pages
|       |   |   |-- DashboardPage.tsx           # KPI cards + chart placeholders
|       |   |   |-- PlaceholderPage.tsx         # Stub pages for unimplemented routes
|       |   |
|       |   |-- portal/                        # Customer portal pages
|       |       |-- PortalHomePage.tsx          # Linked shops listing
|       |
|       |-- lib/
|       |   |-- constants.ts                    # App constants + Arabic enum labels
|       |   |-- utils/
|       |   |   |-- cn.ts                      # clsx + tailwind-merge utility
|       |   |   |-- formatDate.ts              # date-fns formatting with Arabic locale
|       |   |   |-- formatCurrency.ts          # EGP currency + number formatting
|       |   |
|       |   |-- i18n/
|       |   |   |-- index.ts                  # Translation system + dot-notation lookup
|       |   |   |-- en.ts                     # English translations (~225 lines)
|       |   |   |-- ar.ts                     # Arabic translations (~225 lines)
|       |   |
|       |   |-- api/                           # API client modules
|       |       |-- client.ts                  # Axios instance with JWT interceptors
|       |       |-- auth.ts                    # Auth API calls
|       |       |-- books.ts                   # Book CRUD + file operations
|       |       |-- customers.ts               # Walk-in, member, link API
|       |       |-- dashboard.ts               # Analytics API
|       |       |-- expenses.ts               # Expense API
|       |       |-- materials.ts               # Material + transaction API
|       |       |-- notifications.ts            # Notification API
|       |       |-- orders.ts                  # Order API
|       |       |-- payments.ts                # Payment + settlement API
|       |       |-- pricing.ts                 # Pricing rule API
|       |       |-- portal.ts                  # Customer portal API
|       |
|       |-- types/                              # TypeScript type definitions (13 modules)
|           |-- auth.ts, book.ts, common.ts, customer.ts, dashboard.ts
|           |-- expense.ts, material.ts, notification.ts, order.ts
|           |-- payment.ts, pricing.ts, portal.ts
```

---

## Getting Started

### Prerequisites

- Python 3.13 or later
- Node.js 18 or later
- Docker and Docker Compose for infrastructure services
- [uv](https://github.com/astral-sh/uv) (recommended Python package manager)

### Infrastructure Setup

Start PostgreSQL and Redis using Docker Compose:

```bash
# From the project root
docker compose up -d
```

This launches two services:
- **PostgreSQL 18** on port `5432` with persistent volume storage
- **Redis 8.6** on port `6379` with AOF persistence and password authentication

### Backend Setup

```bash
cd Printly-backend

# Install dependencies
uv sync

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database URI, Redis URI, JWT secret, etc.

# Run database migrations
alembic upgrade head

# (Optional) Seed default subscription plans and admin user
uv run python -m app.db.seed_runner

# Start the development server
uv run fastapi dev main.py
```

The backend API will be available at `http://localhost:8000` with auto-generated Swagger documentation at `/docs`.

### Frontend Setup

```bash
cd Printly-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend application will be available at `http://localhost:5173` with the Vite dev server proxying `/uploads` requests to the backend.

### Running Tests

```bash
cd Printly-backend

# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run a specific test file
uv run pytest tests/test_orders.py
```

---

## Configuration

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URI` | PostgreSQL async connection string | `postgresql+asyncpg://user:pass@localhost:5432/printly` |
| `REDIS_URI` | Redis connection string | `redis://:password@localhost:6379/0` |
| `JWT_SECRET_KEY` | Secret key for JWT token signing | `your-secret-key` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `UPLOAD_FOLDER_NAME` | Directory for uploaded book files | `uploads` |
| `ALLOWED_FILE_TYPES` | Accepted MIME types for uploads | `["application/pdf"]` |
| `ALLOWED_FILE_EXTENSIONS` | Accepted file extensions | `[".pdf"]` |
| `MAX_FILE_SIZE` | Maximum upload file size in bytes | `10485760` |
| `ADMIN_GMAIL` | Admin user email for seed script | `admin@printly.com` |
| `ADMIN_PASSWORD` | Admin user password for seed script | `secure-password` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register/shop-owner` | Public | Register a new shop owner (creates user + tenant + free plan) |
| `POST` | `/auth/register/customer` | Public | Register a new customer account |
| `POST` | `/auth/login` | Public | Authenticate with email/password, receive JWT tokens |
| `POST` | `/auth/refresh` | Public | Rotate refresh token, receive new token pair |
| `GET` | `/auth/protected` | Any | Test endpoint to verify authentication |

### Books

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/books` | Staff | Create a new book record |
| `GET` | `/books` | Staff | List books with pagination and filters |
| `GET` | `/books/{id}` | Staff | Get book details by ID |
| `PUT` | `/books/{id}` | Staff | Update book metadata |
| `DELETE` | `/books/{id}` | Staff | Delete a book and its file |
| `POST` | `/books/{id}/file` | Staff | Upload a file to a book |
| `GET` | `/books/{id}/file` | Staff | Download a book file |
| `DELETE` | `/books/{id}/file` | Staff | Delete a book file |

### Customers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/customers/walk-in` | Staff | Create a walk-in customer |
| `GET` | `/customers/walk-in` | Staff | List walk-in customers |
| `GET` | `/customers/walk-in/{id}` | Staff | Get walk-in customer details |
| `PUT` | `/customers/walk-in/{id}` | Staff | Update walk-in customer |
| `DELETE` | `/customers/walk-in/{id}` | Staff | Delete walk-in customer |
| `POST` | `/customers/members` | Staff | Create a customer member |
| `GET` | `/customers/members` | Staff | List customer members |
| `GET` | `/customers/members/{id}` | Staff | Get member details |
| `PUT` | `/customers/members/{id}` | Staff | Update member |
| `DELETE` | `/customers/members/{id}` | Staff | Remove member |
| `POST` | `/customers/link` | Staff | Send link request to customer |
| `PATCH` | `/customers/link/{id}` | Staff | Approve or reject link request |
| `GET` | `/customers/{id}/balance` | Staff | Get customer current balance |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/orders` | Staff | Create a new order with items |
| `GET` | `/orders` | Staff | List orders with status/date filters |
| `GET` | `/orders/{id}` | Staff | Get order with line items |
| `PUT` | `/orders/{id}` | Staff | Update order metadata |
| `PATCH` | `/orders/{id}/status` | Staff | Change order status (validated transitions) |
| `DELETE` | `/orders/{id}` | Staff | Delete an order |

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/payments` | Staff | Record a payment (cash/transfer/wallet/balance) |
| `GET` | `/payments` | Staff | List payments with filters |
| `GET` | `/payments/{id}` | Staff | Get payment details |
| `PUT` | `/payments/{id}` | Staff | Update payment |
| `DELETE` | `/payments/{id}` | Staff | Delete payment (reverses balance) |
| `POST` | `/payments/settle` | Staff | Batch settle unpaid orders for a customer |
| `GET` | `/payments/balance/{customer_id}` | Staff | Get customer balance breakdown |

### Materials

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/materials` | Staff | Add a new material to inventory |
| `GET` | `/materials` | Staff | List materials |
| `GET` | `/materials/{id}` | Staff | Get material with stock level |
| `PUT` | `/materials/{id}` | Staff | Update material details |
| `DELETE` | `/materials/{id}` | Staff | Remove material (soft-delete if used) |
| `POST` | `/materials/{id}/transactions` | Staff | Record a stock transaction |
| `GET` | `/materials/{id}/transactions` | Staff | List transactions for a material |
| `GET` | `/materials/transactions/{id}` | Staff | Get transaction details |

### Pricing

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/pricing/rules` | Staff | Create a pricing rule |
| `GET` | `/pricing/rules` | Staff | List pricing rules |
| `GET` | `/pricing/rules/{id}` | Staff | Get pricing rule |
| `PUT` | `/pricing/rules/{id}` | Staff | Update pricing rule |
| `DELETE` | `/pricing/rules/{id}` | Staff | Delete pricing rule |
| `POST` | `/pricing/rules/{id}/customer` | Staff | Add customer-specific pricing |
| `GET` | `/pricing/rules/{id}/customer` | Staff | List customer pricings for a rule |
| `GET` | `/pricing/customer/{id}` | Staff | Get customer pricing details |
| `PUT` | `/pricing/customer/{id}` | Staff | Update customer pricing |
| `DELETE` | `/pricing/customer/{id}` | Staff | Delete customer pricing |
| `GET` | `/pricing/customer` | Staff | List all customer pricings |

### Expenses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/expenses` | Staff | Record a new expense |
| `GET` | `/expenses` | Staff | List expenses with category/date filters |
| `GET` | `/expenses/{id}` | Staff | Get expense details |
| `PUT` | `/expenses/{id}` | Staff | Update expense |
| `DELETE` | `/expenses/{id}` | Staff | Delete expense |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard/overview` | Staff | Complete dashboard overview (all stats) |
| `GET` | `/dashboard/revenue` | Staff | Revenue statistics with period comparison |
| `GET` | `/dashboard/expenses` | Staff | Expense statistics by category |
| `GET` | `/dashboard/profit` | Staff | Profit analysis with margins |
| `GET` | `/dashboard/orders` | Staff | Order counts by status |
| `GET` | `/dashboard/top-materials` | Staff | Most consumed materials |
| `GET` | `/dashboard/top-customers` | Staff | Highest-spending customers |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications` | Staff | List notifications with unread count |
| `PATCH` | `/notifications/{id}` | Staff | Mark a notification as read |
| `PATCH` | `/notifications` | Staff | Mark all notifications as read |

### Activation Codes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/activation-codes` | Admin | Create a new activation code |
| `GET` | `/activation-codes` | Admin | List all activation codes |
| `POST` | `/activation-codes/apply` | Staff | Redeem an activation code for the tenant |

### Customer Portal

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/portal/profile` | Customer | Get current customer profile |
| `GET` | `/portal/tenants` | Customer | List linked (approved) shops |
| `GET` | `/portal/orders` | Customer | List customer orders |
| `GET` | `/portal/orders/{id}` | Customer | Get specific order details |
| `GET` | `/portal/books` | Customer | List customer books |
| `GET` | `/portal/balance` | Customer | Get current balance |
| `GET` | `/portal/notifications` | Customer | List customer notifications |
| `PATCH` | `/portal/notifications/{id}` | Customer | Mark notification as read |
| `PATCH` | `/portal/notifications` | Customer | Mark all notifications as read |

---

## How It Works

**1. Shop Registration and Setup**

A shop owner registers through the frontend by providing their personal details (name, email, password) along with shop information (name, phone, address). The backend creates a User account with the SHOP_OWNER role, a Tenant record, an approved TenantMember linking them to the shop, and a 15-day free subscription plan. The owner receives JWT tokens immediately and can begin configuring their shop.

**2. Staff and Customer Onboarding**

Shop owners can add staff members (employees) to their shop, each with their own login credentials and access to the dashboard. Customers interact with the system in two ways: they can register through the customer portal to create an account, or shop staff can quickly add walk-in customers with just a name and phone number. Registered customers can request to link to a shop, and staff can approve or reject these requests through the dashboard.

**3. Pricing Configuration**

Before accepting orders, shop owners configure their pricing through a component-based system. Each service type (page printing, cover, binding, lamination, extra services) gets its own pricing rule with a price and unit type. For high-volume customers, staff can set custom pricing overrides that take precedence over the default rules during order calculation.

**4. Order Creation and Pricing**

When a customer submits a print job, the order is created with one or more line items. Each item specifies the book, number of copies, pages per copy, paper type, print sides, and optional add-ons (cover type, binding type, lamination). The pricing service looks up the applicable pricing rules (or customer-specific overrides), calculates the per-item cost, and stores a complete price snapshot in the order. The order number is generated atomically using a Redis counter to prevent duplicates.

**5. Order Fulfillment**

Orders move through a defined lifecycle: NEW (received), PRINTING (in production), READY (completed), and DELIVERED (handed to customer). Staff update the status through the dashboard, and the system validates each transition to prevent invalid changes (for example, a DELIVERED order cannot be moved back to PRINTING). Orders can be cancelled from the NEW or PRINTING states.

**6. Payment and Balance Management**

When a customer picks up their order, staff records a payment. The system supports multiple payment methods and can split a single payment between cash and the customer's stored balance. If a customer overpays, the excess is automatically added to their balance for future use. The balance calculation is straightforward: total order amounts minus total payments. Staff can also use the batch settlement feature to pay off all outstanding orders for a customer in a single operation.

**7. Inventory Tracking**

Every time materials are purchased, consumed for an order, adjusted, or returned, a transaction is recorded and the current stock level is updated automatically. The system can alert staff when stock falls below a configurable minimum threshold, helping prevent material shortages that could delay order fulfillment.

**8. Analytics and Reporting**

The dashboard aggregates data from across the system using raw SQL queries for optimal performance. Revenue stats compare current and previous periods with percentage change calculations. Profit analysis factors in all categorized expenses. Top material and customer reports help shop owners make informed purchasing and relationship decisions.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Mahmoud El Saeed Mohammed
