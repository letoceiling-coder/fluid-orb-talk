import { v4 as uuidv4 } from 'uuid';
import { WorkflowStore } from './WorkflowStore.js';
import { WSHub } from '../websocket/WSHub.js';
import { TriggerNode } from './nodes/TriggerNode.js';
import { PromptNode } from './nodes/PromptNode.js';
import { AIModelNode } from './nodes/AIModelNode.js';
import { ImageGeneratorNode } from './nodes/ImageGeneratorNode.js';
import { VideoGeneratorNode } from './nodes/VideoGeneratorNode.js';
import { VoiceGeneratorNode } from './nodes/VoiceGeneratorNode.js';
import { APICallNode } from './nodes/APICallNode.js';
import { StorageNode } from './nodes/StorageNode.js';
import type { BaseNode } from './nodes/BaseNode.js';
import type {
  WorkflowGraph,
  WorkflowNode,
  NodeExecutionContext,
  NodeOutput,
} from '../types/workflow.types.js';

type NodeType = 'trigger' | 'prompt' | 'ai-model' | 'image-generator' |
                'video-generator' | 'voice-generator' | 'api-call' | 'storage';

/**
 * WorkflowEngine — Creates and executes automation workflows.
 *
 * Input: ReactFlow graph JSON (nodes + edges)
 * Execution: topological sort → execute each node in order
 * Progress: emitted via WebSocket as node status changes
 */
export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private store: WorkflowStore;

  private nodeExecutors: Record<NodeType, BaseNode> = {
    'trigger':         new TriggerNode(),
    'prompt':          new PromptNode(),
    'ai-model':        new AIModelNode(),
    'image-generator': new ImageGeneratorNode(),
    'video-generator': new VideoGeneratorNode(),
    'voice-generator': new VoiceGeneratorNode(),
    'api-call':        new APICallNode(),
    'storage':         new StorageNode(),
  };

  private constructor() {
    this.store = WorkflowStore.getInstance();
  }

  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  async create(workspaceId: string, name: string, graph: WorkflowGraph): Promise<string> {
    this.validateGraph(graph);
    return this.store.save(workspaceId, name, graph);
  }

  async execute(
    workflowId: string,
    triggerPayload: Record<string, unknown>,
    context: { workspaceId: string; userId: string },
  ): Promise<Record<string, NodeOutput>> {
    const graph = await this.store.load(workflowId);
    if (!graph) throw new Error(`WorkflowEngine: workflow "${workflowId}" not found`);

    const runId = uuidv4();
    const ws = WSHub.getInstance();
    const results: Record<string, NodeOutput> = {};

    // Topological sort
    const ordered = this.topologicalSort(graph);
    let currentData: Record<string, unknown> = triggerPayload;

    for (const node of ordered) {
      ws.broadcast({ type: 'progress', runId, nodeId: node.id, status: 'running' });

      const executor = this.nodeExecutors[node.data.nodeType as NodeType];
      if (!executor) {
        console.warn(`WorkflowEngine: no executor for node type "${node.data.nodeType}"`);
        continue;
      }

      const execContext: NodeExecutionContext = {
        nodeId: node.id,
        config: node.data.config ?? {},
        input: currentData,
        workflowId,
        workspaceId: context.workspaceId,
        userId: context.userId,
      };

      try {
        const output = await executor.execute(execContext);
        results[node.id] = output;
        currentData = { ...currentData, ...output.data };

        ws.broadcast({ type: 'progress', runId, nodeId: node.id, status: 'done', output });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Node execution failed';
        results[node.id] = { success: false, data: { error: errorMsg }, nodeType: node.data.nodeType };
        ws.broadcast({ type: 'progress', runId, nodeId: node.id, status: 'error', error: errorMsg });
        break;
      }
    }

    return results;
  }

  private validateGraph(graph: WorkflowGraph): void {
    if (!graph.nodes || graph.nodes.length === 0) {
      throw new Error('WorkflowEngine: graph must have at least one node');
    }
    // Check for cycles via topological sort — throws if cycle detected
    this.topologicalSort(graph);
  }

  private topologicalSort(graph: WorkflowGraph): WorkflowNode[] {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const node of graph.nodes) {
      inDegree.set(node.id, 0);
      adj.set(node.id, []);
    }

    for (const edge of graph.edges) {
      adj.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sorted: WorkflowNode[] = [];
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = nodeMap.get(current);
      if (node) sorted.push(node);

      for (const neighbor of adj.get(current) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== graph.nodes.length) {
      throw new Error('WorkflowEngine: workflow graph contains a cycle');
    }

    return sorted;
  }
}
