import { MetricCard } from './MetricCard'
import { fmtUSD, fmtPct, exliqStatus } from '@/lib/utils'
import { useLanguageStore, t } from '@/store/language'
import type { Metrics } from '@/lib/types'

interface MetricsDashboardProps {
  metrics: Metrics
}

export function MetricsDashboard({ metrics: m }: MetricsDashboardProps) {
  const status = exliqStatus(m)
  const { lang } = useLanguageStore()

  return (
    <div className="space-y-4">
      {/* Row 1: Core safety — 3 large cards */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          size="lg"
          label="Net Liquidation Value"
          labelZh="净清算价值"
          value={fmtUSD(m.nlv)}
          status="neutral"
          tooltip="账户全部平仓后的净价值 = 现金 + 多头市值 - 空头负债"
        />
        <MetricCard
          size="lg"
          label="Excess Liquidity"
          labelZh="剩余流动性 ★"
          value={fmtUSD(m.excess_liquidity)}
          subValue={m.excess_liquidity < 0 ? '⚠ 负数 → 强制平仓' : `Cushion ${fmtPct(m.cushion)}`}
          status={status}
          tooltip="ELV - 维持保证金。负数时 IB 开始强制平仓"
        />
        <MetricCard
          size="lg"
          label="Cushion"
          labelZh="安全缓冲比率"
          value={fmtPct(m.cushion)}
          subValue={`>15% 安全 | >5% 警戒 | <2% 危险`}
          status={status}
          tooltip="剩余流动性 / NLV。IB 实时监控此指标"
        />
      </div>

      {/* Row 2: Margin detail — 4 medium cards */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard
          label="Equity with Loan Value"
          labelZh="贷款价值权益"
          value={fmtUSD(m.elv)}
          tooltip="计算保证金的基础资产值，RegT 下 ≈ NLV"
        />
        <MetricCard
          label="Available Funds"
          labelZh="可用资金"
          value={fmtUSD(m.available_funds)}
          status={m.available_funds < 0 ? 'danger' : 'neutral'}
          subValue={m.available_funds < 0 ? '无法开新仓' : undefined}
          tooltip="ELV - 初始保证金。负数时无法开新仓"
        />
        <MetricCard
          label="Initial Margin"
          labelZh="初始保证金"
          value={fmtUSD(m.total_initial_margin)}
          subValue={`股票 ${fmtUSD(m.stock_initial_margin)} | 期货 ${fmtUSD(m.futures_initial_margin)}`}
          tooltip="开新仓所需保证金总额"
        />
        <MetricCard
          label="Maintenance Margin"
          labelZh="维持保证金"
          value={fmtUSD(m.total_maint_margin)}
          subValue={`股票 ${fmtUSD(m.stock_maint_margin)} | 期货 ${fmtUSD(m.futures_maint_margin)}`}
          tooltip="维持现有持仓所需最低保证金"
        />
      </div>

      {/* Row 3: Market value & buying power — 5 medium cards */}
      <div className="grid grid-cols-5 gap-3">
        <MetricCard
          label="Net Market Value"
          labelZh="净持仓市值"
          value={fmtUSD(m.net_market_value)}
          subValue={`多头 ${fmtUSD(m.long_market_value)}`}
          tooltip="多头市值 - 空头市值（不含期货名义值）"
        />
        <MetricCard
          label="SMA"
          labelZh="特别备忘账户"
          value={fmtUSD(m.sma)}
          subValue="快照近似值，可手动覆盖"
          tooltip="max(0, ELV - 股票初始保证金)。精确值需完整交易历史"
        />
        <MetricCard
          label="Stock Buying Power"
          labelZh="股票购买力"
          value={fmtUSD(m.stock_buying_power)}
          subValue="RegT隔夜 2×"
          tooltip="min(ELV, PrevDayELV) - IM × 2"
        />
        <MetricCard
          label="Option Buying Power"
          labelZh="期权购买力"
          value={fmtUSD(m.option_buying_power)}
          subValue="期权无杠杆 1×"
          tooltip="= 可用资金（期权需100%保证金）"
        />
        <MetricCard
          label="Margin Ratio"
          labelZh="保证金占比"
          value={fmtPct(m.margin_ratio)}
          status={m.margin_ratio > 0.5 ? 'warn' : 'neutral'}
          tooltip="初始保证金 / NLV"
        />
      </div>

      {/* Segment table — Securities / Commodities / Total */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">{t('分部', 'Segment', lang)}</th>
              <th className="text-right px-4 py-2">{t('剩余流动性', 'Excess Liquidity', lang)}</th>
              <th className="text-right px-4 py-2">{t('初始保证金', 'Initial Margin', lang)}</th>
              <th className="text-right px-4 py-2">{t('维持保证金', 'Maint. Margin', lang)}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-2 font-medium">{t('证券（股票）', 'Securities', lang)}</td>
              <td className={`text-right px-4 py-2 tabular-nums ${m.securities_excess_liquidity < 0 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                {fmtUSD(m.securities_excess_liquidity)}
              </td>
              <td className="text-right px-4 py-2 tabular-nums text-slate-600">{fmtUSD(m.stock_initial_margin)}</td>
              <td className="text-right px-4 py-2 tabular-nums text-slate-600">{fmtUSD(m.stock_maint_margin)}</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-2 font-medium">{t('商品（期货）', 'Commodities', lang)}</td>
              <td className={`text-right px-4 py-2 tabular-nums ${m.commodities_excess_liquidity < 0 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                {fmtUSD(m.commodities_excess_liquidity)}
              </td>
              <td className="text-right px-4 py-2 tabular-nums text-slate-600">{fmtUSD(m.futures_initial_margin)}</td>
              <td className="text-right px-4 py-2 tabular-nums text-slate-600">{fmtUSD(m.futures_maint_margin)}</td>
            </tr>
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-2">{t('合计', 'Total', lang)}</td>
              <td className={`text-right px-4 py-2 tabular-nums ${m.excess_liquidity < 0 ? 'text-red-600' : 'text-green-700'}`}>
                {fmtUSD(m.excess_liquidity)}
              </td>
              <td className="text-right px-4 py-2 tabular-nums">{fmtUSD(m.total_initial_margin)}</td>
              <td className="text-right px-4 py-2 tabular-nums">{fmtUSD(m.total_maint_margin)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
