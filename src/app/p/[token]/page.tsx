/**
 * Public proposal page — /p/[token]
 * Brand-owner view: read-only, typed-signature approval, request changes.
 */

import { notFound }            from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq }                  from "drizzle-orm";
import { getDb }               from "@/lib/db";
import { proposal, proposalView } from "@/db/schema";
import { formatCents }         from "@/lib/money";
import BrandMark               from "@/components/britch/BrandMark";
import ProposalStatus          from "@/components/britch/ProposalStatus";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);

  const p = await db.query.proposal.findFirst({
    where: eq(proposal.token, token),
    with: { brand: { columns: { name: true } } },
  });

  if (!p) notFound();

  // Log view (fire-and-forget)
  try {
    await db.insert(proposalView).values({ proposalId: p.id, accountId: p.accountId });
  } catch { /* non-critical */ }

  const lineItems = p.lineItems as { label: string; priceCents: number; qty: number }[] | null ?? [];
  const totalCents = lineItems.reduce((s, l) => s + l.priceCents * l.qty, 0);

  return (
    <div style={{ background: "var(--ink)", minHeight: "100vh", color: "var(--paper)" }}>
      <header style={{ maxWidth: 760, margin: "0 auto", padding: "28px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandMark size="sm" />
        <ProposalStatus status={p.status} />
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 64px" }}>
        <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 700, margin: "0 0 6px", lineHeight: 1.1 }}>
          {p.title ?? "Proposal"}
        </h1>
        {p.brand && (
          <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.5, margin: "0 0 32px" }}>
            Prepared for {p.brand.name}
          </p>
        )}

        {p.notes && (
          <div style={{ marginBottom: 32, padding: "20px", background: "var(--ink-2)", borderRadius: "var(--r)", borderLeft: "4px solid var(--volt)" }}>
            <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", opacity: 0.8, lineHeight: 1.65, margin: 0 }}>
              {p.notes}
            </p>
          </div>
        )}

        {lineItems.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.1em", marginBottom: 12 }}>
              SCOPE &amp; DELIVERABLES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {lineItems.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", background: "var(--ink-2)", borderRadius: "var(--r)", fontFamily: "var(--font-general-sans)", fontSize: 15 }}>
                  <span style={{ color: "var(--paper)" }}>
                    {item.label}{item.qty > 1 ? ` × ${item.qty}` : ""}
                  </span>
                  <span style={{ fontFamily: "var(--font-space-mono)", color: "var(--paper)" }}>
                    {formatCents(item.priceCents * item.qty)}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 18px", background: "var(--ink-3)", borderRadius: "var(--r)", marginTop: 2 }}>
                <span style={{ fontFamily: "var(--font-clash-display)", fontSize: 20, color: "var(--paper)", fontWeight: 700 }}>Total</span>
                <span style={{ fontFamily: "var(--font-clash-display)", fontSize: 20, color: "var(--volt)", fontWeight: 700 }}>{formatCents(totalCents)}</span>
              </div>
            </div>
          </div>
        )}

        {p.status === "SENT" && (
          <div style={{ borderTop: "var(--line-paper)", paddingTop: 32 }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.1em", marginBottom: 16 }}>
              RESPONSE
            </div>
            <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.5, marginBottom: 20 }}>
              Type your full name to approve this proposal.
            </p>
            <div style={{ padding: "16px", background: "var(--ink-2)", borderRadius: "var(--r)", fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.4 }}>
              Approval form available in full build (requires client component + server action).
            </div>
          </div>
        )}

        <div style={{ marginTop: 48, fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.25 }}>
          v{p.version} · Powered by BRITCH
        </div>
      </main>
    </div>
  );
}
