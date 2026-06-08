# Britch — Creator Pricing & Proposal Platform

> **Working name.** Britch = **Br**and + Pi**tch**. Name not yet cleared — placeholder until trademark/domain clearance.

B2B SaaS that helps mid-sized content creators **price themselves with data**, present an **agency-grade public rate page**, and send **sharp, scoped proposals** to brands. Britch is **not** a marketplace and never matches creators to brands — it is a tool the creator controls.

Reverse-engineered from the TTP Budget platform: we keep the proven spine (**rate menu → proposal → tokenized public page → PDF → approval**) and add the two things TTP never had — a **data-driven rate engine** and a **centrally-governed pricing-data plane** that Britch staff tune from an admin backend.

The core thesis, baked into the math: **creators are priced on reach, not follower count.** A creator with 30K followers and 200K average views is priced on the 200K.

---

## Stack — fully native to Cloudflare

| Layer            | Choice                                                                 |
|------------------|------------------------------------------------------------------------|
| Framework        | Next.js 15 (App Router) + TypeScript                                   |
| UI               | Tailwind + shadcn/ui                                                   |
| Hosting          | **Cloudflare Workers** via `@opennextjs/cloudflare` (not Pages)        |
| Database         | **Cloudflare D1** (SQLite) — native, free tier                         |
| ORM              | Prisma + **D1 driver adapter** (`driverAdapters`)                      |
| Auth             | **Better Auth** — self-hosted on Workers, sessions in KV/D1 (no third-party SaaS) |
| Sessions / cache | **Cloudflare KV** (also OpenNext incremental cache)                    |
| File storage     | **Cloudflare R2** (PDFs, avatars, cached work thumbnails)              |
| Bot protection   | **Cloudflare Turnstile** (public pages + signup)                       |
| Email            | **Resend** — HTTP API; the *one* external dependency (no Cloudflare-native transactional send) |
| PDF              | `@react-pdf/renderer` — runs in the Worker (**verify, see Spikes**)    |
| Embeds           | Official **oEmbed** (TikTok open; Instagram token-gated) + cover-image fallback |

### Native-Cloudflare specifics & tradeoffs
Everything bundles into Cloudflare's free tier for MVP: Workers (~100k req/day), D1 (5GB, ~5M row-reads/day), KV, R2 (10GB), Turnstile. The only external service is Resend (free tier, HTTP).

**D1 is SQLite — the consequences to internalize:**
- **No `DECIMAL` type → everything numeric is an integer.** Money = **cents**. Multipliers, rates, percentages = **integer basis points** (1.0× = `10000`, 0.5× = `5000`, 3.0% engagement = `300`). All engine math runs in integers; we divide/format only at display. (This *replaces* the earlier `Decimal(5,4)` plan — integers are more robust here, no rounding drift.)
- **No native `enum` → enums are validated strings** at the app layer (Prisma `String` + a TS union / zod guard).
- **SQLite is single-writer;** D1 manages this at Cloudflare's edge. Fine at MVP write volume; revisit only if we become write-heavy.
- **JSON** stored as text columns (Prisma `Json` maps cleanly).
- **Escape hatch:** if we outgrow D1, the Prisma abstraction makes a move to Neon Postgres a *contained* change (swap the driver adapter, reconcile integer→Decimal types).

**Config:** `nodejs_compat` flag + compatibility date `2024-09-23` or later.

### Spikes — prove before building broadly
1. **Better Auth on Workers/OpenNext** — protected routes + sessions (KV/D1) working under the adapter.
2. **`@react-pdf/renderer` in the Workers runtime** — render a test PDF. Riskiest native piece. If it fails, fall back to a separate PDF render path (e.g., a dedicated Worker/queue). **Do not build the proposal PDF on an unproven foundation.**

### Hard rule
- **No LLM / Claude API anywhere in the runtime.** Deliberate cost decision. SeededProvider + manual entry power the MVP. (Screenshot→numbers vision extraction is explicitly deferred as a future optional toggle, since it would require an API.)

---

## Two Data Planes

This is the central architectural difference from TTP. TTP had one plane (workspace-scoped data) plus a copy-on-create global library. Britch has two **live** planes:

### 1. Creator-scoped plane (row-level secured)
Everything a creator owns: profile, social accounts, analytics snapshots, post samples, deliverables, rate pages, work items, brands, proposals, invoices. Scoped by `accountId`, enforced by a Prisma `$extends()` wrapper (the TTP `getScopedDb()` pattern, re-keyed from `workspaceId` → `accountId`). A query can never return another account's data.

