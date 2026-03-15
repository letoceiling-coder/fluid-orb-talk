export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface ChatConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

export interface VisionConfig {
  model?: string;
  detail?: 'low' | 'high' | 'auto';
  maxTokens?: number;
}

export interface TTSConfig {
  voice?: string;
  language?: string;
  speed?: number;
  format?: 'mp3' | 'pcm' | 'wav';
  model?: string;
}

export interface STTConfig {
  language?: string;
  model?: string;
  prompt?: string;
}
