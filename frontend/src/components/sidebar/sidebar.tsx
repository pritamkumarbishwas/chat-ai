import { useState, useMemo } from "react"
import {
  MessageSquare,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types/chat"

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNewChat: () => void
}

function groupConversations(conversations: Conversation[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const groups: { label: string; items: Conversation[] }[] = []

  const todayItems: Conversation[] = []
  const yesterdayItems: Conversation[] = []
  const previous7Days: Conversation[] = []
  const previous30Days: Conversation[] = []
  const older: Conversation[] = []

  for (const conv of conversations) {
    const d = new Date(conv.updatedAt)
    if (d >= today) {
      todayItems.push(conv)
    } else if (d >= yesterday) {
      yesterdayItems.push(conv)
    } else if (d >= sevenDaysAgo) {
      previous7Days.push(conv)
    } else if (d >= thirtyDaysAgo) {
      previous30Days.push(conv)
    } else {
      older.push(conv)
    }
  }

  if (todayItems.length) groups.push({ label: "Today", items: todayItems })
  if (yesterdayItems.length) groups.push({ label: "Yesterday", items: yesterdayItems })
  if (previous7Days.length) groups.push({ label: "Previous 7 Days", items: previous7Days })
  if (previous30Days.length) groups.push({ label: "Previous 30 Days", items: previous30Days })
  if (older.length) groups.push({ label: "Older", items: older })

  return groups
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onNewChat,
}: SidebarProps) {
  const [search, setSearch] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q))
  }, [conversations, search])

  const groups = useMemo(
    () => groupConversations(filteredConversations),
    [filteredConversations]
  )

  const handleToggleSearch = () => {
    setShowSearch((prev) => {
      if (prev) setSearch("")
      return !prev
    })
  }

  return (
    <aside className="flex flex-col h-full w-[260px] bg-[#171717]">
      {/* Header */}
      <div className="flex items-center justify-between p-2 pr-3">
        <Button
          variant="ghost"
          onClick={onNewChat}
          className="gap-2 h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-[#2f2f2f] shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="text-[13px]">New chat</span>
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSearch}
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-[#2f2f2f]"
            >
              <Search className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Search chats</TooltipContent>
        </Tooltip>
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="w-full h-8 rounded-lg border border-[#424242] bg-[#2f2f2f] pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#10a37f]"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <nav aria-label="Chat history" className="px-2 py-1">
          {groups.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              {search ? "No chats found" : "No conversations yet"}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {group.label}
                </div>
                {group.items.map((conv) => (
                  <div
                    key={conv.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelect(conv.id)
                      }
                    }}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                      conv.id === activeConversationId
                        ? "bg-[#2f2f2f] text-foreground"
                        : "text-muted-foreground hover:bg-[#2f2f2f]/60 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate text-[13px] leading-tight">
                      {conv.title}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-[#424242]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        className="w-48 bg-[#2f2f2f] border-[#424242] text-foreground"
                      >
                        <DropdownMenuItem className="gap-2 cursor-pointer text-sm">
                          <Pencil className="h-3.5 w-3.5" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#424242]" />
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer text-sm text-red-500 focus:text-red-500 focus:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(conv.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ))
          )}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className="border-t border-[#424242] p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer hover:bg-[#2f2f2f] transition-colors">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-[#10a37f] text-white text-xs font-medium">
              U
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 text-[13px] text-foreground truncate">User</span>
        </div>
      </div>
    </aside>
  )
}
