import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import type { BaseProvider } from '../providers/BaseProvider.js';
import type { GatewayRequest, RoutingStrategy, TaskType } from '../types/gateway.types.js';

/**
 * SuperRouter — Selects the best provider for a given request.
 *
 * Priority chains (Phase 2):
 *   chat/reasoning  → openai → anthropic → google
 *   vision/analyze  → openai → anthropic → google
 *   embed           → openai → google
 *   audio/tts       → openai
 *   audio/stt       → openai
 *
 * Strategies: round-robin | latency-first | cost-optimized |
 *             quality-first | weighted-load | geo-aware
 */
export class SuperRouter {
  private static instance: SuperRouter;
  private registry: ProviderRegistry;
  private rrCounters: Map<TaskType, number> = new Map();

  /** Ordered fallback chains per task type */
  private readonly priorityChain: Partial<Record<TaskType, string[]>> = {
    'text/chat':      ['openai', 'anthropic', 'google'],
    'text/reasoning': ['openai', 'anthropic', 'google'],
    'vision/analyze': ['openai', 'anthropic', 'google'],
    'embed':          ['openai', 'google'],
    'audio/tts':      ['openai'],
    'audio/stt':      ['openai'],
    'image/generate': ['replicate'],
    'video/generate': ['replicate'],
  };

  private constructor() {
    this.registry = ProviderRegistry.getInstance();
  }

  static getInstance(): SuperRouter {
    if (!SuperRouter.instance) {
      SuperRouter.instance = new SuperRouter();
    }
    return SuperRouter.instance;
  }

  /**
   * Returns the primary provider for the request based on strategy.
   * Used by ExecutionEngine.execute().
   */
  async route(request: GatewayRequest): Promise<BaseProvider> {
    const strategy: RoutingStrategy =
      (request.strategy as RoutingStrategy) ??
      (process.env.DEFAULT_ROUTING_STRATEGY as RoutingStrategy) ??
      'quality-first';

    const candidates = this.getCandidates(request.taskType);

    if (candidates.length === 0) {
      throw new Error(`SuperRouter: no providers available for task "${request.taskType}"`);
    }

    switch (strategy) {
      case 'round-robin':    return this.roundRobin(request.taskType, candidates);
      case 'latency-first':  return this.latencyFirst(candidates);
      case 'cost-optimized': return this.costOptimized(candidates, request.taskType);
      case 'quality-first':  return this.qualityFirst(candidates);
      case 'weighted-load':  return this.weightedLoad(candidates);
      case 'geo-aware':      return this.geoAware(candidates, request.region);
      default:               return candidates[0];
    }
  }

  /**
   * Returns ordered fallback chain for a task type.
   * Used by ExecutionEngine for automatic failover.
   */
  getFallbackChain(taskType: TaskType): BaseProvider[] {
    const chain = this.priorityChain[taskType] ?? [];
    const providers: BaseProvider[] = [];

    for (const name of chain) {
      try {
        providers.push(this.registry.getProvider(name));
      } catch {
        // provider not registered — skip
      }
    }

    // Append any remaining registered providers not already in the chain
    if (providers.length === 0) {
      return this.registry.getProvidersForTask(taskType);
    }

    return providers;
  }

  // ── Private strategies ────────────────────────────────────────────────────

  private getCandidates(taskType: TaskType): BaseProvider[] {
    const chain = this.priorityChain[taskType];
    if (chain) {
      const ordered: BaseProvider[] = [];
      for (const name of chain) {
        try { ordered.push(this.registry.getProvider(name)); } catch { /* skip */ }
      }
      return ordered.length > 0 ? ordered : this.registry.getProvidersForTask(taskType);
    }
    return this.registry.getProvidersForTask(taskType);
  }

  private roundRobin(taskType: TaskType, providers: BaseProvider[]): BaseProvider {
    const count = this.rrCounters.get(taskType) ?? 0;
    const selected = providers[count % providers.length];
    this.rrCounters.set(taskType, count + 1);
    return selected;
  }

  private latencyFirst(providers: BaseProvider[]): BaseProvider {
    return providers.reduce((best, p) =>
      p.getLatencyEstimate() < best.getLatencyEstimate() ? p : best
    );
  }

  private costOptimized(providers: BaseProvider[], taskType: TaskType): BaseProvider {
    return providers.reduce((best, p) =>
      p.getCostEstimate(1000, taskType) < best.getCostEstimate(1000, taskType) ? p : best
    );
  }

  private qualityFirst(providers: BaseProvider[]): BaseProvider {
    return providers.reduce((best, p) =>
      (p.qualityRank ?? 0) > (best.qualityRank ?? 0) ? p : best
    );
  }

  private weightedLoad(providers: BaseProvider[]): BaseProvider {
    return providers.reduce((best, p) =>
      (p.currentLoad ?? 0) < (best.currentLoad ?? 0) ? p : best
    );
  }

  private geoAware(providers: BaseProvider[], region?: string): BaseProvider {
    if (!region) return providers[0];
    return providers.find((p) => p.region === region) ?? providers[0];
  }
}
