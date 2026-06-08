import { headers }           from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";
import { getScopedDb }       from "@/lib/db";
import ProposalStatus        from "@/components/britch/ProposalStatus";
import Link                  from "next/link";

export default async function ProposalsPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const db        = getScopedDb(env.DB, session.user.id);
  const proposals = await db.proposal.findMany({
    orderBy: { updatedAt: "desc" },
    include: { brand: { select: { name: true } } },
  });

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900 }}>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 40, color: "var(--paper)", margin: "0 0 32px" }}>Proposals</h1>

      {proposals.length === 0 ? (
        <div style={{ padding: "64px 0", textAlign: "center", fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.4 }}>
          No proposals yet. Create one from the Brands page.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {proposals.map(p => (
            <Link
              key={p.id}
              href={`/proposals/${p.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                background: "var(--ink-2)",
                borderRadius: "var(--r)",
                gap: 16,
              }}>
                <div>
                  <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", fontWeight: 500 }}>
                    {p.title ?? "Untitled proposal"}
                  </div>
                  {p.brand && (
                    <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 12, color: "var(--paper)", opacity: 0.45, marginTop: 2 }}>
                      {p.brand.name}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.35 }}>
                    v{p.version}
                  </span>
                  <ProposalStatus status={p.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
