import { usePortfolioStore } from '@/store/portfolio'
import { fmtUSD, fmt } from '@/lib/utils'
import type { PositionDetail } from '@/lib/types'

interface Props {
  positionDetails?: PositionDetail[]
}

export function PositionTable({ positionDetails }: Props) {
  const { stocks, futures, removeStock, removeFutures, updateStock, updateFutures } = usePortfolioStore()

  return (
    <div className="space-y-6">
      {/* Stocks */}
      {stocks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">股票</span>
            {stocks.length} 个持仓
          </h3>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-2">代码</th>
                  <th className="text-right px-4 py-2">股数</th>
                  <th className="text-right px-4 py-2">均价</th>
                  <th className="text-right px-4 py-2">现价</th>
                  <th className="text-right px-4 py-2">市值(USD)</th>
                  <th className="text-right px-4 py-2">浮盈亏</th>
                  <th className="text-right px-4 py-2">IM(USD)</th>
                  <th className="text-right px-4 py-2">MM(USD)</th>
                  <th className="text-right px-4 py-2">占比%</th>
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
                        <div className="text-xs text-slate-400">{p.market} · {p.currency}</div>
                      </td>
                      <td className={`text-right px-4 py-2 tabular-nums ${isShort ? 'text-orange-600' : ''}`}>
                        {fmt(p.shares)}
                        {isShort && <span className="ml-1 text-xs">空</span>}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{fmt(p.avg_cost, 2)}</td>
                      <td className="text-right px-4 py-2">
                        <input
                          type="number"
                          value={p.current_price}
                          onChange={e => updateStock(p.id, { current_price: parseFloat(e.target.value) || 0 })}
                          className="w-24 text-right border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-2 py-0.5 text-sm outline-none tabular-nums"
                        />
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums">{detail ? fmtUSD(detail.market_value_usd ?? 0) : '—'}</td>
                      <td className={`text-right px-4 py-2 tabular-nums ${(detail?.unrealized_pnl_usd ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {detail ? fmtUSD(detail.unrealized_pnl_usd) : '—'}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{detail ? fmtUSD(detail.initial_margin_usd) : '—'}</td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{detail ? fmtUSD(detail.maint_margin_usd) : '—'}</td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-400">{detail ? `${detail.pct_of_total_margin.toFixed(1)}%` : '—'}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeStock(p.id)} className="text-red-400 hover:text-red-600 text-xs">删除</button>
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
            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">期货</span>
            {futures.length} 个合约
          </h3>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="text-left px-4 py-2">代码</th>
                  <th className="text-right px-4 py-2">合约数</th>
                  <th className="text-right px-4 py-2">开仓价</th>
                  <th className="text-right px-4 py-2">现价</th>
                  <th className="text-right px-4 py-2">名义值(USD)</th>
                  <th className="text-right px-4 py-2">浮盈亏</th>
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
                        <div className="text-xs text-slate-400">{p.exchange} · ×{p.multiplier} · {p.currency}</div>
                      </td>
                      <td className={`text-right px-4 py-2 tabular-nums ${isShort ? 'text-orange-600' : ''}`}>
                        {fmt(p.contracts)}
                        {isShort && <span className="ml-1 text-xs">空</span>}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{fmt(p.avg_entry_price, 2)}</td>
                      <td className="text-right px-4 py-2">
                        <input
                          type="number"
                          value={p.current_price}
                          onChange={e => updateFutures(p.id, { current_price: parseFloat(e.target.value) || 0 })}
                          className="w-24 text-right border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-2 py-0.5 text-sm outline-none tabular-nums"
                        />
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums">{detail ? fmtUSD(detail.notional_usd ?? 0) : '—'}</td>
                      <td className={`text-right px-4 py-2 tabular-nums ${(detail?.unrealized_pnl_usd ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {detail ? fmtUSD(detail.unrealized_pnl_usd) : '—'}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{detail ? fmtUSD(detail.initial_margin_usd) : '—'}</td>
                      <td className="text-right px-4 py-2 tabular-nums text-slate-500">{detail ? fmtUSD(detail.maint_margin_usd) : '—'}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => removeFutures(p.id)} className="text-red-400 hover:text-red-600 text-xs">删除</button>
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
          <p className="text-lg">暂无持仓</p>
          <p className="text-sm mt-1">请在「持仓管理」页面添加股票或期货持仓</p>
        </div>
      )}
    </div>
  )
}
