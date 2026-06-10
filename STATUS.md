# Britch — Build Status

> Updated after Step 7. Reflects what's built, what's stubbed, and what's deferred.

---

## ✅ Completed (Steps 0–7)

### Infrastructure
- [x] Next.js 15 App Router + `@opennextjs/cloudflare` — deploys to Cloudflare Workers
- [x] `wrangler.toml` — D1, KV, R2, Turnstile, Better Auth bindings
- [x] `open-next.config.ts` — worker wrapper, edge converter, dummy cache/queue
- [x] `tsconfig.json` + `tsconfig.test.json` (vitest globals isolated from Workers types)
- [x] Tailwind + Britch design tokens (ink/volt/flush/paper/electric, Clash Display, General Sans, Space Mono)
- [x] `shadcn/ui` components.json configured

### Database
- [x] Prisma schema — 26 models, both data planes, zero Decimal/Float, all money = Int cents
- [x] D1 migration SQL (`prisma/migrations/0001_initial/migration.sql`) — 31 tables + indexes
- [x] Global seed SQL (`prisma/seed.sql`) — niches, CPM benchmarks, format multipliers, EngineParams, ProviderConfig
- [x] Demo seed SQL (`prisma/seed-demo.sql`) — Creator Name user, account, deliverables, RatePage at `/r/demo-creator`
- [x] `getScopedDb()` — Prisma `$extends()` row-level security wrapper (accountId injected on all scoped models)
- [x] `getPrisma()` — global plane client (admin-only writes)

### Auth
- [x] `createAuth(d1)` factory — Better Auth v1.6.14, `prismaAdapter`, cookie sessions, `nextCookies()` plugin
- [x] `getSession()` / `requireSession()` helpers
- [x] `app/api/auth/[...all]/route.ts` — `toNextJsHandler` App Router handler
- [x] Browser auth client (`src/lib/auth-client.ts`)
- [x] Sign-in page — email + password + Turnstile
- [x] Sign-up page — name + email + password + Turnstile
- [x] `app/(creator)/layout.tsx` — `requireSession()` guard + `AppShell`
- [x] `app/admin/layout.tsx` — hard `role === "ADMIN"` guard + `AdminShell`

### Rate Engine
- [x] `computeRate()` — pure function, integer math only, no side effects
- [x] 25 unit tests (all passing) — Creator Name TikTok + Instagram assertions, edge cases, determinism
- [x] `DEFAULT_ENGINE_PARAMS` constant matching architecture seed values

### Analytics Provider Layer
- [x] `AnalyticsProvider` interface
- [x] `SeededProvider` — reads `SeedCreator` rows, returns `AnalyticsSnapshot`
- [x] `ManualProvider` — passes through form values
- [x] `PhylloProvider` / `HypeAuditorProvider` / `DirectPlatformProvider` — stubs (throw "not implemented")
- [x] `getActiveProvider()` factory — reads `ProviderConfig` from DB

### oEmbed + R2
- [x] `TikTokOEmbed` — open endpoint, no auth, 5s timeout
- [x] `InstagramOEmbed` — token-gated stub (returns `{}` gracefully when no token)
- [x] `CoverImageFallback` — accepts any URL, returns R2 thumbnail key
- [x] `resolveOEmbed()` — chain: TikTok → Instagram → Fallback
- [x] R2 `r2Put / r2Get / r2Delete / r2Exists` helpers
- [x] `getCachedThumbnail()` — fetch-once pattern: check R2 → fetch from URL → store
- [x] Named key builders (`avatar()`, `thumbnail()`, `pdf()`, `logo()`, `brandLogo()`)

### UI Components
- [x] `BrandMark` — "B" box + "BRITCH" wordmark, size variants sm/md/lg
- [x] `AppShell` — creator sidebar (nav, user footer, sign out)
- [x] `AdminShell` — admin sidebar (nav, flush accent, creator app link)
- [x] `FloorBar` — floor/target/stretch range bar with volt pip
- [x] `WhyThisRate` — expandable engine breakdown equation
- [x] `RateCard` — deliverable card with platform pill, FloorBar, WhyThisRate
- [x] `AudiencePanel` — gender/age/country bar charts
- [x] `WorkStrip` — horizontal scrollable work item tiles with R2 thumbnails
- [x] `ProposalStatus` — status lifecycle badge
- [x] `Ticker` — scrolling volt ticker strip

