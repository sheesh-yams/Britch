/**
 * Creator app layout — session guard + sidebar shell.
 *
 * All (creator)/** routes inherit this layout.
 * requireSession() redirects to /sign-in if no valid session exists.
 * The AppShell renders the sidebar + topbar chrome.
 */

import { headers }  from "next/headers";
import { getRequestContext } from "@opennextjs/cloudflare";
import { requireSession }    from "@/lib/auth";
import AppShell              from "@/components/layout/AppShell";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { env } = getRequestContext();
  const session = await requireSession(env.DB, await headers());

  return <AppShell user={session.user}>{children}</AppShell>;
}
