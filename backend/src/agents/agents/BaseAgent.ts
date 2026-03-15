import type { AgentConfig, AgentState, AgentCapability } from '../../types/agent.types.js';

/**
 * BaseAgent — Abstract class for all AI agents.
 *
 * Lifecycle: idle → starting → running → paused → stopped
 *
 * Each concrete agent implements:
 *   plan()   — generate list of steps for the given task
 *   step()   — execute one step using available tools
 *   observe() — process tool result and decide next action
 */
export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly capabilities: AgentCapability[];

  protected config: AgentConfig;
  protected state: AgentState = 'idle';
  protected memory: Array<{ role: 'user' | 'assistant' | 'tool'; content: string }> = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  getState(): AgentState {
    return this.state;
  }

  abstract plan(task: string): Promise<string[]>;

  abstract step(stepDescription: string): Promise<string>;

  abstract observe(toolResult: string): Promise<'continue' | 'done' | 'error'>;

  async start(task: string): Promise<void> {
    this.state = 'starting';
    this.memory = [];

    const steps = await this.plan(task);

    this.state = 'running';

    for (const stepDesc of steps) {
      if (this.state !== 'running') break;

      const result = await this.step(stepDesc);
      const decision = await this.observe(result);

      if (decision === 'done' || decision === 'error') {
        break;
      }
    }

    this.state = 'stopped';
  }

  pause(): void {
    if (this.state === 'running') {
      this.state = 'paused';
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'running';
    }
  }

  stop(): void {
    this.state = 'stopped';
  }
}
