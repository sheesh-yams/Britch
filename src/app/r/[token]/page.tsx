/**
 * Public rate page — /r/[token]
 *
 * Tokenized, no-auth public page that renders a creator's published rate card.
 *
 * Data flow:
 *   1. Look up RatePage by token
 *   2. If DRAFT:     show preview banner (creator only; brand owners see 404)
 *   3. If PUBLISHED: render frozenRates snapshot — data never changes after publish
 *   4. Log a RatePageView (fire-and-forget; never blocks render)
 *
 * For the seeded Sarah Creates demo, visit /r/demo-sarah after running seed-demo.sql.
 */

import { notFound }            from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, isNull, desc } from "drizzle-orm";
import { getDb }               from "@/lib/db";
import type { DB }             from "@/lib/db";
import {
  ratePage, ratePageView,
  deliverable, formatMultiplier, cpmBenchmark, engineParams,
} from "@/db/schema";
import { computeRate, DEFAULT_ENGINE_PARAMS } from "@/lib/engine";
import { formatCents }         from "@/lib/money";
import BrandMark      from "@/components/britch/BrandMark";
import RateCard       from "@/components/britch/RateCard";
import AudiencePanel  from "@/components/britch/AudiencePanel";
import Ticker         from "@/components/britch/Ticker";

export const dynamic = "force-dynamic";

// ── Types for the frozen / computed rate records stored in RatePage ────────────

interface FrozenDeliverable {
  id:               string;
  platform:         string;
  deliverableType:  string;
  label?:           string;
  targetCents:      number;
  floorCents:       number;
  stretchCents:     number;
  breakdown: {
    avgReach:           number;
    cpmCents:           number;
    formatMultiplierBps:number;
    engAdjBps:          number;
    weightedReach:      number;
    baseCents:          number;
  };
  followers:         number;
  engagementRateBps: number;
}

interface FrozenRates {
  deliverables: FrozenDeliverable[];
  audience?:    {
    gender?:       Record<string, number>;
    ageBands?:     Record<string, number>;
    topCountries?: { code: string; label: string; pct: number }[];
  };
  bio?:          string;
  handles?:      Record<string, string>;
  avatarKey?:    string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseFrozenRates(json: unknown): FrozenRates | null {
  if (!json || typeof json !== "object") return null;
  return json as FrozenRates;
}

async function logView(db: DB, ratePageId: string, accountId: string, req: Request) {
  try {
    const ip  = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? null;
    const ua  = req.headers.get("user-agent") ?? null;
    const ref = req.headers.get("referer") ?? null;
    await db.insert(ratePageView).values({ ratePageId, accountId, ip, userAgent: ua, referrer: ref });
  } catch {
    // Non-critical — never block render
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RatePagePublic({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  // 1. Fetch RatePage + account + profile + connected social accounts
  const rp = await db.query.ratePage.findFirst({
    where: eq(ratePage.token, token),
    with: {
      account: {
        with: {
          profile: true,
          socialAccounts: {
            where: (sa, { isNull: nullCheck }) => nullCheck(sa.disconnectedAt),
          },
        },
      },
    },
  });

  if (!rp) notFound();

  // 2. Determine render mode
  const isDraft     = rp.status === "DRAFT";
  const isPublished = rp.status === "PUBLISHED";

  if (!isDraft && !isPublished) notFound();

  // 3. Parse rates — prefer frozenRates (published snapshot) else compute live
  let rates: FrozenRates | null = parseFrozenRates(rp.frozenRates);

  if (!rates) {
    rates = await computeLiveRates(db, rp.account);
  }

  if (!rates || rates.deliverables.length === 0) {
    return <EmptyState token={token} isDraft={isDraft} />;
  }

  // 4. Log view (fire-and-forget)
  void logView(db, rp.id, rp.accountId, new Request("http://britch"));

  // 5. Creator profile info
  const profile    = rp.account.profile;
  const handles    = rates.handles ?? {};
  const bio        = rates.bio ?? profile?.bio ?? null;
  const r2BaseUrl  = env.R2_PUBLIC_URL ?? "";

  const avatarUrl  = profile?.avatarKey && r2BaseUrl
    ? `${r2BaseUrl}/${profile.avatarKey}`
    : null;

  // 6. Group deliverables by platform
  const byPlatform = groupByPlatform(rates.deliverables);

  // 7. Ticker items
  const tickerItems = rates.deliverables.flatMap(d => [
    `${d.label ?? d.deliverableType} · ${formatCents(d.targetCents)}`,
  ]);

  return (
    <div style={{ background: "var(--ink)", minHeight: "100vh", color: "var(--paper)" }}>
      {isDraft && (
        <div style={{ background: "var(--flush)", color: "#fff", textAlign: "center", padding: "10px 16px", fontFamily: "var(--font-space-mono)", fontSize: 12, letterSpacing: "0.05em" }}>
          DRAFT PREVIEW — this rate page is not yet published
        </div>
      )}

      <header style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "32px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandMark size="md" />
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.05em" }}>
          RATE CARD
        </div>
      </header>

      <section style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "48px 24px 32px", display: "grid", gridTemplateColumns: avatarUrl ? "auto 1fr" : "1fr", gap: 32, alignItems: "start" }}>
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={profile?.displayName ?? "Creator"}
            style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--volt)", flexShrink: 0 }}
          />
        )}

