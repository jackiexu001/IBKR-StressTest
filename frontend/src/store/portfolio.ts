import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Portfolio, StockPosition, FuturesPosition, Account } from '@/lib/types'
import { nanoid } from '@/lib/utils'

const DEFAULT_ACCOUNT: Account = {
  cash_balance: 0,
  base_currency: 'USD',
  fx_rates: {},
  account_type: 'RegT',
}

interface PortfolioStore {
  account: Account
  stocks: StockPosition[]
  futures: FuturesPosition[]

  setAccount: (account: Account) => void
  addStock: (stock: Omit<StockPosition, 'id'>) => void
  updateStock: (id: string, stock: Partial<StockPosition>) => void
  removeStock: (id: string) => void
  addFutures: (fut: Omit<FuturesPosition, 'id'>) => void
  updateFutures: (id: string, fut: Partial<FuturesPosition>) => void
  removeFutures: (id: string) => void
  getPortfolio: () => Portfolio
  importPortfolio: (p: Portfolio) => void
  reset: () => void
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      account: DEFAULT_ACCOUNT,
      stocks: [],
      futures: [],

      setAccount: (account) => set({ account }),

      addStock: (stock) =>
        set(s => ({ stocks: [...s.stocks, { id: nanoid(), ...stock }] })),

      updateStock: (id, stock) =>
        set(s => ({ stocks: s.stocks.map(p => p.id === id ? { ...p, ...stock } : p) })),

      removeStock: (id) =>
        set(s => ({ stocks: s.stocks.filter(p => p.id !== id) })),

      addFutures: (fut) =>
        set(s => ({ futures: [...s.futures, { id: nanoid(), ...fut }] })),

      updateFutures: (id, fut) =>
        set(s => ({ futures: s.futures.map(p => p.id === id ? { ...p, ...fut } : p) })),

      removeFutures: (id) =>
        set(s => ({ futures: s.futures.filter(p => p.id !== id) })),

      getPortfolio: () => {
        const { account, stocks, futures } = get()
        return { account, stocks, futures }
      },

      importPortfolio: ({ account, stocks, futures }) =>
        set({ account, stocks, futures }),

      reset: () => set({ account: DEFAULT_ACCOUNT, stocks: [], futures: [] }),
    }),
    { name: 'ib-risk-portfolio' }
  )
)
