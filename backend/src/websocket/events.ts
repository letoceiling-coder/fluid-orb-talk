/**
 * WebSocket event type definitions.
 *
 * All messages between server and client use these types.
 */

import type { TokenUsage } from '../types/gateway.types.js';

export type WSEventType =
  | 'chat/chunk'
  | 'chat/done'
  | 'chat/error'
  | 'vision/result'
  | 'progress'
  | 'agent/update'
  | 'agent/done'
  | 'agent/error'
  | 'workflow/progress'
  | 'workflow/done'
  | 'workflow/error'
  | 'ping'
  | 'pong';

export interface WSEvent {
  type: WSEventType;
  [key: string]: unknown;
}

export interface ChatChunkEvent extends WSEvent {
  type:      'chat/chunk';
  sessionId: string;
  chunk:     string;
  provider:  string;
}

export interface ChatDoneEvent extends WSEvent {
  type:      'chat/done';
  sessionId: string;
  provider:  string;
  usage?:    TokenUsage;
}

export interface ProgressEvent extends WSEvent {
  type: 'progress';
  runId: string;
  nodeId?: string;
  agentId?: string;
  status: 'running' | 'done' | 'error';
  output?: unknown;
  error?: string;
}

export interface AgentUpdateEvent extends WSEvent {
  type: 'agent/update';
  agentId: string;
  step: string;
  result: string;
}

export interface WorkflowProgressEvent extends WSEvent {
  type: 'workflow/progress';
  runId: string;
  nodeId: string;
  status: 'running' | 'done' | 'error';
}
