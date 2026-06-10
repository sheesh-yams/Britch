"use client";
/**
 * Sign-in page — email + password with Cloudflare Turnstile.
 * Client component; calls Better Auth's signIn.email().
 */

import { useState, useRef } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { TURNSTILE_SITEKEY, TURNSTILE_ACTION, verifyTurnstileToken } from "@/lib/turnstile";
import BrandMark from "@/components/britch/BrandMark";

declare global {
  interface Window {
    turnstile?: {
      render: (el: string | HTMLElement, opts: Record<string, unknown>) => string;
      getResponse: (id: string) => string | null;
      reset: (id: string) => void;
    };
  }
}

export default function SignInPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetId     = useRef<string | null>(null);

  const initTurnstile = (el: HTMLDivElement | null) => {
    if (!el || widgetId.current) return;
    if (typeof window === "undefined" || !window.turnstile) return;
    widgetId.current = window.turnstile.render(el, {
      sitekey: TURNSTILE_SITEKEY,
      action:  TURNSTILE_ACTION,
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Gate: verify Turnstile token via siteverify Worker before any auth call.
    // The Worker holds the secret. Existing signIn.email() logic below is unchanged.
    const token = widgetId.current ? window.turnstile?.getResponse(widgetId.current) : null;
    const verified = await verifyTurnstileToken(token);
    if (!verified) {
      setError("Please complete the verification challenge.");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      setLoading(false);
      return;
    }

    try {
      const result = await signIn.email({ email, password, callbackURL: "/dashboard" });
      if (result?.error) {
        setError(result.error.message ?? "Sign in failed.");
        if (widgetId.current) window.turnstile?.reset(widgetId.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Load Turnstile script */}
      <script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
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
          {/* Logo */}
          <div style={{ marginBottom: 40, textAlign: "center" }}>
            <BrandMark size="lg" />
          </div>

          {/* Card */}
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
              Sign in
            </h1>
            <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.5, margin: "0 0 28px" }}>
              Welcome back. Let&apos;s get to work.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.5, letterSpacing: "0.07em" }}>
                  EMAIL
                </span>
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
                <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, color: "var(--paper)", opacity: 0.5, letterSpacing: "0.07em" }}>
                  PASSWORD
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={inputStyle}
                  placeholder="••••••••"
                />
              </label>

              {/* Turnstile */}
              <div ref={node => { turnstileRef.current = node; initTurnstile(node); }} />

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
                  transition: "background 0.15s",
                }}
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--paper)", opacity: 0.45 }}>
            No account?{" "}
            <Link href="/sign-up" style={{ color: "var(--volt)", textDecoration: "none", fontWeight: 600 }}>
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </>
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
