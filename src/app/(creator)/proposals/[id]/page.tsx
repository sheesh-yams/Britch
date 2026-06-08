import { headers }           from "next/headers";
import { getRequestContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";
import { getScopedDb }       from "@/lib/db";
import { notFound }          from "next/navigation";
import { formatCents }       from "@/lib/money";
import ProposalStatus        from "@/components/britch/ProposalStatus";
import Link                  from "next/link";

export default async function ProposalDetailPage({ params }: { params: { id: string } }) {
  const { env } = getRequestContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const db       = getScopedDb(env.DB, session.user.id);
  const proposal = await db.proposal.findUnique({
    where: { id: params.id },
    include: {
      brand:         true,
      workItems:     true,
    },
  });

  if (!proposal) notFound();

  const lineItems = proposal.lineItems as { id: string; label: string; priceCents: number; qty: number }[] | null ?? [];
  const totalCents = lineItems.reduce((s, l) => s + l.priceCents * l.qty, 0);

  return (
    <div style={{ padding: "40px 32px", maxWidth: 800 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/proposals" style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4, textDecoration: "none" }}>
          ← Proposals
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 36, color: "var(--paper)", margin: 0 }}>
          {proposal.title ?? "Untitled proposal"}
        </h1>
        <ProposalStatus status={proposal.status} />
      </div>

      {proposal.brand && (
        <div style={{ marginBottom: 20, fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.55 }}>
          For <strong style={{ color: "var(--paper)", opacity: 1 }}>{proposal.brand.name}</strong>
        </div>
      )}

      {lineItems.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.1em", marginBottom: 12 }}>
            LINE ITEMS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {lineItems.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "11px 16px", background: "var(--ink-2)", borderRadius: "var(--r)", fontFamily: "var(--font-general-sans)", fontSize: 14 }}>
                <span style={{ color: "var(--paper)" }}>{item.label} {item.qty > 1 && `× ${item.qty}`}</span>
                <span style={{ color: "var(--volt)", fontFamily: "var(--font-space-mono)", fontWeight: 600 }}>{formatCents(item.priceCents * item.qty)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", background: "var(--ink-3)", borderRadius: "var(--r)", fontFamily: "var(--font-clash-display)", fontSize: 18, marginTop: 4 }}>
              <span style={{ color: "var(--paper)" }}>Total</span>
              <span style={{ color: "var(--volt)" }}>{formatCents(totalCents)}</span>
            </div>
          </div>
        </div>
      )}

      {proposal.message && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.1em", marginBottom: 10 }}>
            MESSAGE
          </div>
          <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", opacity: 0.7, lineHeight: 1.6, margin: 0 }}>
            {proposal.message}
          </p>
        </div>
      )}

      {proposal.token && (
        <div>
          <Link
            href={`/p/${proposal.token}`}
            target="_blank"
            style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "var(--volt)", textDecoration: "none" }}
          >
            View public proposal /p/{proposal.token} →
          </Link>
        </div>
      )}
    </div>
  );
}
