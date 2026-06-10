/**
 * Britch — Drizzle schema (was prisma/schema.prisma)
 *
 * Target: Cloudflare D1 (SQLite) via drizzle-orm/d1.
 * Conventions (unchanged from Prisma migration):
 *   - Money = integer CENTS (no Decimal)
 *   - All other numerics = integer BASIS POINTS (10000 = 1.0×)
 *   - CPM = cents per 1,000 reach
 *   - Enums = text + TS union (SQLite has no native enum)
 *   - JSON = text({ mode: "json" })
 *
 * Better Auth tables (user, session, account, verification) use the lowercase
 * singular names the better-auth drizzle adapter expects. Everything else uses
 * camelCase to match the previous Prisma model names, so query call sites only
 * change shape (verb), not table identifiers.
 */

import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

const cuid = () => createId();
const now = () => new Date();

// ════════════════════════════════════════════════════════════
// BETTER AUTH — User + Session + Account + Verification
// (lowercase singular — required by @better-auth/drizzle-adapter)
// ════════════════════════════════════════════════════════════

export const user = sqliteTable("user", {
  id:            text("id").primaryKey().$defaultFn(cuid),
  name:          text("name").notNull(),
  email:         text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image:         text("image"),
  createdAt:     integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:     integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
  // Britch role flag — gates /admin routes. "USER" | "ADMIN"
  role:          text("role").notNull().default("USER"),
});

