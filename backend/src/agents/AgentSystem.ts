import { v4 as uuidv4 } from 'uuid';
import { AgentRunner } from './AgentRunner.js';
import { VideoCreatorAgent } from './agents/VideoCreatorAgent.js';
import { ImageCreatorAgent } from './agents/ImageCreatorAgent.js';
import { ResearchAgent } from './agents/ResearchAgent.js';
import { MarketingAgent } from './agents/MarketingAgent.js';
import type { AgentConfig, AgentState, AgentCapability } from '../types/agent.types.js';
import type { BaseAgent } from './agents/BaseAgent.js';

interface AgentRecord {
  id: string;
  agent: BaseAgent;
  runner: AgentRunner;
  config: AgentConfig;
  createdAt: Date;
}

/**
 * AgentSystem — Manages the full lifecycle of all AI agents.
 *
 * Agent states: idle → starting → running → paused → stopped → error
 */
export class AgentSystem {
  private static instance: AgentSystem;
  private agents: Map<string, AgentRecord> = new Map();

  private constructor() {}

  static getInstance(): AgentSystem {
    if (!AgentSystem.instance) {
      AgentSystem.instance = new AgentSystem();
    }
    return AgentSystem.instance;
  }

  createAgent(config: AgentConfig): string {
    const id = uuidv4();
    const agent = this.instantiateAgent(config);
    const runner = new AgentRunner(agent);

    this.agents.set(id, { id, agent, runner, config, createdAt: new Date() });
    return id;
  }

  async startAgent(id: string, task: string): Promise<void> {
    const record = this.getRecord(id);
    await record.runner.run(task);
  }

  pauseAgent(id: string): void {
    this.getRecord(id).agent.pause();
  }

  resumeAgent(id: string): void {
    this.getRecord(id).agent.resume();
  }

  stopAgent(id: string): void {
    this.getRecord(id).agent.stop();
  }

  getStatus(id: string): AgentState {
    return this.getRecord(id).agent.getState();
  }

  listAgents(): Array<{ id: string; name: string; state: AgentState; capabilities: AgentCapability[] }> {
    return Array.from(this.agents.values()).map(({ id, agent }) => ({
      id,
      name: agent.name,
      state: agent.getState(),
      capabilities: agent.capabilities,
    }));
  }

  deleteAgent(id: string): void {
    const record = this.agents.get(id);
    if (record) {
      record.agent.stop();
      this.agents.delete(id);
    }
  }

  private getRecord(id: string): AgentRecord {
    const record = this.agents.get(id);
    if (!record) throw new Error(`AgentSystem: agent "${id}" not found`);
    return record;
  }

  private instantiateAgent(config: AgentConfig): BaseAgent {
    switch (config.type) {
      case 'video-creator':  return new VideoCreatorAgent(config);
      case 'image-creator':  return new ImageCreatorAgent(config);
      case 'research':       return new ResearchAgent(config);
      case 'marketing':      return new MarketingAgent(config);
      default:
        throw new Error(`AgentSystem: unknown agent type "${config.type}"`);
    }
  }
}
