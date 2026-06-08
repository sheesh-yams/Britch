import { getPrisma }         from "@/lib/db";
import { getRequestContext } from "@opennextjs/cloudflare";

export default async function NichesPage() {
  const { env } = getRequestContext();
  const prisma  = getPrisma(env.DB);
  const niches  = await prisma.niche.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 32, color: "var(--paper)", margin: "0 0 24px" }}>
        Niches
      </h1>
      <div style={{ display: "grid", gap: 1 }}>
        {niches.map(n => (
          <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--ink-3)", borderRadius: "var(--r)" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.35, minWidth: 20 }}>{n.order}</span>
              <span style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)" }}>{n.label}</span>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4 }}>{n.slug}</span>
            </div>
            <span style={{ color: n.isActive ? "var(--volt)" : "var(--flush)", fontFamily: "var(--font-space-mono)", fontSize: 11 }}>
              {n.isActive ? "active" : "inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