export const session = sqliteTable("session", {
  id:        text("id").primaryKey().$defaultFn(cuid),
  userId:    text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  token:     text("token").notNull().unique(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const account = sqliteTable("account", {
  id:                    text("id").primaryKey().$defaultFn(cuid),
  userId:                text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId:             text("accountId").notNull(),
  providerId:            text("providerId").notNull(),
  accessToken:           text("accessToken"),
  refreshToken:          text("refreshToken"),
  accessTokenExpiresAt:  integer("accessTokenExpiresAt",  { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
  scope:                 text("scope"),
  idToken:               text("idToken"),
  password:              text("password"),
  createdAt:             integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:             integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const verification = sqliteTable("verification", {
  id:         text("id").primaryKey().$defaultFn(cuid),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt:  integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:  integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

// ════════════════════════════════════════════════════════════
// CREATOR-SCOPED PLANE
// Every row has accountId — RLS-by-construction at the query layer.
// ════════════════════════════════════════════════════════════

export const creatorAccount = sqliteTable("creatorAccount", {
  id:          text("id").primaryKey().$defaultFn(cuid),
  ownerUserId: text("ownerUserId").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  createdAt:   integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:   integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const creatorProfile = sqliteTable("creatorProfile", {
  id:                 text("id").primaryKey().$defaultFn(cuid),
  accountId:          text("accountId").notNull().unique().references(() => creatorAccount.id, { onDelete: "cascade" }),
  displayName:        text("displayName").notNull(),
  bio:                text("bio"),
  avatarKey:          text("avatarKey"),
  // niches: JSON array of Niche slugs e.g. ["lifestyle","travel"]
  niches:             text("niches", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  // availabilityStatus: "AVAILABLE" | "BOOKED" | "OFF"
  availabilityStatus: text("availabilityStatus").notNull().default("AVAILABLE"),
  // branding: { logoKey?: string, accentColor?: string }
  branding:           text("branding", { mode: "json" }).$type<{ logoKey?: string; accentColor?: string }>().notNull().default(sql`'{}'`),
  location:           text("location"),
  website:            text("website"),
  createdAt:          integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:          integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const socialAccount = sqliteTable("socialAccount", {
  id:                text("id").primaryKey().$defaultFn(cuid),
  accountId:         text("accountId").notNull().references(() => creatorAccount.id, { onDelete: "cascade" }),
  // platform: "INSTAGRAM" | "TIKTOK"
  platform:          text("platform").notNull(),
  handle:            text("handle").notNull(),
  followers:         integer("followers").notNull().default(0),
  engagementRateBps: integer("engagementRateBps").notNull().default(0),
  avgViews:          integer("avgViews").notNull().default(0),
  audience:          text("audience", { mode: "json" }).$type<{ gender?: Record<string, number>; ageBands?: Record<string, number>; topCountries?: { code: string; label: string; pct: number }[] }>().notNull().default(sql`'{}'`),
  source:            text("source").notNull().default("SELF_REPORTED"),
  consentGrantedAt:  integer("consentGrantedAt", { mode: "timestamp_ms" }),
  disconnectedAt:    integer("disconnectedAt",   { mode: "timestamp_ms" }),
  createdAt:         integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:         integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
}, (t) => [uniqueIndex("socialAccount_account_platform_unique").on(t.accountId, t.platform)]);

export const analyticsSnapshot = sqliteTable("analyticsSnapshot", {
  id:                text("id").primaryKey().$defaultFn(cuid),
  socialAccountId:   text("socialAccountId").notNull().references(() => socialAccount.id, { onDelete: "cascade" }),
  accountId:         text("accountId").notNull(),
  followers:         integer("followers").notNull(),
  engagementRateBps: integer("engagementRateBps").notNull(),
  avgViews:          integer("avgViews").notNull(),
  audience:          text("audience", { mode: "json" }).notNull().default(sql`'{}'`),
  source:            text("source").notNull(),
  capturedAt:        integer("capturedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const postSample = sqliteTable("postSample", {
  id:              text("id").primaryKey().$defaultFn(cuid),
  socialAccountId: text("socialAccountId").notNull().references(() => socialAccount.id, { onDelete: "cascade" }),
  accountId:       text("accountId").notNull(),
  platform:        text("platform").notNull(),
  url:             text("url"),
  views:           integer("views").notNull(),
  isPaid:          integer("isPaid", { mode: "boolean" }).notNull().default(false),
  postedAt:        integer("postedAt", { mode: "timestamp_ms" }),
  createdAt:       integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const deliverable = sqliteTable("deliverable", {
  id:                 text("id").primaryKey().$defaultFn(cuid),
  accountId:          text("accountId").notNull().references(() => creatorAccount.id, { onDelete: "cascade" }),
  platform:           text("platform").notNull(),
  // type: "REEL" | "CAROUSEL" | "STORY" | "VIDEO" | "LIVE" | "SLIDE"
  type:               text("type").notNull(),
  label:              text("label"),
  description:        text("description"),
  isActive:           integer("isActive", { mode: "boolean" }).notNull().default(true),
  reachUsed:          integer("reachUsed").notNull().default(0),
  suggestedRateCents: integer("suggestedRateCents").notNull().default(0),
  finalRateCents:     integer("finalRateCents").notNull().default(0),
  floorCents:         integer("floorCents").notNull().default(0),
  stretchCents:       integer("stretchCents").notNull().default(0),
  breakdown:          text("breakdown", { mode: "json" }).$type<{ avgReach: number; cpmCents: number; formatMultiplierBps: number; engAdjBps: number; weightedReach: number; baseCents: number } | Record<string, never>>().notNull().default(sql`'{}'`),
  createdAt:          integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:          integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
}, (t) => [uniqueIndex("deliverable_account_platform_type_unique").on(t.accountId, t.platform, t.type)]);

export const bundle = sqliteTable("bundle", {
  id:             text("id").primaryKey().$defaultFn(cuid),
  accountId:      text("accountId").notNull().references(() => creatorAccount.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  deliverableIds: text("deliverableIds", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  discountBps:    integer("discountBps").notNull().default(0),
  computedCents:  integer("computedCents").notNull().default(0),
  isActive:       integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt:      integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:      integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const addOn = sqliteTable("addOn", {
  id:          text("id").primaryKey().$defaultFn(cuid),
  accountId:   text("accountId").notNull().references(() => creatorAccount.id, { onDelete: "cascade" }),
  // type: "USAGE_RIGHTS" | "WHITELISTING" | "RUSH" | "EXCLUSIVITY" | "OTHER"
  type:        text("type").notNull(),
  label:       text("label"),
  description: text("description"),
  priceCents:  integer("priceCents").notNull().default(0),
  isActive:    integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt:   integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:   integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const workItem = sqliteTable("workItem", {
  id:           text("id").primaryKey().$defaultFn(cuid),
  accountId:    text("accountId").notNull().references(() => creatorAccount.id, { onDelete: "cascade" }),
  platform:     text("platform").notNull(),
  sourceUrl:    text("sourceUrl").notNull(),
  embedHtml:    text("embedHtml"),
  thumbnailKey: text("thumbnailKey"),
  caption:      text("caption"),
  order:        integer("order").notNull().default(0),
  createdAt:    integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:    integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const brand = sqliteTable("brand", {
  id:           text("id").primaryKey().$defaultFn(cuid),
  accountId:    text("accountId").notNull().references(() => creatorAccount.id, { onDelete: "cascade" }),
  name:         text("name").notNull(),
  contactName:  text("contactName"),
  contactEmail: text("contactEmail"),
  logoKey:      text("logoKey"),
  notes:        text("notes"),
  createdAt:    integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:    integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const ratePage = sqliteTable("ratePage", {
  id:                 text("id").primaryKey().$defaultFn(cuid),
  accountId:          text("accountId").notNull().references(() => creatorAccount.id, { onDelete: "cascade" }),
  token:              text("token").notNull().unique(),
  // status: "DRAFT" | "PUBLISHED"
  status:             text("status").notNull().default("DRAFT"),
  theme:              text("theme", { mode: "json" }).notNull().default(sql`'{}'`),
  preparedForBrandId: text("preparedForBrandId").references(() => brand.id),
  frozenRates:        text("frozenRates", { mode: "json" }).notNull().default(sql`'{}'`),
  publishedAt:        integer("publishedAt", { mode: "timestamp_ms" }),
  createdAt:          integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:          integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const ratePageView = sqliteTable("ratePageView", {
  id:         text("id").primaryKey().$defaultFn(cuid),
  ratePageId: text("ratePageId").notNull().references(() => ratePage.id, { onDelete: "cascade" }),
  accountId:  text("accountId").notNull(),
  ip:         text("ip"),
  userAgent:  text("userAgent"),
  referrer:   text("referrer"),
  viewedAt:   integer("viewedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const proposal = sqliteTable("proposal", {
  id:                 text("id").primaryKey().$defaultFn(cuid),
  accountId:          text("accountId").notNull().references(() => creatorAccount.id, { onDelete: "cascade" }),
  brandId:            text("brandId").notNull().references(() => brand.id),
  token:              text("token").notNull().unique(),
  version:            integer("version").notNull().default(1),
  // status: "DRAFT" | "SENT" | "VIEWED" | "CHANGES_NEEDED" | "APPROVED" | "LOST" | "EXPIRED"
  status:             text("status").notNull().default("DRAFT"),
  title:              text("title"),
  lineItems:          text("lineItems",  { mode: "json" }).$type<{ label: string; priceCents: number; qty: number }[]>().notNull().default(sql`'[]'`),
  milestones:         text("milestones", { mode: "json" }).notNull().default(sql`'[]'`),
  totalCents:         integer("totalCents").notNull().default(0),
  signatureName:      text("signatureName"),
  signatureIp:        text("signatureIp"),
  approvedAt:         integer("approvedAt",  { mode: "timestamp_ms" }),
  approvedTotalCents: integer("approvedTotalCents"),
  expiresAt:          integer("expiresAt",   { mode: "timestamp_ms" }),
  notes:              text("notes"),
  sentAt:             integer("sentAt",      { mode: "timestamp_ms" }),
  createdAt:          integer("createdAt",   { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:          integer("updatedAt",   { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const proposalWorkItem = sqliteTable("proposalWorkItem", {
  id:         text("id").primaryKey().$defaultFn(cuid),
  proposalId: text("proposalId").notNull().references(() => proposal.id, { onDelete: "cascade" }),
  workItemId: text("workItemId").notNull().references(() => workItem.id, { onDelete: "cascade" }),
  order:      integer("order").notNull().default(0),
}, (t) => [uniqueIndex("proposalWorkItem_proposal_workItem_unique").on(t.proposalId, t.workItemId)]);

export const proposalView = sqliteTable("proposalView", {
  id:         text("id").primaryKey().$defaultFn(cuid),
  proposalId: text("proposalId").notNull().references(() => proposal.id, { onDelete: "cascade" }),
  accountId:  text("accountId").notNull(),
  ip:         text("ip"),
  userAgent:  text("userAgent"),
  viewedAt:   integer("viewedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

// ════════════════════════════════════════════════════════════
// BRITCH-GOVERNED PRICING PLANE — global, admin-writable only
// ════════════════════════════════════════════════════════════

export const niche = sqliteTable("niche", {
  id:       text("id").primaryKey().$defaultFn(cuid),
  slug:     text("slug").notNull().unique(),
  label:    text("label").notNull(),
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  order:    integer("order").notNull().default(0),
});

export const cpmBenchmark = sqliteTable("cpmBenchmark", {
  id:            text("id").primaryKey().$defaultFn(cuid),
  platform:      text("platform").notNull(),
  nicheId:       text("nicheId").references(() => niche.id),
  // followerTier: "NANO" | "MICRO" | "MID" | "MACRO"
  followerTier:  text("followerTier").notNull(),
  cpmCents:      integer("cpmCents").notNull(),
  source:        text("source"),
  effectiveDate: integer("effectiveDate", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  isActive:      integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt:     integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:     integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
}, (t) => [uniqueIndex("cpmBenchmark_platform_niche_tier_unique").on(t.platform, t.nicheId, t.followerTier)]);

export const formatMultiplier = sqliteTable("formatMultiplier", {
  id:              text("id").primaryKey().$defaultFn(cuid),
  platform:        text("platform").notNull(),
  deliverableType: text("deliverableType").notNull(),
  multiplierBps:   integer("multiplierBps").notNull(),
  isActive:        integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt:       integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:       integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
}, (t) => [uniqueIndex("formatMultiplier_platform_type_unique").on(t.platform, t.deliverableType)]);

export const engineParams = sqliteTable("engineParams", {
  id:                     text("id").primaryKey().$defaultFn(cuid),
  version:                integer("version").notNull().default(1),
  isActive:               integer("isActive", { mode: "boolean" }).notNull().default(true),
  label:                  text("label"),
  reachWeightBps:         integer("reachWeightBps").notNull().default(8500),
  followerWeightBps:      integer("followerWeightBps").notNull().default(1500),
  benchmarkEngagementBps: integer("benchmarkEngagementBps").notNull().default(300),
  engAdjMinBps:           integer("engAdjMinBps").notNull().default(7000),
  engAdjMaxBps:           integer("engAdjMaxBps").notNull().default(13000),
  roundingCents:          integer("roundingCents").notNull().default(5000),
  floorSpreadBps:         integer("floorSpreadBps").notNull().default(2000),
  stretchSpreadBps:       integer("stretchSpreadBps").notNull().default(2000),
  createdAt:              integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:              integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
});

export const seedCreator = sqliteTable("seedCreator", {
  id:          text("id").primaryKey().$defaultFn(cuid),
  handle:      text("handle").notNull(),
  platform:    text("platform").notNull(),
  displayName: text("displayName").notNull(),
  snapshot:    text("snapshot",   { mode: "json" }).notNull(),
  postSample:  text("postSample", { mode: "json" }).notNull().default(sql`'[]'`),
  isActive:    integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt:   integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt:   integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
}, (t) => [uniqueIndex("seedCreator_handle_platform_unique").on(t.handle, t.platform)]);

export const pricingModelVersion = sqliteTable("pricingModelVersion", {
  id:                text("id").primaryKey().$defaultFn(cuid),
  label:             text("label").notNull(),
  paramsSnapshot:    text("paramsSnapshot",    { mode: "json" }).notNull(),
  benchmarkSnapshot: text("benchmarkSnapshot", { mode: "json" }).notNull(),
  publishedAt:       integer("publishedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  publishedBy:       text("publishedBy").notNull(),
});

export const providerConfig = sqliteTable("providerConfig", {
  id:                      text("id").primaryKey().$defaultFn(cuid),
  // activeAnalyticsProvider: "SEEDED" | "MANUAL" | "PHYLLO" | "HYPE_AUDITOR" | "DIRECT_PLATFORM"
  activeAnalyticsProvider: text("activeAnalyticsProvider").notNull().default("SEEDED"),
  oembedTokens:            text("oembedTokens", { mode: "json" }).notNull().default(sql`'{}'`),
  updatedAt:               integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now).$onUpdateFn(now),
  updatedBy:               text("updatedBy"),
});

// ════════════════════════════════════════════════════════════
// Relations — Drizzle joins via `with: { ... }` need these declared
// ════════════════════════════════════════════════════════════

export const userRelations = relations(user, ({ one, many }) => ({
  sessions:       many(session),
  accounts:       many(account),
  creatorAccount: one(creatorAccount, { fields: [user.id], references: [creatorAccount.ownerUserId] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const creatorAccountRelations = relations(creatorAccount, ({ one, many }) => ({
  owner:          one(user,           { fields: [creatorAccount.ownerUserId], references: [user.id] }),
  profile:        one(creatorProfile, { fields: [creatorAccount.id], references: [creatorProfile.accountId] }),
  socialAccounts: many(socialAccount),
  deliverables:   many(deliverable),
  bundles:        many(bundle),
  addOns:         many(addOn),
  workItems:      many(workItem),
  brands:         many(brand),
  ratePages:      many(ratePage),
  proposals:      many(proposal),
}));

export const creatorProfileRelations = relations(creatorProfile, ({ one }) => ({
  account: one(creatorAccount, { fields: [creatorProfile.accountId], references: [creatorAccount.id] }),
}));

export const socialAccountRelations = relations(socialAccount, ({ one, many }) => ({
  account:     one(creatorAccount, { fields: [socialAccount.accountId], references: [creatorAccount.id] }),
  snapshots:   many(analyticsSnapshot),
  postSamples: many(postSample),
}));

export const analyticsSnapshotRelations = relations(analyticsSnapshot, ({ one }) => ({
  socialAccount: one(socialAccount, { fields: [analyticsSnapshot.socialAccountId], references: [socialAccount.id] }),
}));

export const postSampleRelations = relations(postSample, ({ one }) => ({
  socialAccount: one(socialAccount, { fields: [postSample.socialAccountId], references: [socialAccount.id] }),
}));

export const deliverableRelations = relations(deliverable, ({ one }) => ({
  account: one(creatorAccount, { fields: [deliverable.accountId], references: [creatorAccount.id] }),
}));

export const bundleRelations = relations(bundle, ({ one }) => ({
  account: one(creatorAccount, { fields: [bundle.accountId], references: [creatorAccount.id] }),
}));

export const addOnRelations = relations(addOn, ({ one }) => ({
  account: one(creatorAccount, { fields: [addOn.accountId], references: [creatorAccount.id] }),
}));

export const workItemRelations = relations(workItem, ({ one, many }) => ({
  account:       one(creatorAccount, { fields: [workItem.accountId], references: [creatorAccount.id] }),
  proposalItems: many(proposalWorkItem),
}));

export const brandRelations = relations(brand, ({ one, many }) => ({
  account:   one(creatorAccount, { fields: [brand.accountId], references: [creatorAccount.id] }),
  proposals: many(proposal),
  ratePages: many(ratePage),
}));

export const ratePageRelations = relations(ratePage, ({ one, many }) => ({
  account: one(creatorAccount, { fields: [ratePage.accountId], references: [creatorAccount.id] }),
  brand:   one(brand,          { fields: [ratePage.preparedForBrandId], references: [brand.id] }),
  views:   many(ratePageView),
}));

export const ratePageViewRelations = relations(ratePageView, ({ one }) => ({
  ratePage: one(ratePage, { fields: [ratePageView.ratePageId], references: [ratePage.id] }),
}));

export const proposalRelations = relations(proposal, ({ one, many }) => ({
  account:   one(creatorAccount, { fields: [proposal.accountId], references: [creatorAccount.id] }),
  brand:     one(brand,          { fields: [proposal.brandId],   references: [brand.id] }),
  workItems: many(proposalWorkItem),
  views:     many(proposalView),
}));

export const proposalWorkItemRelations = relations(proposalWorkItem, ({ one }) => ({
  proposal: one(proposal, { fields: [proposalWorkItem.proposalId], references: [proposal.id] }),
  workItem: one(workItem, { fields: [proposalWorkItem.workItemId], references: [workItem.id] }),
}));

export const proposalViewRelations = relations(proposalView, ({ one }) => ({
  proposal: one(proposal, { fields: [proposalView.proposalId], references: [proposal.id] }),
}));

export const nicheRelations = relations(niche, ({ many }) => ({
  benchmarks: many(cpmBenchmark),
}));

export const cpmBenchmarkRelations = relations(cpmBenchmark, ({ one }) => ({
  niche: one(niche, { fields: [cpmBenchmark.nicheId], references: [niche.id] }),
}));
