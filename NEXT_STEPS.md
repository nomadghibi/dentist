# Next Steps - Phase 1 Launch Checklist

## Immediate Actions (Required for Launch)

### 1. Database Migration ⚠️ CRITICAL

**Status**: Schema updated, migration needs to be generated and applied

```powershell
# Step 1: Generate migration from schema changes
npm run db:generate

# Step 2: Review the generated SQL file in drizzle/migrations/
# Look for files like: 0000_xxxxx_phase1_v2.sql

# Step 3: Apply migration to database
npm run db:migrate

# Step 4: Verify tables were created
npm run db:studio
# Check for: match_sessions, match_recommendations, events tables
# Check dentists table has new columns: accepting_new_patients, availability_flags, etc.
```

**Expected Output**: 
- 3 new tables created
- `dentists` table has 6 new columns
- `leads` table has 5 new columns
- 2 new enums created

---

### 2. Authentication Implementation ⚠️ CRITICAL

**Status**: Placeholder code exists, needs real implementation

**Current Issue**: 
- `src/app/dentist/dashboard/page.tsx` line 12: `const userId = null;`
- `src/lib/auth.ts` `getServerSession()` returns null
- API routes need auth headers

**Options**:

#### Option A: Use Existing Auth System
If you have an existing auth system, integrate it:
1. Update `getServerSession()` in `src/lib/auth.ts`
2. Update dashboard to use real session
3. Add auth middleware to API routes

#### Option B: Add NextAuth.js (Recommended)
```powershell
npm install next-auth
npm install @auth/drizzle-adapter
```

Then implement:
- `src/app/api/auth/[...nextauth]/route.ts`
- Update `src/lib/auth.ts` to use NextAuth session
- Add session provider to layout

#### Option C: Simple JWT Tokens
- Create login endpoint
- Issue JWT tokens
- Verify tokens in API routes

**Files to Update**:
- `src/lib/auth.ts` - Implement `getServerSession()`
- `src/app/dentist/dashboard/page.tsx` - Get real userId
- `src/app/api/dentist/*/route.ts` - Add auth checks

---

### 3. Test Database Migration

```powershell
# After migration, test that new features work:

# Test 1: Create a match session
# Visit http://localhost:3000/match and complete quiz
# Check database: SELECT * FROM match_sessions;

# Test 2: Check events table
# Visit a dentist profile
# Check database: SELECT * FROM events WHERE type = 'profile_view';

# Test 3: Check lead scoring
# Submit a lead via lead form
# Check database: SELECT lead_score, lead_score_reasons FROM leads;
```

---

## Recommended Actions (Before Full Launch)

### 4. Integrate Event Tracking

Add to existing pages:

**File**: `src/app/fl/[city]/dentists/[slug]/page.tsx`

Add at the top (client component):
```typescript
"use client";
import { useEffect } from "react";

// In the component:
useEffect(() => {
  if (dentist?.id) {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dentistId: dentist.id,
        type: "profile_view",
      }),
    }).catch(console.error);
  }
}, [dentist?.id]);
```

**File**: `src/components/DentistCard.tsx`

Add click handlers:
```typescript
const handlePhoneClick = () => {
  fetch("/api/events", {
    method: "POST",
    body: JSON.stringify({
      dentistId: dentist.id,
      type: "call_click",
    }),
  });
};

const handleWebsiteClick = () => {
  fetch("/api/events", {
    method: "POST",
    body: JSON.stringify({
      dentistId: dentist.id,
      type: "website_click",
    }),
  });
};
```

---

### 5. Add Match Quiz Link to Navigation

**File**: `src/app/page.tsx` (Landing page)

Add button in hero section:
```typescript
<Link
  href="/match"
  className="px-8 py-4 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700"
>
  Find My Match →
</Link>
```

**File**: `src/app/layout.tsx` (Navigation)

Add link:
```typescript
<Link href="/match" className="text-sm font-medium text-slate-700">
  Find Your Match
</Link>
```

---

### 6. Add Availability Filters to City Pages

**File**: `src/app/fl/[city]/dentists/page.tsx`

