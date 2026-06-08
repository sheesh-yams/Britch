"use client";
/**
 * AppShell — creator app chrome.
 * Sidebar (desktop) + drawer (mobile) + topbar.
 */

import Link      from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "@/components/britch/BrandMark";
import { signOut } from "@/lib/auth-client";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: "▦" },
  { href: "/analytics",  label: "Analytics",  icon: "◈" },
  { href: "/rates",      label: "Rates",      icon: "◉" },
  { href: "/proposals",  label: "Proposals",  icon: "◫" },
  { href: "/brands",     label: "Brands",     icon: "◳" },
  { href: "/settings",   label: "Settings",   icon: "◎" },
];

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const path = usePathname();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        minHeight: "100vh",
        background: "var(--ink)",
      }}
    >
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        style={{
          background: "var(--ink-2)",
          borderRight: "var(--line-paper)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
        }}
      >
        <div style={{ padding: "0 20px 24px" }}>
          <BrandMark size="sm" />
        </div>

        <nav style={{ flex: 1 }}>
          {NAV.map(({ href, label, icon }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 20px",
                  color: active ? "var(--volt)" : "var(--paper)",
                  background: active ? "var(--ink-3)" : "transparent",
                  textDecoration: "none",
                  fontFamily: "var(--font-general-sans)",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  borderLeft: active
                    ? "3px solid var(--volt)"
                    : "3px solid transparent",
                  transition: "all 0.1s",
                }}
              >
                <span style={{ fontSize: 16, opacity: 0.8 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── User footer ──────────────────────────────────────── */}
        <div
          style={{
            borderTop: "var(--line-paper)",
            padding: "16px 20px",
          }}
        >
          <div style={{ color: "var(--paper)", fontSize: 13, marginBottom: 4, fontWeight: 500 }}>
            {user.name}
          </div>
          <div style={{ color: "var(--paper)", opacity: 0.5, fontSize: 12, marginBottom: 12 }}>
            {user.email}
          </div>
          <button
            onClick={() => signOut().then(() => { window.location.href = "/sign-in"; })}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "transparent",
              border: "1.5px solid var(--paper)",
              color: "var(--paper)",
              fontFamily: "var(--font-general-sans)",
              fontSize: 12,
              cursor: "pointer",
              borderRadius: "var(--r)",
              opacity: 0.6,
              textAlign: "left",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main
        style={{
          background: "var(--ink)",
          overflowY: "auto",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
