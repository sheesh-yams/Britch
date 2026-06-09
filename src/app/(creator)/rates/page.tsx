import { headers }           from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";
import { getScopedDb }       from "@/lib/db";
import { formatCents }       from "@/lib/money";
import Link                  from "next/link";

export default async function RatesPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const db         = getScopedDb(env.DB, session.user.id);
  const [ratePages, deliverables] = await Promise.all([
    db.ratePage.findMany({ orderBy: { updatedAt: "desc" } }),
    db.deliverable.findMany({ where: { isActive: true }, orderBy: [{ platform: "asc" }, { type: "asc" }] }),
  ]);

  return (
    <div style={{ padding: "40px 32px", maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 40, color: "var(--paper)", margin: "0 0 4px" }}>Rates</h1>
          <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.5, margin: 0 }}>
            Your deliverables, rate pages, and published cards.
          </p>
        </div>
      </div>

      {/* Deliverables table */}
      <Section title="DELIVERABLES">
        {deliverables.length === 0 ? (
          <Empty message="No deliverables yet. Complete onboarding to generate rates." />
        ) : (
          <div style={{ display: "grid", gap: 1 }}>
            {deliverables.map(d => (
              <div
                key={d.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 16,
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "var(--ink-2)",
                  borderRadius: "var(--r)",
                  fontFamily: "var(--font-general-sans)",
                  fontSize: 14,
                  color: "var(--paper)",
                }}
              >
                <span>
                  {d.label ?? d.type}
                  <span style={{ marginLeft: 8, fontFamily: "var(--font-space-mono)", fontSize: 11, opacity: 0.4 }}>{d.platform}</span>
                </span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "var(--paper)", opacity: 0.5 }}>
                  floor {formatCents(d.floorCents)}
                </span>
                <span style={{ fontFamily: "var(--font-clash-display)", fontSize: 16, color: "var(--volt)", fontWeight: 600 }}>
                  {formatCents(d.finalRateCents)}
                </span>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "var(--paper)", opacity: 0.5 }}>
                  stretch {formatCents(d.stretchCents)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Rate pages */}
      <Section title="RATE PAGES">
        {ratePages.length === 0 ? (
          <Empty message="No rate pages yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {ratePages.map(rp => (
              <div
                key={rp.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--ink-2)", borderRadius: "var(--r)" }}
              >
                <div>
                  <span style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)" }}>
                    {rp.title ?? "Untitled rate page"}
                  </span>
                  <span style={{ marginLeft: 10, fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4 }}>
                    {rp.status}
                  </span>
                </div>
                <Link
                  href={`/r/${rp.token}`}
                  target="_blank"
                  style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--volt)", textDecoration: "none" }}
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.1em", marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div style={{ padding: "32px 16px", fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.4, textAlign: "center" }}>
      {message}
    </div>
  );
}
