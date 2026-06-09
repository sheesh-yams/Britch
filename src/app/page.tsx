import { redirect } from "next/navigation";
import { headers }  from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const { env } = getCloudflareContext();
  const session = await getSession(env.DB, await headers());
  redirect(session ? "/dashboard" : "/sign-in");
}
