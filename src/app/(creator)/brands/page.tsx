import { headers }           from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";
import { getScopedDb }       from "@/lib/db";

export default async function BrandsPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const db     = getScopedDb(env.DB, session.user.id);
  const brands = await db.brand.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div style={{ padding: "40px 32px", maxWidth: 800 }}>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 40, color: "var(--paper)", margin: "0 0 32px" }}>Brands</h1>

      {brands.length === 0 ? (
        <div style={{ padding: "64px 0", textAlign: "center", fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.4 }}>
          No brands yet. Add a brand to start creating proposals.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {brands.map(b => (
            <div
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                background: "var(--ink-2)",
                borderRadius: "var(--r)",
              }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", fontWeight: 500 }}>
                  {b.name}
                </div>
                {b.website && (
                  <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4, marginTop: 2 }}>
                    {b.website}
                  </div>
                )}
              </div>
              {b.primaryContactEmail && (
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.35 }}>
                  {b.primaryContactEmail}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
