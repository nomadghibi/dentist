# V2 Platform Upgrade Roadmap

## Phase 1: Revenue + Differentiation (MVP-V2)

### Goal
Increase conversion, retention, and dentist willingness to pay quickly.

### Features

#### 1. Patient Matching Quiz
**Priority**: High  
**ROI**: High - Differentiates from competitors, increases engagement  
**Scope**: 
- 6-8 question quiz at `/match`
- Returns top 3 dentists with explainable reasons
- Stores match sessions and recommendations
- Reuses existing ranking.ts logic

**Success Metrics**:
- 20%+ of visitors complete quiz
- 30%+ of quiz completers click through to recommended dentists
- 15%+ increase in lead conversion from quiz users

#### 2. Availability Signals
**Priority**: High  
**ROI**: High - Reduces friction, increases booking confidence  
**Scope**:
- Dentist-controlled availability flags (accepting new patients, same-week, emergency today, weekend)
- Filter/sort on city/service pages
- Dentist dashboard UI for updates

**Success Metrics**:
- 50%+ of claimed dentists update availability within 30 days
- 25%+ increase in leads for dentists with availability signals
- Reduced "not accepting new patients" friction

#### 3. Lead Quality Scoring
**Priority**: Medium-High  
**ROI**: Medium-High - Helps dentists prioritize, increases response rates  
**Scope**:
- Deterministic scoring (0-100) on lead creation
- Lead status tracking (new, contacted, booked, lost)
- Prioritized lead list in dashboard

**Success Metrics**:
- 20%+ improvement in dentist response time to high-quality leads
- 15%+ increase in booking rate for scored leads

#### 4. Cost Transparency
**Priority**: Medium  
**ROI**: Medium - Builds trust, reduces price-shopping friction  
**Scope**:
- Self-reported pricing ranges (optional)
- "Cost Transparency" badge (updated within 90 days)
- Display on profile with disclaimers

**Success Metrics**:
- 30%+ of claimed dentists add pricing
- 10%+ increase in profile views for dentists with pricing
- Reduced "price inquiry" leads

#### 5. Dentist Growth Dashboard
**Priority**: High  
**ROI**: High - Core value prop for subscriptions  
**Scope**:
- Event tracking (views, leads, clicks, match impressions)
- Basic analytics (views, leads, conversion rate, avg lead score)
- Pro: basic analytics
- Premium: full analytics + CSV exports

**Success Metrics**:
- 40%+ of Pro/Premium dentists view dashboard weekly
- 25%+ increase in subscription retention
- Clear ROI visibility for dentists

### Phase 1 Risks
- **Risk**: Quiz complexity may reduce completion rate  
  **Mitigation**: Start with 6 questions, A/B test, progressive disclosure
- **Risk**: Dentist adoption of availability/pricing updates  
  **Mitigation**: Email onboarding, dashboard prompts, make it easy
- **Risk**: Performance impact of event tracking  
  **Mitigation**: Async event logging, batch inserts, rate limiting

### Phase 1 Timeline
- Week 1-2: Database schema + migrations
- Week 2-3: API routes + core logic
- Week 3-4: UI components + dashboard
- Week 4-5: Testing + refinement
- Week 5-6: Launch + monitoring

---

## Phase 2: Moat + Automation

### Goal
Deepen defensibility, reduce churn, automate operations.

### Features

#### 6. Private Post-Visit Feedback
**Priority**: Medium  
**ROI**: Medium - Builds trust, provides insights  
**Scope**:
- Private feedback (not public reviews)
- Basic moderation (PHI keywords, profanity)
- Aggregate insights in dashboard

**Success Metrics**:
- 10%+ feedback rate from booked leads
- Dentist satisfaction with insights
- Improved service quality signals

#### 7. Competitor Insights + Rank Snapshots
**Priority**: Medium  
**ROI**: Medium - Premium differentiator  
**Scope**:
- Weekly rank snapshots
- Rank trends over time
- "Share of visibility" metric
- Premium-only feature

**Success Metrics**:
- 30%+ of Premium dentists use insights
- Increased Premium upgrade rate
- Reduced churn for Premium subscribers

#### 8. Automated Follow-ups
**Priority**: Low-Medium  
**ROI**: Medium - Reduces lost leads, improves conversion  
**Scope**:
- Email follow-ups at 24h and 72h
- Opt-out friendly
- Alternative dentist suggestions

**Success Metrics**:
- 15%+ of unbooked leads convert after follow-up
- Reduced lead abandonment
- Improved patient experience

#### 9. Verified Badges Expansion
**Priority**: Low-Medium  
**ROI**: Low-Medium - Trust signals, differentiation  
**Scope**:
- Additional badges (insurance, emergency, anxiety-friendly, pediatric-friendly)
- Verification request flow
- Admin approval workflow

**Success Metrics**:
- 40%+ of dentists request additional badges
- Increased profile completeness
- Trust signal impact on conversion

#### 10. Local Authority Guides
**Priority**: Low  
**ROI**: Low-Medium - SEO value, content marketing  
**Scope**:
- Limited guide pages (/guides/{city}/{topic})
- Uses real internal data
- FAQs + links to service pages

**Success Metrics**:
- Organic traffic growth
- Guide page engagement
- Conversion from guides to dentist pages

### Phase 2 Risks
- **Risk**: Feedback moderation complexity  
  **Mitigation**: Start simple, iterate based on abuse patterns
- **Risk**: Rank snapshot computation performance  
  **Mitigation**: Background jobs, caching, incremental updates
- **Risk**: Follow-up email deliverability  
  **Mitigation**: Use Resend, respect opt-outs, monitor bounces

### Phase 2 Timeline
- Week 1-2: Database schema + migrations
- Week 2-3: Core features (feedback, insights, follow-ups)
- Week 3-4: Badges + guides
- Week 4-5: Testing + refinement
- Week 5-6: Launch behind feature flags

---

## Entitlements Matrix

| Feature | Free | Pro ($99/mo) | Premium ($199/mo) |
|---------|------|--------------|-------------------|
| Patient Matching Quiz | ✅ | ✅ | ✅ |
| Availability Signals | ✅ (view) | ✅ (edit) | ✅ (edit) |
| Cost Transparency | ✅ (view) | ✅ (edit) | ✅ (edit) |
| Lead Quality Scoring | ❌ | ✅ (view) | ✅ (view) |
| Basic Analytics | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ |
| CSV Exports | ❌ | ❌ | ✅ |
| Competitor Insights | ❌ | ❌ | ✅ |
| Private Feedback | ✅ (submit) | ✅ (submit) | ✅ (submit + insights) |
| Automated Follow-ups | ✅ (receive) | ✅ (receive) | ✅ (receive) |
| Badge Requests | ✅ | ✅ | ✅ |

---

## Success Criteria

### Phase 1 Launch Criteria
- ✅ All Phase 1 features implemented and tested
- ✅ Database migrations run successfully
- ✅ API routes have rate limiting
- ✅ Dashboard accessible to Pro/Premium subscribers
- ✅ Quiz completion rate > 15%
- ✅ Zero breaking changes to existing routes

### Phase 2 Launch Criteria
- ✅ All Phase 2 features implemented
- ✅ Feature flags in place
- ✅ Moderation rules tested
- ✅ Follow-up emails tested
- ✅ Guides indexed in sitemaps
- ✅ Performance benchmarks met

