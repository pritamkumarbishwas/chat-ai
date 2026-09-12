import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"

interface UIState {
  activeConversationId: string | null
  sidebarOpen: boolean
}

const initialState: UIState = {
  activeConversationId: null,
  sidebarOpen: false,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload
    },
    clearActiveConversation(state) {
      state.activeConversationId = null
    },
    openSidebar(state) {
      state.sidebarOpen = true
    },
    closeSidebar(state) {
      state.sidebarOpen = false
    },
  },
})

export const {
  setActiveConversation,
  clearActiveConversation,
  openSidebar,
  closeSidebar,
} = uiSlice.actions

export default uiSlice.reducer
