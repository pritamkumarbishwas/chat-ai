import { configureStore } from "@reduxjs/toolkit"
import { chatApi } from "./api/chat-api"
import uiReducer from "./slices/ui-slice"
import conversationsReducer from "./slices/conversations-slice"

export const store = configureStore({
  reducer: {
    [chatApi.reducerPath]: chatApi.reducer,
    ui: uiReducer,
    conversations: conversationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(chatApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
