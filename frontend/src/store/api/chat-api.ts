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
    headers: {
      "Content-Type": "application/json",
    },
  }),
  tagTypes: ["Health", "Conversations", "Messages"],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: "/api/chat",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),
    health: builder.query<HealthResponse, void>({
      query: () => "/health",
      providesTags: ["Health"],
    }),
    getConversations: builder.query<
      { conversations: ConversationSummary[] },
      void
    >({
      query: () => "/api/conversations",
      providesTags: ["Conversations"],
    }),
    getConversationMessages: builder.query<
      { conversation_id: string; messages: ConversationMessage[] },
      string
    >({
      query: (conversationId) => `/api/conversations/${conversationId}`,
      providesTags: (_result, _error, conversationId) => [
        { type: "Messages", id: conversationId },
      ],
    }),
    deleteConversationApi: builder.mutation<{ detail: string }, string>({
      query: (conversationId) => ({
        url: `/api/conversations/${conversationId}`,
        method: "DELETE",
      }),
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
