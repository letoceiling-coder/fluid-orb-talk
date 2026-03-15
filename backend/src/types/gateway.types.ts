export type TaskType =
  | 'text/chat'
  | 'text/reasoning'
  | 'vision/analyze'
  | 'image/generate'
  | 'video/generate'
  | 'audio/tts'
  | 'audio/stt'
  | 'embed';

export type RoutingStrategy =
  | 'round-robin'
  | 'latency-first'
  | 'cost-optimized'
  | 'quality-first'
  | 'weighted-load'
  | 'geo-aware';

export interface GatewayRequest {
  taskType: TaskType;
  payload: Record<string, unknown>;
  strategy?: RoutingStrategy | string;
  workspaceId?: string;
  userId?: string;
  region?: string;
}

export interface TokenUsage {
  prompt_tokens:     number;
  completion_tokens: number;
  total_tokens:      number;
}

export interface GatewayResponse {
  success:  boolean;
  provider: string;
  taskType: string;
  model?:   string;
  data?:    Record<string, unknown>;
  usage?:   TokenUsage;
  error?:   string;
}
