// STUB — DirectPlatformProvider (V2)
import type { AnalyticsProvider, AnalyticsSnapshot, Platform } from "./types";

export class DirectPlatformProvider implements AnalyticsProvider {
  async fetchSnapshot(_handle: string, _platform: Platform): Promise<AnalyticsSnapshot> {
    throw new Error("DirectPlatformProvider is not yet implemented (V2)");
  }
}
