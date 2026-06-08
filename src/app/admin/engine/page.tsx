import { getPrisma }         from "@/lib/db";
import { getRequestContext } from "@opennextjs/cloudflare";
import { formatBps, formatCents, formatMultiplier } from "@/lib/money";

export default async function EnginePage() {
  const { env } = getRequestContext();
  const prisma  = getPrisma(env.DB);
  const ep      = await prisma.engineParams.findFirst({ where: { isActive: true } });

  if (!ep) {
    return (
      <div>
        <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 32, color: "var(--paper)", margin: "0 0 16px" }}>Engine Params</h1>
        <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--flush)" }}>
          No active engine params found. Run seed SQL to initialize.
        </p>
      </div>
    );
  }

  const params = [
    { label: "Reach weight",         value: formatBps(ep.reachWeightBps),         raw: ep.reachWeightBps,         note: "% of score from avg organic reach" },
    { label: "Follower weight",       value: formatBps(ep.followerWeightBps),       raw: ep.followerWeightBps,       note: "% of score from follower count" },
    { label: "Benchmark engagement",  value: formatBps(ep.benchmarkEngagementBps),  raw: ep.benchmarkEngagementBps,  note: "baseline engagement rate for adj=1.0×" },
    { label: "Eng adj floor",         value: formatMultiplier(ep.engAdjMinBps),     raw: ep.engAdjMinBps,            note: "min engagement multiplier (low eng)" },
    { label: "Eng adj ceiling",       value: formatMultiplier(ep.engAdjMaxBps),     raw: ep.engAdjMaxBps,            note: "max engagement multiplier (high eng)" },
    { label: "Rounding step",         value: formatCents(ep.roundingCents),         raw: ep.roundingCents,           note: "round rates to nearest N" },
    { label: "Floor spread",          value: formatBps(ep.floorSpreadBps),          raw: ep.floorSpreadBps,          note: "floor = target × (1 - spread)" },
    { label: "Stretch spread",        value: formatBps(ep.stretchSpreadBps),        raw: ep.stretchSpreadBps,        note: "stretch = target × (1 + spread)" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 32, color: "var(--paper)", margin: 0 }}>Engine Params</h1>
        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "var(--volt)" }}>
          {ep.label}
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.45, margin: "0 0 28px" }}>
        Singleton — only one active set. Version v{ep.version}. To update, use the admin actions API.
      </p>

      <div style={{ display: "grid", gap: 1 }}>
        {params.map(({ label, value, note }) => (
          <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "12px 16px", background: "var(--ink-3)", borderRadius: "var(--r)", alignItems: "start" }}>
            <div>
              <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)" }}>{label}</div>
              <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 12, color: "var(--paper)", opacity: 0.4, marginTop: 2 }}>{note}</div>
            </div>
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 14, color: "var(--volt)", fontWeight: 600, textAlign: "right" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
