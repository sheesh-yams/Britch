"use client";
/**
 * AdminShell — Britch admin chrome.
 * Minimal dark nav — operators only.
 */

import Link      from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "@/components/britch/BrandMark";
import { signOut } from "@/lib/auth-client";

const ADMIN_NAV = [
  { href: "/admin",                label: "Overview" },
  { href: "/admin/benchmarks",     label: "CPM Benchmarks" },
  { href: "/admin/multipliers",    label: "Format Multipliers" },
  { href: "/admin/niches",         label: "Niches" },
  { href: "/admin/engine",         label: "Engine Params" },
  { href: "/admin/seed-creators",  label: "Seed Creators" },
  { href: "/admin/providers",      label: "Providers" },
];

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const path = usePathname();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: "100vh", background: "var(--ink)" }}>
      <aside
        style={{
          background: "var(--ink-2)",
          borderRight: "1.5px solid var(--flush)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
        }}
      >
        <div style={{ padding: "0 16px 20px" }}>
          <BrandMark size="sm" />
          <div style={{
            marginTop: 6,
            padding: "3px 8px",
            background: "var(--flush)",
            color: "#fff",
            fontSize: 10,
            fontFamily: "var(--font-space-mono)",
            fontWeight: 700,
            display: "inline-block",
            borderRadius: "var(--r)",
            letterSpacing: "0.1em",
          }}>
            ADMIN
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {ADMIN_NAV.map(({ href, label }) => {
            const active = path === href || (href !== "/admin" && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "block",
                  padding: "9px 16px",
                  color: active ? "var(--flush)" : "var(--paper)",
                  background: active ? "rgba(255,67,101,0.08)" : "transparent",
                  textDecoration: "none",
                  fontFamily: "var(--font-general-sans)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  borderLeft: active ? "3px solid var(--flush)" : "3px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: "1.5px solid var(--flush)", padding: "12px 16px" }}>
          <div style={{ color: "var(--paper)", fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
            {user.email}
          </div>
          <Link
            href="/dashboard"
            style={{
              display: "block",
              color: "var(--paper)",
              fontSize: 12,
              opacity: 0.5,
              textDecoration: "none",
              marginBottom: 8,
            }}
          >
            ← Creator app
          </Link>
          <button
            onClick={() => signOut().then(() => { window.location.href = "/sign-in"; })}
            style={{
              width: "100%",
              padding: "6px 10px",
              background: "transparent",
              border: "1px solid var(--flush)",
              color: "var(--flush)",
              fontFamily: "var(--font-general-sans)",
              fontSize: 11,
              cursor: "pointer",
              borderRadius: "var(--r)",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ background: "var(--ink)", padding: 32, minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}
