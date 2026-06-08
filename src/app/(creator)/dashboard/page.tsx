import { headers }            from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession }         from "@/lib/auth";
import { getScopedDb }        from "@/lib/db";
import { formatCents }        from "@/lib/money";
import Link                   from "next/link";

export default async function DashboardPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null; // layout already guards; just satisfy TS

  const db      = getScopedDb(env.DB, session.user.id);

  const [account, ratePages, proposals] = await Promise.all([
    db.creatorAccount.findFirst({ include: { profile: true } }),
    db.ratePage.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
    db.proposal.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  const heading = account?.profile?.displayName
    ? `Hey, ${account.profile.displayName.split(" ")[0]}.`
    : "Hey.";

  return (
    <div style={{ padding: "40px 32px", maxWidth: 900 }}>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: "clamp(32px, 5vw, 56px)", color: "var(--paper)", margin: "0 0 6px", lineHeight: 1.05 }}>
        {heading}
      </h1>
      <p style={{ fontFamily: "var(--font-general-sans)", fontSize: 15, color: "var(--paper)", opacity: 0.5, margin: "0 0 40px" }}>
        {account ? "Here's where things stand." : "Finish setting up your profile to get started."}
      </p>

      {!account && (
        <Link
          href="/onboarding"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "var(--volt)",
            color: "var(--ink)",
            fontFamily: "var(--font-clash-display)",
            fontSize: 15,
            fontWeight: 700,
            borderRadius: "var(--r)",
            textDecoration: "none",
            marginBottom: 40,
          }}
        >
          Complete onboarding →
        </Link>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
        <StatCard label="Rate pages" value={String(ratePages.length)} />
        <StatCard label="Proposals" value={String(proposals.length)} />
      </div>

      {ratePages.length > 0 && (
        <Section title="RECENT RATE PAGES">
          {ratePages.map(rp => (
            <RowItem
              key={rp.id}
              label={rp.title ?? `Rate page · ${rp.token}`}
              meta={rp.status}
              href={`/r/${rp.token}`}
            />
          ))}
        </Section>
      )}

      {proposals.length > 0 && (
        <Section title="RECENT PROPOSALS">
          {proposals.map(p => (
            <RowItem
              key={p.id}
              label={p.title ?? `Proposal #${p.version}`}
              meta={p.status}
              href={`/proposals/${p.id}`}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--ink-2)", border: "1.5px solid var(--ink-3)", borderRadius: "var(--r)", padding: "20px 22px" }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.08em", marginBottom: 8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: "var(--font-clash-display)", fontSize: 36, color: "var(--volt)", fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.1em", marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {children}
      </div>
    </div>
  );
}

function RowItem({ label, meta, href }: { label: string; meta: string; href?: string }) {
  const content = (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      background: "var(--ink-2)",
      borderRadius: "var(--r)",
      fontFamily: "var(--font-general-sans)",
      color: "var(--paper)",
      fontSize: 14,
    }}>
      <span>{label}</span>
      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 11, opacity: 0.4 }}>{meta}</span>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{content}</Link>;
  return content;
}
