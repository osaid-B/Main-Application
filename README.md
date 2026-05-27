# Business Dashboard

A full-featured business management application built with React, TypeScript, and Vite.

## Features

- **Dashboard** — overview of key business metrics
- **Customers** — manage customer records
- **Products** — product catalog management
- **Purchases** — track purchase orders
- **Suppliers** — supplier directory
- **Invoices** — create and manage invoices
- **Payments** — payment tracking
- **Treasury** — financial overview
- **Employees** — employee management
- **Data Import** — bulk import via file upload
- **Settings** — app preferences and localization (English / Arabic with RTL support)
- **AI Assistant** — built-in AI chat panel for business insights

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for fast dev/build
- [React Router](https://reactrouter.com/) for client-side routing
- [Lucide React](https://lucide.dev/) for icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The app works immediately — no database required. All data comes from `src/data/*Mock.ts` files and is persisted in `localStorage`.

**Mock login credentials:**

| Username | Password | Role |
|----------|----------|------|
| admin | 1234 | Admin |
| manager | 1234 | Manager |
| finance | 1234 | Finance |
| factory | 1234 | Factory |
| cashier | 1234 | Cashier |

## Database Setup (Supabase)

Connect a real PostgreSQL backend by following these steps.

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project. Note the **Project URL** and **anon public key** from Settings → API.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your project URL and anon key. **Never commit `.env.local`.**

### 3. Run the SQL migration

In Supabase → SQL Editor, paste and run:

```
supabase/migrations/001_initial_schema.sql
```

This creates all 23 tables, indexes, `updated_at` triggers, and Row Level Security policies.

### 4. Seed mock data

```
supabase/seed.sql
```

### 5. Create test users

In Supabase → Authentication → Users, create:

| Email | Password | Role |
|-------|----------|------|
| admin@atlas-erp.com | Admin1234! | Admin |
| manager@atlas-erp.com | Manager1234! | Manager |
| finance@atlas-erp.com | Finance1234! | Finance |
| factory@atlas-erp.com | Factory1234! | Factory |
| cashier@atlas-erp.com | Cashier1234! | Cashier |

After creating each user, assign their role:

```sql
INSERT INTO user_roles (user_id, role) VALUES ('<uuid>', 'Admin');
```

### 6. Enable Realtime (optional)

In Supabase → Database → Replication, enable realtime on:
`factory_orders`, `loyalty_transactions`, `pos_sales`

### 7. Start the dev server

With both env vars set the app bootstraps from Supabase on mount. Without them it falls back to mock data — no code changes needed.

## Build

```bash
npm run build
```

Output goes to the `dist/` folder.
