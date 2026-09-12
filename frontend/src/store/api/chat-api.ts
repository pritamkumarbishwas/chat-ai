import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export interface ChatRequest {
  message: string
  conversation_id?: string
  history: { role: "user" | "assistant" | "system"; content: string }[]
}

export interface ChatResponse {
  reply: string
  conversation_id: string | null
  model: string | null
}

export interface HealthResponse {
  status: string
  version: string
  llm_provider: string
  api_configured: boolean
}

export interface ConversationSummary {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  }),
  tagTypes: ["Health", "Conversations", "Messages"],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({ url: "/api/chat", method: "POST", body }),
      invalidatesTags: ["Conversations"],
    }),
    health: builder.query<HealthResponse, void>({
      query: () => "/health",
      providesTags: ["Health"],
    }),
    getConversations: builder.query<{ conversations: ConversationSummary[] }, void>({
      query: () => "/api/conversations",
      providesTags: ["Conversations"],
    }),
    getConversationMessages: builder.query<
      { conversation_id: string; messages: ConversationMessage[] },
      string
    >({
      query: (id) => `/api/conversations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Messages", id }],
    }),
    deleteConversationApi: builder.mutation<{ detail: string }, string>({
      query: (id) => ({ url: `/api/conversations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Conversations"],
    }),
  }),
})

export const {
  useSendMessageMutation,
  useHealthQuery,
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useDeleteConversationApiMutation,
} = chatApi

// Streaming helper — not part of RTK Query, used directly in App.tsx
const API_URL = API_BASE_URL

export async function streamChat(
  message: string,
  conversationId: string,
  history: { role: string; content: string }[],
  onChunk: (text: string) => void,
  onDone: (conversationId: string) => void,
  onError: (error: string) => void,
) {
  try {
    const res = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversation_id: conversationId, history }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }))
      onError(err.detail || `HTTP ${res.status}`)
      return
    }

    const convId = res.headers.get("X-Conversation-ID") || conversationId
    const reader = res.body?.getReader()
    if (!reader) {
      onError("No response stream")
      return
    }

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") {
            onDone(convId)
            return
          }
          if (data === "[ERROR]") {
            onError("Stream error")
            return
          }
          onChunk(data)
        }
      }
    }
    onDone(convId)
  } catch (e) {
    onError(e instanceof Error ? e.message : "Network error")
  }
}
