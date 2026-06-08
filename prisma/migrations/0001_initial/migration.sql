-- Britch — Initial D1 Migration
-- Generated from prisma/schema.prisma
-- Run: npx wrangler d1 migrations apply britch-db --local

-- ── Better Auth tables ──────────────────────────────────────────────────────

CREATE TABLE "User" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "email"         TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER NOT NULL DEFAULT 0,
  "image"         TEXT,
  "role"          TEXT NOT NULL DEFAULT 'USER',
  "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     DATETIME NOT NULL
);

CREATE TABLE "Session" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "userId"     TEXT NOT NULL,
  "token"      TEXT NOT NULL UNIQUE,
  "expiresAt"  DATETIME NOT NULL,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Account" (
  "id"                     TEXT NOT NULL PRIMARY KEY,
  "userId"                 TEXT NOT NULL,
  "accountId"              TEXT NOT NULL,
  "providerId"             TEXT NOT NULL,
  "accessToken"            TEXT,
  "refreshToken"           TEXT,
  "accessTokenExpiresAt"   DATETIME,
  "refreshTokenExpiresAt"  DATETIME,
  "scope"                  TEXT,
  "idToken"                TEXT,
  "password"               TEXT,
  "createdAt"              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Verification" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value"      TEXT NOT NULL,
  "expiresAt"  DATETIME NOT NULL,
  "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  DATETIME NOT NULL
);

-- ── Creator-scoped plane ────────────────────────────────────────────────────

CREATE TABLE "CreatorAccount" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "ownerUserId" TEXT NOT NULL UNIQUE,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   DATETIME NOT NULL,
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "CreatorProfile" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "accountId"          TEXT NOT NULL UNIQUE,
  "displayName"        TEXT NOT NULL,
  "bio"                TEXT,
  "avatarKey"          TEXT,
  "niches"             TEXT NOT NULL DEFAULT '[]',
  "availabilityStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "branding"           TEXT NOT NULL DEFAULT '{}',
  "location"           TEXT,
  "website"            TEXT,
  "createdAt"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE
);

CREATE TABLE "SocialAccount" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "accountId"         TEXT NOT NULL,
  "platform"          TEXT NOT NULL,
  "handle"            TEXT NOT NULL,
  "followers"         INTEGER NOT NULL DEFAULT 0,
  "engagementRateBps" INTEGER NOT NULL DEFAULT 0,
  "avgViews"          INTEGER NOT NULL DEFAULT 0,
  "audience"          TEXT NOT NULL DEFAULT '{}',
  "source"            TEXT NOT NULL DEFAULT 'SELF_REPORTED',
  "consentGrantedAt"  DATETIME,
  "disconnectedAt"    DATETIME,
  "createdAt"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE,
  UNIQUE ("accountId", "platform")
);

CREATE TABLE "AnalyticsSnapshot" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "socialAccountId"   TEXT NOT NULL,
  "accountId"         TEXT NOT NULL,
  "followers"         INTEGER NOT NULL,
  "engagementRateBps" INTEGER NOT NULL,
  "avgViews"          INTEGER NOT NULL,
  "audience"          TEXT NOT NULL DEFAULT '{}',
  "source"            TEXT NOT NULL,
  "capturedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE
);

CREATE TABLE "PostSample" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "socialAccountId" TEXT NOT NULL,
  "accountId"       TEXT NOT NULL,
  "platform"        TEXT NOT NULL,
  "url"             TEXT,
  "views"           INTEGER NOT NULL,
  "isPaid"          INTEGER NOT NULL DEFAULT 0,
  "postedAt"        DATETIME,
  "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE
);

CREATE TABLE "Deliverable" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "accountId"          TEXT NOT NULL,
  "platform"           TEXT NOT NULL,
  "type"               TEXT NOT NULL,
  "label"              TEXT,
  "description"        TEXT,
  "isActive"           INTEGER NOT NULL DEFAULT 1,
  "reachUsed"          INTEGER NOT NULL DEFAULT 0,
  "suggestedRateCents" INTEGER NOT NULL DEFAULT 0,
  "finalRateCents"     INTEGER NOT NULL DEFAULT 0,
  "floorCents"         INTEGER NOT NULL DEFAULT 0,
  "stretchCents"       INTEGER NOT NULL DEFAULT 0,
  "breakdown"          TEXT NOT NULL DEFAULT '{}',
  "createdAt"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE,
  UNIQUE ("accountId", "platform", "type")
);

