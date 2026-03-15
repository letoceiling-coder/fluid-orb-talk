import { BaseAgent } from './BaseAgent.js';
import type { AgentConfig, AgentCapability } from '../../types/agent.types.js';

/**
 * ResearchAgent — Deep web research with source verification and reporting.
 *
 * Capabilities: Browsing, Analytics, Code
 */
export class ResearchAgent extends BaseAgent {
  readonly name = 'Research Assistant';
  readonly capabilities: AgentCapability[] = ['Browsing', 'Analytics', 'Code'];

  constructor(config: AgentConfig) {
    super(config);
  }

  async plan(task: string): Promise<string[]> {
    return [
      `Define research scope: ${task}`,
      'Identify key search queries',
      'Browse and collect sources (web search)',
      'Verify and cross-reference sources',
      'Extract and structure key findings',
      'Generate formatted research report',
    ];
  }

  async step(stepDescription: string): Promise<string> {
    return `[ResearchAgent stub] Completed step: ${stepDescription}`;
  }

  async observe(toolResult: string): Promise<'continue' | 'done' | 'error'> {
    return 'continue';
  }
}
