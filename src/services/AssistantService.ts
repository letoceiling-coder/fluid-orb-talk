const GATEWAY_BASE = '/gateway';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export class AssistantService {
  private static instance: AssistantService;
  static getInstance(): AssistantService {
    if (!AssistantService.instance) AssistantService.instance = new AssistantService();
    return AssistantService.instance;
  }

  async sendMessage(
    messages: ChatMessage[],
    options: { model?: string; stream?: boolean } = {}
  ): Promise<ChatResponse> {
    const response = await fetch(`${GATEWAY_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, ...options }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error((err as { error?: string }).error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<ChatResponse>;
  }

  async *streamResponse(
    messages: ChatMessage[],
    options: { model?: string } = {}
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${GATEWAY_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, stream: true, ...options }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data) as { delta?: string; content?: string };
              const text = parsed.delta ?? parsed.content ?? '';
              if (text) yield text;
            } catch {
              // non-JSON chunk
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const assistantService = AssistantService.getInstance();
