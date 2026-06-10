/**
 * Creator dashboard — "what do I need to know right now?"
 *
 * Designed against the actual data we have today, not the data we wish we
 * had. Anything that would require analytics history (trend arrows) or
 * external data (niche inspo, trending content) is intentionally absent —
 * surfacing fake numbers there is worse than not having the panel.
 */

import Link                from "next/link";
import { headers }         from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getSession }      from "@/lib/auth";
import { getScopedDb }     from "@/lib/db";
import {
  creatorProfile, socialAccount, postSample,
  ratePage, proposal, deliverable,
} from "@/db/schema";
import { formatCents, formatBps } from "@/lib/money";
import { followerTier }    from "@/lib/rates";
import ProposalStatus      from "@/components/britch/ProposalStatus";
import { CopyLink }        from "./copy-link";

export default async function DashboardPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const scoped = await getScopedDb(env.DB, session.user.id);
  if (!scoped) return <PreOnboarding firstName={firstNameOf(session.user.name)} />;
  const { db, accountId } = scoped;

  const ACTIVE_DEAL_STATUSES   = ["SENT", "VIEWED", "CHANGES_NEEDED"];
  const APPROVED_DEAL_STATUSES = ["APPROVED"];

  const [profile, socials, deliverables, publishedRatePage, activeDeals, recentWins] = await Promise.all([
    db.query.creatorProfile.findFirst({ where: eq(creatorProfile.accountId, accountId) }),
    db.query.socialAccount.findMany({
      where: and(eq(socialAccount.accountId, accountId), isNull(socialAccount.disconnectedAt)),
    }),
    db.query.deliverable.findMany({
      where: and(eq(deliverable.accountId, accountId), eq(deliverable.isActive, true)),
    }),
    db.query.ratePage.findFirst({
      where: and(eq(ratePage.accountId, accountId), eq(ratePage.status, "PUBLISHED")),
      orderBy: desc(ratePage.publishedAt),
    }),
    db.query.proposal.findMany({
      where: and(eq(proposal.accountId, accountId), inArray(proposal.status, ACTIVE_DEAL_STATUSES)),
      with: { brand: { columns: { name: true } } },
      orderBy: [desc(proposal.updatedAt)],
      limit: 6,
    }),
    db.query.proposal.findMany({
      where: and(eq(proposal.accountId, accountId), inArray(proposal.status, APPROVED_DEAL_STATUSES)),
      with: { brand: { columns: { name: true } } },
      orderBy: [desc(proposal.approvedAt)],
      limit: 5,
    }),
  ]);

  // Per-platform post samples for the channel-monitor sparklines.
  const postSamplesBySocial = new Map<string, { views: number; isPaid: boolean }[]>();
  if (socials.length > 0) {
    const ids = socials.map(s => s.id);
    const samples = await db.query.postSample.findMany({
      where: and(inArray(postSample.socialAccountId, ids)),
      orderBy: desc(postSample.createdAt),
      limit: 200,
    });
    for (const s of samples) {
      const list = postSamplesBySocial.get(s.socialAccountId) ?? [];
      if (list.length < 20) list.push({ views: s.views, isPaid: s.isPaid });
      postSamplesBySocial.set(s.socialAccountId, list);
    }
  }

  // Roll-ups — only computed off real data, never inferred from followers.
  const totalFollowers = socials.reduce((s, sa) => s + sa.followers, 0);
  const totalReach     = socials.reduce((s, sa) => s + sa.avgViews,  0);
  const totalEngWeight = socials.reduce((s, sa) => s + sa.followers, 0);
  const weightedEng = totalEngWeight > 0
    ? Math.round(socials.reduce((s, sa) => s + sa.engagementRateBps * sa.followers, 0) / totalEngWeight)
    : 0;
  const closedValueCents = recentWins.reduce(
    (s, p) => s + (p.approvedTotalCents ?? p.totalCents ?? 0), 0,
  );

  const baseUrl = env.NEXT_PUBLIC_APP_URL || env.BETTER_AUTH_URL || "";
  const publicRateUrl = publishedRatePage ? `${baseUrl}/r/${publishedRatePage.token}` : null;

  const firstName = firstNameOf(profile?.displayName ?? session.user.name);
  const niches    = (profile?.niches as string[] | null) ?? [];

  return (
    <div style={{ padding: "32px 32px 64px", maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.1em", marginBottom: 4 }}>
          {greeting()}
        </div>
        <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: "clamp(34px, 5vw, 52px)", color: "var(--paper)", margin: 0, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          Hello {firstName}.
        </h1>
        <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", opacity: 0.5, margin: "6px 0 0" }}>
          Your channel monitor, deals in motion, and recent wins — all in one place.
        </p>
      </header>

      <StatStrip
        totalFollowers={totalFollowers}
        totalReach={totalReach}
        weightedEngBps={weightedEng}
        activeDealCount={activeDeals.length}
        closedValueCents={closedValueCents}
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: 24, marginTop: 28, alignItems: "start" }}>
        <main style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <ChannelMonitor socials={socials} samplesBySocial={postSamplesBySocial} />
          <ActiveDeals deals={activeDeals} />
          <RecentWork wins={recentWins} />
        </main>

        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PublicPageCard url={publicRateUrl} deliverableCount={deliverables.length} />
          <ProfileCard
            displayName={profile?.displayName ?? null}
            handle={socials[0]?.handle ?? null}
            niches={niches}
            bio={profile?.bio ?? null}
          />
          <QuickLinks />
        </aside>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function StatStrip({
  totalFollowers, totalReach, weightedEngBps, activeDealCount, closedValueCents,
}: {
  totalFollowers:   number;
  totalReach:       number;
  weightedEngBps:   number;
  activeDealCount:  number;
  closedValueCents: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      <Stat label="TOTAL FOLLOWERS" value={compactNumber(totalFollowers)} sub={tierLabel(totalFollowers)} />
      <Stat label="AVG REACH / POST" value={compactNumber(totalReach)} sub="across platforms" />
      <Stat label="AVG ENGAGEMENT"  value={formatBps(weightedEngBps)} sub="follower-weighted" />
      <Stat label="ACTIVE DEALS"    value={String(activeDealCount)} sub="sent or viewed" />
      <Stat label="CLOSED VALUE"    value={closedValueCents > 0 ? formatCents(closedValueCents) : "—"} sub="signed proposals" />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)", padding: "16px 18px" }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.45, letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-clash-display)", fontSize: 26, color: "var(--paper)", fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function ChannelMonitor({
  socials, samplesBySocial,
}: {
  socials: { id: string; platform: string; handle: string; followers: number; engagementRateBps: number; avgViews: number }[];
  samplesBySocial: Map<string, { views: number; isPaid: boolean }[]>;
}) {
  return (
    <SectionCard
      title="CHANNEL MONITOR"
      subtitle="Per-platform stats + the last 20 video views you logged"
      right={<Link href="/analytics" style={linkStyle}>Open analytics →</Link>}
    >
      {socials.length === 0 ? (
        <Empty>No connected platforms yet. <Link href="/onboarding" style={linkStyle}>Run onboarding</Link>.</Empty>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: socials.length === 1 ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {socials.map(sa => {
            const samples  = samplesBySocial.get(sa.id) ?? [];
            const organic  = samples.filter(s => !s.isPaid).map(s => s.views);
            const paidCount = samples.filter(s => s.isPaid).length;
            const orgMean  = organic.length ? Math.round(organic.reduce((a, b) => a + b, 0) / organic.length) : sa.avgViews;
            const max      = samples.length ? Math.max(...samples.map(s => s.views)) : 0;
            const min      = samples.length ? Math.min(...samples.map(s => s.views)) : 0;
            return (
              <div key={sa.id} style={{ background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--volt)", letterSpacing: "0.1em" }}>{sa.platform}</div>
                    <div style={{ fontFamily: "var(--font-clash-display)", fontSize: 18, color: "var(--paper)", fontWeight: 600, marginTop: 2 }}>{sa.handle}</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.45, letterSpacing: "0.07em" }}>
                    {tierLabel(sa.followers)}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <MiniStat label="FOLLOWERS" value={compactNumber(sa.followers)} />
                  <MiniStat label="REACH"     value={compactNumber(orgMean)} highlight />
                  <MiniStat label="ENG"       value={formatBps(sa.engagementRateBps)} />
                </div>

                {samples.length > 0 ? (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--paper)", opacity: 0.45, letterSpacing: "0.08em" }}>
                        LAST {samples.length} POSTS
                      </span>
                      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.05em" }}>
                        min {compactNumber(min)} · max {compactNumber(max)}{paidCount > 0 ? ` · ${paidCount} paid` : ""}
                      </span>
                    </div>
                    <Sparkline samples={samples} />
                  </div>
                ) : (
                  <Empty>No video sample yet. <Link href="/onboarding" style={linkStyle}>Add some →</Link></Empty>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function Sparkline({ samples }: { samples: { views: number; isPaid: boolean }[] }) {
  const W = 520, H = 56, GAP = 2;
  const max = Math.max(...samples.map(s => s.views), 1);
  const barW = Math.max(2, (W - GAP * (samples.length - 1)) / samples.length);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Recent video views">
      {samples.map((s, i) => {
        const bh = Math.max(2, (s.views / max) * H);
        const x  = i * (barW + GAP);
        return (
          <rect
            key={i}
            x={x}
            y={H - bh}
            width={barW}
            height={bh}
            fill={s.isPaid ? "var(--paper)" : "var(--volt)"}
            opacity={s.isPaid ? 0.35 : 0.95}
            rx={1}
          />
        );
      })}
    </svg>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.08em" }}>{label}</div>
      <div style={{
        fontFamily: "var(--font-clash-display)",
        fontSize: 16,
        color: highlight ? "var(--volt)" : "var(--paper)",
        fontWeight: highlight ? 700 : 600,
        marginTop: 2,
      }}>{value}</div>
    </div>
  );
}

function ActiveDeals({
  deals,
}: {
  deals: { id: string; status: string; title: string | null; totalCents: number; expiresAt: Date | null; sentAt: Date | null; updatedAt: Date; brand: { name: string } | null }[];
}) {
  const now = Date.now();
  return (
    <SectionCard
      title="ACTIVE DEALS"
      subtitle="Proposals out for review"
      right={<Link href="/proposals" style={linkStyle}>All proposals →</Link>}
    >
      {deals.length === 0 ? (
        <Empty>Nothing out for review right now.</Empty>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {deals.map(d => {
            const exp = d.expiresAt ? new Date(d.expiresAt).getTime() : null;
            const dayDelta = exp ? Math.round((exp - now) / 86_400_000) : null;
            return (
              <Link key={d.id} href={`/proposals/${d.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr auto auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "var(--ink-2)",
                  borderRadius: "var(--r)",
                }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", fontWeight: 500 }}>
                      {d.title ?? "Untitled proposal"}
                    </div>
                    <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.5, marginTop: 2 }}>
                      {d.brand?.name ?? "—"}
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: dayDelta !== null && dayDelta <= 3 ? "var(--flush)" : "var(--paper)", opacity: dayDelta !== null && dayDelta <= 3 ? 0.95 : 0.6 }}>
                    {dayDelta === null
                      ? "no deadline"
                      : dayDelta < 0
                        ? `${Math.abs(dayDelta)}d overdue`
                        : dayDelta === 0
                          ? "due today"
                          : `${dayDelta}d left`}
                  </span>
                  <span style={{ fontFamily: "var(--font-clash-display)", fontSize: 14, color: "var(--volt)", fontWeight: 600 }}>
                    {formatCents(d.totalCents)}
                  </span>
                  <ProposalStatus status={d.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function RecentWork({
  wins,
}: {
  wins: { id: string; title: string | null; totalCents: number; approvedTotalCents: number | null; approvedAt: Date | null; brand: { name: string } | null }[];
}) {
  return (
    <SectionCard title="RECENT WORK" subtitle="Approved proposals">
      {wins.length === 0 ? (
        <Empty>No approvals yet. Win some.</Empty>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {wins.map(p => (
            <div key={p.id} style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr auto",
              gap: 14,
              alignItems: "center",
              padding: "12px 16px",
              background: "var(--ink-2)",
              borderRadius: "var(--r)",
            }}>
              <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)" }}>
                {p.title ?? "Untitled"}
                <span style={{ marginLeft: 10, fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.45 }}>
                  {p.brand?.name ?? ""}
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.5 }}>
                {p.approvedAt ? new Date(p.approvedAt).toLocaleDateString() : ""}
              </span>
              <span style={{ fontFamily: "var(--font-clash-display)", fontSize: 14, color: "var(--volt)", fontWeight: 600 }}>
                {formatCents(p.approvedTotalCents ?? p.totalCents)}
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function PublicPageCard({ url, deliverableCount }: { url: string | null; deliverableCount: number }) {
  return (
    <div style={{ background: "linear-gradient(180deg, rgba(196,255,2,0.08) 0%, var(--ink-2) 100%)", border: "1.5px solid var(--volt)", borderRadius: "var(--r)", padding: "18px 20px" }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--volt)", letterSpacing: "0.1em", marginBottom: 8 }}>
        YOUR PUBLIC RATE PAGE
      </div>
      {url ? (
        <>
          <div style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            color: "var(--paper)",
            background: "var(--ink-3)",
            padding: "8px 10px",
            borderRadius: "var(--r)",
            wordBreak: "break-all",
            marginBottom: 12,
          }}>
            {url.replace(/^https?:\/\//, "")}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <CopyLink url={url} />
            <Link
              href={url}
              target="_blank"
              style={{ flex: 1, textDecoration: "none", padding: "9px 12px", background: "var(--volt)", color: "var(--ink)", borderRadius: "var(--r)", fontFamily: "var(--font-space-mono)", fontSize: 11, letterSpacing: "0.05em", textAlign: "center", fontWeight: 700 }}
            >
              VIEW →
            </Link>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.65, margin: "0 0 12px" }}>
            {deliverableCount > 0
              ? "Your rates are ready. Publish to get a shareable URL you can send to brands."
              : "Set your rates first, then publish a page to share with brands."}
          </p>
          <Link
            href="/rates"
            style={{ display: "block", textAlign: "center", padding: "9px 12px", background: "var(--volt)", color: "var(--ink)", borderRadius: "var(--r)", fontFamily: "var(--font-clash-display)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
          >
            Go to rates →
          </Link>
        </>
      )}
    </div>
  );
}

function ProfileCard({
  displayName, handle, niches, bio,
}: {
  displayName: string | null;
  handle:      string | null;
  niches:      string[];
  bio:         string | null;
}) {
  return (
    <div style={{ background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)", padding: "18px 20px" }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.45, letterSpacing: "0.1em", marginBottom: 10 }}>
        PROFILE
      </div>
      <div style={{ fontFamily: "var(--font-clash-display)", fontSize: 18, color: "var(--paper)", fontWeight: 600 }}>
        {displayName ?? "Untitled creator"}
      </div>
      {handle && (
        <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--volt)", marginTop: 2 }}>
          {handle}
        </div>
      )}
      {niches.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {niches.map(n => (
            <span key={n} style={{ padding: "4px 9px", background: "var(--ink-3)", borderRadius: "var(--r)", fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.7, letterSpacing: "0.05em" }}>
              {n.toUpperCase()}
            </span>
          ))}
        </div>
      )}
      {bio && (
        <p style={{ marginTop: 12, fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.6, lineHeight: 1.5 }}>
          {bio}
        </p>
      )}
      <Link href="/settings" style={{ ...linkStyle, marginTop: 14, display: "inline-block" }}>
        Edit profile →
      </Link>
    </div>
  );
}

function QuickLinks() {
  const links: { href: string; label: string }[] = [
    { href: "/rates",     label: "Rates" },
    { href: "/analytics", label: "Analytics" },
    { href: "/brands",    label: "Brands" },
    { href: "/proposals", label: "Proposals" },
  ];
  return (
    <div style={{ background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)", padding: "14px 20px" }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.45, letterSpacing: "0.1em", marginBottom: 10 }}>
        QUICK LINKS
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{ ...linkStyle, padding: "8px 0" }}>
            {l.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  title, subtitle, right, children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)", padding: "18px 20px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.5, letterSpacing: "0.1em" }}>{title}</div>
          {subtitle && (
            <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.45, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "20px 0", textAlign: "center", fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.45 }}>
      {children}
    </div>
  );
}

function PreOnboarding({ firstName }: { firstName: string }) {
  return (
    <div style={{ padding: "60px 32px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: "clamp(34px, 5vw, 52px)", color: "var(--paper)", margin: "0 0 8px", lineHeight: 1.05 }}>
        Hello {firstName}.
      </h1>
      <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 16, color: "var(--paper)", opacity: 0.55, margin: "0 0 28px" }}>
        Finish setting up your profile so we can compute your rates.
      </p>
      <Link
        href="/onboarding"
        style={{ display: "inline-block", padding: "12px 24px", background: "var(--volt)", color: "var(--ink)", borderRadius: "var(--r)", fontFamily: "var(--font-clash-display)", fontSize: 15, fontWeight: 700, textDecoration: "none" }}
      >
        Complete onboarding →
      </Link>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function firstNameOf(name: string | null | undefined): string {
  if (!name) return "creator";
  const trimmed = name.trim().split(/\s+/)[0];
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

function tierLabel(followers: number): string {
  return `${followerTier(followers)} TIER`;
}

function greeting(): string {
  // Static rather than time-of-day; we don't know the viewer's TZ on the server
  // and rendering a "good morning" at 11pm reads as broken.
  return "TODAY";
}

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 11,
  color: "var(--volt)",
  textDecoration: "none",
  letterSpacing: "0.05em",
};

// Pin unused-by-design imports so future minor edits don't strip them.
void sql;
