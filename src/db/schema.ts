import { pgTable, text, integer, timestamp, jsonb, pgEnum, boolean, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "dentist"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "pro", "premium"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "trialing"]);
export const verifiedStatusEnum = pgEnum("verified_status", ["unverified", "pending", "verified"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "booked", "lost"]);
export const eventTypeEnum = pgEnum("event_type", [
  "profile_view",
  "lead_submit",
  "call_click",
  "website_click",
  "match_impression",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("dentist"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: { columns: [table.email] },
}));

// Dentists table
export const dentists = pgTable("dentists", {
  id: uuid("id").defaultRandom().primaryKey(),
  npi: text("npi").unique(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  citySlug: text("city_slug").notNull(),
  cityName: text("city_name").notNull(),
  state: text("state").notNull().default("FL"),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  taxonomy: text("taxonomy"),
  lat: text("lat"),
  lng: text("lng"),
  servicesFlags: jsonb("services_flags").$type<{
    emergency?: boolean;
    pediatric?: boolean;
    invisalign?: boolean;
    [key: string]: boolean | undefined;
  }>(),
  insurances: jsonb("insurances").$type<string[]>(),
  languages: jsonb("languages").$type<string[]>(),
  hours: jsonb("hours").$type<{
    [day: string]: { open: string; close: string } | null;
  }>(),
  completenessScore: integer("completeness_score").default(0).notNull(),
  verifiedStatus: verifiedStatusEnum("verified_status").default("unverified").notNull(),
  verifiedAt: timestamp("verified_at"),
  verifiedByAdminId: uuid("verified_by_admin_id").references(() => users.id),
  verificationSource: text("verification_source"),
  userId: uuid("user_id").references(() => users.id), // Link to claimed user account
  // Phase 1: Availability & Pricing
  acceptingNewPatients: boolean("accepting_new_patients"),
  availabilityFlags: jsonb("availability_flags").$type<{
    same_week?: boolean;
    emergency_today?: boolean;
    weekend?: boolean;
  }>(),
  availabilityLastUpdated: timestamp("availability_last_updated"),
  pricingRanges: jsonb("pricing_ranges").$type<{
    cleaning?: { min: number; max: number };
    emergency_visit?: { min: number; max: number };
    crown?: { min: number; max: number };
    invisalign?: { min: number; max: number };
    implants?: { min: number; max: number };
  }>(),
  pricingLastUpdated: timestamp("pricing_last_updated"),
  // Phase 2: Badges (preparing schema)
  badges: jsonb("badges").$type<{
    license_verified?: boolean;
    insurance_verified?: boolean;
    emergency_capable?: boolean;
    anxiety_friendly?: boolean;
    pediatric_friendly?: boolean;
  }>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  citySlugSlugIdx: { columns: [table.citySlug, table.slug], unique: true },
  npiIdx: { columns: [table.npi] },
  citySlugIdx: { columns: [table.citySlug] },
  verifiedStatusIdx: { columns: [table.verifiedStatus] },
}));

// Dentist claim tokens
export const dentistClaimTokens = pgTable("dentist_claim_tokens", {
  token: text("token").primaryKey(),
  dentistId: uuid("dentist_id").references(() => dentists.id).notNull(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  dentistId: uuid("dentist_id").references(() => dentists.id).notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  dentistIdIdx: { columns: [table.dentistId] },
  statusIdx: { columns: [table.status] },
}));

// Leads
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  dentistId: uuid("dentist_id").references(() => dentists.id).notNull(),
  patientName: text("patient_name").notNull(),
  patientEmail: text("patient_email").notNull(),
  patientPhone: text("patient_phone"),
  message: text("message"),
  sourceUrl: text("source_url"),
  // Phase 1: Lead Quality Scoring
  status: leadStatusEnum("status").default("new").notNull(),
  leadScore: integer("lead_score"), // 0-100
  leadScoreReasons: jsonb("lead_score_reasons").$type<string[]>(),
  notes: jsonb("notes").$type<
    Array<{
      id: string;
      body: string;
      author: string;
      createdAt: string;
    }>
  >(),
  contactedAt: timestamp("contacted_at"),
  bookedAt: timestamp("booked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dentistIdCreatedAtIdx: { columns: [table.dentistId, table.createdAt] },
  statusIdx: { columns: [table.status] },
  leadScoreIdx: { columns: [table.leadScore] },
}));

// Admin audit log
export const adminAudit = pgTable("admin_audit", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminUserId: uuid("admin_user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  adminUserIdIdx: { columns: [table.adminUserId] },
  entityTypeEntityIdIdx: { columns: [table.entityType, table.entityId] },
  createdAtIdx: { columns: [table.createdAt] },
}));

// Ingestion runs
export const ingestionRuns = pgTable("ingestion_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  citySlug: text("city_slug").notNull(),
  insertedCount: integer("inserted_count").default(0).notNull(),
  updatedCount: integer("updated_count").default(0).notNull(),
  errors: jsonb("errors").$type<Array<{ message: string; npi?: string }>>(),
});

// Job runs (for all scheduled jobs)
export const jobRuns = pgTable("job_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // "ingest", "rank-snapshots", "followups"
  status: text("status").notNull().default("running"), // "running" | "completed" | "failed"
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  error: text("error"),
}, (table) => ({
  nameIdx: { columns: [table.name] },
  startedAtIdx: { columns: [table.startedAt] },
  statusIdx: { columns: [table.status] },
}));

