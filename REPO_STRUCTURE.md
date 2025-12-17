# Repository Structure

## Complete File Tree

```
dentist-finder/
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── docker-compose.yml           # PostgreSQL Docker setup
├── drizzle.config.ts            # Drizzle ORM configuration
├── next.config.mjs              # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Main documentation
├── SETUP.md                     # Windows PowerShell setup guide
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vitest.config.ts             # Vitest test configuration
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── admin/               # Admin console
│   │   │   ├── login/
│   │   │   │   └── page.tsx     # Admin login page
│   │   │   ├── dentists/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Dentist verification page
│   │   │   └── page.tsx         # Admin dashboard
│   │   ├── api/                 # API routes
│   │   │   ├── admin/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts # Admin login endpoint
│   │   │   │   └── verify/
│   │   │   │       └── route.ts # Verify dentist endpoint
│   │   │   ├── claim/
│   │   │   │   ├── start/
│   │   │   │   │   └── route.ts # Start claim process
│   │   │   │   ├── complete/
│   │   │   │   │   └── route.ts # Complete claim
│   │   │   │   └── verify/
│   │   │   │       └── route.ts # Verify claim token
│   │   │   ├── jobs/
│   │   │   │   └── ingest/
│   │   │   │       └── route.ts # NPPES ingestion trigger
│   │   │   ├── leads/
│   │   │   │   └── route.ts     # Lead submission
│   │   │   ├── search/
│   │   │   │   └── dentists/
│   │   │   │       └── route.ts # Search dentists API
│   │   │   └── stripe/
│   │   │       ├── checkout/
│   │   │       │   └── route.ts # Create checkout session
│   │   │       └── webhook/
│   │   │           └── route.ts # Stripe webhook handler
│   │   ├── claim/               # Profile claiming flow
│   │   │   ├── [token]/
│   │   │   │   └── page.tsx     # Complete claim page
│   │   │   └── page.tsx          # Start claim page
│   │   ├── dentist/             # Dentist dashboard
│   │   │   └── dashboard/
│   │   │       └── page.tsx     # Dentist dashboard
│   │   ├── fl/                  # Florida city pages
│   │   │   └── [city]/
│   │   │       ├── dentists/
│   │   │       │   ├── [slug]/
│   │   │       │   │   └── page.tsx # Dentist profile page
│   │   │       │   └── page.tsx     # City hub page
│   │   │       └── [service]/
│   │   │           └── page.tsx     # Service page
│   │   ├── for-dentists/
│   │   │   └── page.tsx          # Marketing page
│   │   ├── pricing/
│   │   │   └── page.tsx          # Pricing page
│   │   ├── privacy/
│   │   │   └── page.tsx          # Privacy policy
│   │   ├── sitemaps/             # Dynamic sitemaps
│   │   │   └── [city]/
│   │   │       └── route.ts     # Per-city sitemap
│   │   ├── terms/
│   │   │   └── page.tsx          # Terms of service
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Homepage
│   │   ├── robots.ts             # Robots.txt generator
│   │   └── sitemap.ts            # Sitemap index
│   │
│   ├── components/               # React components
│   │   ├── DentistCard.tsx       # Dentist listing card
│   │   ├── Filters.tsx           # Search filters
│   │   ├── LeadForm.tsx         # Lead submission form
│   │   └── VerifyButton.tsx     # Admin verify button
│   │
│   ├── db/                       # Database
│   │   ├── index.ts             # Drizzle client
│   │   ├── schema.ts            # Database schema
│   │   └── seed.ts              # Seed script
│   │
│   ├── jobs/                     # Background jobs
│   │   ├── ingest-npi.ts        # NPPES ingestion logic
│   │   └── ingest-npi.test.ts  # Ingestion tests
│   │
│   └── lib/                      # Utilities
│       ├── auth.ts              # Authentication helpers
│       ├── ranking.ts           # Ranking algorithm
│       ├── ranking.test.ts      # Ranking tests
│       ├── rate-limit.ts        # Rate limiting
│       ├── seo.ts               # SEO utilities
│       ├── seo.test.ts         # SEO tests
│       └── slug.ts             # Slug generation
│
└── drizzle/                      # Generated migrations (after running db:generate)
```

## Key Files Summary

### Configuration
- `package.json` - Dependencies and npm scripts
- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript strict mode configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `drizzle.config.ts` - Database ORM configuration
- `docker-compose.yml` - Local PostgreSQL setup

### Database
- `src/db/schema.ts` - Complete database schema with all tables and indexes
- `src/db/index.ts` - Drizzle client initialization
- `src/db/seed.ts` - Admin user seed script

### Core Pages
- `src/app/page.tsx` - Homepage with city links
- `src/app/fl/[city]/dentists/page.tsx` - City hub page (MUST IMPLEMENT)
- `src/app/fl/[city]/[service]/page.tsx` - Service page (MUST IMPLEMENT)
- `src/app/fl/[city]/dentists/[slug]/page.tsx` - Profile page (MUST IMPLEMENT)

### SEO
- `src/app/robots.ts` - Robots.txt generator (MUST IMPLEMENT)
- `src/app/sitemap.ts` - Sitemap index (MUST IMPLEMENT)
- `src/app/sitemaps/[city]/route.ts` - Per-city sitemap (MUST IMPLEMENT)
- `src/lib/seo.ts` - SEO metadata helpers (MUST IMPLEMENT)

### API Routes
- `src/app/api/leads/route.ts` - Lead submission (MUST IMPLEMENT)
- `src/app/api/search/dentists/route.ts` - Search API (MUST IMPLEMENT)
- `src/app/api/jobs/ingest/route.ts` - Ingestion trigger (MUST IMPLEMENT)
- `src/app/api/stripe/*` - Stripe integration
- `src/app/api/admin/*` - Admin endpoints

### Business Logic
- `src/lib/ranking.ts` - Ranking algorithm with featured placement (MUST IMPLEMENT)
- `src/jobs/ingest-npi.ts` - NPPES API ingestion (MUST IMPLEMENT)

### Tests
- `src/lib/ranking.test.ts` - Ranking algorithm tests (MUST IMPLEMENT)
- `src/lib/seo.test.ts` - SEO utility tests (MUST IMPLEMENT)
- `src/jobs/ingest-npi.test.ts` - Ingestion tests (MUST IMPLEMENT)

## Environment Variables

See `.env.example` for all required variables:
- Database connection
- Stripe keys
- Resend API key
- Job secret token
- App URL

## Database Tables

1. `users` - Admin and dentist accounts
2. `dentists` - Dentist profiles with NPI data
3. `subscriptions` - Stripe subscription records
4. `leads` - Patient inquiries
5. `dentist_claim_tokens` - Email verification tokens
6. `admin_audit` - Admin action audit log
7. `ingestion_runs` - NPPES ingestion history

## Next Steps

1. Set up environment variables
2. Run database migrations
3. Seed admin user
4. Run NPPES ingestion for each city
5. Configure Stripe products and webhooks
6. Deploy to production

