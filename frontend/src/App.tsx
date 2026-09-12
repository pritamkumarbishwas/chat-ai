import { useCallback, useEffect, useRef, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatArea } from "@/components/chat"
import { Header } from "@/components/layout"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useDeleteConversationApiMutation,
  streamChat,
} from "@/store/api/chat-api"
import {
  selectConversations,
  selectActiveConversationId,
  selectActiveConversation,
  selectSidebarOpen,
} from "@/store/selectors"
import {
  addConversation,
  addMessage,
  appendToMessage,
  updateMessageContent,
  removeMessage,
  deleteConversation,
  renameConversation,
  loadConversations,
  loadMessages,
} from "@/store/slices/conversations-slice"
import {
  setActiveConversation,
  clearActiveConversation,
  openSidebar,
  closeSidebar,
} from "@/store/slices/ui-slice"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import type { Message } from "@/types/chat"

export default function App() {
  const dispatch = useAppDispatch()
  const streamingRef = useRef(false)
  const [isStreaming, setIsStreaming] = useState(false)

  const [deleteConversationApi] = useDeleteConversationApiMutation()

  const conversations = useAppSelector(selectConversations)
  const activeConversationId = useAppSelector(selectActiveConversationId)
  const activeConversation = useAppSelector(selectActiveConversation)
  const sidebarOpen = useAppSelector(selectSidebarOpen)

  const { data: conversationsData } = useGetConversationsQuery()
  const { data: messagesData } = useGetConversationMessagesQuery(
    activeConversationId!,
    { skip: !activeConversationId },
  )

  // Hydrate conversations from backend on mount
  useEffect(() => {
    if (conversationsData?.conversations) {
      dispatch(loadConversations(conversationsData.conversations))
    }
  }, [conversationsData, dispatch])

  // Load messages when selecting a conversation
  useEffect(() => {
    if (
      activeConversationId &&
      Array.isArray(messagesData?.messages) &&
      messagesData.messages.length > 0
    ) {
      dispatch(loadMessages(activeConversationId, messagesData.messages))
    }
  }, [activeConversationId, messagesData, dispatch])

  // Keyboard shortcut: Ctrl+N for new chat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault()
        dispatch(clearActiveConversation())
        dispatch(closeSidebar())
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [dispatch])

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || streamingRef.current) return

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
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(convId, userMessage))

      // Create placeholder for streaming assistant message
      const assistantId = crypto.randomUUID()
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(convId, assistantMessage))

      streamingRef.current = true
      setIsStreaming(true)

      const history =
        activeConversation?.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })) ?? []

      await streamChat(
        content.trim(),
        convId,
        history,
        // onChunk — append text to the streaming message
        (chunk) => {
          dispatch(
            appendToMessage({
              conversationId: convId!,
              messageId: assistantId,
              text: chunk,
            }),
          )
        },
        // onDone
        () => {
          streamingRef.current = false
          setIsStreaming(false)
        },
        // onError
        (error) => {
          streamingRef.current = false
          setIsStreaming(false)
          dispatch(
            updateMessageContent({
              conversationId: convId!,
              messageId: assistantId,
              content: `Sorry, something went wrong: ${error}`,
            }),
          )
        },
      )
    },
    [activeConversationId, activeConversation, dispatch],
  )

  const handleRetry = useCallback(
    async (conversationId: string, failedMessageId: string) => {
      if (streamingRef.current) return

      const conv = conversations.find((c) => c.id === conversationId)
      if (!conv) return

      // Find the user message that triggered the failed response
      const msgIndex = conv.messages.findIndex((m) => m.id === failedMessageId)
      if (msgIndex < 1) return

      const userMsg = conv.messages[msgIndex - 1]
      if (!userMsg || userMsg.role !== "user") return

      // Remove the failed assistant message
      dispatch(removeMessage({ conversationId, messageId: failedMessageId }))

      // Re-send with a fresh assistant placeholder
      const assistantId = crypto.randomUUID()
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(conversationId, assistantMessage))

      streamingRef.current = true
      setIsStreaming(true)

      // Build history from messages before the failed one
      const history = conv.messages
        .filter((m) => m.id !== failedMessageId)
        .map((m) => ({ role: m.role, content: m.content }))

      await streamChat(
        userMsg.content,
        conversationId,
        history,
        (chunk) => {
          dispatch(
            appendToMessage({
              conversationId,
              messageId: assistantId,
              text: chunk,
            }),
          )
        },
        () => {
          streamingRef.current = false
          setIsStreaming(false)
        },
        (error) => {
          streamingRef.current = false
          setIsStreaming(false)
          dispatch(
            updateMessageContent({
              conversationId,
              messageId: assistantId,
              content: `Sorry, something went wrong: ${error}`,
            }),
          )
        },
      )
    },
    [conversations, dispatch],
  )

  const handleSelect = useCallback(
    (id: string) => {
      dispatch(setActiveConversation(id))
      dispatch(closeSidebar())
    },
    [dispatch],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      dispatch(deleteConversation(id))
      if (activeConversationId === id) {
        dispatch(clearActiveConversation())
      }
      try {
        await deleteConversationApi(id).unwrap()
      } catch {
        // Backend delete failed, local state already updated
      }
    },
    [dispatch, activeConversationId, deleteConversationApi],
  )

  const handleRename = useCallback(
    (id: string, title: string) => {
      dispatch(renameConversation({ id, title }))
    },
    [dispatch],
  )

  const handleNewChat = useCallback(() => {
    dispatch(clearActiveConversation())
    dispatch(closeSidebar())
  }, [dispatch])

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onNewChat={handleNewChat}
          onRename={handleRename}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet
        open={sidebarOpen}
        onOpenChange={(open) =>
          dispatch(open ? openSidebar() : closeSidebar())
        }
      >
        <SheetContent
          side="left"
          className="w-[260px] p-0 bg-sidebar border-border md:hidden"
        >
          <SheetTitle className="sr-only">Chat history</SheetTitle>
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onNewChat={handleNewChat}
            onRename={handleRename}
          />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          activeConversation={activeConversation}
          onOpenSidebar={() => dispatch(openSidebar())}
          onNewChat={handleNewChat}
        />

        <ChatArea
          conversation={activeConversation}
          onSend={handleSend}
          onRetry={handleRetry}
          isLoading={isStreaming}
        />
      </div>
    </div>
  )
}
