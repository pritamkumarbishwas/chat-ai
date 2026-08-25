import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PanelLeft, ChevronDown, Share } from "lucide-react"
import { ChatGPTLogo } from "./logo"
import type { Conversation } from "@/types/chat"

interface HeaderProps {
  activeConversation: Conversation | null
  onOpenSidebar: () => void
}

export function Header({ activeConversation, onOpenSidebar }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-[#424242] shrink-0">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSidebar}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-[#2f2f2f] md:hidden"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-1.5 h-9 px-2 text-foreground hover:bg-[#2f2f2f] font-semibold text-[15px]"
            >
              <ChatGPTLogo className="h-5 w-5" />
              <span className="hidden sm:inline">ChatGPT</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-[#2f2f2f] border-[#424242] text-foreground"
          >
            <DropdownMenuItem className="gap-2 cursor-pointer text-sm font-medium">
              <ChatGPTLogo className="h-4 w-4" />
              ChatGPT
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-sm text-muted-foreground">
              <span className="ml-6">More natural, creative</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-sm font-medium">
              <span className="ml-6">GPT-4o</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-sm text-muted-foreground">
              <span className="ml-6">Great for complex tasks</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {activeConversation && (
          <span className="hidden lg:inline text-[13px] text-muted-foreground truncate max-w-75">
            {activeConversation.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-[#2f2f2f]"
            >
              <Share className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share chat</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
