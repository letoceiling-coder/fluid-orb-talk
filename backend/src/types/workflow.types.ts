export type WorkflowNodeType =
  | 'trigger'
  | 'prompt'
  | 'ai-model'
  | 'image-generator'
  | 'video-generator'
  | 'voice-generator'
  | 'api-call'
  | 'storage';

export interface WorkflowNode {
  id: string;
  data: {
    nodeType: WorkflowNodeType;
    config: Record<string, unknown>;
    label?: string;
  };
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface NodeExecutionContext {
  nodeId: string;
  config: Record<string, unknown>;
  input: Record<string, unknown>;
  workflowId?: string;
  workspaceId?: string;
  userId?: string;
}

export interface NodeOutput {
  success: boolean;
  data: Record<string, unknown>;
  nodeType: string;
}