Add filter options:
```typescript
// In Filters component or add new section
<label>
  <input
    type="checkbox"
    checked={filters.acceptingNewPatients}
    onChange={(e) => setFilters({...filters, acceptingNewPatients: e.target.checked})}
  />
  Accepting New Patients
</label>
```

---

### 7. Run Unit Tests

```powershell
# Run all tests
npm test

# Run specific test
npm test lead-scoring
npm test match-quiz

# Watch mode
npm run test:watch
```

**Expected**: All tests pass ✅

---

## Optional Enhancements

### 8. Add Cost Transparency Badge

**File**: `src/components/DentistCard.tsx`

Add badge display:
```typescript
{dentist.pricingLastUpdated && 
  new Date(dentist.pricingLastUpdated) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) && (
    <span className="badge">Cost Transparency</span>
  )
}
```

### 9. Add Lead Status Management

**File**: `src/components/LeadList.tsx`

Add status update buttons:
```typescript
<select
  value={lead.status}
  onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
>
  <option value="new">New</option>
  <option value="contacted">Contacted</option>
  <option value="booked">Booked</option>
  <option value="lost">Lost</option>
</select>
```

### 10. Add Analytics Export (Premium)

**File**: `src/app/api/dentist/analytics/export/route.ts`

Create CSV export endpoint for Premium users.

---

## Testing Checklist

Before launching, test:

- [ ] Quiz completes and shows 3 recommendations
- [ ] Recommendations link to correct dentist profiles
- [ ] Events are tracked when viewing profiles
- [ ] Lead scoring works (check database)
- [ ] Dentist can update availability (requires auth)
- [ ] Dentist can update pricing (requires auth)
- [ ] Analytics dashboard shows data (requires auth + subscription)
- [ ] Lead list shows scores (requires auth + subscription)
- [ ] All unit tests pass
- [ ] No console errors in browser
- [ ] Mobile responsive (test on phone)

---

## Deployment Steps

### 1. Pre-Deployment
```powershell
# Build the project
npm run build

# Check for errors
npm run lint

# Run tests
npm test
```

### 2. Database Migration (Production)
```powershell
# Backup database first!
# Then run migration on production database
DATABASE_URL="production_url" npm run db:migrate
```

### 3. Environment Variables
Ensure production `.env` has:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- Any new variables needed

### 4. Deploy
- Deploy code
- Verify migration ran
- Test critical paths
- Monitor for errors

---

## Monitoring After Launch

Track these metrics:

1. **Quiz Completion Rate**
   ```sql
   SELECT COUNT(*) FROM match_sessions;
   -- Compare to page views
   ```

2. **Match-to-Lead Conversion**
   ```sql
   SELECT COUNT(*) FROM leads WHERE source_url LIKE '%/match%';
   ```

3. **Dentist Adoption**
   ```sql
   SELECT COUNT(*) FROM dentists 
   WHERE availability_last_updated IS NOT NULL 
   OR pricing_last_updated IS NOT NULL;
   ```

4. **Dashboard Usage**
   ```sql
   SELECT COUNT(*) FROM events 
   WHERE type = 'profile_view' 
   AND meta->>'source' = 'dashboard';
   ```

---

## Support & Documentation

- **For Dentists**: Create onboarding guide for dashboard
- **For Patients**: Add FAQ about matching quiz
- **For Admins**: Document new admin features

---

## Priority Order

1. **Must Do** (Blocking launch):
   - Database migration
   - Authentication implementation

2. **Should Do** (Better UX):
   - Event tracking integration
   - Match quiz link in navigation
   - Unit tests passing

3. **Nice to Have** (Can add later):
   - Availability filters
   - Cost transparency badges
   - Lead status management
   - Analytics export

---

## Estimated Time

- Database migration: **15 minutes**
- Authentication: **2-4 hours** (depending on approach)
- Event tracking: **1 hour**
- Testing: **1-2 hours**
- **Total: 4-8 hours** to production-ready

---

## Need Help?

Check these files:
- `PHASE1_COMPLETE.md` - Implementation summary
- `V2_COMPLETE_IMPLEMENTATION.md` - Full specification
- `RUN_LOCALLY.md` - Local setup guide

