import { headers }            from "next/headers";
import { redirect }           from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, asc, desc } from "drizzle-orm";
import { getSession }         from "@/lib/auth";
import { getScopedDb }        from "@/lib/db";
import { ratePage, deliverable } from "@/db/schema";
import { formatCents }        from "@/lib/money";
import Link                   from "next/link";
import {
  updateDeliverableRate,
  recomputeAllRates,
  publishRatePage,
} from "./actions";

export default async function RatesPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const scoped = await getScopedDb(env.DB, session.user.id);
  if (!scoped) redirect("/onboarding");
  const { db, accountId } = scoped;

  const [ratePages, deliverables] = await Promise.all([
    db.query.ratePage.findMany({
      where: eq(ratePage.accountId, accountId),
      orderBy: desc(ratePage.updatedAt),
    }),
    db.query.deliverable.findMany({
      where: and(eq(deliverable.accountId, accountId), eq(deliverable.isActive, true)),
      orderBy: [asc(deliverable.platform), asc(deliverable.type)],
    }),
  ]);

  const published = ratePages.find(rp => rp.status === "PUBLISHED");

  return (
    <div style={{ padding: "40px 32px", maxWidth: 960 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 40, color: "var(--paper)", margin: "0 0 4px" }}>Rates</h1>
          <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.5, margin: 0 }}>
            Your deliverables. Edit floor/target/stretch, then publish a rate page.
          </p>
        </div>
        <form action={recomputeAllRates}>
          <button type="submit" style={secondaryButtonStyle}>Recompute from stats</button>
        </form>
      </div>

      <Section title="DELIVERABLES">
        {deliverables.length === 0 ? (
          <Empty message="No deliverables yet. Either the global pricing plane isn't seeded, or onboarding didn't capture your stats. Try 'Recompute from stats' above." />
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {deliverables.map(d => (
              <form
                key={d.id}
                action={updateDeliverableRate}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(140px, 1fr) repeat(3, 130px) 90px",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "var(--ink-2)",
                  borderRadius: "var(--r)",
                }}
              >
                <input type="hidden" name="id" value={d.id} />
                <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)" }}>
                  {d.label ?? d.type}
                  <span style={{ marginLeft: 8, fontFamily: "var(--font-space-mono)", fontSize: 11, opacity: 0.4 }}>{d.platform}</span>
                </div>
                <CurrencyInput name="floor"   defaultCents={d.floorCents}     label="FLOOR" />
                <CurrencyInput name="final"   defaultCents={d.finalRateCents} label="TARGET" highlight />
                <CurrencyInput name="stretch" defaultCents={d.stretchCents}   label="STRETCH" />
                <button type="submit" style={saveButtonStyle}>Save</button>
              </form>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <form action={publishRatePage}>
                <button type="submit" style={primaryButtonStyle}>
                  {published ? "Republish rate page →" : "Publish rate page →"}
                </button>
              </form>
            </div>
          </div>
        )}
      </Section>

      <Section title="RATE PAGES">
        {ratePages.length === 0 ? (
          <Empty message="No published rate pages yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {ratePages.map(rp => (
              <div
                key={rp.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "var(--ink-2)", borderRadius: "var(--r)" }}
              >
                <div>
                  <span style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)" }}>{rp.token}</span>
                  <span style={{ marginLeft: 10, fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4 }}>{rp.status}</span>
                  {rp.publishedAt && (
                    <span style={{ marginLeft: 10, fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4 }}>
                      published {new Date(rp.publishedAt).toLocaleDateString()}
                    </span>
                  )}
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

function CurrencyInput({
  name, defaultCents, label, highlight,
}: { name: string; defaultCents: number; label: string; highlight?: boolean }) {
  // defaultValue uses dollars (server-action handler converts back to cents).
  const dollars = (defaultCents / 100).toFixed(0);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "var(--paper)", opacity: 0.45, letterSpacing: "0.08em" }}>
        {label}
      </span>
      <input
        type="text"
        name={name}
        defaultValue={`$${dollars}`}
        style={{
          padding: "8px 10px",
          background: "var(--ink-3)",
          border: "1.5px solid var(--ink-3)",
          borderRadius: "var(--r)",
          color: highlight ? "var(--volt)" : "var(--paper)",
          fontFamily: "var(--font-space-mono)",
          fontSize: 14,
          fontWeight: highlight ? 600 : 400,
          outline: "none",
          width: "100%",
        }}
        aria-label={`${name} (was ${formatCents(defaultCents)})`}
      />
    </label>
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

const primaryButtonStyle: React.CSSProperties = {
  padding: "11px 22px",
  background: "var(--volt)",
  color: "var(--ink)",
  border: "none",
  borderRadius: "var(--r)",
  fontFamily: "var(--font-clash-display)",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "transparent",
  color: "var(--paper)",
  border: "1.5px solid var(--ink-3)",
  borderRadius: "var(--r)",
  fontFamily: "var(--font-general-sans)",
  fontSize: 13,
  cursor: "pointer",
};

const saveButtonStyle: React.CSSProperties = {
  padding: "8px 10px",
  background: "var(--ink-3)",
  color: "var(--paper)",
  border: "none",
  borderRadius: "var(--r)",
  fontFamily: "var(--font-space-mono)",
  fontSize: 11,
  cursor: "pointer",
  letterSpacing: "0.05em",
};
