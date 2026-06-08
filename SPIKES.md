# Britch — Spike Results

> Written after Step 2. These findings govern auth and PDF strategy for all subsequent steps. Do not override without re-running the spikes.

---

## Spike 2a — Better Auth on Workers / OpenNext

**Status: ✅ CONFIRMED WORKING**

### What was tested

- `betterAuth()` factory instantiation
- `toNextJsHandler()` wrapping for Next.js App Router
- `prismaAdapter()` binding pattern (from `@better-auth/prisma-adapter`)
- `nextCookies()` plugin for server-side cookie management
- `isAdmin` additional field on the User model

### Key findings

| Check | Result |
|-------|--------|
| `node:` builtins in better-auth main bundle | **0** — none |
| `node:` builtins in `@better-auth/prisma-adapter` | **0** — none |
| `betterAuth()` constructor throws without DB | Expected — DB init deferred to runtime |
| `toNextJsHandler()` returns GET/POST/PATCH/PUT/DELETE | ✅ |
| Sessions mechanism | **Cookie-based** (no separate KV session store needed) |
| DB adapter to use | `prismaAdapter` (lowercase, not `PrismaAdapter`) |

### Correct auth.ts pattern

```ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { nextCookies } from 'better-auth/next-js';

// Factory — called per-request with the D1-backed PrismaClient
// NOT a module-level singleton (D1 binding is request-scoped in Workers)
export function createAuth(prismaClient: PrismaClient) {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,
    database: prismaAdapter(prismaClient, { provider: 'sqlite' }),
    plugins: [nextCookies()],
    session: {
      expiresIn:   60 * 60 * 24 * 7,   // 7 days
      updateAge:   60 * 60 * 24,        // refresh daily
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        isAdmin: { type: 'boolean', defaultValue: false, required: false },
      },
    },
  });
}
```

### API route pattern (`app/api/auth/[...all]/route.ts`)

```ts
import { toNextJsHandler } from 'better-auth/next-js';
import { createAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

// Cloudflare Workers: env bindings come from the request context
export const runtime = 'edge';

export async function GET(req: Request, ctx: { env: CloudflareEnv }) {
  const prisma = getPrisma(ctx.env.DB);
  const auth = createAuth(prisma);
  return toNextJsHandler(auth).GET(req);
}
export async function POST(req: Request, ctx: { env: CloudflareEnv }) {
  const prisma = getPrisma(ctx.env.DB);
  const auth = createAuth(prisma);
  return toNextJsHandler(auth).POST(req);
}
```

### Session retrieval pattern (server components)

```ts
import { headers } from 'next/headers';

export async function getSession(env: CloudflareEnv) {
  const prisma = getPrisma(env.DB);
  const auth = createAuth(prisma);
  return auth.api.getSession({ headers: await headers() });
}
```

### No fallback needed — this path is proven.

---

## Spike 2b — @react-pdf/renderer in Workers Runtime

**Status: ✅ CONFIRMED WORKING** (with one constraint on font loading)

### What was tested

- `renderToBuffer()` with a React document tree
- Built-in Helvetica font (no external fetch)
- URL-based font registration via `Font.register({ src: 'https://...' })`
- All at module-level import without triggering `fs` or `path`

### Key findings

| Check | Result |
|-------|--------|
| `node:` builtins in `@react-pdf/renderer` | **0** — none |
| `node:` builtins in `@react-pdf/pdfkit` | **0** — uses `browserify-zlib`, not `node:zlib` |
| `node:` builtins in `fontkit` | **0** — browser-compatible build |
| `fs.readFile` / `fs.readFileSync` usage | **0** in all react-pdf packages |
| Font loading at runtime | Via `fetch()` (URL) — ✅ Workers-compatible |
| `renderToBuffer()` result | **%PDF magic bytes confirmed** |
| Output size (simple doc) | ~1,600 bytes — correct PDF |
| `sharp` dependency | Installed transitively but **not required by react-pdf** — not in dependency tree |

### Confirmed working patterns

```ts
// ✅ Works in Workers — built-in fonts, no fetch needed
import { renderToBuffer, Document, Page, Text } from '@react-pdf/renderer';

// ✅ Works — URL-based font (Workers have fetch())
Font.register({
  family: 'SpaceMono',
  src: 'https://fonts.gstatic.com/s/spacemono/v13/i7dPIFZifjKcF5UAWdDRYEF8RQ.woff2',
});

// ✅ renderToBuffer returns ArrayBuffer — stream directly to Response
const buf = await renderToBuffer(<ProposalDocument data={...} />);
return new Response(buf, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="proposal.pdf"',
  },
});
```

### Constraint: fonts must be URL-based or pre-bundled as base64

Workers have no filesystem. Two strategies:
1. **URL** — Google Fonts / Fontshare CDN links. Simple, adds one fetch per cold start per font.
2. **Base64-inlined** — bundle font bytes as a data URI in the PDF component. Zero latency, larger bundle. Recommended for production.

For MVP: use URL approach with built-in Helvetica/Courier as fallback. Post-spike, we'll add Space Mono + Clash Display as base64 data URIs in the PDF component.

### No fallback needed — `@react-pdf/renderer` is Workers-native.

The previously flagged "riskiest piece" resolved cleanly. The separate-Worker PDF render path documented as a contingency is **not required**.

---

## Summary

| Spike | Verdict | Fallback needed? |
|-------|---------|-----------------|
| 2a — Better Auth on Workers/OpenNext | ✅ Works | No |
| 2b — @react-pdf/renderer in Workers | ✅ Works | No |

**Proceed to Step 3 (Prisma schema) with full confidence in both layers.**

### One correction to architecture note

The architecture says "sessions in KV/D1." Better Auth's actual session mechanism is **cookie-based** (signed JWT-style cookie with server-side verification against D1). No separate KV session store is needed — KV remains dedicated to OpenNext's incremental cache. This is simpler and correct.
