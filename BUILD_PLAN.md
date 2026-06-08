# Britch — Build Plan (MVP)

> Architecture is the source of truth. This file maps MVP features to file locations and tracks build order. Update as work progresses.

---

## File & Folder Manifest

```
britch/
├── app/                                   # Next.js App Router root
│   ├── layout.tsx                         # Root layout (font, globals)
│   ├── page.tsx                           # Redirect → /dashboard or /sign-in
│   │
│   ├── (auth)/                            # Auth pages (unprotected)
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   │
│   ├── (creator)/                         # Creator app — requires session
│   │   ├── layout.tsx                     # Auth guard + sidebar shell
│   │   ├── onboarding/
│   │   │   └── page.tsx                   # Wizard: identity → stats → niches → posts → done
│   │   ├── dashboard/
│   │   │   └── page.tsx                   # Snapshot, rate-page status, recent activity
│   │   ├── analytics/
│   │   │   └── page.tsx                   # Followers, engagement, avgReach, audience
│   │   ├── rates/
│   │   │   └── page.tsx                   # Rate-page builder: deliverables, bundles, add-ons, work, publish
│   │   ├── proposals/
│   │   │   ├── page.tsx                   # Proposal list
│   │   │   └── [id]/page.tsx              # Proposal editor
│   │   ├── brands/
│   │   │   └── page.tsx                   # Brand/client list + create
│   │   └── settings/
│   │       └── page.tsx                   # Account, connected accounts, branding, delete
│   │
│   ├── r/[token]/                         # Public rate page (no auth)
│   │   └── page.tsx
│   ├── p/[token]/                         # Public proposal (no auth)
│   │   └── page.tsx
│   │
│   ├── admin/                             # Britch Admin — hard role guard in layout
│   │   ├── layout.tsx                     # Role guard: redirect non-admin instantly
│   │   ├── page.tsx                       # Admin dashboard
│   │   ├── benchmarks/page.tsx            # CPM benchmark manager
│   │   ├── multipliers/page.tsx           # Format multiplier manager
│   │   ├── niches/page.tsx                # Niche taxonomy manager
│   │   ├── engine/page.tsx                # Engine params + rate sandbox
│   │   ├── seed-creators/page.tsx         # Seed creator CRUD
│   │   └── providers/page.tsx             # Active provider + oEmbed token config
│   │
│   └── api/
│       ├── auth/[...all]/route.ts         # Better Auth handler
│       └── pdf/[proposalId]/route.ts      # PDF render endpoint
│
├── src/
│   ├── lib/
│   │   ├── db.ts                          # Prisma client + D1 adapter + getScopedDb()
│   │   ├── auth.ts                        # Better Auth config (KV sessions, D1 user store)
│   │   ├── auth-client.ts                 # Better Auth browser client
│   │   ├── engine.ts                      # Rate engine — pure function, integer math
│   │   ├── engine.test.ts                 # Vitest unit tests (Sarah Creates assertions)
│   │   ├── r2.ts                          # R2 get/put/delete, thumbnail cache util
│   │   ├── resend.ts                      # Resend HTTP email helper
│   │   ├── tokens.ts                      # nanoid token generation
│   │   ├── money.ts                       # cents → "$1,200" formatter (display only)
│   │   ├── providers/
│   │   │   ├── types.ts                   # AnalyticsProvider interface + AnalyticsSnapshot type
│   │   │   ├── index.ts                   # getActiveProvider() factory reads ProviderConfig
│   │   │   ├── seeded.ts                  # SeededProvider — looks up SeedCreator by handle
│   │   │   ├── manual.ts                  # ManualProvider — passes through form values
│   │   │   ├── phyllo.ts                  # STUB — PhylloProvider
│   │   │   ├── hype-auditor.ts            # STUB — HypeAuditorProvider
│   │   │   └── direct-platform.ts         # STUB — DirectPlatformProvider
│   │   └── oembed/
│   │       ├── types.ts                   # OEmbedProvider interface
│   │       ├── index.ts                   # resolveOEmbed() — tries providers in order
│   │       ├── tiktok.ts                  # TikTokOEmbed — open, no auth
│   │       ├── instagram.ts               # InstagramOEmbed — token-gated stub
│   │       └── fallback.ts                # CoverImageFallback
│   │
│   ├── admin/
│   │   └── actions.ts                     # Admin server actions — quarantined, role-checked
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui components (auto-generated)
│   │   ├── britch/
│   │   │   ├── BrandMark.tsx              # The B + BRITCH logotype
│   │   │   ├── RateCard.tsx               # Deliverable card with "Why this rate?" expand
│   │   │   ├── WhyThisRate.tsx            # breakdown equation visual
│   │   │   ├── FloorBar.tsx               # floor/target/stretch range bar
│   │   │   ├── AudiencePanel.tsx          # Gender/age/country breakdown
│   │   │   ├── WorkStrip.tsx              # Featured work oEmbed/thumbnail row
│   │   │   ├── ProposalStatus.tsx         # Status lifecycle badge
│   │   │   └── Ticker.tsx                 # Scrolling ticker strip
│   │   └── layout/
│   │       ├── AppShell.tsx               # Creator app sidebar + topbar
│   │       └── AdminShell.tsx             # Admin app nav
│   │
│   └── types/
│       └── index.ts                       # Shared TS types, Zod schemas, enum unions
│
├── prisma/
│   ├── schema.prisma                      # Both data planes; all models
│   └── migrations/                        # D1 migration files
│
├── scripts/
│   └── seed.ts                            # Seed: niches, benchmarks, multipliers, EngineParams,
│                                          #   ProviderConfig, Sarah Creates seed creator
│
├── public/
│   └── fonts/                             # Self-hosted Clash Display + General Sans + Space Mono
│
├── wrangler.toml                          # D1, KV, R2, Turnstile bindings; nodejs_compat
├── next.config.ts                         # @opennextjs/cloudflare integration
├── tailwind.config.ts                     # Britch design tokens (--ink, --volt, etc.)
├── components.json                        # shadcn/ui config
├── tsconfig.json
├── vitest.config.ts
├── BUILD_PLAN.md                          # This file
├── SPIKES.md                              # Spike results (written after Step 2)
├── SETUP.md                               # Env vars, local dev, seed, deploy (Step 8)
└── STATUS.md                              # What's built, gaps, open items (Step 8)
```

