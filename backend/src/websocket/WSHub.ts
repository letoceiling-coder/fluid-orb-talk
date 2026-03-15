import type { Server } from 'http';
import type { WSEvent } from './events.js';

interface ConnectedClient {
  id: string;
  socket: {
    readyState: number;
    OPEN: number;
    send: (data: string) => void;
    on: (event: string, cb: (...args: unknown[]) => void) => void;
  };
  rooms: Set<string>;
  connectedAt: Date;
  meta?: Record<string, unknown>;
}

/**
 * WSHub — Central WebSocket connection manager.
 *
 * Phase 3 additions:
 *   - chatStream rooms (one per sessionId)
 *   - agent update routing
 *   - workflow progress routing
 *   - ping/pong heartbeat
 */
export class WSHub {
  private static instance: WSHub;
  private clients: Map<string, ConnectedClient> = new Map();
  private clientCounter = 0;
  private pingInterval?: ReturnType<typeof setInterval>;

  private constructor() {
    this.startHeartbeat();
  }

  static getInstance(): WSHub {
    if (!WSHub.instance) {
      WSHub.instance = new WSHub();
    }
    return WSHub.instance;
  }

  init(_server: Server): void {
    console.log('[WSHub] WebSocket hub initialized via @fastify/websocket');
  }

  addClient(socket: ConnectedClient['socket'], meta?: Record<string, unknown>): string {
    const id = `client_${++this.clientCounter}_${Date.now()}`;
    this.clients.set(id, {
      id,
      socket,
      rooms: new Set(),
      connectedAt: new Date(),
      meta,
    });

    socket.on('close', () => this.removeClient(id));
    socket.on('error', () => this.removeClient(id));

    console.log(`[WSHub] Client connected: ${id} (total: ${this.clients.size})`);
    this.sendToClient(id, { type: 'pong', clientId: id, ts: Date.now() });
    return id;
  }

  removeClient(id: string): void {
    if (this.clients.delete(id)) {
      console.log(`[WSHub] Client disconnected: ${id} (total: ${this.clients.size})`);
    }
  }

  joinRoom(clientId: string, room: string): void {
    this.clients.get(clientId)?.rooms.add(room);
  }

  leaveRoom(clientId: string, room: string): void {
    this.clients.get(clientId)?.rooms.delete(room);
  }

  broadcast(event: WSEvent | Record<string, unknown>): void {
    const payload = JSON.stringify(event);
    for (const client of this.clients.values()) {
      this.safeSend(client, payload);
    }
  }

  sendToRoom(room: string, event: WSEvent | Record<string, unknown>): void {
    const payload = JSON.stringify(event);
    for (const client of this.clients.values()) {
      if (client.rooms.has(room)) {
        this.safeSend(client, payload);
      }
    }
  }

  sendToClient(clientId: string, event: WSEvent | Record<string, unknown>): void {
    const client = this.clients.get(clientId);
    if (client) this.safeSend(client, JSON.stringify(event));
  }

  /** Emit a streaming chat chunk to a specific session room */
  emitChatChunk(sessionId: string, chunk: string, provider: string): void {
    this.sendToRoom(`chat:${sessionId}`, {
      type: 'chat/chunk',
      sessionId,
      chunk,
      provider,
    });
  }

  /** Emit chat/done to a session room */
  emitChatDone(sessionId: string, provider: string): void {
    this.sendToRoom(`chat:${sessionId}`, {
      type: 'chat/done',
      sessionId,
      provider,
    });
  }

  /** Emit workflow progress */
  emitWorkflowProgress(runId: string, nodeId: string, status: 'running' | 'done' | 'error', output?: unknown): void {
    this.sendToRoom(`workflow:${runId}`, {
      type:   'workflow/progress',
      runId,
      nodeId,
      status,
      output,
    });
  }

  /** Emit agent update */
  emitAgentUpdate(agentId: string, step: string, result: string): void {
    this.sendToRoom(`agent:${agentId}`, {
      type: 'agent/update',
      agentId,
      step,
      result,
    });
  }

  getStats(): { total: number; rooms: string[] } {
    const rooms = new Set<string>();
    for (const c of this.clients.values()) c.rooms.forEach((r) => rooms.add(r));
    return { total: this.clients.size, rooms: Array.from(rooms) };
  }

  private safeSend(client: ConnectedClient, payload: string): void {
    try {
      if (client.socket.readyState === client.socket.OPEN) {
        client.socket.send(payload);
      }
    } catch {
      this.removeClient(client.id);
    }
  }

  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      const ping = JSON.stringify({ type: 'ping', ts: Date.now() });
      for (const client of this.clients.values()) {
        this.safeSend(client, ping);
      }
    }, 30_000);
  }

  destroy(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }
}
