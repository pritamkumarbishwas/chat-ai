import { useEffect, useRef } from "react"
import { Sparkles } from "lucide-react"
import { ChatMessage } from "./chat-message"
import { ChatInput } from "./chat-input"
import { ThinkingIndicator } from "./thinking-indicator"
import type { Conversation } from "@/types/chat"

interface ChatAreaProps {
  conversation: Conversation | null
  onSend: (message: string) => void
  isLoading?: boolean
}

const SUGGESTIONS = [
  "Explain quantum computing",
  "Write a Python function",
  "Help me debug my code",
  "Create a marketing plan",
] as const

export function ChatArea({ conversation, onSend, isLoading }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages, isLoading])

  const messages = conversation?.messages ?? []
  const isEmpty = messages.length === 0 && !isLoading

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              How can I help you today?
            </h1>
            <p className="text-muted-foreground max-w-md">
              Ask me anything. I can help with writing, analysis, coding, math, and more.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-lg w-full">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSend(suggestion)}
                  className="text-left p-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-sm text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  )
}
