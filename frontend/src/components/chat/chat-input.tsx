import { useState, useRef, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus on mount and after sending
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [disabled])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    if (!input.trim() || disabled) return
    onSend(input)
    setInput("")
    // Re-focus after send
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full max-w-[48rem] mx-auto px-4 pb-4 md:pb-6">
      <div className="relative flex items-end rounded-3xl bg-[#2f2f2f] border border-[#424242] focus-within:border-[#555] transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          rows={1}
          disabled={disabled}
          aria-label="Message input"
          className="flex-1 resize-none bg-transparent text-[16px] text-white placeholder-[#8e8e8e] py-3 pl-4 pr-12 focus:outline-none disabled:opacity-50 min-h-[28px] max-h-[200px] leading-[1.6]"
        />

        <div className="flex items-center justify-center shrink-0 pr-2 pb-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className={`h-8 w-8 rounded-full shrink-0 transition-colors ${
                  input.trim()
                    ? "bg-white text-black hover:bg-[#e0e0e0]"
                    : "bg-[#424242] text-[#8e8e8e] cursor-not-allowed"
                }`}
              >
                <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message (Enter)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#8e8e8e] mt-2 select-none">
        AI can make mistakes. Check important info.
      </p>
    </div>
  )
}
