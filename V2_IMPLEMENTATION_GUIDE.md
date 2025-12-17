# V2 Platform Implementation Guide

## Overview

This document provides complete implementation details for the V2 upgrade, delivered in two phases.

## Phase 1: Revenue + Differentiation (Current Focus)

### Database Migration

Run the following to generate and apply migrations:

```bash
# Generate migration from schema changes
npm run db:generate

# Review the generated migration in drizzle/migrations/

# Apply migration
npm run db:migrate
```

### Key Files Created

#### Core Logic
- `src/lib/validators/match.ts` - Quiz validation
- `src/lib/validators/availability.ts` - Availability validation
- `src/lib/validators/pricing.ts` - Pricing validation
- `src/lib/lead-scoring.ts` - Lead quality scoring
- `src/lib/match-quiz.ts` - Patient matching algorithm
- `src/lib/analytics.ts` - Analytics calculations
- `src/lib/entitlements.ts` - Feature access control

#### API Routes
- `src/app/api/match/route.ts` - Patient matching quiz
- `src/app/api/events/route.ts` - Event tracking
- `src/app/api/dentist/availability/route.ts` - Update availability
- `src/app/api/dentist/pricing/route.ts` - Update pricing
- `src/app/api/dentist/analytics/route.ts` - Get analytics
- `src/app/api/leads/route.ts` - Updated with lead scoring

### UI Components Needed

#### Patient-Facing
1. **`src/app/match/page.tsx`** - Patient matching quiz page
   - 6-8 question form
   - Results display with top 3 dentists
   - Explainable reasons for each match

2. **Updated city/service pages** - Add availability filters
   - Filter by "Accepting new patients"
   - Filter by "Same-week available"
   - Filter by "Weekend available"
   - Filter by "Emergency today"

#### Dentist-Facing
1. **Updated `src/app/dentist/dashboard/page.tsx`**
   - Analytics panels (views, leads, conversion)
   - Lead list with scores and status
   - Availability update form
   - Pricing update form

2. **New components:**
   - `src/components/AvailabilityForm.tsx`
   - `src/components/PricingForm.tsx`
   - `src/components/AnalyticsPanel.tsx`
   - `src/components/LeadList.tsx`

### Testing

#### Unit Tests
Create `src/lib/lead-scoring.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { computeLeadScore } from "./lead-scoring";

describe("Lead Scoring", () => {
  it("scores emergency leads higher", () => {
    const result = computeLeadScore({ urgency: "emergency" });
    expect(result.score).toBeGreaterThan(50);
    expect(result.reasons).toContain("Emergency request");
  });
  // ... more tests
});
```

Create `src/lib/match-quiz.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { matchDentists } from "./match-quiz";
// ... tests
```

### Environment Variables

No new environment variables required for Phase 1.

### Rate Limiting

All write endpoints have rate limiting:
- `/api/match`: 10 req/min
- `/api/events`: 100 req/min
- `/api/dentist/*`: 10 req/min
- `/api/leads`: 5 req/15min (existing)

### Entitlements Matrix

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| View availability | ✅ | ✅ | ✅ |
| Edit availability | ❌ | ✅ | ✅ |
| View pricing | ✅ | ✅ | ✅ |
| Edit pricing | ❌ | ✅ | ✅ |
| View lead scores | ❌ | ✅ | ✅ |
| Basic analytics | ❌ | ✅ | ✅ |
| Advanced analytics | ❌ | ❌ | ✅ |
| CSV export | ❌ | ❌ | ✅ |

## Phase 2: Moat + Automation (Future)

### Additional Database Tables
- `feedback` - Private post-visit feedback
- `rank_snapshots` - Weekly rank tracking
- `lead_followups` - Automated follow-up tracking
- `verification_requests` - Badge verification requests

### Additional API Routes
- `POST /api/feedback` - Submit feedback
- `GET /api/dentist/competitor-insights` - Rank insights (Premium)
- `POST /api/dentist/request-badge` - Request badge verification
- Background jobs for follow-ups and rank snapshots

### Guide Pages
- `/guides/[city]/[topic]/page.tsx`
- Limited to: palm-bay, melbourne, space-coast
- Topics: emergency-dentist, pediatric-dentist, invisalign, dental-implants, teeth-cleaning

## Security Considerations

1. **Rate Limiting**: All write endpoints protected
2. **Input Validation**: All inputs validated with Zod
3. **Entitlements**: Server-side checks for subscription features
4. **PHI Protection**: Feedback moderation prevents medical content
5. **Audit Logging**: Admin actions logged (existing)

## Performance Considerations

1. **Event Tracking**: Async, non-blocking
2. **Analytics**: Cached queries, indexed on dentist_id + created_at
3. **Match Quiz**: Efficient scoring algorithm, limited to city dentists

## Monitoring & Metrics

Track:
- Quiz completion rate
- Match-to-lead conversion
- Dentist adoption of availability/pricing updates
- Dashboard engagement
- Lead score distribution

## Rollout Plan

1. **Week 1**: Database migration + API routes
2. **Week 2**: UI components + testing
3. **Week 3**: Internal testing + bug fixes
4. **Week 4**: Beta with select dentists
5. **Week 5**: Full launch + monitoring

## Support & Documentation

- Update README with new features
- Create dentist onboarding guide
- Add API documentation
- Create video tutorials for dashboard

