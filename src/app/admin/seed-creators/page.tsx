import { getPrisma }         from "@/lib/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export default async function AdminSeedCreatorsPage() {
  const { env }  = getCloudflareContext();
  const prisma   = getPrisma(env.DB);
  const creators = await prisma.seedCreator.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 32, color: "var(--paper)", margin: "0 0 8px" }}>
        Seed Creators
      </h1>
      <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.45, margin: "0 0 24px" }}>
        Demo analytics data served by SeededProvider. Used when no real OAuth integration is active.
      </p>

      {creators.length === 0 ? (
        <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--flush)" }}>
          No seed creators. Run prisma/seed.sql via wrangler d1 execute.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {creators.map(c => {
            const snap = c.snapshot as Record<string, unknown> | null;
            return (
              <div key={c.id} style={{ padding: "14px 18px", background: "var(--ink-3)", borderRadius: "var(--r)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", fontWeight: 500 }}>
                      {c.displayName}
                    </span>
                    <span style={{ marginLeft: 10, fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4 }}>
                      {c.handle} · {c.platform}
                    </span>
                  </div>
                  <span style={{ color: c.isActive ? "var(--volt)" : "var(--flush)", fontFamily: "var(--font-space-mono)", fontSize: 11 }}>
                    {c.isActive ? "active" : "inactive"}
                  </span>
                </div>
                {snap && (
                  <div style={{ marginTop: 6, fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4 }}>
                    {Number(snap.followers ?? 0).toLocaleString()} followers · {Number(snap.engagementRateBps ?? 0) / 100}% eng
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
