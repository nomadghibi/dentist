# Dentist Finder Platform

A production-quality Next.js 14 (App Router) TypeScript application for finding dentists in Florida cities (Palm Bay, Melbourne, Space Coast) with SEO optimization, Stripe subscriptions, and lead generation.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **TailwindCSS**
- **PostgreSQL** with **Drizzle ORM**
- **Stripe** (subscriptions)
- **Resend** (transactional email)
- **Zod** (validation)
- **Vitest** (unit tests)

## Features

- SEO-optimized city hub pages and service pages
- Stripe subscription management for featured listings
- NPPES API integration for dentist data ingestion
- Profile claiming workflow with email verification
- Admin console for license verification
- Lead generation forms with rate limiting
- JSON-LD structured data for SEO
- Sitemap generation (index + per-city)

## Prerequisites

- Node.js 18+ and pnpm (or npm)
- Docker and Docker Compose (for local PostgreSQL)
- Stripe account with API keys
- Resend account with API key

## Setup Instructions

### 1. Clone and Install Dependencies

```powershell
pnpm install
```

### 2. Start PostgreSQL with Docker

```powershell
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` with:
- User: `postgres`
- Password: `postgres`
- Database: `dentist_finder`

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```powershell
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret (for production)
- `RESEND_API_KEY` - Resend API key
- `AUTH_SECRET` - Long, random string for signing secure session cookies
- `JOB_SECRET_TOKEN` - Secret token for ingestion API
- `NEXT_PUBLIC_APP_URL` - Your app URL (e.g., `http://localhost:3000`)

### 4. Run Database Migrations

```powershell
pnpm db:generate
pnpm db:push
```

Or use migrations:

```powershell
pnpm db:migrate
```

### 5. Seed Initial Admin User (Optional)

Create an admin user manually via SQL or add a seed script:

```sql
INSERT INTO users (email, password_hash, role) 
VALUES ('admin@example.com', '<bcrypt_hash>', 'admin');
```

### 6. Run Ingestion for a City

```powershell
# Using curl or Postman
curl -X POST http://localhost:3000/api/jobs/ingest \
  -H "Content-Type: application/json" \
  -d '{"city": "palm-bay", "secret": "your-job-secret-token"}'
```

Repeat for `melbourne` and `space-coast`.

### 7. Start Development Server

```powershell
pnpm dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── fl/[city]/          # City hub and service pages
│   ├── admin/              # Admin console
│   ├── claim/              # Profile claiming flow
│   ├── dentist/            # Dentist dashboard
│   ├── api/                # API routes
│   ├── sitemaps/           # Dynamic sitemaps
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── robots.ts           # Robots.txt
│   └── sitemap.ts          # Sitemap index
├── components/             # React components
├── db/                     # Database schema and client
│   ├── schema.ts           # Drizzle schema
│   └── index.ts            # DB client
├── jobs/                   # Background jobs
│   └── ingest-npi.ts       # NPPES ingestion
└── lib/                    # Utilities
    ├── auth.ts             # Authentication helpers
    ├── ranking.ts          # Ranking algorithm
    ├── seo.ts              # SEO utilities
    ├── slug.ts             # Slug generation
    └── rate-limit.ts       # Rate limiting
```

## Database Schema

Key tables:
- `users` - Admin and dentist accounts
- `dentists` - Dentist profiles
- `subscriptions` - Stripe subscriptions
- `leads` - Patient inquiries
- `dentist_claim_tokens` - Email verification tokens
- `admin_audit` - Admin action logs
- `ingestion_runs` - NPPES ingestion history

## API Endpoints

### Public
- `GET /api/search/dentists` - Search dentists
- `POST /api/leads` - Submit lead form
- `POST /api/claim/start` - Start claim process
- `POST /api/claim/complete` - Complete claim

### Protected
- `POST /api/jobs/ingest` - Trigger NPPES ingestion (requires secret)
- `POST /api/admin/verify` - Verify dentist (admin only)
- `POST /api/stripe/checkout` - Create Stripe checkout
- `POST /api/stripe/webhook` - Stripe webhook handler

## Testing

Run unit tests:

```powershell
pnpm test
```

Watch mode:

```powershell
pnpm test:watch
```

## Production Deployment

1. Set up PostgreSQL database (managed service recommended)
2. Configure environment variables
3. Run migrations: `pnpm db:migrate`
4. Build: `pnpm build`
5. Start: `pnpm start`

## Stripe Setup

1. Create products and prices in Stripe dashboard
2. Set `STRIPE_PRICE_PRO` and `STRIPE_PRICE_PREMIUM` in `.env`
3. Configure webhook endpoint: `/api/stripe/webhook`
4. Add webhook secret to `STRIPE_WEBHOOK_SECRET`

## SEO Features

- City hub pages: `/fl/{city}/dentists`
- Service pages: `/fl/{city}/{service}`
- Profile pages: `/fl/{city}/dentists/{slug}`
- JSON-LD structured data on profile pages
- Sitemap index and per-city sitemaps
- Canonical URLs
- Robots.txt

## Notes

- Featured listings are clearly labeled as "Sponsored"
- Paid website links use `rel="sponsored"`
- Rate limiting on lead forms (15 min window, 5 requests)
- Admin audit log for verification actions
- NPPES ingestion preserves claimed profile data

## License

Proprietary
