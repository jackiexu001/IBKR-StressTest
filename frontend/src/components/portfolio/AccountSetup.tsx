import { useState } from 'react'
import { usePortfolioStore } from '@/store/portfolio'
import type { Account, Currency } from '@/lib/types'

const CURRENCIES: Currency[] = ['USD', 'HKD', 'JPY', 'KRW', 'SGD']

export function AccountSetup() {
  const { account, setAccount } = usePortfolioStore()
  const [form, setForm] = useState<Account>(account)

  const updateFxRate = (currency: Currency, value: string) => {
    const rate = parseFloat(value)
    setForm(f => ({
      ...f,
      fx_rates: { ...f.fx_rates, [currency]: isNaN(rate) ? undefined : rate },
    }))
  }

  const save = () => setAccount(form)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">账户设置</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Total Cash Value（从 IB TWS 复制）
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={form.cash_balance}
              onChange={e => setForm(f => ({ ...f, cash_balance: parseFloat(e.target.value) || 0 }))}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
            <select
              value={form.base_currency}
              onChange={e => setForm(f => ({ ...f, base_currency: e.target.value as Currency }))}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <p className="text-xs text-slate-400 mt-1">含期货每日结算盈亏，含卖空收益</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Previous Day ELV（可选，用于精确计算购买力）
          </label>
          <input
            type="number"
            value={form.prev_day_elv ?? ''}
            onChange={e => setForm(f => ({ ...f, prev_day_elv: parseFloat(e.target.value) || undefined }))}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="留空则用当日 ELV"
          />
        </div>
      </div>

      {/* FX Rates */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">
          汇率（外币 → USD，e.g. HKD: 0.1282）
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {(['HKD', 'JPY', 'KRW', 'SGD'] as Currency[]).map(cur => (
            <div key={cur}>
              <label className="block text-xs text-slate-500 mb-1">{cur} / USD</label>
              <input
                type="number"
                step="0.0001"
                value={form.fx_rates[cur] ?? ''}
                onChange={e => updateFxRate(cur, e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={cur === 'HKD' ? '0.1282' : cur === 'JPY' ? '0.0067' : cur === 'KRW' ? '0.00073' : '0.74'}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        保存账户设置
      </button>
    </div>
  )
}
