import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import { useLanguageStore, t } from '@/store/language'
import type { InstrumentSearchResult } from '@/lib/types'

interface SymbolSearchProps {
  onSelect: (result: InstrumentSearchResult) => void
  placeholder?: string
}

export function SymbolSearch({ onSelect, placeholder }: SymbolSearchProps) {
  const { lang } = useLanguageStore()
  const defaultPlaceholder = t('输入代码或名称搜索，如 AAPL, ES, 0700', 'Search by symbol or name, e.g. AAPL, ES, 0700', lang)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<InstrumentSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = (q: string) => {
    setQuery(q)
    clearTimeout(timer.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.searchInstruments(q)
        setResults(data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const select = (r: InstrumentSearchResult) => {
    onSelect(r)
    setQuery(r.symbol)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => search(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder ?? defaultPlaceholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
      {loading && (
        <div className="absolute right-3 top-2.5 text-slate-400 text-xs">{t('搜索中…', 'Searching…', lang)}</div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => select(r)}
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 flex items-center justify-between"
            >
              <div>
                <span className="font-mono font-semibold text-sm text-slate-800">{r.symbol}</span>
                <span className="ml-2 text-sm text-slate-500">{r.name}</span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <span className={`text-xs px-1.5 py-0.5 rounded ${r.type === 'futures' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {r.type === 'futures' ? t('期货', 'FUT', lang) : t('股票', 'STK', lang)}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{r.market}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
