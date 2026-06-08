import { getPrisma }         from "@/lib/db";
import { getRequestContext } from "@opennextjs/cloudflare";

export default async function ProvidersPage() {
  const { env }    = getRequestContext();
  const prisma     = getPrisma(env.DB);
  const config     = await prisma.providerConfig.findFirst();

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 32, color: "var(--paper)", margin: "0 0 8px" }}>
        Provider Config
      </h1>
      <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.45, margin: "0 0 28px" }}>
        Controls which analytics provider is active and stores oEmbed tokens.
      </p>

      {!config ? (
        <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--flush)" }}>
          No provider config found. Run seed SQL.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="Active analytics provider" value={config.activeAnalyticsProvider ?? "—"} highlight />
          <Row label="Config ID"                 value={config.id} mono />
          <Row label="Last updated"              value={config.updatedAt ? new Date(config.updatedAt).toLocaleString() : "—"} mono />

          <div style={{ marginTop: 12 }}>
            <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.08em", marginBottom: 10 }}>
              AVAILABLE PROVIDERS
            </div>
            {["SEEDED", "MANUAL", "PHYLLO", "HYPEAUDITOR", "DIRECT"].map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--ink-3)", borderRadius: "var(--r)", marginBottom: 1 }}>
                <span style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)" }}>{p}</span>
                {config.activeAnalyticsProvider === p && (
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--volt)" }}>ACTIVE</span>
                )}
                {["PHYLLO", "HYPEAUDITOR", "DIRECT"].includes(p) && (
                  <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.3 }}>STUB</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 14px", background: "var(--ink-3)", borderRadius: "var(--r)" }}>
      <span style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.5 }}>{label}</span>
      <span style={{ fontFamily: mono ? "var(--font-space-mono)" : "var(--font-general-sans)", fontSize: mono ? 11 : 14, color: highlight ? "var(--volt)" : "var(--paper)", fontWeight: highlight ? 600 : 400 }}>
        {value}
      </span>
    </div>
  );
}