---

## MVP Feature → File Map

### Auth
| Feature | File(s) |
|---------|---------|
| Sign-up / Sign-in pages | `app/(auth)/sign-in/`, `app/(auth)/sign-up/` |
| Better Auth config (KV sessions, D1 store) | `src/lib/auth.ts` |
| Better Auth API handler | `app/api/auth/[...all]/route.ts` |
| Protected route guard | `app/(creator)/layout.tsx` |
| Admin role guard | `app/admin/layout.tsx` + `src/admin/actions.ts` |
| Browser auth client | `src/lib/auth-client.ts` |

### Onboarding wizard
| Feature | File(s) |
|---------|---------|
| Identity step (name, niche, avatar) | `app/(creator)/onboarding/page.tsx` |
| Stats step (SeededProvider or manual form) | `app/(creator)/onboarding/page.tsx` + `src/lib/providers/` |
| Post sample input (last 20, paid/organic flag) | `app/(creator)/onboarding/page.tsx` |
| Rate compute on completion | calls `engine.ts`, writes `Deliverable` rows |

### Rate engine
| Feature | File(s) |
|---------|---------|
| Pure engine function | `src/lib/engine.ts` |
| Unit tests | `src/lib/engine.test.ts` |
| "Why this rate?" breakdown | `src/components/britch/WhyThisRate.tsx` + `FloorBar.tsx` |

### Analytics / Provider layer
| Feature | File(s) |
|---------|---------|
| AnalyticsProvider interface | `src/lib/providers/types.ts` |
| SeededProvider (working) | `src/lib/providers/seeded.ts` |
| ManualProvider (working) | `src/lib/providers/manual.ts` |
| Phyllo / HypeAuditor / Direct stubs | `src/lib/providers/*.ts` |
| Active provider factory | `src/lib/providers/index.ts` |

### oEmbed + Featured Work
| Feature | File(s) |
|---------|---------|
| OEmbedProvider interface | `src/lib/oembed/types.ts` |
| TikTokOEmbed (working, no auth) | `src/lib/oembed/tiktok.ts` |
| InstagramOEmbed (token-gated stub) | `src/lib/oembed/instagram.ts` |
| CoverImageFallback | `src/lib/oembed/fallback.ts` |
| R2 fetch-once thumbnail caching | `src/lib/r2.ts` |
| WorkItem paste → oEmbed → R2 | `src/lib/oembed/index.ts` |
| Featured work UI strip | `src/components/britch/WorkStrip.tsx` |

### Rate page (builder + public)
| Feature | File(s) |
|---------|---------|
| Rate page builder UI | `app/(creator)/rates/page.tsx` |
| Deliverable CRUD + rate compute | `app/(creator)/rates/page.tsx` + Server Actions |
| Bundle + add-on management | `app/(creator)/rates/page.tsx` |
| Publish → snapshot `frozenRates` | Server Action in rates route |
| Public rate page (tokenized) | `app/r/[token]/page.tsx` |
| "Why this rate?" reveal | `src/components/britch/RateCard.tsx` + `WhyThisRate.tsx` |
| Draft preview banner | `app/r/[token]/page.tsx` |

