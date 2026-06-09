import { headers }           from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";
import { getScopedDb }       from "@/lib/db";

export default async function SettingsPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  if (!session) return null;

  const db      = getScopedDb(env.DB, session.user.id);
  const account = await db.creatorAccount.findFirst({ include: { profile: true } });

  return (
    <div style={{ padding: "40px 32px", maxWidth: 640 }}>
      <h1 style={{ fontFamily: "var(--font-clash-display)", fontSize: 40, color: "var(--paper)", margin: "0 0 32px" }}>Settings</h1>

      <Section title="ACCOUNT">
        <FieldRow label="Name"    value={session.user.name} />
        <FieldRow label="Email"   value={session.user.email} />
        <FieldRow label="Role"    value={session.user.role ?? "USER"} />
        <FieldRow label="User ID" value={session.user.id} mono />
      </Section>

      {account?.profile && (
        <Section title="CREATOR PROFILE">
          <FieldRow label="Display name"   value={account.profile.displayName ?? "—"} />
          <FieldRow label="Niches"         value={(account.profile.niches as string[] | null)?.join(", ") || "—"} />
          {account.profile.bio && <FieldRow label="Bio" value={account.profile.bio} />}
        </Section>
      )}

      <Section title="DANGER ZONE">
        <div style={{ fontFamily: "var(--font-general-sans)", fontSize: 14, color: "var(--flush)", opacity: 0.8 }}>
          Account deletion is available via support. Contact us to permanently remove your data.
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontFamily: "var(--font-space-mono)", fontSize: 10, color: "var(--paper)", opacity: 0.4, letterSpacing: "0.1em", marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {children}
      </div>
    </div>
  );
}

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--ink-2)", borderRadius: "var(--r)", gap: 16 }}>
      <span style={{ fontFamily: "var(--font-general-sans)", fontSize: 13, color: "var(--paper)", opacity: 0.5 }}>{label}</span>
      <span style={{
        fontFamily: mono ? "var(--font-space-mono)" : "var(--font-general-sans)",
        fontSize: mono ? 11 : 14,
        color: "var(--paper)",
        opacity: mono ? 0.6 : 1,
      }}>{value}</span>
    </div>
  );
}