### 2. Britch-governed pricing plane (global, live, admin-only-writable)
The pricing intelligence: CPM benchmarks, format multipliers, niche taxonomy, engine parameters, seed creators. **Not** scoped. **Read by every creator's rate engine; writable only through Britch Admin.** Unlike TTP's library (which copies into a workspace and then diverges), this data stays **centrally authoritative** — when Britch changes a CPM, every creator's *suggested* rates move.

> **Snapshot discipline (inherited from TTP).** Suggested rates recompute **live** from current global benchmarks. But the moment a creator **publishes a rate page** or **sends a proposal**, the numbers are **frozen** onto that record. Retuning the model never silently rewrites a proposal a brand already received.

---

## Multi-tenancy & "managers later"

MVP is **one creator = one account**, solo, no team UI. But the schema is manager-ready from day one:

- `Account` owns all creator-scoped data and has an `ownerUserId`.
- Identity comes from **Better Auth** (`User`), mapped to a single `Account` in MVP.
- A future `Membership` join (`userId`, `accountId`, `role`) lets a manager/agency attach to multiple creator accounts later — **no migration needed**, just expose the UI.

---

## Money & Number Conventions

- **Money:** integer **cents**. `$1,200 → 120000`. Never floats.
- **Everything else numeric:** **integer basis points**, because D1/SQLite has no `DECIMAL`. Multiplier `1.0× → 10000`; `0.5× → 5000`. Engagement `3.0% → 300`. CPM stored in **cents per 1,000** (`$12.00 → 1200`).
- **All engine math is integer**; format to human units only at the display edge.
- **Rates snapshot on save.** A `Deliverable` stores both `suggestedRateCents` (recomputed live) and `finalRateCents` (creator's chosen number). Published artifacts freeze the full computed set.

---

## Data Model — at a glance

```
══════════════ CREATOR-SCOPED PLANE (accountId row-level security) ══════════════

Account (1)
  ├── ownerUserId  (Better Auth User)
  ├── (future) Membership[]  →  managers, not exposed in MVP
  ├── CreatorProfile
  │     ├── displayName, bio, avatarKey (R2)
  │     ├── niches[]            → references global Niche taxonomy
  │     ├── availabilityStatus  ("AVAILABLE" | "BOOKED" | "OFF" — validated string)
  │     └── branding            JSON — { logoKey, accentColor } for their own pages
  │
  ├── SocialAccount[]          (current connection state, per platform)
  │     ├── platform           ("INSTAGRAM" | "TIKTOK" ; YOUTUBE/SNAP later)
  │     ├── handle
  │     ├── followers          int
  │     ├── engagementRateBps  int   (300 = 3.0%)
  │     ├── avgViews           int    ← drives pricing (reach, not followers)
  │     ├── audience           JSON — { gender{}, ageBands{}, topCountries[] }
  │     └── source             ("SEEDED" | "SELF_REPORTED" | "VERIFIED" | "THIRD_PARTY")
  │           │
  │           ├── AnalyticsSnapshot[]   (point-in-time history — trend over time, V1.1)
  │           │
  │           └── PostSample[]          ← rate-engine fuel (onboarding "last 20")
  │                 ├── platform
  │                 ├── url             (optional in MVP)
  │                 ├── views           int
  │                 ├── isPaid          bool   (paid vs organic)
  │                 └── postedAt        (optional)
  │             // Organic-only views feed avgReach. "Import spec" formalizes this later.
  │
  ├── Deliverable[]            (the rate menu)
  │     ├── platform, type     ("REEL" | "CAROUSEL" | "STORY" | "VIDEO" | "LIVE" | "SLIDE" | …)
  │     ├── reachUsed          int   (snapshot of avg organic reach at compute)
  │     ├── suggestedRateCents int   (recomputed live from global plane)
  │     ├── finalRateCents     int   (creator override; defaults to suggested)
  │     ├── floorCents         int   (private negotiation floor)
  │     └── breakdown          JSON — the "Why this rate?" intermediates
  │
  ├── Bundle[]                 ( name, deliverableIds[], discountBps, computedCents )
  ├── AddOn[]                  ( "USAGE_RIGHTS" | "WHITELISTING" | "RUSH" | … , priceCents )
  │
  ├── WorkItem[]               (Featured Work / moodboard)
  │     ├── platform, sourceUrl
  │     ├── embedHtml          (from oEmbed; nullable)
  │     ├── thumbnailKey       (R2 — fetched-once, never hotlinked)
  │     ├── caption, order
  │
  ├── Brand[]                  (who the creator pitches — TTP "Client" analog)
  │     ├── name, contactName, contactEmail, logoKey
  │
  ├── RatePage[]               (public /r/[token])
  │     ├── token, theme, status ("DRAFT" | "PUBLISHED")
  │     ├── preparedForBrandId  (optional personalization — V1.1)
  │     ├── frozenRates         JSON — snapshot of rates at publish
  │     └── RatePageView[]      (tokenized view analytics)
  │
  ├── Proposal[]               (public /p/[token] + PDF — the TTP spine)
  │     ├── token, version, status
  │     │     ("DRAFT"→"SENT"→"VIEWED"→"CHANGES_NEEDED"→"SENT"→"APPROVED" | "LOST" | "EXPIRED")
  │     ├── brandId
  │     ├── lineItems           JSON — frozen deliverables + add-ons at send
  │     ├── milestones          JSON — payment schedule (bps or flat cents; sums to 10000 bps)
  │     ├── ProposalWorkItem[]  ← curated subset of WorkItem per proposal
  │     ├── signatureName, signatureIp, approvedAt, approvedTotalCents
  │     └── ProposalView[]      (read receipts)
  │
  └── Invoice[]                 (public /i/[token] — V1.1)

══════════════ BRITCH-GOVERNED PRICING PLANE (global, admin-only) ══════════════

Niche                ( slug, label, isActive )                       ← taxonomy creators pick from
CpmBenchmark         ( platform, nicheId?, followerTier, cpmCents,   ← engine reads this (cents per 1,000)
                       source, effectiveDate )
                       // nicheId NULL = generic MVP model; populated later = niche-adjusted
FormatMultiplier     ( platform, deliverableType, multiplierBps )    ← Reel 10000, Story 5000, etc.
EngineParams         ( reachWeightBps, followerWeightBps,            ← global knobs (singleton, versioned)
                       benchmarkEngagementBps, engAdjMinBps, engAdjMaxBps,
                       roundingCents, floorSpreadBps, stretchSpreadBps )
SeedCreator          ( handle, platform, snapshot JSON, postSample JSON ) ← powers SeededProvider
PricingModelVersion  ( params snapshot, benchmarks snapshot, label, publishedAt )  ← rollback (V1.1)
AdminUser / role     ( role flag on Better Auth User — gates /admin )
AuditLog             ( actorId, entity, before, after, at )          ← V1.1
ProviderConfig       ( activeAnalyticsProvider, oembedTokens JSON )  ← switch source w/o deploy
```

---

## Seed values (v0 — all admin-editable from day one)

Starting calibration from published 2026 benchmarks. **These are guesses to be tuned in `/admin`, not ground truth.**

**Niches (10):** Lifestyle, Beauty, Food, Fitness, Tech, Gaming, Fashion, Finance, Travel, Comedy.

**Generic CPM (`nicheId = NULL`, cents per 1,000 reach):** Instagram `1200` ($12), TikTok `1000` ($10). *(Niche-specific rows layered in later via admin.)*

**Format multipliers (bps, baseline video unit = 10000):**
- Instagram: Reel `10000`, Carousel `8500`, Story `5000`
- TikTok: Video `10000`, Story/Slide `5000`, Live `12000`

**EngineParams defaults:**
- `reachWeightBps 8500` / `followerWeightBps 1500` (price mostly on reach; followers as fallback when view data is thin)
- `benchmarkEngagementBps 300` (3% baseline), engagement adjustment clamped `engAdjMinBps 7000` … `engAdjMaxBps 13000`
- `roundingCents 5000` (round to nearest $50)
- `floorSpreadBps 2000` (floor = 20% below target), `stretchSpreadBps 2000` (stretch = 20% above)

**Seed creator (powers the demo):** "Sarah Creates" — niches Lifestyle/Travel/Fashion — TikTok @sarah_creates 500K / 4.5%, Instagram @sarah.creates 245K / 3.8% — audience + last-20 post sample stored on the seed record so the engine computes real numbers end-to-end.

---

## The Rate Engine (core IP)

A pure function. Reads the global plane, consumes a creator's normalized snapshot + post sample, emits rates **plus the breakdown that powers "Why this rate?"**. All integer math.

```
avgReach        = mean(views of organic PostSample for that platform)        // organic only
cpm             = CpmBenchmark(platform, niche?, followerTier).cpmCents       // falls back to generic
formatMult      = FormatMultiplier(platform, deliverableType).multiplierBps
engAdj          = clamp( engagementRateBps * 10000 / benchmarkEngagementBps,  // ratio in bps
                         engAdjMinBps, engAdjMaxBps )
weightedReach   = (avgReach * reachWeightBps + followers * followerWeightBps) / 10000

baseCents       = weightedReach * cpm / 1000 * formatMult / 10000 * engAdj / 10000
target          = roundTo(baseCents, roundingCents)
floor           = roundTo(target * (10000 - floorSpreadBps)   / 10000, roundingCents)
stretch         = roundTo(target * (10000 + stretchSpreadBps) / 10000, roundingCents)

breakdown       = { avgReach, cpm, formatMult, engAdj, weightedReach, baseCents }
```

- **Compute time:** reads live global params. **Save time:** result + breakdown freeze onto `Deliverable` / artifact.
- **"Why this rate?"** is just `breakdown` surfaced in the UI — no extra computation, no API.
- **Range** (floor / target / stretch) gives entry-level creators a walk-away line, not a sticker price.
- The engine is the thing **Britch Admin tunes**; every knob above lives in the global plane.

---

## Providers (pluggable — the "swap source, zero rewrite" layer)

```
interface AnalyticsProvider { fetchSnapshot(handle, platform): AnalyticsSnapshot }
  SeededProvider        // MVP — returns seed-creator data
  ManualProvider        // MVP — creator-entered form values
  PhylloProvider        // later — consented, verified private metrics
  HypeAuditorProvider   // later — third-party benchmark/audience (licensed API)
  DirectPlatformProvider// later — Meta/TikTok/YouTube OAuth (the "Foam model")

interface OEmbedProvider { resolve(url): { embedHtml?, thumbnailUrl? } }
  TikTokOEmbed          // open, no auth
  InstagramOEmbed       // requires Meta app token (oEmbed only, NOT analytics app-review)
  CoverImageFallback    // creator-supplied cover if oEmbed unavailable
```

`ProviderConfig` in the admin plane selects the active analytics provider without a deploy. The rate engine only ever sees a normalized `AnalyticsSnapshot` — it never knows or cares which provider produced it.

> **Work embeds.** On paste: attempt oEmbed → store embed HTML (web) + **fetch the thumbnail once and cache it in R2** (never hotlink the platform's expiring URL). Web view = live embed where available, image card otherwise. PDF = always the R2 thumbnail + tappable link.

---

## App Routes

### Creator app (auth required — Better Auth)
| Route | Description | Phase |
|-------|-------------|-------|
| `/onboarding` | Wizard: identity → connect/enter stats → niche → last-20 post sample → done | MVP |
| `/dashboard` | Snapshot, rate-page status, recent activity | MVP |
| `/analytics` | Followers, engagement, avg reach, audience per platform | MVP |
| `/rates` | Rate-page builder: deliverables, bundles, add-ons, theme, work items, publish | MVP |
| `/proposals` | Proposal list (Kanban pipeline → V1.1) | MVP |
| `/proposals/[id]` | Proposal editor — scope, milestones, attach work items | MVP |
| `/brands` | Brand/client list | MVP |
| `/settings` | Account, connected accounts (+disconnect/delete), branding, delete account | MVP |

### Public (no auth, tokenized, Turnstile-protected)
| Route | Description | Phase |
|-------|-------------|-------|
| `/r/[token]` | Public rate page (the agency-grade mockup) — draft-aware preview banner | MVP |
| `/p/[token]` | Public proposal — approve, download PDF, request changes; embedded work | MVP |
| `/i/[token]` | Public invoice — payment details + PDF | V1.1 |
| `/calc` | Pre-signup teaser calculator (handle → teaser range → sign up) | V1.1 |

### Britch Admin (role-flagged `/admin` group; logic quarantined in its own module behind a hard role guard)
| Route | Description | Phase |
|-------|-------------|-------|
| `/admin` | Admin dashboard | MVP |
| `/admin/benchmarks` | CPM benchmark manager (platform × niche × tier) | MVP |
| `/admin/multipliers` | Format multiplier manager | MVP |
| `/admin/niches` | Niche taxonomy manager | MVP |
| `/admin/engine` | Engine parameters **+ rate sandbox** (test inputs → output, validate before publish) | MVP |
| `/admin/seed-creators` | Seed creator CRUD (powers SeededProvider) | MVP |
| `/admin/providers` | Active provider + oEmbed token config | MVP-lite |
| `/admin/users` | Creator/account management + support actions | V1.1 |
| `/admin/models` | Versioned pricing models + rollback | V1.1 |
| `/admin/audit` | Parameter-change audit log | V1.1 |

---

## The Core Artifacts

### 1. Rate Page (`/rates` builder → public `/r/[token]`)
Per-platform deliverable menu with data-backed rates, bundles, add-ons, audience snapshot, a **Featured Work** strip, an availability status, and the signature **"Why this rate?"** reveal. Ends in a **start-a-deal CTA** ("Request to work together") — the front door to the proposal loop, not a dead-end price list. Token-driven theming. Publish freezes the rate set.

### 2. Proposal (`/proposals/[id]` → public `/p/[token]` + PDF)
The TTP spine, reskinned: scoped deliverables + add-ons, payment milestones (bps or flat, must sum to 10000 bps), curated **work-item proof** (embeds on web, R2 thumbnails on PDF), tokenized public page, read receipts, typed-signature approval, version auto-increment, full status lifecycle.

### 3. Pricing Intelligence (engine + admin)
The rate engine + the admin plane that governs it. The creator sees rates and the breakdown; Britch staff tune CPMs, multipliers, niches, and engine knobs, and validate changes in the sandbox before publishing.

### 4. Featured Work / Moodboard
Paste an IG/TikTok link → oEmbed → embed on web, R2-cached thumbnail on PDF. Curate a subset per proposal so the creator tailors proof to each brand. **Proof beats persuasion** — this replaced the cut AI features.

---

## Onboarding Flow

1. **Identity** — display name, niche selection (from global taxonomy), avatar.
2. **Stats** — type username + platform (IG / TikTok) → SeededProvider returns the snapshot; OR manual entry (followers, engagement, avg views, audience).
3. **Post sample** — last **20** posts: platform, views, **paid or organic**. Organic views feed `avgReach`. *(Formalized as an import spec later.)*
4. **Compute** — rate engine produces initial suggested rates → land on `/rates`.

---

## Phasing summary

- **MVP** — onboarding, manual/seeded stats, post sample, rate engine + "why this rate" + range, rate-page builder & public page, proposal builder/send/PDF/approval/read-receipts, brands, featured work (oEmbed + R2 thumbnails), settings w/ data deletion; Admin: benchmarks, multipliers, niches, engine + sandbox, seed creators, provider config.
- **V1.1** — usage-rights/licensing calculator, deal pipeline (Kanban), invoices, "prepared-for-brand" personalization, teaser calculator, marketing/education site, snapshot trend history, versioned pricing models, admin user mgmt + audit log, media kit.
- **V2** — percentile benchmarking, live verified providers (Phyllo / direct OAuth). *(Counter-offer AI and outreach templates were cut to avoid runtime API cost.)*

---

## Conventions (carried from TTP, adapted)

- **Row-level security:** scoped Prisma `$extends()` injecting `accountId` on every creator-scoped query. Admin + global-plane writes bypass scoping behind the admin role gate.
- **Two planes, never crossed:** creators can read the global plane only as computed rates; they can never read or write benchmark rows directly.
- **Snapshot on save:** published rate pages and sent proposals freeze their numbers; retuning the model never rewrites history.
- **Money = integer cents; all other numerics = integer basis points** (no Decimal — D1/SQLite).
- **Enums = validated strings** (Prisma `String` + TS union/zod).
- **R2 for all blobs**, including fetch-once work thumbnails — never hotlink expiring platform URLs.
- **Consent hygiene:** every connected account has explicit consent + one-click disconnect/delete (GDPR/CCPA), even in the seeded MVP.
- **No runtime LLM/API calls.**
- **Admin quarantine:** admin server actions live in their own module behind a hard role guard — never a creator action with an `if admin` branch. Makes a future separate admin app a move, not a rewrite.
- **Provider abstraction:** all external data behind `AnalyticsProvider` / `OEmbedProvider`, switchable via `ProviderConfig`.

---

## Locked decisions
- **Hosting/data:** fully native Cloudflare — Workers + D1 + KV + R2 + Turnstile, free tier. Resend the lone external (email).
- **Auth:** Better Auth, self-hosted on Workers (replaces Clerk).
- **Numerics:** integer cents + integer basis points (no Decimal).
- **Admin access:** role-flagged `/admin` group, logic quarantined behind a hard role guard.
- **Niches + seed CPM/multiplier values:** as above; all editable from `/admin`.

## Open items (resolve via Spikes, not debate)
- **Spike 1:** Better Auth on Workers/OpenNext.
- **Spike 2:** `@react-pdf/renderer` in the Workers runtime (fallback path if it fails).
- Confirm D1 free-tier limits cover MVP (they do at expected volume; monitor row-reads).
- Lock `followerTier` boundaries for `CpmBenchmark` (e.g., <10K / 10–50K / 50–250K / 250K+).