CREATE TABLE "Bundle" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "accountId"      TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "deliverableIds" TEXT NOT NULL DEFAULT '[]',
  "discountBps"    INTEGER NOT NULL DEFAULT 0,
  "computedCents"  INTEGER NOT NULL DEFAULT 0,
  "isActive"       INTEGER NOT NULL DEFAULT 1,
  "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE
);

CREATE TABLE "AddOn" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "accountId"   TEXT NOT NULL,
  "type"        TEXT NOT NULL,
  "label"       TEXT,
  "description" TEXT,
  "priceCents"  INTEGER NOT NULL DEFAULT 0,
  "isActive"    INTEGER NOT NULL DEFAULT 1,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE
);

CREATE TABLE "WorkItem" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "accountId"    TEXT NOT NULL,
  "platform"     TEXT NOT NULL,
  "sourceUrl"    TEXT NOT NULL,
  "embedHtml"    TEXT,
  "thumbnailKey" TEXT,
  "caption"      TEXT,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE
);

CREATE TABLE "Brand" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "accountId"    TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "contactName"  TEXT,
  "contactEmail" TEXT,
  "logoKey"      TEXT,
  "notes"        TEXT,
  "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE
);

CREATE TABLE "RatePage" (
  "id"                  TEXT NOT NULL PRIMARY KEY,
  "accountId"           TEXT NOT NULL,
  "token"               TEXT NOT NULL UNIQUE,
  "status"              TEXT NOT NULL DEFAULT 'DRAFT',
  "theme"               TEXT NOT NULL DEFAULT '{}',
  "preparedForBrandId"  TEXT,
  "frozenRates"         TEXT NOT NULL DEFAULT '{}',
  "publishedAt"         DATETIME,
  "createdAt"           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE,
  FOREIGN KEY ("preparedForBrandId") REFERENCES "Brand"("id")
);

CREATE TABLE "RatePageView" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "ratePageId" TEXT NOT NULL,
  "accountId"  TEXT NOT NULL,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "referrer"   TEXT,
  "viewedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("ratePageId") REFERENCES "RatePage"("id") ON DELETE CASCADE
);

CREATE TABLE "Proposal" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "accountId"          TEXT NOT NULL,
  "brandId"            TEXT NOT NULL,
  "token"              TEXT NOT NULL UNIQUE,
  "version"            INTEGER NOT NULL DEFAULT 1,
  "status"             TEXT NOT NULL DEFAULT 'DRAFT',
  "title"              TEXT,
  "lineItems"          TEXT NOT NULL DEFAULT '[]',
  "milestones"         TEXT NOT NULL DEFAULT '[]',
  "totalCents"         INTEGER NOT NULL DEFAULT 0,
  "signatureName"      TEXT,
  "signatureIp"        TEXT,
  "approvedAt"         DATETIME,
  "approvedTotalCents" INTEGER,
  "expiresAt"          DATETIME,
  "notes"              TEXT,
  "sentAt"             DATETIME,
  "createdAt"          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          DATETIME NOT NULL,
  FOREIGN KEY ("accountId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE,
  FOREIGN KEY ("brandId") REFERENCES "Brand"("id")
);

CREATE TABLE "ProposalWorkItem" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "proposalId" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "order"      INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE,
  FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE,
  UNIQUE ("proposalId", "workItemId")
);

CREATE TABLE "ProposalView" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "proposalId" TEXT NOT NULL,
  "accountId"  TEXT NOT NULL,
  "ip"         TEXT,
  "userAgent"  TEXT,
  "viewedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE
);

-- ── Britch-governed pricing plane ───────────────────────────────────────────

