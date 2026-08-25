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

const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    addConversation: {
      reducer(state, action: PayloadAction<Conversation>) {
        state.items.unshift(action.payload)
      },
      prepare(content: string, id: string) {
        const now = new Date()
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
      reducer(state, action: PayloadAction<{ conversationId: string; message: Message }>) {
        const conv = state.items.find((c) => c.id === action.payload.conversationId)
        if (conv) {
          conv.messages.push(action.payload.message)
          conv.updatedAt = new Date()
          if (conv.messages.length === 1 && action.payload.message.role === "user") {
            conv.title = generateTitle(action.payload.message.content)
          }
        }
      },
      prepare(conversationId: string, message: Message) {
        return { payload: { conversationId, message } }
      },
    },
    deleteConversation(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload)
    },
    renameConversation(state, action: PayloadAction<{ id: string; title: string }>) {
      const conv = state.items.find((c) => c.id === action.payload.id)
      if (conv) {
        conv.title = action.payload.title
      }
    },
  },
})

export const { addConversation, addMessage, deleteConversation, renameConversation } =
  conversationsSlice.actions

export default conversationsSlice.reducer
