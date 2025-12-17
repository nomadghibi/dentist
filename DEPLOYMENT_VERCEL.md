# Vercel Production Deployment Guide

## Overview

This guide covers deploying the Dentist Finder platform to Vercel with Neon Postgres and scheduled cron jobs.

## Architecture

- **Frontend/API**: Next.js 14 on Vercel
- **Database**: PostgreSQL on Neon
- **Cron Jobs**: Vercel Cron → `/api/cron/*` → `/api/jobs/*`
- **Security**: CRON_SECRET for job endpoint protection

## Prerequisites

1. Vercel account
2. Neon account (or other Postgres provider)
3. Environment variables ready

## Step 1: Set Up Neon Database

### 1.1 Create Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Create new project
3. Copy connection string (looks like: `postgresql://user:pass@host/dbname`)

### 1.2 Run Migrations

```powershell
# Set DATABASE_URL to Neon connection string
$env:DATABASE_URL = "postgresql://user:pass@host.neon.tech/dbname"

# Generate migration (if needed)
npm run db:generate

# Push schema to Neon
npm run db:push

# Or run migrations
npm run db:migrate
```

## Step 2: Configure Vercel Environment Variables

### 2.1 Via Vercel Dashboard

1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add the following:

```
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname
CRON_SECRET=your-random-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
JWT_SECRET=your-jwt-secret-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Important**: 
- `CRON_SECRET` must be a strong random string (use: `openssl rand -hex 32`)
- Set for **Production**, **Preview**, and **Development** environments
- `NEXT_PUBLIC_APP_URL` should be your production domain

### 2.2 Via Vercel CLI

```powershell
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL production
vercel env add CRON_SECRET production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add RESEND_API_KEY production
vercel env add JWT_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production
```

## Step 3: Deploy to Vercel

### 3.1 First Deployment

```powershell
# Deploy
vercel --prod

# Or push to main branch (if connected to Git)
git push origin main
```

### 3.2 Verify Deployment

1. Check Vercel dashboard for deployment status
2. Visit your production URL
3. Test key endpoints:
   - Homepage loads
   - `/match` quiz works
   - API routes respond

## Step 4: Verify Cron Jobs

### 4.1 Check Cron Configuration

The `vercel.json` file should be automatically detected. Verify in Vercel dashboard:
- Project Settings → Cron Jobs
- Should see 5 cron jobs listed

### 4.2 Manual Testing (Before First Cron Run)

Test each cron endpoint manually using curl:

```powershell
# Test ingest (replace YOUR_CRON_SECRET and YOUR_DOMAIN)
$headers = @{
    "Authorization" = "Bearer YOUR_CRON_SECRET"
    "Content-Type" = "application/json"
}

# Test ingest for palm-bay
Invoke-WebRequest -Uri "https://YOUR_DOMAIN.vercel.app/api/jobs/ingest?city=palm-bay" `
    -Method POST -Headers $headers

# Test rank snapshots
Invoke-WebRequest -Uri "https://YOUR_DOMAIN.vercel.app/api/jobs/rank-snapshots" `
    -Method POST -Headers $headers

# Test followups
Invoke-WebRequest -Uri "https://YOUR_DOMAIN.vercel.app/api/jobs/followups" `
    -Method POST -Headers $headers
```

### 4.3 Test Cron Endpoints (Vercel Cron Simulation)

```powershell
# Simulate Vercel cron call (with x-vercel-cron header)
$headers = @{
    "x-vercel-cron" = "1"
    "Content-Type" = "application/json"
}

Invoke-WebRequest -Uri "https://YOUR_DOMAIN.vercel.app/api/cron/ingest?city=palm-bay" `
    -Method POST -Headers $headers
```

## Step 5: Monitor Cron Jobs

### 5.1 Check Job Runs in Database

```sql
-- View recent job runs
SELECT name, status, started_at, finished_at, error
FROM job_runs
ORDER BY started_at DESC
LIMIT 20;

-- Check ingestion runs
SELECT city_slug, started_at, finished_at, inserted_count, updated_count
FROM ingestion_runs
ORDER BY started_at DESC
LIMIT 10;

-- Check follow-ups sent
SELECT step, COUNT(*) as count, MAX(sent_at) as last_sent
FROM lead_followups
GROUP BY step;
```

### 5.2 Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click "Functions" tab
3. View logs for cron executions
4. Check for errors or timeouts

### 5.3 Set Up Alerts (Optional)

- Vercel: Configure function error alerts
- Database: Set up Neon monitoring
- External: Use Sentry or similar for error tracking

## Step 6: Verify Database Migrations

After deployment, ensure all tables exist:

```sql
-- Check job_runs table exists
SELECT * FROM job_runs LIMIT 1;

-- Check all Phase 1 tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'job_runs',
    'match_sessions',
    'match_recommendations',
    'events',
    'rank_snapshots',
    'lead_followups'
);
```

## Cron Schedule Reference

| Job | Schedule | Description |
|-----|----------|-------------|
| Ingest (Palm Bay) | `0 2 * * *` | Daily at 2:00 AM |
| Ingest (Melbourne) | `10 2 * * *` | Daily at 2:10 AM |
| Ingest (Space Coast) | `20 2 * * *` | Daily at 2:20 AM |
| Rank Snapshots | `0 3 * * 0` | Weekly on Sunday at 3:00 AM |
| Follow-ups | `0 */6 * * *` | Every 6 hours |

## Troubleshooting

### Cron Jobs Not Running

1. **Check vercel.json**: Ensure it's in project root
2. **Check Vercel Dashboard**: Settings → Cron Jobs should list all jobs
3. **Check Logs**: View function execution logs
4. **Verify CRON_SECRET**: Must be set in environment variables

### Job Timeouts

- Increase timeout in `runJob()` calls (currently 5-15 min)
- Optimize job logic for faster execution
- Consider breaking large jobs into batches

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check Neon connection pooling settings
- Ensure IP allowlist includes Vercel IPs (if required)

### Authentication Errors

- Verify `CRON_SECRET` matches in all environments
- Check Authorization header format: `Bearer <secret>`
- Ensure `x-vercel-cron` header is being sent (Vercel adds this automatically)

## Production Checklist

- [ ] Neon database created and migrations run
- [ ] All environment variables set in Vercel
- [ ] `vercel.json` committed to repository
- [ ] First deployment successful
- [ ] Cron jobs visible in Vercel dashboard
- [ ] Manual cron endpoint tests pass
- [ ] Database tables created (check with SQL)
- [ ] Job runs table logging correctly
- [ ] Monitoring/alerts configured (optional)

## Next Steps

1. **Monitor First Cron Runs**: Watch logs for first scheduled executions
2. **Verify Data**: Check database for ingested dentists, snapshots, follow-ups
3. **Optimize**: Adjust timeouts, batch sizes based on actual performance
4. **Scale**: Consider moving to dedicated worker service if jobs become too heavy

## Migration to Worker Service (Future)

When ready to move off Vercel Cron:

1. Keep `/api/jobs/*` endpoints (they're already worker-ready)
2. Replace `/api/cron/*` with worker service scheduler
3. Worker service calls `/api/jobs/*` with `CRON_SECRET`
4. No changes needed to job logic

---

**Support**: Check Vercel docs for cron jobs: https://vercel.com/docs/cron-jobs

