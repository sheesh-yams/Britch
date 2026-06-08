import { getPrisma }         from "@/lib/db";
import { getRequestContext } from "@opennextjs/cloudflare";
import { formatMultiplier }  from "@/lib/money";

export default async function MultipliersPage() {
  const { env } = getRequestContext();
  const prisma  = getPrisma(env.DB);
  const rows    = await prisma.formatMultiplier.findMany({ orderBy: [{ platform: "asc" }, { deliverableType: "asc" }] });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 32, color: "var(--paper)", margin: "0 0 24px" }}>
        Format Multipliers
      </h1>
      <div style={{ display: "grid", gap: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: "8px 14px", fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.07em" }}>
          <span>PLATFORM</span><span>TYPE</span><span>MULTIPLIER</span><span>ACTIVE</span>
        </div>
        {rows.map(r => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, padding: "10px 14px", background: "var(--ink-3)", borderRadius: "var(--r)", fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)" }}>
            <span>{r.platform}</span>
            <span>{r.deliverableType}</span>
            <span style={{ color: "var(--volt)", fontFamily: "var(--font-space-mono)" }}>{formatMultiplier(r.multiplierBps)}</span>
            <span style={{ color: r.isActive ? "var(--volt)" : "var(--flush)" }}>{r.isActive ? "✓" : "✗"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
