# Running V2 Platform Locally (Windows PowerShell)

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running (via Docker Compose)
- Environment variables configured

## Setup Steps

### 1. Install Dependencies

```powershell
npm install
```

### 2. Set Up Environment Variables

Ensure `.env` file exists with:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dentist_finder
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
GOOGLE_MAPS_API_KEY=...
```

### 3. Run Database Migrations

```powershell
# Generate migration from schema changes
npm run db:generate

# Review the migration file in drizzle/migrations/

# Apply migration
npm run db:migrate
```

### 4. Start PostgreSQL (if using Docker)

```powershell
docker-compose up -d
```

### 5. Start Development Server

```powershell
npm run dev
```

The app will be available at `http://localhost:3000`

## Testing New Features

### Test Patient Matching Quiz

1. Navigate to `http://localhost:3000/match`
2. Complete the quiz
3. Verify top 3 recommendations appear
4. Check database: `match_sessions` and `match_recommendations` tables

### Test Event Tracking

1. Visit a dentist profile page
2. Check `events` table for `profile_view` event
3. Click phone number or website
4. Check for `call_click` or `website_click` events

### Test Lead Scoring

1. Submit a lead via `/api/leads`
2. Check `leads` table for `lead_score` and `lead_score_reasons`
3. Verify score is between 0-100

### Test Dentist Dashboard (Requires Auth)

1. Claim a dentist profile
2. Subscribe to Pro or Premium plan
3. Navigate to `/dentist/dashboard`
4. Test:
   - Update availability
   - Update pricing
   - View analytics

## Database Queries for Testing

### Check Match Sessions
```sql
SELECT * FROM match_sessions ORDER BY created_at DESC LIMIT 10;
```

### Check Events
```sql
SELECT type, COUNT(*) 
FROM events 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY type;
```

### Check Lead Scores
```sql
SELECT 
  lead_score,
  COUNT(*) as count,
  AVG(lead_score) as avg_score
FROM leads
WHERE lead_score IS NOT NULL
GROUP BY lead_score
ORDER BY lead_score DESC;
```

### Check Analytics for Dentist
```sql
SELECT 
  e.type,
  COUNT(*) as count
FROM events e
WHERE e.dentist_id = 'YOUR_DENTIST_ID'
  AND e.created_at > NOW() - INTERVAL '30 days'
GROUP BY e.type;
```

## Troubleshooting

### Migration Errors

If migration fails:
```powershell
# Check current migration status
npm run db:studio

# Rollback if needed (manual SQL)
# Then regenerate migration
npm run db:generate
```

### Type Errors

If TypeScript errors appear:
```powershell
# Regenerate types
npm run build

# Check for missing imports
```

### Rate Limiting Issues

Rate limiting is in-memory. To reset:
- Restart the dev server
- Or clear the rate limit store (currently in-memory)

## Next Steps

1. Implement UI components (see V2_IMPLEMENTATION_GUIDE.md)
2. Add unit tests
3. Test end-to-end flows
4. Deploy to staging