// Phase 1: Patient Matching Quiz
export const matchSessions = pgTable("match_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  citySlug: text("city_slug").notNull(),
  answers: jsonb("answers").$type<{
    urgency?: string;
    insurance?: string;
    adult_or_child?: string;
    anxiety_level?: string;
    weekend_need?: boolean;
    language?: string;
    budget_sensitivity?: string;
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  citySlugIdx: { columns: [table.citySlug] },
  createdAtIdx: { columns: [table.createdAt] },
}));

export const matchRecommendations = pgTable("match_recommendations", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => matchSessions.id).notNull(),
  dentistId: uuid("dentist_id").references(() => dentists.id).notNull(),
  score: integer("score").notNull(), // 0-100
  reasons: jsonb("reasons").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: { columns: [table.sessionId] },
  dentistIdIdx: { columns: [table.dentistId] },
  sessionIdDentistIdIdx: { columns: [table.sessionId, table.dentistId], unique: true },
}));

// Phase 1: Event Tracking
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  dentistId: uuid("dentist_id").references(() => dentists.id),
  type: eventTypeEnum("type").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dentistIdIdx: { columns: [table.dentistId] },
  typeIdx: { columns: [table.type] },
  createdAtIdx: { columns: [table.createdAt] },
  dentistIdTypeCreatedAtIdx: { columns: [table.dentistId, table.type, table.createdAt] },
}));

// Phase 2: Private Feedback
export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  dentistId: uuid("dentist_id").references(() => dentists.id).notNull(),
  leadId: uuid("lead_id").references(() => leads.id),
  ratingOverall: integer("rating_overall").notNull(), // 1-5
  waitTimeRating: integer("wait_time_rating"), // 1-5 optional
  bedsideMannerRating: integer("bedside_manner_rating"), // 1-5 optional
  wouldRecommend: boolean("would_recommend").notNull(),
  comment: text("comment"), // max 500 chars, no PHI
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dentistIdIdx: { columns: [table.dentistId] },
  leadIdIdx: { columns: [table.leadId] },
  createdAtIdx: { columns: [table.createdAt] },
}));

// Phase 2: Rank Snapshots
export const rankSnapshots = pgTable("rank_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  dentistId: uuid("dentist_id").references(() => dentists.id).notNull(),
  citySlug: text("city_slug").notNull(),
  serviceSlug: text("service_slug"), // nullable for city hub
  rankPosition: integer("rank_position").notNull(),
  totalListings: integer("total_listings").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dentistIdIdx: { columns: [table.dentistId] },
  citySlugIdx: { columns: [table.citySlug] },
  createdAtIdx: { columns: [table.createdAt] },
  dentistIdCitySlugServiceSlugCreatedAtIdx: { columns: [table.dentistId, table.citySlug, table.serviceSlug, table.createdAt] },
}));

// Phase 2: Lead Follow-ups
export const leadFollowups = pgTable("lead_followups", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  step: text("step").notNull(), // "24h" | "72h"
  sentAt: timestamp("sent_at").notNull(),
  channel: text("channel").notNull().default("email"), // "email" | "sms"
  status: text("status").notNull().default("sent"), // "sent" | "delivered" | "bounced" | "unsubscribed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  leadIdIdx: { columns: [table.leadId] },
  sentAtIdx: { columns: [table.sentAt] },
}));

// Phase 2: Verification Requests
export const verificationRequests = pgTable("verification_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  dentistId: uuid("dentist_id").references(() => dentists.id).notNull(),
  badgeType: text("badge_type").notNull(), // "insurance_verified" | "emergency_capable" | "anxiety_friendly" | "pediatric_friendly"
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "denied"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  dentistIdIdx: { columns: [table.dentistId] },
  statusIdx: { columns: [table.status] },
  createdAtIdx: { columns: [table.createdAt] },
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  verifiedDentists: many(dentists),
  auditLogs: many(adminAudit),
  dentist: many(dentists),
}));

export const dentistsRelations = relations(dentists, ({ one, many }) => ({
  subscription: one(subscriptions),
  leads: many(leads),
  claimTokens: many(dentistClaimTokens),
  user: one(users, {
    fields: [dentists.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  dentist: one(dentists, {
    fields: [subscriptions.dentistId],
    references: [dentists.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  dentist: one(dentists, {
    fields: [leads.dentistId],
    references: [dentists.id],
  }),
  feedback: many(feedback),
  followups: many(leadFollowups),
}));

export const matchSessionsRelations = relations(matchSessions, ({ many }) => ({
  recommendations: many(matchRecommendations),
}));

export const matchRecommendationsRelations = relations(matchRecommendations, ({ one }) => ({
  session: one(matchSessions, {
    fields: [matchRecommendations.sessionId],
    references: [matchSessions.id],
  }),
  dentist: one(dentists, {
    fields: [matchRecommendations.dentistId],
    references: [dentists.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  dentist: one(dentists, {
    fields: [events.dentistId],
    references: [dentists.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  dentist: one(dentists, {
    fields: [feedback.dentistId],
    references: [dentists.id],
  }),
  lead: one(leads, {
    fields: [feedback.leadId],
    references: [leads.id],
  }),
}));

export const rankSnapshotsRelations = relations(rankSnapshots, ({ one }) => ({
  dentist: one(dentists, {
    fields: [rankSnapshots.dentistId],
    references: [dentists.id],
  }),
}));

export const leadFollowupsRelations = relations(leadFollowups, ({ one }) => ({
  lead: one(leads, {
    fields: [leadFollowups.leadId],
    references: [leads.id],
  }),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  dentist: one(dentists, {
    fields: [verificationRequests.dentistId],
    references: [dentists.id],
  }),
}));
