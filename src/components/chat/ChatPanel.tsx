import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { assistantService, type ChatMessage } from '@/services/AssistantService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
}

interface ChatPanelProps {
  initialMessage?: string;
  placeholder?: string;
  className?: string;
  onMessageSent?: (msg: string) => void;
  onResponse?: (resp: string) => void;
}

export function ChatPanel({
  initialMessage,
  placeholder = 'Type a message...',
  className = '',
  onMessageSent,
  onResponse,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessage
      ? [{ id: 'init', role: 'system', text: initialMessage, timestamp: new Date() }]
      : []
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = useCallback((): ChatMessage[] => {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.text }));
  }, [messages]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);
    onMessageSent?.(content);

    const context = buildContext();
    context.push({ role: 'user', content });

    try {
      const result = await assistantService.sendMessage(context);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      onResponse?.(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, buildContext, onMessageSent, onResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages area */}
      <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Bot className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/60">Send a message to start a conversation</p>
          </div>
        )}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''} ${msg.role === 'system' ? 'justify-center' : ''}`}
          >
            {msg.role !== 'system' && (
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                msg.role === 'assistant' ? 'bg-primary/20' : 'bg-secondary'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot className="h-3.5 w-3.5 text-primary" />
                  : <User className="h-3.5 w-3.5 text-foreground" />
                }
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === 'system' ? 'max-w-full' : ''}`}>
              <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'system'
                  ? 'text-muted-foreground/60 italic text-center bg-transparent'
                  : msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-secondary/40 text-foreground rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-secondary/40 rounded-xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-muted-foreground/50"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <span className="text-[10px] text-destructive bg-destructive/10 px-3 py-1 rounded-full">
              {error}
            </span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border/30 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-h-[36px] max-h-24 bg-secondary/20 border-border/30 resize-none text-xs focus-visible:ring-1 focus-visible:ring-primary/50"
            rows={1}
          />
          <Button
            size="icon"
            className="h-9 w-9 rounded-lg flex-shrink-0"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
