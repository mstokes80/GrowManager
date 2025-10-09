import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-primary">
              GrowManager
            </h1>
            <p className="mt-4 text-muted-foreground">
              Cannabis Grow Journal & Analytics Platform
            </p>
            <div className="mt-8 rounded-lg border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold text-card-foreground">
                Welcome to GrowManager
              </h2>
              <p className="mt-2 text-muted-foreground">
                Your development environment is ready. Start building your grow journal!
              </p>
            </div>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App