import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Dashboard } from '@/pages/Dashboard'
import { Portfolio } from '@/pages/Portfolio'
import { StressTest } from '@/pages/StressTest'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function Layout() {
  const navCls = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800 text-lg">IB Risk Tool</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">RegT</span>
          </div>
          <nav className="flex gap-1">
            <NavLink to="/" end className={navCls}>仪表盘</NavLink>
            <NavLink to="/portfolio" className={navCls}>持仓管理</NavLink>
            <NavLink to="/stress" className={navCls}>压力测试</NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/stress" element={<StressTest />} />
        </Routes>
      </main>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
