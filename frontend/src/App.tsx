import { useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatArea } from "@/components/chat"
import { Header } from "@/components/layout"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useSendMessageMutation } from "@/store/api/chat-api"
import { selectConversations, selectActiveConversationId, selectActiveConversation, selectSidebarOpen } from "@/store/selectors"
import { addConversation, addMessage, deleteConversation } from "@/store/slices/conversations-slice"
import { setActiveConversation, clearActiveConversation, openSidebar, closeSidebar } from "@/store/slices/ui-slice"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import type { Message } from "@/types/chat"

export default function App() {
  const dispatch = useAppDispatch()
  const [sendMessageApi, { isLoading }] = useSendMessageMutation()

  const conversations = useAppSelector(selectConversations)
  const activeConversationId = useAppSelector(selectActiveConversationId)
  const activeConversation = useAppSelector(selectActiveConversation)
  const sidebarOpen = useAppSelector(selectSidebarOpen)

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      let convId = activeConversationId
      if (!convId) {
        convId = crypto.randomUUID()
        dispatch(addConversation(content, convId))
        dispatch(setActiveConversation(convId))
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      }
      dispatch(addMessage(convId, userMessage))

      try {
        const history = activeConversation?.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })) ?? []

        const response = await sendMessageApi({
          message: content.trim(),
          conversation_id: convId,
          history,
        }).unwrap()

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
          timestamp: new Date(),
        }
        dispatch(addMessage(convId, assistantMessage))
      } catch {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        }
        dispatch(addMessage(convId, errorMessage))
      }
    },
    [activeConversationId, activeConversation, isLoading, dispatch, sendMessageApi]
  )

  const handleSelect = useCallback(
    (id: string) => {
      dispatch(setActiveConversation(id))
      dispatch(closeSidebar())
    },
    [dispatch]
  )

  const handleDelete = useCallback(
    (id: string) => {
      dispatch(deleteConversation(id))
      if (activeConversationId === id) {
        dispatch(clearActiveConversation())
      }
    },
    [dispatch, activeConversationId]
  )

  const handleNewChat = useCallback(() => {
    dispatch(clearActiveConversation())
    dispatch(closeSidebar())
  }, [dispatch])

  return (
    <div className="flex h-screen bg-[#212121] text-[#ececec]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={(open) => dispatch(open ? openSidebar() : closeSidebar())}>
        <SheetContent side="left" className="w-[260px] p-0 bg-[#171717] border-[#424242] md:hidden">
          <SheetTitle className="sr-only">Chat history</SheetTitle>
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onNewChat={handleNewChat}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          activeConversation={activeConversation}
          onOpenSidebar={() => dispatch(openSidebar())}
        />

        <ChatArea
          conversation={activeConversation}
          onSend={handleSend}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
