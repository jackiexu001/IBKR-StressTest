import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AccountSetup } from '@/components/portfolio/AccountSetup'
import { AddStockForm } from '@/components/portfolio/AddStockForm'
import { AddFuturesForm } from '@/components/portfolio/AddFuturesForm'
import { PositionTable } from '@/components/portfolio/PositionTable'
import { usePortfolioStore } from '@/store/portfolio'
import { useLanguageStore, t } from '@/store/language'
import { api } from '@/lib/api'
import type { StockPosition, FuturesPosition } from '@/lib/types'

type Panel = 'none' | 'stock' | 'futures' | 'account'

export function Portfolio() {
  const [panel, setPanel] = useState<Panel>('none')
  const [editStock, setEditStock] = useState<StockPosition | null>(null)
  const [editFutures, setEditFutures] = useState<FuturesPosition | null>(null)
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

  const handleEdit = (type: 'stock' | 'futures', id: string) => {
    if (type === 'stock') {
      const pos = stocks.find(s => s.id === id)
      if (pos) { setEditStock(pos); setEditFutures(null); setPanel('stock') }
    } else {
      const pos = futures.find(f => f.id === id)
      if (pos) { setEditFutures(pos); setEditStock(null); setPanel('futures') }
    }
  }

  const handlePanelOpen = (p: Panel) => {
    setEditStock(null)
    setEditFutures(null)
    setPanel(panel === p ? 'none' : p)
  }

  const handleDone = () => {
    setPanel('none')
    setEditStock(null)
    setEditFutures(null)
  }

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

  const panelTitle = editStock
    ? t(`修改股票持仓：${editStock.symbol}`, `Edit Stock: ${editStock.symbol}`, lang)
    : editFutures
    ? t(`修改期货持仓：${editFutures.symbol}`, `Edit Futures: ${editFutures.symbol}`, lang)
    : panel === 'stock'
    ? t('添加股票持仓', 'Add Stock Position', lang)
    : panel === 'futures'
    ? t('添加期货持仓', 'Add Futures Position', lang)
    : t('账户设置', 'Account Setup', lang)

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => handlePanelOpen('stock')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              panel === 'stock' && !editStock
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            + {t('添加股票', 'Add Stock', lang)}
          </button>
          <button
            onClick={() => handlePanelOpen('futures')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              panel === 'futures' && !editFutures
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            + {t('添加期货', 'Add Futures', lang)}
          </button>
          <button
            onClick={() => handlePanelOpen('account')}
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
          <h3 className="text-sm font-semibold text-slate-700 mb-4">{panelTitle}</h3>
          {panel === 'stock' && (
            <AddStockForm onDone={handleDone} initial={editStock ?? undefined} />
          )}
          {panel === 'futures' && (
            <AddFuturesForm onDone={handleDone} initial={editFutures ?? undefined} />
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
        <PositionTable
          positionDetails={metrics?.per_position}
          showDelete={true}
          onEdit={handleEdit}
        />
      </div>
    </div>
  )
}
