import { useQuery } from '@tanstack/react-query'
import { usePortfolioStore } from '@/store/portfolio'
import { MetricsDashboard } from '@/components/metrics/MetricsDashboard'
import { PositionTable } from '@/components/portfolio/PositionTable'
import { useLanguageStore, t } from '@/store/language'
import { api } from '@/lib/api'

export function Dashboard() {
  const { getPortfolio, stocks, futures } = usePortfolioStore()
  const { lang } = useLanguageStore()

  const portfolio = getPortfolio()
  const hasPositions = stocks.length > 0 || futures.length > 0

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['metrics', portfolio],
    queryFn: () => api.getMetrics(portfolio),
    enabled: hasPositions,
    staleTime: 30_000,
  })

  if (!hasPositions) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <div className="text-5xl mb-4">📊</div>
        <p className="text-xl font-medium text-slate-600">{t('暂无持仓数据', 'No position data', lang)}</p>
        <p className="text-sm mt-2">{t('请前往「持仓管理」页面添加股票或期货持仓', 'Go to Portfolio tab to add positions', lang)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="text-center py-8 text-slate-400 text-sm">{t('计算指标中…', 'Calculating metrics…', lang)}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {t('指标计算失败：', 'Metrics error: ', lang)}{(error as Error).message}
        </div>
      )}
      {metrics && <MetricsDashboard metrics={metrics} />}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">{t('持仓明细', 'Position Detail', lang)}</h2>
        <PositionTable positionDetails={metrics?.per_position} showDelete={false} />
      </div>
    </div>
  )
}
