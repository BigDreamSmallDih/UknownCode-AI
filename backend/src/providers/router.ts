import type { AIProvider, ProviderId } from './provider.interface.js';

/** Registry of the providers this server has credentials for. */
export class ProviderRouter {
  private readonly providers = new Map<ProviderId, AIProvider>();

  constructor(providers: readonly AIProvider[] = []) {
    for (const provider of providers) this.providers.set(provider.id, provider);
  }

  get(id: ProviderId): AIProvider | undefined {
    return this.providers.get(id);
  }

  list(): ProviderId[] {
    return [...this.providers.keys()];
  }
}
