import { getCloudflareContext } from "@opennextjs/cloudflare";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { cpmBenchmark } from "@/db/schema";
import { formatCents } from "@/lib/money";

export default async function BenchmarksPage() {
  const { env } = getCloudflareContext();
  const db = getDb(env.DB);
  const rows = await db.query.cpmBenchmark.findMany({
    orderBy: [asc(cpmBenchmark.platform), asc(cpmBenchmark.followerTier)],
  });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 32, color: "var(--paper)", margin: "0 0 24px" }}>
        CPM Benchmarks
      </h1>
      <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.45, margin: "0 0 24px" }}>
        Global CPM benchmarks used by the rate engine. nicheId=NULL rows apply to all niches (generic).
      </p>
      <Table rows={rows} />
    </div>
  );
}

function Table({ rows }: { rows: { id: string; platform: string; nicheId: string | null; followerTier: string; cpmCents: number; source: string | null; isActive: boolean }[] }) {
  return (
    <div style={{ display: "grid", gap: 1 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, padding: "8px 14px", fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.07em" }}>
        <span>PLATFORM</span><span>NICHE</span><span>TIER</span><span>CPM</span><span>ACTIVE</span>
      </div>
      {rows.map(r => (
        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, padding: "10px 14px", background: "var(--ink-3)", borderRadius: "var(--r)", fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", alignItems: "center" }}>
          <span>{r.platform}</span>
          <span style={{ opacity: 0.5 }}>{r.nicheId ?? "—"}</span>
          <span>{r.followerTier}</span>
          <span style={{ color: "var(--volt)", fontFamily: "var(--font-space-mono)" }}>{formatCents(r.cpmCents)}</span>
          <span style={{ color: r.isActive ? "var(--volt)" : "var(--flush)" }}>{r.isActive ? "✓" : "✗"}</span>
        </div>
      ))}
    </div>
  );
}
