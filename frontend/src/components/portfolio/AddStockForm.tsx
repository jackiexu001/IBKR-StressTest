import { useState } from 'react'
import { SymbolSearch } from './SymbolSearch'
import { usePortfolioStore } from '@/store/portfolio'
import { api } from '@/lib/api'
import type { StockPosition, Market, Currency, InstrumentSearchResult } from '@/lib/types'

const MARKET_IM: Record<Market, number> = { US: 0.50, HK: 0.50, JP: 0.30, KR: 0.40, SG: 0.50 }
const MARKET_MM: Record<Market, number> = { US: 0.25, HK: 0.25, JP: 0.20, KR: 0.20, SG: 0.25 }

const BLANK: Omit<StockPosition, 'id'> = {
  symbol: '', name: '', market: 'US', shares: 0,
  avg_cost: 0, current_price: 0, currency: 'USD',
  initial_margin_rate: 0.50, maintenance_margin_rate: 0.25,
}

interface Props { onDone?: () => void }

export function AddStockForm({ onDone }: Props) {
  const { addStock } = usePortfolioStore()
  const [form, setForm] = useState<Omit<StockPosition, 'id'>>(BLANK)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [error, setError] = useState('')

  const onSelect = async (r: InstrumentSearchResult) => {
    const market = r.market as Market
    setForm(f => ({
      ...f,
      symbol: r.symbol,
      name: r.name,
      market,
      currency: r.currency as Currency || 'USD',
      initial_margin_rate: MARKET_IM[market] ?? 0.50,
      maintenance_margin_rate: MARKET_MM[market] ?? 0.25,
    }))
    // Auto-fetch price
    setLoadingPrice(true)
    try {
      const { price, currency } = await api.getPrice(r.symbol)
      setForm(f => ({ ...f, current_price: price, currency: currency as Currency }))
    } catch {
      // price fetch failed — user fills manually
    } finally {
      setLoadingPrice(false)
    }
  }

  const submit = () => {
    if (!form.symbol) { setError('请选择股票代码'); return }
    if (form.shares === 0) { setError('股数不能为 0'); return }
    if (form.current_price <= 0) { setError('请输入有效的当前价格'); return }
    setError('')
    addStock(form)
    setForm(BLANK)
    onDone?.()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">搜索股票代码</label>
        <SymbolSearch onSelect={onSelect} />
      </div>

      {form.symbol && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-800">{form.symbol}</span>
            <span className="text-slate-500 text-sm">{form.name}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{form.market}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">股数（负数 = 做空）</label>
              <input type="number" value={form.shares}
                onChange={e => setForm(f => ({ ...f, shares: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">平均成本</label>
              <input type="number" value={form.avg_cost}
                onChange={e => setForm(f => ({ ...f, avg_cost: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                当前价格 {loadingPrice && <span className="text-blue-500">获取中…</span>}
              </label>
              <input type="number" value={form.current_price}
                onChange={e => setForm(f => ({ ...f, current_price: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">初始保证金比率（%）</label>
              <input type="number" step="0.01" min="0" max="1"
                value={form.initial_margin_rate}
                onChange={e => setForm(f => ({ ...f, initial_margin_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">维持保证金比率（%）</label>
              <input type="number" step="0.01" min="0" max="1"
                value={form.maintenance_margin_rate}
                onChange={e => setForm(f => ({ ...f, maintenance_margin_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          添加持仓
        </button>
        <button onClick={() => { setForm(BLANK); onDone?.() }}
          className="border px-5 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          取消
        </button>
      </div>
    </div>
  )
}
