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

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  }),
  tagTypes: ["Health"],
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: "/api/chat",
        method: "POST",
        body,
      }),
    }),
    health: builder.query<HealthResponse, void>({
      query: () => "/health",
      providesTags: ["Health"],
    }),
  }),
})

export const { useSendMessageMutation, useHealthQuery } = chatApi
