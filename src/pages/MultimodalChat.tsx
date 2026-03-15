import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Image, Mic, MicOff, Video, FileText, Plus, X, Camera,
  Paperclip, Sparkles, Bot, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Attachment {
  id: string;
  type: "image" | "video" | "document" | "voice";
  name: string;
  preview?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: Attachment[];
  timestamp: Date;
}

const cannedResponses: Record<string, string> = {
  default: "I've analyzed your message. That's a great point — let me elaborate on some key aspects that might be helpful for your use case.",
  image: "I can see the image you've shared. It appears to contain visual elements that suggest a structured layout. The composition uses contrasting colors and geometric patterns effectively.",
  document: "I've reviewed the document you uploaded. It contains structured content that I can help you analyze, summarize, or extract key information from.",
  voice: "I heard your voice message clearly. Based on what you said, let me provide a detailed response that addresses your main points.",
  video: "I've captured and analyzed the video frame. The scene contains several identifiable elements that I can describe in detail if you'd like.",
};

export default function MultimodalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I'm your multimodal AI assistant. You can send me text, images, voice messages, video frames, or documents. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addAttachment = useCallback((type: Attachment["type"], name: string) => {
    setAttachments((prev) => [...prev, {
      id: crypto.randomUUID(),
      type,
      name,
      preview: type === "image" ? `https://picsum.photos/200/150?random=${Math.random()}` : undefined,
    }]);
    setShowAttachMenu(false);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: text || (attachments.length > 0 ? `Sent ${attachments.length} attachment(s)` : ""),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsTyping(true);

    // Determine response type
    const attachType = userMsg.attachments?.[0]?.type;
    const responseKey = attachType || "default";

    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: cannedResponses[responseKey] || cannedResponses.default,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 1500);
  }, [input, attachments]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      addAttachment("voice", "Voice message (5s)");
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        addAttachment("voice", "Voice message (5s)");
      }, 3000);
    }
  }, [isRecording, addAttachment]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Multimodal Chat</h1>
            <p className="text-[10px] text-muted-foreground">Text • Image • Voice • Video • Documents</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === "assistant" ? "bg-primary/20" : "bg-secondary"
              }`}>
                {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-foreground" />}
              </div>
              <div className={`max-w-[70%] space-y-2 ${msg.role === "user" ? "items-end" : ""}`}>
                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="glass-panel p-2 rounded-lg">
                        {att.type === "image" && att.preview ? (
                          <img src={att.preview} alt={att.name} className="w-40 h-28 object-cover rounded" />
                        ) : (
                          <div className="flex items-center gap-2 px-2">
                            {att.type === "voice" ? <Mic className="h-3.5 w-3.5 text-primary" /> :
                             att.type === "document" ? <FileText className="h-3.5 w-3.5 text-primary" /> :
                             att.type === "video" ? <Video className="h-3.5 w-3.5 text-primary" /> :
                             <Image className="h-3.5 w-3.5 text-primary" />}
                            <span className="text-[10px] text-muted-foreground">{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Text */}
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary/40 text-foreground rounded-tl-sm"
                }`}>
                  {msg.text}
                </div>
                <p className="text-[9px] text-muted-foreground/50 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-secondary/40 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border/30 bg-card/30 backdrop-blur-xl">
        {/* Attachments preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pt-3 flex gap-2 flex-wrap">
                {attachments.map((att) => (
                  <motion.div
                    key={att.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border/30 text-xs text-muted-foreground"
                  >
                    {att.type === "image" ? <Image className="h-3 w-3" /> :
                     att.type === "voice" ? <Mic className="h-3 w-3" /> :
                     att.type === "document" ? <FileText className="h-3 w-3" /> :
                     <Video className="h-3 w-3" />}
                    <span className="max-w-[100px] truncate text-[10px]">{att.name}</span>
                    <button onClick={() => removeAttachment(att.id)} className="ml-0.5 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2 glass-panel rounded-2xl px-3 py-2">
            {/* Attach menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <AnimatePresence>
                {showAttachMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-12 left-0 glass-panel-strong rounded-xl p-2 w-48 shadow-xl z-50"
                  >
                    {[
                      { icon: Image, label: "Upload Image", type: "image" as const, file: "photo.jpg" },
                      { icon: Camera, label: "Capture Frame", type: "video" as const, file: "frame_capture.jpg" },
                      { icon: FileText, label: "Upload Document", type: "document" as const, file: "document.pdf" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => addAttachment(item.type, item.file)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 min-h-[36px] max-h-32 bg-transparent border-0 resize-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-1.5"
              rows={1}
            />

            {/* Voice record */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full ${isRecording ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground"}`}
              onClick={toggleRecording}
            >
              {isRecording ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                  <MicOff className="h-4 w-4" />
                </motion.div>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Send */}
            <AnimatePresence>
              {(input.trim() || attachments.length > 0) && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={sendMessage}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" />
    </div>
  );
}
