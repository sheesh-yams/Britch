"use client";
/**
 * Sign-up page — name + email + password with Cloudflare Turnstile.
 * After sign-up, redirects to /onboarding to collect creator profile.
 */

import { useState, useRef } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import BrandMark from "@/components/britch/BrandMark";

export default function SignUpPage() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const widgetId = useRef<string | null>(null);

  const initTurnstile = (el: HTMLDivElement | null) => {
    if (!el || widgetId.current) return;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || typeof window === "undefined" || !window.turnstile) return;
    widgetId.current = window.turnstile.render(el, { sitekey: siteKey });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/onboarding",
      });
      if (result?.error) {
        setError(result.error.message ?? "Sign up failed.");
        window.turnstile?.reset(widgetId.current!);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
      window.turnstile?.reset(widgetId.current!);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <main
        style={{
          minHeight: "100vh",
          background: "var(--ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 40, textAlign: "center" }}>
            <BrandMark size="lg" />
          </div>

          <div
            style={{
              background: "var(--ink-2)",
              border: "1.5px solid var(--ink-3)",
              borderRadius: "var(--r)",
              padding: "32px",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-clash-display)",
                fontSize: 28,
                fontWeight: 700,
                color: "var(--paper)",
                margin: "0 0 6px",
              }}
            >
              Create account
            </h1>
            <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.5, margin: "0 0 28px" }}>
              Know your worth. Set your rate.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={labelStyle}>NAME</span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Your name"
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={labelStyle}>EMAIL</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={inputStyle}
                  placeholder="you@example.com"
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={labelStyle}>PASSWORD</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={inputStyle}
                  placeholder="8+ characters"
                />
              </label>

              <div ref={initTurnstile} />

              {error && (
                <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--flush)", padding: "10px 12px", background: "rgba(255,67,101,0.1)", borderRadius: "var(--r)" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "13px 20px",
                  background: loading ? "var(--ink-3)" : "var(--volt)",
                  color: "var(--ink)",
                  border: "none",
                  borderRadius: "var(--r)",
                  fontFamily: "var(--font-clash-display)",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? "Creating account…" : "Create account →"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.45 }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: "var(--volt)", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>

          <p style={{ textAlign: "center", marginTop: 8, fontFamily: "var(--font-general-sans)", fontSize: 12, color: "var(--paper)", opacity: 0.3 }}>
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 11,
  color: "var(--paper)",
  opacity: 0.5,
  letterSpacing: "0.07em",
};

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
