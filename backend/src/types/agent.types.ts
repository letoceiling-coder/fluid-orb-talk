export type AgentState = 'idle' | 'starting' | 'running' | 'paused' | 'stopped' | 'error';

export type AgentCapability =
  | 'Vision'
  | 'Video'
  | 'Image'
  | 'Audio'
  | 'Code'
  | 'Browsing'
  | 'Analytics'
  | 'Memory';

export type AgentType = 'video-creator' | 'image-creator' | 'research' | 'marketing';

export interface AgentConfig {
  type: AgentType;
  name: string;
  model?: string;
  maxSteps?: number;
  tools?: string[];
  memory?: boolean;
  [key: string]: unknown;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string;
  toolResult?: string;
}
