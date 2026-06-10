import { getCloudflareContext } from "@opennextjs/cloudflare";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { niche } from "@/db/schema";

export default async function NichesPage() {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const niches = await db.query.niche.findMany({ orderBy: asc(niche.order) });

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
