// STUB — HypeAuditorProvider (V2)
import type { AnalyticsProvider, AnalyticsSnapshot, Platform } from "./types";

export class HypeAuditorProvider implements AnalyticsProvider {
  async fetchSnapshot(_handle: string, _platform: Platform): Promise<AnalyticsSnapshot> {
    throw new Error("HypeAuditorProvider is not yet implemented (V2)");
  }
}
