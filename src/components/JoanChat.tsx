import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import { JoanAvatar } from "./JoanAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SEED_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm Joan, your AI hiring coordinator. Ask me anything about your pipeline -- who's strongest, what needs attention, or how to improve your process.",
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-accent-foreground shrink-0">
        <span className="text-xs font-semibold">J</span>
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-muted-foreground/50"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JoanChat() {
  const { company } = useAuth();
  const companyId = company?.id || "demo-company";
  const chatAction = useAction(api.actions.joanChat.chat);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([SEED_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const history = messages.filter((m) => m !== SEED_MESSAGE);

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const response = await chatAction({
        companyId,
        message: trimmed,
        history: [...history, userMsg].slice(-10),
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I ran into an issue processing that. Could you try again?",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(160,84%,39%)] text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </motion.button>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 w-full sm:w-[400px] h-full bg-card/95 backdrop-blur-xl shadow-2xl sm:rounded-l-2xl border-l border-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
              <JoanAvatar size="sm" showPulse={false} />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold">Chat with Joan</h3>
                <p className="text-xs text-muted-foreground">
                  AI Hiring Coordinator
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messages.map((msg, i) =>
                msg.role === "assistant" ? (
                  <div key={i} className="flex items-end gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-accent-foreground shrink-0">
                      <span className="text-xs font-semibold">J</span>
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end mb-3">
                    <div className="bg-[hsl(160,84%,39%)] text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%]">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )
              )}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-4 py-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Joan anything..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 max-h-[100px] overflow-y-auto"
                  style={{
                    height: "auto",
                    minHeight: "40px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
                  }}
                  disabled={sending}
                />
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,34%)] text-white shrink-0"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
                Enter to send, Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
