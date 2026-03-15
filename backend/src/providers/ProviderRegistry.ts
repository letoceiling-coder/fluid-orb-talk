import { BaseProvider } from './BaseProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';
import { GoogleProvider } from './GoogleProvider.js';
import { ElevenLabsProvider } from './ElevenLabsProvider.js';
import { ReplicateProvider } from './ReplicateProvider.js';
import type { TaskType } from '../types/gateway.types.js';

/**
 * ProviderRegistry — Runtime registry of all available AI providers.
 *
 * Responsibilities:
 *   - Auto-register all providers on first access
 *   - Return provider by name
 *   - List providers that support a given task type
 *   - Check provider availability
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, BaseProvider> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  register(provider: BaseProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): BaseProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`ProviderRegistry: provider "${name}" not registered`);
    }
    return provider;
  }

  getProvidersForTask(taskType: TaskType): BaseProvider[] {
    return Array.from(this.providers.values()).filter((p) =>
      p.supportedTaskTypes.includes(taskType),
    );
  }

  listAll(): Array<{ name: string; tasks: TaskType[]; available: boolean }> {
    return Array.from(this.providers.values()).map((p) => ({
      name: p.name,
      tasks: p.supportedTaskTypes,
      available: Boolean(process.env[`${p.name.toUpperCase()}_API_KEY`]),
    }));
  }

  private registerDefaults(): void {
    this.register(new OpenAIProvider());
    this.register(new AnthropicProvider());
    this.register(new GoogleProvider());
    this.register(new ElevenLabsProvider());
    this.register(new ReplicateProvider());
  }
}
