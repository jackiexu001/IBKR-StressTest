import { useState } from 'react'
import { SymbolSearch } from './SymbolSearch'
import { NumInput } from '@/components/ui/NumInput'
import { usePortfolioStore } from '@/store/portfolio'
import { api } from '@/lib/api'
import type { FuturesPosition, Exchange, Currency, InstrumentSearchResult } from '@/lib/types'

const BLANK: Omit<FuturesPosition, 'id'> = {
  symbol: '', name: '', exchange: 'CME', contracts: 0,
  multiplier: 1, avg_entry_price: 0, current_price: 0,
  currency: 'USD', initial_margin_per_contract: 0, maintenance_margin_per_contract: 0,
}

interface Props { onDone?: () => void }

export function AddFuturesForm({ onDone }: Props) {
  const { addFutures } = usePortfolioStore()
  const [form, setForm] = useState<Omit<FuturesPosition, 'id'>>(BLANK)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [error, setError] = useState('')

  const onSelect = async (r: InstrumentSearchResult) => {
    setForm(f => ({
      ...f,
      symbol: r.symbol,
      name: r.name,
      exchange: (r.exchange as Exchange) || 'CME',
      multiplier: r.multiplier ?? 1,
      currency: r.currency as Currency || 'USD',
    }))

    // Fetch price and contract info (includes typical_im / typical_mm) in parallel
    const [priceResult, infoResult] = await Promise.allSettled([
      api.getPrice(r.symbol),
      api.getInfo(r.symbol),
    ])

    setLoadingPrice(false)

    setForm(f => {
      const next = { ...f }
      if (priceResult.status === 'fulfilled') {
        next.current_price = priceResult.value.price
      }
      if (infoResult.status === 'fulfilled') {
        const info = infoResult.value as InstrumentSearchResult & { typical_im?: number; typical_mm?: number }
        if (info.typical_im && info.typical_im > 0) next.initial_margin_per_contract = info.typical_im
        if (info.typical_mm && info.typical_mm > 0) next.maintenance_margin_per_contract = info.typical_mm
      }
      return next
    })
  }

  const submit = () => {
    if (!form.symbol) { setError('请选择期货代码'); return }
    if (form.contracts === 0) { setError('合约数不能为 0'); return }
    if (form.current_price <= 0) { setError('请输入有效的当前价格'); return }
    if (form.initial_margin_per_contract <= 0) { setError('请填写每合约初始保证金'); return }
    if (form.maintenance_margin_per_contract <= 0) { setError('请填写每合约维持保证金'); return }
    setError('')
    addFutures(form)
    setForm(BLANK)
    onDone?.()
  }

  const inputCls = 'w-full border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none'
  const marginCls = 'w-full border-2 border-orange-200 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-400 outline-none'

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">搜索期货代码</label>
        <SymbolSearch onSelect={r => { setLoadingPrice(true); onSelect(r) }} placeholder="输入期货代码，如 ES, NQ, HSI, NK" />
      </div>

      {form.symbol && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-slate-800">{form.symbol}</span>
            <span className="text-slate-500 text-sm">{form.name}</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{form.exchange}</span>
            <span className="text-xs text-slate-400">乘数 {form.multiplier} | {form.currency}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">合约数（负数 = 空头）</label>
              <NumInput value={form.contracts} onChange={v => setForm(f => ({ ...f, contracts: v }))} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">开仓均价</label>
              <NumInput value={form.avg_entry_price} onChange={v => setForm(f => ({ ...f, avg_entry_price: v }))} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                当前价格 {loadingPrice && <span className="text-blue-500">获取中…</span>}
              </label>
              <NumInput value={form.current_price} onChange={v => setForm(f => ({ ...f, current_price: v }))} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-orange-600 mb-1">
                每合约初始保证金（{form.currency}，已预填参考值）
              </label>
              <NumInput value={form.initial_margin_per_contract} onChange={v => setForm(f => ({ ...f, initial_margin_per_contract: v }))} className={marginCls} placeholder="0" />
              <p className="text-xs text-slate-400 mt-0.5">IB 随市波动调整，请以 IB TWS 实际值为准</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-orange-600 mb-1">
                每合约维持保证金（{form.currency}，已预填参考值）
              </label>
              <NumInput value={form.maintenance_margin_per_contract} onChange={v => setForm(f => ({ ...f, maintenance_margin_per_contract: v }))} className={marginCls} placeholder="0" />
              <p className="text-xs text-slate-400 mt-0.5">IB 随市波动调整，请以 IB TWS 实际值为准</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">合约乘数（自动填充，可修改）</label>
            <NumInput value={form.multiplier} onChange={v => setForm(f => ({ ...f, multiplier: v }))} className="w-32 border rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1" />
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
          添加期货持仓
        </button>
        <button onClick={() => { setForm(BLANK); onDone?.() }} className="border px-5 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
          取消
        </button>
      </div>
    </div>
  )
}
