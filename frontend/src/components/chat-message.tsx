import { Copy, Check, User, Bot } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Message } from "@/types/chat"

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group flex gap-4 px-4 py-6 md:px-[74px] w-full max-w-3xl mx-auto">
      <div className="shrink-0">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            isUser ? "bg-muted" : "bg-primary"
          }`}
        >
          {isUser ? (
            <User className="h-4 w-4 text-foreground" />
          ) : (
            <Bot className="h-4 w-4 text-primary-foreground" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-sm font-semibold leading-none">
          {isUser ? "You" : "ChatGPT"}
        </div>
        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>

      {!isUser && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </div>
  )
}
