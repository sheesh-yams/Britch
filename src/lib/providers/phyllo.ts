// STUB — PhylloProvider (V2)
import type { AnalyticsProvider, AnalyticsSnapshot, Platform } from "./types";

export class PhylloProvider implements AnalyticsProvider {
  async fetchSnapshot(_handle: string, _platform: Platform): Promise<AnalyticsSnapshot> {
    throw new Error("PhylloProvider is not yet implemented (V2)");
  }
}