CREATE TABLE "Niche" (
  "id"       TEXT NOT NULL PRIMARY KEY,
  "slug"     TEXT NOT NULL UNIQUE,
  "label"    TEXT NOT NULL,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "order"    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE "CpmBenchmark" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "platform"      TEXT NOT NULL,
  "nicheId"       TEXT,
  "followerTier"  TEXT NOT NULL,
  "cpmCents"      INTEGER NOT NULL,
  "source"        TEXT,
  "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive"      INTEGER NOT NULL DEFAULT 1,
  "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     DATETIME NOT NULL,
  FOREIGN KEY ("nicheId") REFERENCES "Niche"("id"),
  UNIQUE ("platform", "nicheId", "followerTier")
);

CREATE TABLE "FormatMultiplier" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "platform"        TEXT NOT NULL,
  "deliverableType" TEXT NOT NULL,
  "multiplierBps"   INTEGER NOT NULL,
  "isActive"        INTEGER NOT NULL DEFAULT 1,
  "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       DATETIME NOT NULL,
  UNIQUE ("platform", "deliverableType")
);

CREATE TABLE "EngineParams" (
  "id"                     TEXT NOT NULL PRIMARY KEY,
  "version"                INTEGER NOT NULL DEFAULT 1,
  "isActive"               INTEGER NOT NULL DEFAULT 1,
  "label"                  TEXT,
  "reachWeightBps"         INTEGER NOT NULL DEFAULT 8500,
  "followerWeightBps"      INTEGER NOT NULL DEFAULT 1500,
  "benchmarkEngagementBps" INTEGER NOT NULL DEFAULT 300,
  "engAdjMinBps"           INTEGER NOT NULL DEFAULT 7000,
  "engAdjMaxBps"           INTEGER NOT NULL DEFAULT 13000,
  "roundingCents"          INTEGER NOT NULL DEFAULT 5000,
  "floorSpreadBps"         INTEGER NOT NULL DEFAULT 2000,
  "stretchSpreadBps"       INTEGER NOT NULL DEFAULT 2000,
  "createdAt"              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              DATETIME NOT NULL
);

CREATE TABLE "SeedCreator" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "handle"      TEXT NOT NULL,
  "platform"    TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "snapshot"    TEXT NOT NULL,
  "postSample"  TEXT NOT NULL DEFAULT '[]',
  "isActive"    INTEGER NOT NULL DEFAULT 1,
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   DATETIME NOT NULL,
  UNIQUE ("handle", "platform")
);

CREATE TABLE "PricingModelVersion" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "label"             TEXT NOT NULL,
  "paramsSnapshot"    TEXT NOT NULL,
  "benchmarkSnapshot" TEXT NOT NULL,
  "publishedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedBy"       TEXT NOT NULL
);

CREATE TABLE "ProviderConfig" (
  "id"                      TEXT NOT NULL PRIMARY KEY,
  "activeAnalyticsProvider" TEXT NOT NULL DEFAULT 'SEEDED',
  "oembedTokens"            TEXT NOT NULL DEFAULT '{}',
  "updatedAt"               DATETIME NOT NULL,
  "updatedBy"               TEXT
);

-- ── Indexes for common query patterns ───────────────────────────────────────
CREATE INDEX "Session_userId_idx"            ON "Session"("userId");
CREATE INDEX "SocialAccount_accountId_idx"   ON "SocialAccount"("accountId");
CREATE INDEX "PostSample_socialAccountId_idx" ON "PostSample"("socialAccountId");
CREATE INDEX "Deliverable_accountId_idx"     ON "Deliverable"("accountId");
CREATE INDEX "WorkItem_accountId_idx"        ON "WorkItem"("accountId");
CREATE INDEX "Brand_accountId_idx"           ON "Brand"("accountId");
CREATE INDEX "Proposal_accountId_idx"        ON "Proposal"("accountId");
CREATE INDEX "Proposal_brandId_idx"          ON "Proposal"("brandId");
CREATE INDEX "CpmBenchmark_platform_idx"     ON "CpmBenchmark"("platform");
