/**
 * AudiencePanel — gender / age / country audience breakdown.
 * Pure presentational — receives parsed audience JSON.
 */

interface AudienceData {
  gender?:       Record<string, number>;
  ageBands?:     Record<string, number>;
  topCountries?: { code: string; label: string; pct: number }[];
}

interface AudiencePanelProps {
  audience: AudienceData;
}

function BarRow({ label, pct, color = "var(--volt)" }: { label: string; pct: number; color?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.7 }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "var(--paper)" }}>
          {pct}%
        </span>
      </div>
      <div style={{ height: 4, background: "var(--ink-3)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--paper)",
          opacity: 0.4,
          letterSpacing: "0.1em",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export default function AudiencePanel({ audience }: AudiencePanelProps) {
  const { gender, ageBands, topCountries } = audience;

  if (!gender && !ageBands && !topCountries) return null;

  return (
    <div
      style={{
        background: "var(--ink-2)",
        border: "1.5px solid var(--ink-3)",
        borderRadius: "var(--r)",
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-clash-display)",
          fontSize: 16,
          color: "var(--paper)",
          marginBottom: 20,
          fontWeight: 600,
        }}
      >
        Audience
      </div>

      {gender && Object.keys(gender).length > 0 && (
        <Section title="GENDER">
          {Object.entries(gender).map(([k, v]) => (
            <BarRow key={k} label={k} pct={v} />
          ))}
        </Section>
      )}

      {ageBands && Object.keys(ageBands).length > 0 && (
        <Section title="AGE">
          {Object.entries(ageBands).map(([k, v]) => (
            <BarRow key={k} label={k} pct={v} color="var(--electric)" />
          ))}
        </Section>
      )}

      {topCountries && topCountries.length > 0 && (
        <Section title="TOP COUNTRIES">
          {topCountries.map((c) => (
            <BarRow key={c.code} label={`${c.code} · ${c.label}`} pct={c.pct} color="var(--flush)" />
          ))}
        </Section>
      )}
    </div>
  );
}
