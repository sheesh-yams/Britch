/**
 * Provider factory
 *
 * getActiveProvider() reads ProviderConfig from D1 and instantiates
 * the correct AnalyticsProvider. Swapping providers requires only an
 * admin UI change — no deploy.
 */

import type { AnalyticsProvider } from "./types";
import { SeededProvider } from "./seeded";
import { ManualProvider, type ManualInputData } from "./manual";

export type ProviderName =
  | "SEEDED"
  | "MANUAL"
  | "PHYLLO"
  | "HYPE_AUDITOR"
  | "DIRECT_PLATFORM";

interface ProviderConfigRecord {
  activeAnalyticsProvider: string;
}

interface PrismaLike {
  providerConfig: {
    findFirst(): Promise<ProviderConfigRecord | null>;
  };
  seedCreator: {
    findFirst(args: unknown): Promise<unknown>;
  };
}

/**
 * Factory: returns the active provider from ProviderConfig.
 * For MANUAL, pass manualData — the creator's entered stats.
 */
export async function getActiveProvider(
  prisma: PrismaLike,
  manualData?: ManualInputData
): Promise<AnalyticsProvider> {
  const config = await prisma.providerConfig.findFirst();
  const name = (config?.activeAnalyticsProvider ?? "SEEDED") as ProviderName;
  return buildProvider(name, prisma, manualData);
}

export function buildProvider(
  name: ProviderName,
  prisma: PrismaLike,
  manualData?: ManualInputData
): AnalyticsProvider {
  switch (name) {
    case "SEEDED":
      return new SeededProvider(prisma as unknown as ConstructorParameters<typeof SeededProvider>[0]);
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
