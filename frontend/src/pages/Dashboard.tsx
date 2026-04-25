import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePortfolioStore } from '@/store/portfolio'
import { MetricsDashboard } from '@/components/metrics/MetricsDashboard'
import { PositionTable } from '@/components/portfolio/PositionTable'
import { api } from '@/lib/api'

export function Dashboard() {
  const { getPortfolio, stocks, futures } = usePortfolioStore()
  const [shock, setShock] = useState(0)

  const portfolio = getPortfolio()
  const hasPositions = stocks.length > 0 || futures.length > 0

  const shockedPortfolio = shock === 0 ? portfolio : {
    ...portfolio,
    stocks: portfolio.stocks.map(s => ({
      ...s,
      current_price: s.current_price * (1 + shock / 100),
    })),
    futures: portfolio.futures.map(f => ({
      ...f,
      current_price: f.current_price * (1 + shock / 100),
    })),
  }

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['metrics', shockedPortfolio],
    queryFn: () => api.getMetrics(shockedPortfolio),
    enabled: hasPositions,
    staleTime: 30_000,
  })

  if (!hasPositions) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-xl font-medium text-slate-600">暂无持仓数据</p>
        <p className="text-sm mt-2">请前往「持仓管理」页面添加股票或期货持仓</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shock slider */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
            快速压力测试
          </span>
          <input
            type="range"
            min={-50}
            max={50}
            step={1}
            value={shock}
            onChange={e => setShock(parseInt(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className={`text-sm font-mono font-semibold w-16 text-right ${
            shock < 0 ? 'text-red-600' : shock > 0 ? 'text-green-600' : 'text-slate-500'
          }`}>
            {shock > 0 ? '+' : ''}{shock}%
          </span>
          {shock !== 0 && (
            <button
              onClick={() => setShock(0)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              重置
            </button>
          )}
        </div>
        {shock !== 0 && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠ 当前显示的是所有持仓价格 {shock > 0 ? '上涨' : '下跌'} {Math.abs(shock)}% 后的模拟结果
          </p>
        )}
      </div>

      {/* Metrics */}
      {isLoading && (
        <div className="text-center py-8 text-slate-400 text-sm">计算指标中…</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          指标计算失败：{(error as Error).message}
        </div>
      )}
      {metrics && <MetricsDashboard metrics={metrics} />}

      {/* Position Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">持仓明细</h2>
        <PositionTable positionDetails={metrics?.per_position} />
      </div>
    </div>
  )
}