        <div>
          <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 700, margin: 0, lineHeight: 1.05, letterSpacing: "-0.02em", color: "var(--paper)" }}>
            {profile?.displayName ?? rp.account.id}
          </h1>

          {Object.keys(handles).length > 0 && (
            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
              {Object.entries(handles).map(([platform, handle]) => (
                <span key={platform} style={{ fontFamily: "var(--font-space-mono)", fontSize: 13, color: "var(--volt)", opacity: 0.9 }}>
                  {handle}
                </span>
              ))}
            </div>
          )}

          {bio && (
            <p style={{ marginTop: 14, maxWidth: 600, fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", opacity: 0.65, lineHeight: 1.6 }}>
              {bio}
            </p>
          )}

          <StatPills deliverables={rates.deliverables} />
        </div>
      </section>

      {tickerItems.length > 0 && (
        <div style={{ margin: "0 0 40px" }}>
          <Ticker items={tickerItems} speed="normal" />
        </div>
      )}

      <section style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 24px 48px" }}>
        {Object.entries(byPlatform).map(([platform, deliverables]) => (
          <div key={platform} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: "var(--font-clash-display)", fontSize: 13, fontWeight: 600, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.12em", marginBottom: 16 }}>
              {platform === "TIKTOK" ? "TIKTOK" : platform === "INSTAGRAM" ? "INSTAGRAM" : platform}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {deliverables.map((d) => (
                <RateCard
                  key={d.id}
                  platform={d.platform}
                  deliverableType={d.deliverableType}
                  label={d.label}
                  targetCents={d.targetCents}
                  floorCents={d.floorCents}
                  stretchCents={d.stretchCents}
                  breakdown={d.breakdown}
                  followers={d.followers}
                  engagementRateBps={d.engagementRateBps}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {rates.audience && (
        <section style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 24px 64px" }}>
          <AudiencePanel audience={rates.audience} />
        </section>
      )}

      <footer style={{ borderTop: "var(--line-paper)", padding: "24px", textAlign: "center", fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.3 }}>
        Powered by BRITCH · rates computed {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
}

// ── Stat pills ─────────────────────────────────────────────────────────────────

function StatPills({ deliverables }: { deliverables: FrozenDeliverable[] }) {
  if (deliverables.length === 0) return null;
  const minCents = Math.min(...deliverables.map(d => d.targetCents));
  const maxCents = Math.max(...deliverables.map(d => d.targetCents));

  const pills = [
    { label: "Deliverables", value: String(deliverables.length) },
    { label: "Starting at",  value: formatCents(minCents) },
    { label: "Up to",        value: formatCents(maxCents) },
  ];

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
      {pills.map(({ label, value }) => (
        <div key={label} style={{ padding: "8px 14px", background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)" }}>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.05em" }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontFamily: "var(--font-clash-display)", fontSize: 18, color: "var(--volt)", fontWeight: 600 }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ token, isDraft }: { token: string; isDraft: boolean }) {
  return (
    <div style={{ background: "var(--ink)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <BrandMark size="lg" />
        <p style={{ fontFamily: "var(--font-general-sans)", color: "var(--paper)", opacity: 0.5, marginTop: 24 }}>
          {isDraft ? "This rate page is still being set up." : "No rates found for this page."}
        </p>
        <p style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.25, marginTop: 12 }}>
          /r/{token}
        </p>
      </div>
    </div>
  );
}

// ── Live computation fallback ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function computeLiveRates(db: DB, account: any): Promise<FrozenRates | null> {
  try {
    const socialAccounts = account.socialAccounts ?? [];
    if (socialAccounts.length === 0) return null;

    const ep = await db.query.engineParams.findFirst({ where: eq(engineParams.isActive, true) });
    const params = ep ?? DEFAULT_ENGINE_PARAMS;

    const deliverables: FrozenDeliverable[] = [];
    const audience: FrozenRates["audience"] = {};
    const handles: Record<string, string> = {};

    for (const sa of socialAccounts) {
      const platform = sa.platform as "TIKTOK" | "INSTAGRAM";
      const followers         = Number(sa.followers         ?? 0);
      const engagementRateBps = Number(sa.engagementRateBps ?? 0);
      const rawAudience       = sa.audience as Record<string, unknown> | null;
      const rawPostSample     = (sa.postSample as { views: number; isPaid: boolean }[] | null) ?? [];
      const organicViews      = rawPostSample.filter(p => !p.isPaid).map(p => p.views);

      if (sa.handle) handles[platform] = sa.handle;

      if (!audience.gender && rawAudience) {
        const aud = rawAudience as Record<string, unknown>;
        audience.gender       = aud.gender       as Record<string, number> | undefined;
        audience.ageBands     = aud.ageBands     as Record<string, number> | undefined;
        audience.topCountries = aud.topCountries as { code: string; label: string; pct: number }[] | undefined;
      }

      const dbDeliverables = await db.query.deliverable.findMany({
        where: and(
          eq(deliverable.accountId, account.id),
          eq(deliverable.platform, platform),
          eq(deliverable.isActive, true),
        ),
      });

      for (const d of dbDeliverables) {
        const fmRow = await db.query.formatMultiplier.findFirst({
          where: and(
            eq(formatMultiplier.platform, platform),
            eq(formatMultiplier.deliverableType, d.type),
            eq(formatMultiplier.isActive, true),
          ),
        });
        const cpmRow = await db.query.cpmBenchmark.findFirst({
          where: and(eq(cpmBenchmark.platform, platform), eq(cpmBenchmark.isActive, true)),
          orderBy: desc(cpmBenchmark.effectiveDate),
        });

        const formatMultiplierBps = fmRow?.multiplierBps ?? 10000;
        const cpmCents            = cpmRow?.cpmCents      ?? 1000;

        const result = computeRate({
          platform,
          deliverableType: d.type,
          followers,
          engagementRateBps,
          organicPostViews: organicViews,
          cpmCents,
          formatMultiplierBps,
          ...params,
        });

        deliverables.push({
          id:              d.id,
          platform,
          deliverableType: d.type,
          label:           d.label ?? undefined,
          ...result,
          followers,
          engagementRateBps,
        });
      }
    }

    return { deliverables, audience, handles };
  } catch {
    return null;
  }
}

// ── Group deliverables by platform ────────────────────────────────────────────

function groupByPlatform(
  deliverables: FrozenDeliverable[],
): Record<string, FrozenDeliverable[]> {
  return deliverables.reduce<Record<string, FrozenDeliverable[]>>((acc, d) => {
    (acc[d.platform] ??= []).push(d);
    return acc;
  }, {});
}

// Unused import shim to keep `isNull` available if rates engine evolves
void isNull;
