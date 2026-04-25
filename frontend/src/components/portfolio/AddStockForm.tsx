import { useState } from 'react'
import { SymbolSearch } from './SymbolSearch'
import { NumInput } from '@/components/ui/NumInput'
import { usePortfolioStore } from '@/store/portfolio'
import { useLanguageStore, t } from '@/store/language'
import { api } from '@/lib/api'
import type { StockPosition, Market, Currency, InstrumentSearchResult } from '@/lib/types'

const MARKET_IM: Record<Market, number> = { US: 0.50, HK: 0.50, JP: 0.30, KR: 0.40, SG: 0.50 }
const MARKET_MM: Record<Market, number> = { US: 0.25, HK: 0.25, JP: 0.20, KR: 0.20, SG: 0.25 }
const VALID_CURRENCIES = new Set<string>(['USD', 'HKD', 'JPY', 'KRW', 'SGD'])

const BLANK: Omit<StockPosition, 'id'> = {
  symbol: '', name: '', market: 'US', shares: 0,
  avg_cost: 0, current_price: 0, currency: 'USD',
  initial_margin_rate: 0.50, maintenance_margin_rate: 0.25,
}

interface Props { onDone?: () => void }

export function AddStockForm({ onDone }: Props) {
  const { addStock } = usePortfolioStore()
  const { lang } = useLanguageStore()
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
      currency: (VALID_CURRENCIES.has(r.currency) ? r.currency : 'USD') as Currency,
      initial_margin_rate: MARKET_IM[market] ?? 0.50,
      maintenance_margin_rate: MARKET_MM[market] ?? 0.25,
    }))
    setLoadingPrice(true)
    try {
      const { price, currency } = await api.getPrice(r.symbol)
      setForm(f => ({
        ...f,
        current_price: price,
        currency: (VALID_CURRENCIES.has(currency) ? currency : f.currency) as Currency,
      }))
    } catch {
      // user fills manually
    } finally {
      setLoadingPrice(false)
    }
  }

  const submit = () => {
    if (!form.symbol) { setError(t('请选择股票代码', 'Please select a symbol', lang)); return }
    if (form.shares === 0) { setError(t('股数不能为 0', 'Shares cannot be 0', lang)); return }
    if (form.current_price <= 0) { setError(t('请输入有效的当前价格', 'Please enter a valid price', lang)); return }
    setError('')
    addStock(form)
    setForm(BLANK)
    onDone?.()
  }

  const inputCls = 'w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none'

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t('搜索股票代码', 'Search Stock Symbol', lang)}
        </label>
        <SymbolSearch onSelect={onSelect} />
      </div>

      {form.symbol && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-800">{form.symbol}</span>
            <span className="text-slate-500 text-sm">{form.name}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{form.market}</span>
            <span className="text-xs text-slate-400">{form.currency}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {t('股数（负数 = 做空）', 'Shares (negative = short)', lang)}
              </label>
              <NumInput value={form.shares} onChange={v => setForm(f => ({ ...f, shares: v }))} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('平均成本', 'Avg Cost', lang)}</label>
              <NumInput value={form.avg_cost} onChange={v => setForm(f => ({ ...f, avg_cost: v }))} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {t('当前价格', 'Current Price', lang)} {loadingPrice && <span className="text-blue-500">{t('获取中…', 'Loading…', lang)}</span>}
              </label>
              <NumInput value={form.current_price} onChange={v => setForm(f => ({ ...f, current_price: v }))} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {t('初始保证金比率（如 0.5 = 50%）', 'Initial Margin Rate (e.g. 0.5 = 50%)', lang)}
              </label>
              <NumInput value={form.initial_margin_rate} onChange={v => setForm(f => ({ ...f, initial_margin_rate: v }))} className={inputCls} step="0.01" placeholder="0.50" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                {t('维持保证金比率（如 0.25 = 25%）', 'Maint. Margin Rate (e.g. 0.25 = 25%)', lang)}
              </label>
              <NumInput value={form.maintenance_margin_rate} onChange={v => setForm(f => ({ ...f, maintenance_margin_rate: v }))} className={inputCls} step="0.01" placeholder="0.25" />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {t('添加持仓', 'Add Position', lang)}
        </button>
        <button onClick={() => { setForm(BLANK); onDone?.() }} className="border px-5 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          {t('取消', 'Cancel', lang)}
        </button>
      </div>
    </div>
  )
}
