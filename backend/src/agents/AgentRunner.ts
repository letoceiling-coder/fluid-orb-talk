import type { BaseAgent } from './agents/BaseAgent.js';

/**
 * AgentRunner — Manages execution of a single agent's step loop.
 *
 * Wraps the agent's start() method with error handling,
 * event emission for WebSocket progress updates.
 */
export class AgentRunner {
  private agent: BaseAgent;

  constructor(agent: BaseAgent) {
    this.agent = agent;
  }

  async run(task: string): Promise<void> {
    try {
      await this.agent.start(task);
    } catch (err) {
      console.error(`[AgentRunner] Error running agent "${this.agent.name}":`, err);
      throw err;
    }
  }
}
