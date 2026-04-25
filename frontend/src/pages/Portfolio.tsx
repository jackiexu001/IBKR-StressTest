import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AccountSetup } from '@/components/portfolio/AccountSetup'
import { AddStockForm } from '@/components/portfolio/AddStockForm'
import { AddFuturesForm } from '@/components/portfolio/AddFuturesForm'
import { PositionTable } from '@/components/portfolio/PositionTable'
import { usePortfolioStore } from '@/store/portfolio'
import { useLanguageStore, t } from '@/store/language'
import { api } from '@/lib/api'

type Panel = 'none' | 'stock' | 'futures' | 'account'

export function Portfolio() {
  const [panel, setPanel] = useState<Panel>('none')
  const { stocks, futures, importPortfolio, reset, getPortfolio } = usePortfolioStore()
  const { lang } = useLanguageStore()

  const portfolio = getPortfolio()
  const hasPositions = stocks.length > 0 || futures.length > 0
  const { data: metrics } = useQuery({
    queryKey: ['metrics', portfolio],
    queryFn: () => api.getMetrics(portfolio),
    enabled: hasPositions,
    staleTime: 30_000,
  })

  const handleExport = () => {
    const { getPortfolio } = usePortfolioStore.getState()
    const data = JSON.stringify(getPortfolio(), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ib-portfolio-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const data = JSON.parse(text)
        importPortfolio(data)
      } catch {
        alert(t('JSON 格式错误，导入失败', 'Invalid JSON format', lang))
      }
    }
    input.click()
  }

  const handleReset = () => {
    if (confirm(t('确定要清空所有持仓和账户数据吗？', 'Clear all positions and account data?', lang))) reset()
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setPanel(panel === 'stock' ? 'none' : 'stock')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              panel === 'stock'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            + {t('添加股票', 'Add Stock', lang)}
          </button>
          <button
            onClick={() => setPanel(panel === 'futures' ? 'none' : 'futures')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              panel === 'futures'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            + {t('添加期货', 'Add Futures', lang)}
          </button>
          <button
            onClick={() => setPanel(panel === 'account' ? 'none' : 'account')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              panel === 'account'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('账户设置', 'Account Setup', lang)}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-600 border hover:bg-slate-50"
          >
            {t('导入 JSON', 'Import JSON', lang)}
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-600 border hover:bg-slate-50"
          >
            {t('导出 JSON', 'Export JSON', lang)}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs text-red-500 border border-red-200 hover:bg-red-50"
          >
            {t('清空数据', 'Clear All', lang)}
          </button>
        </div>
      </div>

      {/* Expandable panel */}
      {panel !== 'none' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {panel === 'stock' && (
            <AddStockForm onDone={() => setPanel('none')} />
          )}
          {panel === 'futures' && (
            <AddFuturesForm onDone={() => setPanel('none')} />
          )}
          {panel === 'account' && (
            <AccountSetup />
          )}
        </div>
      )}

      {/* Position list */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">{t('持仓列表', 'Positions', lang)}</h2>
          <span className="text-sm text-slate-400">
            {stocks.length} {t('只股票', 'stocks', lang)} · {futures.length} {t('个期货合约', 'futures', lang)}
          </span>
        </div>
        <PositionTable positionDetails={metrics?.per_position} showDelete={true} />
      </div>
    </div>
  )
}
