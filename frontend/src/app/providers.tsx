import { Provider } from "react-redux"
import { TooltipProvider } from "@/components/ui/tooltip"
import { store } from "@/store"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <TooltipProvider delayDuration={300}>
        {children}
      </TooltipProvider>
    </Provider>
  )
}
