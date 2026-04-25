import { usePortfolioStore } from '@/store/portfolio'
import { NumInput } from '@/components/ui/NumInput'
import { fmtUSD, fmt } from '@/lib/utils'
import { useLanguageStore, t } from '@/store/language'
import type { PositionDetail } from '@/lib/types'
import type { StockPosition, FuturesPosition } from '@/lib/types'

interface Props {
  positionDetails?: PositionDetail[]
  showDelete?: boolean
}

// Chinese convention: profit = red, loss = green
const pnlCls = (v: number) => v >= 0 ? 'text-red-600' : 'text-green-600'

const thCls = 'px-3 py-2 text-center text-xs text-slate-500 uppercase font-medium'
const tdCls = 'px-3 py-2 text-center tabular-nums text-sm'

export function PositionTable({ positionDetails, showDelete = false }: Props) {
  const { stocks, futures, removeStock, removeFutures, updateStock, updateFutures } = usePortfolioStore()
  const { lang } = useLanguageStore()

  // Merge stocks and futures in display order, tagging each with type
  const allPositions: Array<{ type: 'stock'; data: StockPosition } | { type: 'futures'; data: FuturesPosition }> = [
    ...stocks.map(s => ({ type: 'stock' as const, data: s })),
    ...futures.map(f => ({ type: 'futures' as const, data: f })),
  ]

  if (allPositions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">{t('暂无持仓', 'No positions', lang)}</p>
        <p className="text-sm mt-1">{t('请前往持仓管理页面添加持仓', 'Add positions in the Portfolio tab', lang)}</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className={`${thCls} w-16`}>{t('类型', 'Type', lang)}</th>
            <th className={`${thCls} text-left`}>{t('代码', 'Symbol', lang)}</th>
            <th className={`${thCls} text-left`}>{t('名称', 'Name', lang)}</th>
            <th className={thCls}>{t('货币', 'Ccy', lang)}</th>
            <th className={thCls}>{t('数量', 'Qty', lang)}</th>
            <th className={thCls}>{t('成本价', 'Avg Cost', lang)}</th>
            <th className={thCls}>{t('现价', 'Price', lang)}</th>
            <th className={thCls}>{t('市值/名义值(USD)', 'Mkt/Notl(USD)', lang)}</th>
            <th className={thCls}>FX</th>
            <th className={thCls}>{t('浮盈亏(原币)', 'P&L(Native)', lang)}</th>
            <th className={thCls}>{t('浮盈亏(USD)', 'P&L(USD)', lang)}</th>
            <th className={thCls}>IM(USD)</th>
            <th className={thCls}>MM(USD)</th>
            <th className={thCls}>{t('占比%', 'Wt%', lang)}</th>
            {showDelete && <th className={thCls}></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allPositions.map(row => {
            if (row.type === 'stock') {
              const p = row.data
              const detail = positionDetails?.find(d => d.id === p.id)
              const isShort = p.shares < 0
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className={tdCls}>
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded">
                      {t('股票', 'STK', lang)}
                    </span>
                  </td>
                  <td className={`${tdCls} text-left`}>
                    <span className="font-mono font-semibold text-slate-800">{p.symbol}</span>
                    <div className="text-xs text-slate-400">{p.market}</div>
                  </td>
                  <td className={`${tdCls} text-left max-w-[130px] truncate text-slate-600`}>{p.name || '—'}</td>
                  <td className={tdCls}>{p.currency}</td>
                  <td className={`${tdCls} ${isShort ? 'text-orange-600' : ''}`}>
                    {fmt(p.shares)}{isShort && <span className="ml-1 text-xs">{t('空', 'S', lang)}</span>}
                  </td>
                  <td className={`${tdCls} text-slate-500`}>{fmt(p.avg_cost, 2)}</td>
                  <td className={tdCls}>
                    <NumInput
                      value={p.current_price}
                      onChange={v => updateStock(p.id, { current_price: v })}
                      className="w-28 text-center border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-2 py-0.5 text-sm outline-none tabular-nums bg-transparent"
                    />
                  </td>
                  <td className={tdCls}>{detail ? fmtUSD(detail.market_value_usd ?? 0) : '—'}</td>
                  <td className={`${tdCls} text-slate-500`}>{detail ? detail.fx_rate.toFixed(4) : '—'}</td>
                  <td className={`${tdCls} ${detail ? pnlCls(detail.unrealized_pnl_native) : ''}`}>
                    {detail ? fmt(detail.unrealized_pnl_native, 2) : '—'}
                  </td>
                  <td className={`${tdCls} ${detail ? pnlCls(detail.unrealized_pnl_usd) : ''}`}>
                    {detail ? fmtUSD(detail.unrealized_pnl_usd) : '—'}
                  </td>
                  <td className={`${tdCls} text-slate-500`}>{detail ? fmtUSD(detail.initial_margin_usd) : '—'}</td>
                  <td className={`${tdCls} text-slate-500`}>{detail ? fmtUSD(detail.maint_margin_usd) : '—'}</td>
                  <td className={`${tdCls} text-slate-400`}>{detail ? `${detail.pct_of_total_margin.toFixed(1)}%` : '—'}</td>
                  {showDelete && (
                    <td className={tdCls}>
                      <button onClick={() => removeStock(p.id)} className="text-red-400 hover:text-red-600 text-xs">
                        {t('删除', 'Del', lang)}
                      </button>
                    </td>
                  )}
                </tr>
              )
            } else {
              const p = row.data
              const detail = positionDetails?.find(d => d.id === p.id)
              const isShort = p.contracts < 0
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className={tdCls}>
                    <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-1.5 py-0.5 rounded">
                      {t('期货', 'FUT', lang)}
                    </span>
                  </td>
                  <td className={`${tdCls} text-left`}>
                    <span className="font-mono font-semibold text-slate-800">{p.symbol}</span>
                    <div className="text-xs text-slate-400">{p.exchange} ×{p.multiplier}</div>
                  </td>
                  <td className={`${tdCls} text-left max-w-[130px] truncate text-slate-600`}>{p.name || '—'}</td>
                  <td className={tdCls}>{p.currency}</td>
                  <td className={`${tdCls} ${isShort ? 'text-orange-600' : ''}`}>
                    {fmt(p.contracts)}{isShort && <span className="ml-1 text-xs">{t('空', 'S', lang)}</span>}
                  </td>
                  <td className={`${tdCls} text-slate-500`}>{fmt(p.avg_entry_price, 2)}</td>
                  <td className={tdCls}>
                    <NumInput
                      value={p.current_price}
                      onChange={v => updateFutures(p.id, { current_price: v })}
                      className="w-28 text-center border border-transparent hover:border-slate-200 focus:border-blue-400 rounded px-2 py-0.5 text-sm outline-none tabular-nums bg-transparent"
                    />
                  </td>
                  <td className={tdCls}>{detail ? fmtUSD(detail.notional_usd ?? 0) : '—'}</td>
                  <td className={`${tdCls} text-slate-500`}>{detail ? detail.fx_rate.toFixed(4) : '—'}</td>
                  <td className={`${tdCls} ${detail ? pnlCls(detail.unrealized_pnl_native) : ''}`}>
                    {detail ? fmt(detail.unrealized_pnl_native, 2) : '—'}
                  </td>
                  <td className={`${tdCls} ${detail ? pnlCls(detail.unrealized_pnl_usd) : ''}`}>
                    {detail ? fmtUSD(detail.unrealized_pnl_usd) : '—'}
                  </td>
                  <td className={`${tdCls} text-slate-500`}>{detail ? fmtUSD(detail.initial_margin_usd) : '—'}</td>
                  <td className={`${tdCls} text-slate-500`}>{detail ? fmtUSD(detail.maint_margin_usd) : '—'}</td>
                  <td className={`${tdCls} text-slate-400`}>{detail ? `${detail.pct_of_total_margin.toFixed(1)}%` : '—'}</td>
                  {showDelete && (
                    <td className={tdCls}>
                      <button onClick={() => removeFutures(p.id)} className="text-red-400 hover:text-red-600 text-xs">
                        {t('删除', 'Del', lang)}
                      </button>
                    </td>
                  )}
                </tr>
              )
            }
          })}
        </tbody>
      </table>
    </div>
  )
}