### Routes — Creator App
- [x] `/` — redirects to `/dashboard` or `/sign-in`
- [x] `/sign-in` — real form + Turnstile
- [x] `/sign-up` — real form + Turnstile
- [x] `/onboarding` — 4-step wizard (identity, platform, stats, done)
- [x] `/dashboard` — reads real DB data (rate pages, proposals, account)
- [x] `/analytics` — reads social accounts, renders audience panels
- [x] `/rates` — reads deliverables + rate pages
- [x] `/proposals` — proposal list
- [x] `/proposals/[id]` — proposal detail with line items
- [x] `/brands` — brand list
- [x] `/settings` — account + profile info

### Routes — Public
- [x] `/r/[token]` — **fully wired** — reads RatePage from DB, renders `frozenRates` snapshot with full brand styling: creator hero, ticker, rate cards (floor/target/stretch), audience panel, footer
- [x] `/p/[token]` — public proposal — reads from DB, renders line items + total + approval placeholder

### Routes — Admin
- [x] `/admin` — overview stats (niches, CPM count, multiplier count, seed creators, engine version, active provider)
- [x] `/admin/benchmarks` — CPM benchmark table (read)
- [x] `/admin/multipliers` — format multiplier table (read)
- [x] `/admin/niches` — niche list with order + active status (read)
- [x] `/admin/engine` — engine params display with notes (read)
- [x] `/admin/seed-creators` — seed creator list with snapshot stats (read)
- [x] `/admin/providers` — provider config + available providers (read)

### Admin Server Actions
- [x] `requireAdminRole()` — session check + role guard via `getRequestContext()`
- [x] `createNiche / updateNiche`
- [x] `upsertCpmBenchmark`
- [x] `upsertFormatMultiplier`
- [x] `updateEngineParams`
- [x] `upsertSeedCreator`
- [x] `updateProviderConfig`

### Utilities
- [x] `formatCents()` / `formatBps()` / `formatMultiplier()` — display-only formatters
- [x] `generateToken()` — nanoid 12-char URL-safe (~71 bits entropy)
- [x] `sendEmail()` — pure fetch, no SDK, Workers-compatible
- [x] `money.ts` — zero floats, never used in engine math

### Spikes
- [x] Spike 2a: Better Auth on Workers/OpenNext — ✅ CONFIRMED WORKING
- [x] Spike 2b: `@react-pdf/renderer` in Workers — ✅ CONFIRMED WORKING

---

## ⚠️ Known Gaps (deferred to next iteration)

### Functional gaps
- **Onboarding server action** — `/api/onboarding` route not implemented. The wizard collects data but the POST goes to a 404. Needs a server action that creates `CreatorAccount`, `CreatorProfile`, `SocialAccount` rows and calls the engine to seed `Deliverable` rows.
- **Rate page publish** — no publish server action yet. The publish button on `/rates` would freeze `frozenRates` into `RatePage`. Currently rates page is read-only.
- **Proposal creation** — no create/edit server actions. Proposals must be inserted directly into D1 for now.
- **PDF endpoint** — `app/api/pdf/[proposalId]/route.ts` not yet created (spike confirmed `@react-pdf/renderer` works; scaffold needed).
- **Admin write UI** — admin pages are read-only. Server actions exist in `src/admin/actions.ts` but no forms wired.
- **Proposal approval** — `/p/[token]` shows a placeholder. Needs a client component + `approveProposal` server action.
- **R2 avatar upload** — settings/onboarding have no file input wired to R2 yet.

### Styling gaps
- Mobile nav (AppShell uses CSS grid; collapses incorrectly on narrow screens)
- Dark/light mode toggle (only dark mode currently)

### Security
- CSRF protection on all server actions (Better Auth handles sessions but form actions need explicit CSRF tokens)
- Rate limiting on sign-up (Turnstile helps but no IP-level rate limit)

---

## 🚫 Explicitly deferred (V1.1 / V2)

Per `BUILD_PLAN.md` skip list:
- `/i/[token]` — invoices
- `/calc` — teaser calculator
- `preparedForBrandId` — proposal personalization
- `AnalyticsSnapshot[]` trend history (field exists, no UI)
- Phyllo / HypeAuditor / DirectPlatform provider implementations
- Admin: users list, versioned models, audit log
- Percentile benchmarking
- Usage-rights calculator
- Deal pipeline Kanban
- Media kit

---

## 📍 Where to start next

1. **Wire the onboarding server action** — `POST /api/onboarding` creates creator plane rows + runs engine
2. **Wire rate page publish** — server action that writes `frozenRates` to `RatePage.frozenRates` and sets `status=PUBLISHED`
3. **Wire proposal create/send** — minimal form on `/proposals` page
4. **Scaffold PDF endpoint** — `app/api/pdf/[proposalId]/route.ts` using `renderToBuffer()` (spike proven working)
5. **Admin write forms** — hook up the server actions in `src/admin/actions.ts` to actual form UIs
