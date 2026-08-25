import { useState, useCallback } from "react"
import type { Conversation, Message } from "@/types/chat"

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function generateTitle(content: string): string {
  const cleaned = content.replace(/[#*`]/g, "").trim()
  return cleaned.length > 40 ? cleaned.slice(0, 40) + "..." : cleaned
}

export function useChatStore() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null

  const createConversation = useCallback((firstMessage?: string): string => {
    const id = generateId()
    const now = new Date()
    const newConv: Conversation = {
      id,
      title: firstMessage ? generateTitle(firstMessage) : "New Chat",
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    setConversations((prev) => [newConv, ...prev])
    setActiveConversationId(id)
    return id
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    }

    setConversations((prev) => {
      let convId = activeConversationId

      if (!convId) {
        const id = generateId()
        const now = new Date()
        const newConv: Conversation = {
          id,
          title: generateTitle(content),
          messages: [userMessage],
          createdAt: now,
          updatedAt: now,
        }
        setConversations((prevInner) => [newConv, ...prevInner])
        setActiveConversationId(id)
        return prev
      }

      return prev.map((conv) => {
        if (conv.id !== convId) return conv
        const updated = {
          ...conv,
          messages: [...conv.messages, userMessage],
          updatedAt: new Date(),
        }
        if (conv.messages.length === 0) {
          updated.title = generateTitle(content)
        }
        return updated
      })
    })

    setTimeout(() => {
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: generateMockResponse(content),
        timestamp: new Date(),
      }

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConversationId) return conv
          return {
            ...conv,
            messages: [...conv.messages, assistantMessage],
            updatedAt: new Date(),
          }
        })
      )
    }, 800 + Math.random() * 1200)
  }, [activeConversationId])

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setActiveConversationId((prev) => (prev === id ? null : prev))
  }, [])

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id)
  }, [])

  const startNewChat = useCallback(() => {
    setActiveConversationId(null)
  }, [])

  return {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    sendMessage,
    deleteConversation,
    selectConversation,
    startNewChat,
  }
}

function generateMockResponse(input: string): string {
  const lower = input.toLowerCase()

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm a helpful AI assistant. How can I help you today?"
  }

  if (lower.includes("what are you") || lower.includes("who are you")) {
    return "I'm an AI chatbot built with React, Tailwind CSS, and shadcn/ui. I'm designed to look and feel like ChatGPT. While I'm currently providing mock responses, you can easily connect me to a real AI API."
  }

  if (lower.includes("react")) {
    return "React is a popular JavaScript library for building user interfaces, developed by Meta. It uses a component-based architecture and a virtual DOM for efficient rendering. Combined with TypeScript, it provides excellent developer experience with type safety."
  }

  if (lower.includes("tailwind")) {
    return "Tailwind CSS is a utility-first CSS framework that lets you build custom designs rapidly without leaving your HTML. It provides low-level utility classes that compose to build any design, directly in your markup."
  }

  if (lower.includes("shadcn")) {
    return "shadcn/ui is a collection of re-usable components built using Radix UI and Tailwind CSS. It's not a component library but a set of copy-and-paste components that you can customize to fit your design system."
  }

  if (lower.includes("help")) {
    return "I can help with a wide range of topics including:\n\n- Answering questions about programming\n- Explaining concepts\n- Writing and reviewing code\n- Brainstorming ideas\n- General knowledge and research\n\nJust ask me anything!"
  }

  if (lower.includes("code") || lower.includes("program")) {
    return "I can help you write and understand code! I'm familiar with many programming languages and frameworks. Share what you're working on and I'll do my best to assist."
  }

  return `That's an interesting question! Here's what I think:\n\n${input.length > 50 ? "Your query seems quite detailed. " : ""}In the context of your question, there are several aspects worth considering. The key factors depend on the specific use case and requirements you have in mind.\n\nFeel free to ask follow-up questions for more specific information!`
}
