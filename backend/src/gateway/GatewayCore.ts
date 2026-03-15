import { SuperRouter } from './SuperRouter.js';
import { ExecutionEngine } from './ExecutionEngine.js';
import type { GatewayRequest, GatewayResponse } from '../types/gateway.types.js';
import { UsageLogger } from '../utils/UsageLogger.js';

/**
 * GatewayCore — Central orchestrator for all AI requests.
 *
 * Flow:
 *   1. Validate request structure
 *   2. Delegate to SuperRouter for provider selection
 *   3. Delegate to ExecutionEngine for task execution
 *   4. Log usage
 *   5. Return unified response
 */
export class GatewayCore {
  private static instance: GatewayCore;

  private router: SuperRouter;
  private engine: ExecutionEngine;
  private logger: UsageLogger;

  private constructor() {
    this.router = SuperRouter.getInstance();
    this.engine = ExecutionEngine.getInstance();
    this.logger = UsageLogger.getInstance();
  }

  static getInstance(): GatewayCore {
    if (!GatewayCore.instance) {
      GatewayCore.instance = new GatewayCore();
    }
    return GatewayCore.instance;
  }

  async handle(request: GatewayRequest): Promise<GatewayResponse> {
    const startTime = Date.now();

    this.validate(request);

    // Select provider based on task type and strategy
    const provider = await this.router.route(request);

    // Execute the task
    const result = await this.engine.execute(request, provider);

    const latencyMs = Date.now() - startTime;

    // Log usage (fire-and-forget)
    this.logger.log({
      provider:          result.provider,
      model:             result.model,
      taskType:          request.taskType,
      latencyMs,
      status:            result.success ? 'success' : 'error',
      workspaceId:       request.workspaceId,
      userId:            request.userId,
      promptTokens:      result.usage?.prompt_tokens,
      completionTokens:  result.usage?.completion_tokens,
      totalTokens:       result.usage?.total_tokens,
    }).catch(console.error);

    return result;
  }

  private validate(request: GatewayRequest): void {
    if (!request.taskType) {
      throw new Error('GatewayCore: taskType is required');
    }
    if (!request.payload) {
      throw new Error('GatewayCore: payload is required');
    }
  }
}
