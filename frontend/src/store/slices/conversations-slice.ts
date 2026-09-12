import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { Conversation, Message } from "@/types/chat"

interface ConversationsState {
  items: Conversation[]
}

const initialState: ConversationsState = {
  items: [],
}

function generateTitle(content: string): string {
  const cleaned = content.replace(/[#*`]/g, "").trim()
  return cleaned.length > 40 ? cleaned.slice(0, 40) + "..." : cleaned
}

function nowISO(): string {
  return new Date().toISOString()
}

const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    addConversation: {
      reducer(state, action: PayloadAction<Conversation>) {
        state.items.unshift(action.payload)
      },
      prepare(content: string, id: string) {
        const now = nowISO()
        return {
          payload: {
            id,
            title: generateTitle(content),
            messages: [],
            createdAt: now,
            updatedAt: now,
          },
        }
      },
    },
    addMessage: {
      reducer(
        state,
        action: PayloadAction<{ conversationId: string; message: Message }>,
      ) {
        const conv = state.items.find(
          (c) => c.id === action.payload.conversationId,
        )
        if (conv) {
          conv.messages.push(action.payload.message)
          conv.updatedAt = nowISO()
          if (
            conv.messages.length === 1 &&
            action.payload.message.role === "user"
          ) {
            conv.title = generateTitle(action.payload.message.content)
          }
        }
      },
      prepare(conversationId: string, message: Message) {
        return { payload: { conversationId, message } }
      },
    },
    appendToMessage: {
      reducer(
        state,
        action: PayloadAction<{
          conversationId: string
          messageId: string
          text: string
        }>,
      ) {
        const conv = state.items.find(
          (c) => c.id === action.payload.conversationId,
        )
        if (conv) {
          const msg = conv.messages.find(
            (m) => m.id === action.payload.messageId,
          )
          if (msg) {
            msg.content += action.payload.text
          }
        }
      },
    },
    updateMessageContent: {
      reducer(
        state,
        action: PayloadAction<{
          conversationId: string
          messageId: string
          content: string
        }>,
      ) {
        const conv = state.items.find(
          (c) => c.id === action.payload.conversationId,
        )
        if (conv) {
          const msg = conv.messages.find(
            (m) => m.id === action.payload.messageId,
          )
          if (msg) {
            msg.content = action.payload.content
          }
        }
      },
    },
    removeMessage: {
      reducer(
        state,
        action: PayloadAction<{ conversationId: string; messageId: string }>,
      ) {
        const conv = state.items.find(
          (c) => c.id === action.payload.conversationId,
        )
        if (conv) {
          conv.messages = conv.messages.filter(
            (m) => m.id !== action.payload.messageId,
          )
        }
      },
    },
    deleteConversation(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload)
    },
    renameConversation(
      state,
      action: PayloadAction<{ id: string; title: string }>,
    ) {
      const conv = state.items.find((c) => c.id === action.payload.id)
      if (conv) {
        conv.title = action.payload.title
      }
    },
    loadConversations: {
      reducer(state, action: PayloadAction<Conversation[]>) {
        const backendIds = new Set(action.payload.map((c) => c.id))
        const localOnly = state.items.filter((c) => !backendIds.has(c.id))
        state.items = [...action.payload, ...localOnly]
      },
      prepare(
        backendConversations: {
          id: string
          title: string
          created_at: string
          updated_at: string
        }[],
      ) {
        const conversations: Conversation[] = (
          backendConversations ?? []
        ).map((c) => ({
          id: c.id,
          title: c.title,
          messages: [],
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }))
        return { payload: conversations }
      },
    },
    loadMessages: {
      reducer(
        state,
        action: PayloadAction<{
          conversationId: string
          messages: Message[]
        }>,
      ) {
        const conv = state.items.find(
          (c) => c.id === action.payload.conversationId,
        )
        if (conv && conv.messages.length === 0) {
          conv.messages = action.payload.messages
        }
      },
      prepare(
        conversationId: string,
        backendMessages: {
          id: string
          role: string
          content: string
          timestamp: string
        }[],
      ) {
        const messages: Message[] = (backendMessages ?? []).map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: m.timestamp,
        }))
        return { payload: { conversationId, messages } }
      },
    },
  },
})

export const {
  addConversation,
  addMessage,
  appendToMessage,
  updateMessageContent,
  removeMessage,
  deleteConversation,
  renameConversation,
  loadConversations,
  loadMessages,
} = conversationsSlice.actions

export default conversationsSlice.reducer
