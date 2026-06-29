/**
 * Provider registry — factory for getting music provider instances.
 * Add new providers here as they are implemented.
 */

import type { MusicProvider } from "./music-provider";
import { JioSaavnProvider } from "./jiosaavn-provider";

const providers: Record<string, MusicProvider> = {};

export function getProvider(name?: string): MusicProvider {
  const providerName =
    name ||
    process.env.NEXT_PUBLIC_MUSIC_PROVIDER ||
    "jiosaavn";

  if (!providers[providerName]) {
    switch (providerName) {
      case "jiosaavn":
        providers[providerName] = new JioSaavnProvider();
        break;
      default:
        throw new Error(`Unknown music provider: ${providerName}`);
    }
  }

  return providers[providerName];
}

export function getAvailableProviders(): string[] {
  return ["jiosaavn"];
}