### Proposals
| Feature | File(s) |
|---------|---------|
| Proposal list | `app/(creator)/proposals/page.tsx` |
| Proposal editor (scope, milestones, work items) | `app/(creator)/proposals/[id]/page.tsx` |
| Send → snapshot `lineItems` JSON | Server Action, freezes on send |
| Public proposal page (tokenized) | `app/p/[token]/page.tsx` |
| Read receipts (`ProposalView`) | `app/p/[token]/page.tsx` on load |
| Typed-signature approval | `app/p/[token]/page.tsx` |
| Request changes flow | `app/p/[token]/page.tsx` |
| Version auto-increment | Server Action on re-send |
| PDF download | `app/api/pdf/[proposalId]/route.ts` via `@react-pdf/renderer` |

### Brands
| Feature | File(s) |
|---------|---------|
| Brand/client list + create/edit | `app/(creator)/brands/page.tsx` |

### Settings
| Feature | File(s) |
|---------|---------|
| Account info | `app/(creator)/settings/page.tsx` |
| Connected accounts + disconnect/delete | `app/(creator)/settings/page.tsx` (consent hygiene) |
| Branding (logo, accent color) | `app/(creator)/settings/page.tsx` |
| Delete account | `app/(creator)/settings/page.tsx` |

### Britch Admin
| Feature | File(s) |
|---------|---------|
| Admin dashboard | `app/admin/page.tsx` |
| CPM benchmark manager | `app/admin/benchmarks/page.tsx` + `src/admin/actions.ts` |
| Format multiplier manager | `app/admin/multipliers/page.tsx` + `src/admin/actions.ts` |
| Niche taxonomy manager | `app/admin/niches/page.tsx` + `src/admin/actions.ts` |
| Engine params + rate sandbox | `app/admin/engine/page.tsx` + `src/admin/actions.ts` |
| Seed creator CRUD | `app/admin/seed-creators/page.tsx` + `src/admin/actions.ts` |
| Provider config (active + oEmbed tokens) | `app/admin/providers/page.tsx` + `src/admin/actions.ts` |

### Infrastructure
| Feature | File(s) |
|---------|---------|
| D1 database + Prisma adapter | `src/lib/db.ts`, `prisma/schema.prisma` |
| Row-level security (getScopedDb) | `src/lib/db.ts` — `$extends()` wrapper |
| KV sessions + OpenNext cache | `wrangler.toml` + `src/lib/auth.ts` |
| R2 file storage | `wrangler.toml` + `src/lib/r2.ts` |
| Turnstile bot protection | `wrangler.toml` + public page forms |
| Resend email | `src/lib/resend.ts` |
| Seed script | `scripts/seed.ts` |

---

## Build Checklist (Steps)

- [ ] **STEP 0** — BUILD_PLAN.md ← *you are here*
- [ ] **STEP 1** — Scaffold: Next.js 15 + OpenNext/Cloudflare, wrangler.toml, Tailwind, shadcn/ui
- [ ] **STEP 2a** — Spike: Better Auth on Workers/OpenNext (sign-up, protected route, KV session)
- [ ] **STEP 2b** — Spike: @react-pdf/renderer in Workers runtime; write SPIKES.md
- [ ] **STEP 3** — Prisma schema (both planes), D1 migration
- [ ] **STEP 4** — Seed script (niches, benchmarks, multipliers, EngineParams, Sarah Creates)
- [ ] **STEP 5** — Rate engine pure function + unit tests
- [ ] **STEP 6** — Provider interfaces + SeededProvider + ManualProvider + OEmbed + R2 thumbnail cache
- [ ] **STEP 7** — Route skeleton (all MVP routes), scoped DB wrapper, admin guard, real data at /r/[token]
- [ ] **STEP 8** — SETUP.md + STATUS.md

---

## Key Conventions (quick reference)

- **Money** = integer **cents** (`$1,200 → 120000`). No floats, no Decimal.
- **Everything else** = integer **basis points** (`1.0× → 10000`, `3% → 300`).
- **CPM** stored as **cents per 1,000** (`$12 CPM → 1200`).
- **Enums** = `Prisma String` + TS union type + Zod guard.
- **Row-level security** = `getScopedDb(accountId)` wraps every creator query.
- **Two planes never cross**: creators read global plane only as computed rates, never raw benchmark rows.
- **Snapshot on save**: published rate pages and sent proposals freeze their numbers.
- **Admin quarantine**: all admin server actions in `src/admin/actions.ts` behind hard role guard. Never an `if (isAdmin)` branch in a creator action.
- **No runtime LLM calls.**
- **R2 for all blobs** — never hotlink expiring platform CDN URLs.

---

## V1.1 / V2 features — explicitly stubbed/skipped in MVP

- `/i/[token]` — invoices
- `/calc` — teaser calculator
- `preparedForBrandId` — proposal personalization (field exists in schema, UI deferred)
- `AnalyticsSnapshot[]` trend history
- Phyllo / HypeAuditor / DirectPlatform providers
- Admin: users, versioned models, audit log
- Percentile benchmarking
- Usage-rights calculator
- Deal pipeline Kanban
- Media kit
