import { usePortfolioStore } from '@/store/portfolio'
import { NumInput } from '@/components/ui/NumInput'
import { fmtUSD, fmt } from '@/lib/utils'
import { useLanguageStore, t } from '@/store/language'
import type { PositionDetail } from '@/lib/types'

interface Props {
  positionDetails?: PositionDetail[]
}

export function PositionTable({ positionDetails }: Props) {
  const { stocks, futures, removeStock, removeFutures, updateStock, updateFutures } = usePortfolioStore()
  const { lang } = useLanguageStore()

  // Chinese convention: profit = red, loss = green
  const pnlCls = (v: number) => v >= 0 ? 'text-red-600' : 'text-green-600'

  return (
    <div className="space-y-6">
      {/* Stocks */}
      {stocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{t('股票', 'Stock', lang)}</span>
            {stocks.length} {t('个持仓', 'positions', lang)}
          </h3>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-2">{t('代码', 'Symbol', lang)}</th>
                  <th className="text-left px-4 py-2">{t('名称', 'Name', lang)}</th>
                  <th className="text-left px-4 py-2">{t('货币', 'Currency', lang)}</th>
                  <th className="text-right px-4 py-2">{t('股数', 'Shares', lang)}</th>
                  <th className="text-right px-4 py-2">{t('均价', 'Avg Cost', lang)}</th>
                  <th className="text-right px-4 py-2">{t('现价', 'Price', lang)}</th>
                  <th className="text-right px-4 py-2">{t('市值(USD)', 'Mkt Val(USD)', lang)}</th>
                  <th className="text-right px-4 py-2">{t('浮盈亏', 'P&L', lang)}</th>
                  <th className="text-right px-4 py-2">IM(USD)</th>
                  <th className="text-right px-4 py-2">MM(USD)</th>
                  <th className="text-right px-4 py-2">{t('占比%', 'Wt%', lang)}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stocks.map(p => {
                  const detail = positionDetails?.find(d => d.id === p.id)
                  const isShort = p.shares < 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <div className="font-mono font-semibold text-slate-800">{p.symbol}</div>
                        <div className="text-xs text-slate-400">{p.market}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-600 max-w-[160px] truncate">{p.name || '—'}</td>
                      <td className="px-4 py-2 text-sm text-slate-500">{p.currency}</td>
                      <td className={`text-right px-4 py-2 tabular-nums ${isShort ? 'text-orange-600' : ''}`}>
                        {fmt(p.shares)}
                        {isShort && <span className="ml-1 text-xs">{t('空', 'S', lang)}</span>}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{fmt(p.avg_cost, 2)}</td>
                      <td className="text-right px-4 py-2">
                        <NumInput
                          value={p.current_price}
                          onChange={v => updateStock(p.id, { current_price: v })}
                          className="w-28 text-right border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-2 py-0.5 text-sm outline-none tabular-nums"
                        />
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums">{detail ? fmtUSD(detail.market_value_usd ?? 0) : '—'}</td>
                      <td className={`text-right px-4 py-2 tabular-nums ${detail ? pnlCls(detail.unrealized_pnl_usd) : ''}`}>
                        {detail ? fmtUSD(detail.unrealized_pnl_usd) : '—'}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{detail ? fmtUSD(detail.initial_margin_usd) : '—'}</td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{detail ? fmtUSD(detail.maint_margin_usd) : '—'}</td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-400">{detail ? `${detail.pct_of_total_margin.toFixed(1)}%` : '—'}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeStock(p.id)} className="text-red-400 hover:text-red-600 text-xs">{t('删除', 'Del', lang)}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Futures */}
      {futures.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">{t('期货', 'Futures', lang)}</span>
            {futures.length} {t('个合约', 'contracts', lang)}
          </h3>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-2">{t('代码', 'Symbol', lang)}</th>
                  <th className="text-left px-4 py-2">{t('名称', 'Name', lang)}</th>
                  <th className="text-left px-4 py-2">{t('货币', 'Currency', lang)}</th>
                  <th className="text-right px-4 py-2">{t('合约数', 'Contracts', lang)}</th>
                  <th className="text-right px-4 py-2">{t('开仓价', 'Entry', lang)}</th>
                  <th className="text-right px-4 py-2">{t('现价', 'Price', lang)}</th>
                  <th className="text-right px-4 py-2">{t('名义值(USD)', 'Notional(USD)', lang)}</th>
                  <th className="text-right px-4 py-2">{t('浮盈亏', 'P&L', lang)}</th>
                  <th className="text-right px-4 py-2">IM(USD)</th>
                  <th className="text-right px-4 py-2">MM(USD)</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {futures.map(p => {
                  const detail = positionDetails?.find(d => d.id === p.id)
                  const isShort = p.contracts < 0
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <div className="font-mono font-semibold text-slate-800">{p.symbol}</div>
                        <div className="text-xs text-slate-400">{p.exchange} ×{p.multiplier}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-600 max-w-[160px] truncate">{p.name || '—'}</td>
                      <td className="px-4 py-2 text-sm text-slate-500">{p.currency}</td>
                      <td className={`text-right px-4 py-2 tabular-nums ${isShort ? 'text-orange-600' : ''}`}>
                        {fmt(p.contracts)}
                        {isShort && <span className="ml-1 text-xs">{t('空', 'S', lang)}</span>}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{fmt(p.avg_entry_price, 2)}</td>
                      <td className="text-right px-4 py-2">
                        <NumInput
                          value={p.current_price}
                          onChange={v => updateFutures(p.id, { current_price: v })}
                          className="w-28 text-right border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-2 py-0.5 text-sm outline-none tabular-nums"
                        />
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums">{detail ? fmtUSD(detail.notional_usd ?? 0) : '—'}</td>
                      <td className={`text-right px-4 py-2 tabular-nums ${detail ? pnlCls(detail.unrealized_pnl_usd) : ''}`}>
                        {detail ? fmtUSD(detail.unrealized_pnl_usd) : '—'}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{detail ? fmtUSD(detail.initial_margin_usd) : '—'}</td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{detail ? fmtUSD(detail.maint_margin_usd) : '—'}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeFutures(p.id)} className="text-red-400 hover:text-red-600 text-xs">{t('删除', 'Del', lang)}</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stocks.length === 0 && futures.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">{t('暂无持仓', 'No positions', lang)}</p>
          <p className="text-sm mt-1">{t('请点击上方按钮添加股票或期货持仓', 'Add stock or futures positions above', lang)}</p>
        </div>
      )}
    </div>
  )
}
