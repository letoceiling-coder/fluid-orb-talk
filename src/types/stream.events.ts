import type { UsageMetadata } from './message.types';
import type { RuntimeState } from './assistant-runtime.types';

export type StreamEventType =
  | 'chat/ack'
  | 'chat/chunk'
  | 'chat/done'
  | 'chat/error'
  | 'session/state'
  | 'ping'
  | 'pong';

export interface StreamEventEnvelope<T extends StreamEventType, P> {
  type: T;
  session_id: string;
  timestamp?: string;
  trace_id?: string;
  payload: P;
}

export interface ChatAckPayload {
  provider?: string;
  model?: string;
}

export interface ChatChunkPayload {
  delta: string;
  index?: number;
}

export interface ChatDonePayload {
  content: string;
  provider?: string;
  model?: string;
  usage?: UsageMetadata;
  latency_ms?: number;
}

export interface ChatErrorPayload {
  error: string;
  code?: string;
  retryable?: boolean;
}

export interface SessionStatePayload {
  state: RuntimeState;
}

export interface PingPayload {
  ts: number;
}

export interface PongPayload {
  ts: number;
}

export type ChatAckEvent = StreamEventEnvelope<'chat/ack', ChatAckPayload>;
export type ChatChunkEvent = StreamEventEnvelope<'chat/chunk', ChatChunkPayload>;
export type ChatDoneEvent = StreamEventEnvelope<'chat/done', ChatDonePayload>;
export type ChatErrorEvent = StreamEventEnvelope<'chat/error', ChatErrorPayload>;
export type SessionStateEvent = StreamEventEnvelope<'session/state', SessionStatePayload>;
export type PingEvent = StreamEventEnvelope<'ping', PingPayload>;
export type PongEvent = StreamEventEnvelope<'pong', PongPayload>;

export type AnyStreamEvent =
  | ChatAckEvent
  | ChatChunkEvent
  | ChatDoneEvent
  | ChatErrorEvent
  | SessionStateEvent
  | PingEvent
  | PongEvent;

