/**
 * Provider factory
 *
 * getActiveProvider() reads ProviderConfig from D1 and instantiates
 * the correct AnalyticsProvider. Swapping providers requires only an
 * admin UI change — no deploy.
 */

import type { DB } from "@/lib/db";
import type { AnalyticsProvider } from "./types";
import { SeededProvider } from "./seeded";
import { ManualProvider, type ManualInputData } from "./manual";

export type ProviderName =
  | "SEEDED"
  | "MANUAL"
  | "PHYLLO"
  | "HYPE_AUDITOR"
  | "DIRECT_PLATFORM";

/**
 * Factory: returns the active provider from ProviderConfig.
 * For MANUAL, pass manualData — the creator's entered stats.
 */
export async function getActiveProvider(
  db: DB,
  manualData?: ManualInputData,
): Promise<AnalyticsProvider> {
  const config = await db.query.providerConfig.findFirst();
  const name = (config?.activeAnalyticsProvider ?? "SEEDED") as ProviderName;
  return buildProvider(name, db, manualData);
}

export function buildProvider(
  name: ProviderName,
  db: DB,
  manualData?: ManualInputData,
): AnalyticsProvider {
  switch (name) {
    case "SEEDED":
      return new SeededProvider(db);
    case "MANUAL":
      if (!manualData) throw new Error("ManualProvider requires manualData");
      return new ManualProvider(manualData);
    case "PHYLLO":
    case "HYPE_AUDITOR":
    case "DIRECT_PLATFORM":
      throw new Error(`Provider ${name} is not yet implemented (V2)`);
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }
}

export { ManualProvider, type ManualInputData };
export type { AnalyticsProvider };
export type { AnalyticsSnapshot, Platform, AudienceData } from "./types";
