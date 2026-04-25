import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { usePortfolioStore } from '@/store/portfolio'
import { api } from '@/lib/api'
import { fmtUSD } from '@/lib/utils'
import type { StressPoint, HeatmapResult, BreakingPointResult } from '@/lib/types'

type Tab = 'single' | 'portfolio' | 'heatmap'

function StressChart({ data, title }: { data: StressPoint[]; title: string }) {
  const breakIdx = data.findIndex(d => d.excess_liquidity < 0)
  const option = {
    title: { text: title, textStyle: { fontSize: 13, fontWeight: 600 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: { dataIndex: number }[]) => {
        const d = data[params[0].dataIndex]
        return `冲击 ${d.shock_pct}%<br/>Excess Liquidity: ${fmtUSD(d.excess_liquidity)}`
      },
    },
    xAxis: {
      type: 'category',
      data: data.map(d => `${d.shock_pct}%`),
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => fmtUSD(v), fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        data: data.map(d => d.excess_liquidity),
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color: '#2563eb' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37,99,235,0.15)' },
              { offset: 1, color: 'rgba(37,99,235,0.01)' },
            ],
          },
        },
        markLine: {
          silent: true,
          data: [{ yAxis: 0, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: '爆仓线', color: '#ef4444' } }],
        },
        markPoint: breakIdx >= 0 ? {
          data: [{ coord: [breakIdx, 0], itemStyle: { color: '#ef4444' }, symbol: 'pin', symbolSize: 40, label: { formatter: '临界' } }],
        } : undefined,
      },
    ],
    grid: { left: 80, right: 20, top: 50, bottom: 30 },
  }
  return <ReactECharts option={option} style={{ height: 300 }} />
}

