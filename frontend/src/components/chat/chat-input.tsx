import { useState, useRef, useEffect } from "react"
import { ArrowUp, Paperclip, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full max-w-[48rem] mx-auto px-4 pb-4 md:pb-6">
      <div className="relative flex items-end rounded-3xl bg-[#2f2f2f] border border-[#424242]">
        <div className="flex items-center justify-center shrink-0 pl-1 pb-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-[#b4b4b4] hover:text-white hover:bg-[#424242]"
                disabled={disabled}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach files</TooltipContent>
          </Tooltip>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT"
          rows={1}
          disabled={disabled}
          aria-label="Message ChatGPT"
          className="flex-1 resize-none bg-transparent text-[16px] text-white placeholder-[#8e8e8e] py-3 pr-2 focus:outline-none disabled:opacity-50 min-h-[28px] max-h-[200px] leading-[1.6]"
        />

        <div className="flex items-center justify-center shrink-0 pr-2 pb-2.5">
          {input.trim() ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleSubmit}
                  disabled={!input.trim() || disabled}
                  className="h-8 w-8 rounded-full bg-white text-black hover:bg-[#e0e0e0] shrink-0"
                >
                  <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-[#b4b4b4] hover:text-white hover:bg-[#424242]"
                  disabled={disabled}
                >
                  <Globe className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search the web</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-[#8e8e8e] mt-2 select-none">
        ChatGPT can make mistakes. Check important info.
      </p>
    </div>
  )
}
