import type { RootState } from "@/store"

export const selectConversations = (state: RootState) => state.conversations.items
export const selectActiveConversationId = (state: RootState) => state.ui.activeConversationId
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen

export const selectActiveConversation = (state: RootState) => {
  const id = state.ui.activeConversationId
  if (!id) return null
  return state.conversations.items.find((c) => c.id === id) ?? null
}

export const selectConversationMessages = (state: RootState) => {
  const conv = selectActiveConversation(state)
  return conv?.messages ?? []
}
