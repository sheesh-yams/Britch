"use client";
/**
 * Onboarding wizard — 4 steps:
 *   1. Identity   — display name, niche, bio
 *   2. Platform   — choose TikTok or Instagram (or both)
 *   3. Stats      — handle + followers + engagement (SeededProvider auto-fills if handle matches seed)
 *   4. Done       — redirect to /dashboard
 *
 * Server actions (stubbed here) will be wired to getScopedDb in Step 8 / full build.
 * For MVP, this collects data and POSTs to a server action.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/britch/BrandMark";

const NICHES = ["Lifestyle", "Beauty", "Food", "Fitness", "Tech", "Gaming", "Fashion", "Finance", "Travel", "Comedy"];
const PLATFORMS = ["TIKTOK", "INSTAGRAM"];

type Step = "identity" | "platform" | "stats" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identity");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [niche,       setNiche]       = useState("");
  const [bio,         setBio]         = useState("");
  const [platforms,   setPlatforms]   = useState<string[]>([]);
  const [handles,     setHandles]     = useState<Record<string, string>>({});
  const [followers,   setFollowers]   = useState<Record<string, string>>({});
  const [engagement,  setEngagement]  = useState<Record<string, string>>({});

  function togglePlatform(p: string) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, niche, bio, platforms, handles, followers, engagement }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? `Save failed (${res.status}). Please try again.`);
        setSaving(false);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <BrandMark size="md" />
        </div>

        {/* Progress */}
        <StepIndicator current={step} />

        {/* ── Step 1: Identity ─────────────────────────────── */}
        {step === "identity" && (
          <Card title="Who are you?" sub="Tell brands how to find you.">
            <Field label="DISPLAY NAME" required>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} placeholder="Sarah Creates" />
            </Field>
            <Field label="NICHE">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {NICHES.map(n => (
                  <Chip key={n} label={n} active={niche === n} onClick={() => setNiche(n)} />
                ))}
              </div>
            </Field>
            <Field label="BIO">
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="Lifestyle creator..." />
            </Field>
            <PrimaryButton disabled={!displayName} onClick={() => setStep("platform")}>
              Next →
            </PrimaryButton>
          </Card>
        )}

        {/* ── Step 2: Platform ─────────────────────────────── */}
        {step === "platform" && (
          <Card title="Platforms" sub="Select all that apply.">
            <div style={{ display: "flex", gap: 12 }}>
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  style={{
                    flex: 1,
                    padding: "20px",
                    background: platforms.includes(p) ? "var(--volt)" : "var(--ink-3)",
                    color: platforms.includes(p) ? "var(--ink)" : "var(--paper)",
                    border: platforms.includes(p) ? "none" : "1.5px solid var(--ink-3)",
                    borderRadius: "var(--r)",
                    fontFamily: "var(--font-clash-display)",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <SecondaryButton onClick={() => setStep("identity")}>← Back</SecondaryButton>
              <PrimaryButton disabled={platforms.length === 0} onClick={() => setStep("stats")}>
                Next →
              </PrimaryButton>
            </div>
          </Card>
        )}

        {/* ── Step 3: Stats ────────────────────────────────── */}
        {step === "stats" && (
          <Card title="Your stats" sub="Used to compute your rates. You can update anytime.">
            {platforms.map(p => (
              <div key={p} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--volt)", opacity: 0.8, marginBottom: 10, letterSpacing: "0.07em" }}>
                  {p}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input type="text" placeholder={`@handle`} value={handles[p] ?? ""} onChange={e => setHandles(h => ({ ...h, [p]: e.target.value }))} style={inputStyle} />
                  <input type="number" placeholder="Followers" value={followers[p] ?? ""} onChange={e => setFollowers(f => ({ ...f, [p]: e.target.value }))} style={inputStyle} min="0" />
                  <input type="number" placeholder="Engagement % (e.g. 4.5)" value={engagement[p] ?? ""} onChange={e => setEngagement(eg => ({ ...eg, [p]: e.target.value }))} style={inputStyle} step="0.1" min="0" max="100" />
                </div>
              </div>
            ))}
            {error && (
              <div style={{ padding: "10px 12px", background: "rgba(255,67,101,0.1)", borderRadius: "var(--r)", fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--flush)" }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <SecondaryButton onClick={() => setStep("platform")}>← Back</SecondaryButton>
              <PrimaryButton onClick={handleFinish} disabled={saving}>
                {saving ? "Saving…" : "Finish →"}
              </PrimaryButton>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ["identity", "platform", "stats", "done"];
  const idx = steps.indexOf(current);
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
      {steps.slice(0, 3).map((s, i) => (
        <div key={s} style={{ width: 32, height: 3, borderRadius: 2, background: i <= idx ? "var(--volt)" : "var(--ink-3)" }} />
      ))}
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)", padding: 32 }}>
      <h2 style={{ fontFamily: "var(--font-clash-display)", fontSize: 26, color: "var(--paper)", margin: "0 0 4px", fontWeight: 700 }}>{title}</h2>
      {sub && <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.5, margin: "0 0 24px" }}>{sub}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.5, letterSpacing: "0.07em" }}>
        {label}{required && " *"}
      </span>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px",
      background: active ? "var(--volt)" : "var(--ink-3)",
      color: active ? "var(--ink)" : "var(--paper)",
      border: "none",
      borderRadius: "var(--r)",
      fontFamily: "var(--font-general-sans)",
      fontSize: 13,
      cursor: "pointer",
      fontWeight: active ? 600 : 400,
    }}>{label}</button>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1,
      padding: "13px 20px",
      background: disabled ? "var(--ink-3)" : "var(--volt)",
      color: disabled ? "var(--paper)" : "var(--ink)",
      border: "none",
      borderRadius: "var(--r)",
      fontFamily: "var(--font-clash-display)",
      fontSize: 16,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
    }}>{children}</button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "13px 20px",
      background: "transparent",
      color: "var(--paper)",
      border: "1.5px solid var(--ink-3)",
      borderRadius: "var(--r)",
      fontFamily: "var(--font-general-sans)",
      fontSize: 15,
      cursor: "pointer",
    }}>{children}</button>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "11px 14px",
  background: "var(--ink-3)",
  border: "1.5px solid var(--ink-3)",
  borderRadius: "var(--r)",
  color: "var(--paper)",
  fontFamily: "var(--font-general-sans)",
  fontSize: 15,
  outline: "none",
  width: "100%",
};
