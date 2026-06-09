import { headers }           from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";
import { getScopedDb }       from "@/lib/db";
import { formatBps }         from "@/lib/money";
import AudiencePanel         from "@/components/britch/AudiencePanel";

export default async function AnalyticsPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const db      = getScopedDb(env.DB, session.user.id);
  const socials = await db.socialAccount.findMany({ where: { disconnectedAt: null } });

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900 }}>
      <PageHeader title="Analytics" sub="Your connected account stats." />

      {socials.length === 0 && (
        <Empty message="No social accounts connected yet. Complete onboarding to add them." />
      )}

      {socials.map(sa => {
        const audience = sa.audience as { gender?: Record<string, number>; ageBands?: Record<string, number>; topCountries?: { code: string; label: string; pct: number }[] } | undefined;

        return (
          <div key={sa.id} style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--font-clash-display)", fontSize: 22, color: "var(--paper)", margin: 0 }}>
                {sa.handle}
              </h2>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4 }}>
                {sa.platform}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              <Stat label="Followers"   value={sa.followers.toLocaleString()} />
              <Stat label="Engagement"  value={formatBps(sa.engagementRateBps)} />
              <Stat label="Avg Views"   value={sa.avgViews.toLocaleString()} />
            </div>

            {audience && <AudiencePanel audience={audience} />}
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)", padding: "16px 18px" }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.08em", marginBottom: 6 }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: "var(--font-clash-display)", fontSize: 26, color: "var(--paper)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 40, color: "var(--paper)", margin: "0 0 4px" }}>{title}</h1>
      {sub && <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.5, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center", fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.4 }}>
      {message}
    </div>
  );
}
