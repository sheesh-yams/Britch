import { headers }           from "next/headers";
import { redirect }          from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, desc }          from "drizzle-orm";
import { getSession }        from "@/lib/auth";
import { getScopedDb }       from "@/lib/db";
import { brand }             from "@/db/schema";

export default async function BrandsPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const scoped = await getScopedDb(env.DB, session.user.id);
  if (!scoped) redirect("/onboarding");
  const { db, accountId } = scoped;

  const brands = await db.query.brand.findMany({
    where: eq(brand.accountId, accountId),
    orderBy: desc(brand.createdAt),
  });

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
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "var(--ink-2)", borderRadius: "var(--r)" }}
            >
              <div>
                <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", fontWeight: 500 }}>
                  {b.name}
                </div>
                {b.notes && (
                  <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.4, marginTop: 2 }}>
                    {b.notes}
                  </div>
                )}
              </div>
              {b.contactEmail && (
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.35 }}>
                  {b.contactEmail}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
