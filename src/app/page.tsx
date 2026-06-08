import { redirect } from "next/navigation";
import { headers }  from "next/headers";
import { getRequestContext } from "@opennextjs/cloudflare";
import { getSession }        from "@/lib/auth";

export default async function RootPage() {
  const { env } = getRequestContext();
  const session = await getSession(env.DB, await headers());
  redirect(session ? "/dashboard" : "/sign-in");
}