function HeatmapChart({ data }: { data: HeatmapResult }) {
  const { x_shocks, y_shocks, matrix } = data
  const values: [number, number, number][] = []
  for (let xi = 0; xi < x_shocks.length; xi++) {
    for (let yi = 0; yi < y_shocks.length; yi++) {
      values.push([xi, yi, matrix[xi][yi]])
    }
  }
  const flat = values.map(v => v[2])
  const minV = Math.min(...flat), maxV = Math.max(...flat)

  const option = {
    tooltip: { formatter: (p: { data: [number, number, number] }) => fmtUSD(p.data[2]) },
    xAxis: { type: 'category', data: x_shocks.map(s => `${s}%`) },
    yAxis: { type: 'category', data: y_shocks.map(s => `${s}%`) },
    visualMap: {
      min: minV, max: maxV, calculable: true, orient: 'horizontal', left: 'center', bottom: 5,
      inRange: { color: ['#ef4444', '#fbbf24', '#22c55e'] },
    },
    series: [{
      type: 'heatmap',
      data: values,
      label: { show: x_shocks.length <= 10, formatter: (p: { data: [number, number, number] }) => {
        const v = p.data[2]
        return Math.abs(v) >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v.toFixed(0)}`
      }},
    }],
    grid: { left: 50, right: 20, top: 10, bottom: 80 },
  }
  return <ReactECharts option={option} style={{ height: 420 }} />
}

export function StressTest() {
  const [tab, setTab] = useState<Tab>('portfolio')
  const [selectedId, setSelectedId] = useState('')
  const [heatmapId1, setHeatmapId1] = useState('')
  const [heatmapId2, setHeatmapId2] = useState('')

  const { getPortfolio, stocks, futures } = usePortfolioStore()
  const portfolio = getPortfolio()
  const allPositions = [
    ...stocks.map(s => ({ id: s.id, label: `${s.symbol} (股票)` })),
    ...futures.map(f => ({ id: f.id, label: `${f.symbol} (期货)` })),
  ]
  const hasPositions = allPositions.length > 0

  const { data: singleData, isLoading: singleLoading } = useQuery({
    queryKey: ['stress-single', selectedId, portfolio],
    queryFn: () => api.stressSingle(portfolio, selectedId),
    enabled: tab === 'single' && !!selectedId,
  })

  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ['stress-portfolio', portfolio],
    queryFn: () => api.stressPortfolio(portfolio),
    enabled: tab === 'portfolio' && hasPositions,
  })

  const { data: bpData, isLoading: bpLoading } = useQuery<BreakingPointResult>({
    queryKey: ['breaking-point', portfolio],
    queryFn: () => api.breakingPoint(portfolio),
    enabled: hasPositions,
    staleTime: 60_000,
  })

  const { data: heatmapData, isLoading: heatmapLoading } = useQuery<HeatmapResult>({
    queryKey: ['heatmap', heatmapId1, heatmapId2, portfolio],
    queryFn: () => api.heatmap(portfolio, heatmapId1, heatmapId2),
    enabled: tab === 'heatmap' && !!heatmapId1 && !!heatmapId2 && heatmapId1 !== heatmapId2,
  })

  if (!hasPositions) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <div className="text-5xl mb-4">📉</div>
        <p className="text-xl font-medium text-slate-600">暂无持仓数据</p>
        <p className="text-sm mt-2">请先在「持仓管理」页面添加持仓</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breaking point summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">爆仓临界点（整体组合）</h2>
        {bpLoading && <p className="text-sm text-slate-400">计算中…</p>}
        {bpData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-lg p-4 ${bpData.overall.down_pct != null ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <p className="text-xs text-slate-500 mb-1">统一下跌触发爆仓</p>
                <p className={`text-2xl font-bold ${bpData.overall.down_pct != null ? 'text-red-600' : 'text-green-600'}`}>
                  {bpData.overall.down_pct != null ? `-${bpData.overall.down_pct.toFixed(1)}%` : '安全（100%跌幅不爆仓）'}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${bpData.overall.up_pct != null ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                <p className="text-xs text-slate-500 mb-1">统一上涨触发爆仓（空头风险）</p>
                <p className={`text-2xl font-bold ${bpData.overall.up_pct != null ? 'text-orange-600' : 'text-green-600'}`}>
                  {bpData.overall.up_pct != null ? `+${bpData.overall.up_pct.toFixed(1)}%` : '安全（100%涨幅不爆仓）'}
                </p>
              </div>
            </div>

            {bpData.per_position.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">逐持仓临界点</h3>
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 border-b">
                    <tr>
                      <th className="text-left py-2">代码</th>
                      <th className="text-left py-2">方向</th>
                      <th className="text-right py-2">下跌触发</th>
                      <th className="text-right py-2">上涨触发</th>
                      <th className="text-right py-2">主要风险</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bpData.per_position.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2 font-mono font-semibold text-slate-800">{p.symbol}</td>
                        <td className="py-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded ${p.side === 'long' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {p.side === 'long' ? '多' : '空'}
                          </span>
                        </td>
                        <td className={`text-right py-2 ${p.breaking_pct_down != null ? 'text-red-600 font-semibold' : 'text-green-600 text-xs'}`}>
                          {p.breaking_pct_down != null ? `-${p.breaking_pct_down.toFixed(1)}%` : '安全'}
                        </td>
                        <td className={`text-right py-2 ${p.breaking_pct_up != null ? 'text-orange-600 font-semibold' : 'text-green-600 text-xs'}`}>
                          {p.breaking_pct_up != null ? `+${p.breaking_pct_up.toFixed(1)}%` : '安全'}
                        </td>
                        <td className={`text-right py-2 font-semibold ${p.primary_risk_pct != null && p.primary_risk_pct < 20 ? 'text-red-600' : p.primary_risk_pct != null && p.primary_risk_pct < 40 ? 'text-orange-500' : 'text-green-600'}`}>
                          {p.primary_risk_pct != null ? `${p.primary_risk_pct.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab charts */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {([['portfolio', '组合压力曲线'], ['single', '单持仓曲线'], ['heatmap', '双资产热力图']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium -mb-px transition-colors ${
                tab === t
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'portfolio' && (
          portfolioLoading
            ? <p className="text-sm text-slate-400 py-8 text-center">计算中…</p>
            : portfolioData
            ? <StressChart data={portfolioData} title="组合统一冲击 → Excess Liquidity" />
            : null
        )}

        {tab === 'single' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">选择持仓</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-64"
              >
                <option value="">-- 请选择 --</option>
                {allPositions.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            {singleLoading && <p className="text-sm text-slate-400 py-4 text-center">计算中…</p>}
            {singleData && <StressChart data={singleData} title="单持仓冲击 → Excess Liquidity" />}
          </div>
        )}

        {tab === 'heatmap' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">持仓 1（X 轴）</label>
                <select value={heatmapId1} onChange={e => setHeatmapId1(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full">
                  <option value="">-- 请选择 --</option>
                  {allPositions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">持仓 2（Y 轴）</label>
                <select value={heatmapId2} onChange={e => setHeatmapId2(e.target.value)} className="border rounded-lg px-3 py-2 text-sm w-full">
                  <option value="">-- 请选择 --</option>
                  {allPositions.filter(p => p.id !== heatmapId1).map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>
            {heatmapLoading && <p className="text-sm text-slate-400 py-4 text-center">计算中…</p>}
            {heatmapData && <HeatmapChart data={heatmapData} />}
          </div>
        )}
      </div>
    </div>
  )
}
