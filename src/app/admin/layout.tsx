/**
 * Admin layout — hard role guard.
 *
 * Runs on every /admin/** route before rendering any child.
 * Two failure paths:
 *   1. No session   → redirect /sign-in
 *   2. role ≠ ADMIN → redirect /dashboard (authenticated but not admin)
 *
 * NEVER replaced with an if (isAdmin) branch in a creator action.
 * This layout is the sole admin gate on the UI layer.
 */

import { redirect } from "next/navigation";
import { headers }  from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";
import AdminShell            from "@/components/layout/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());

  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
