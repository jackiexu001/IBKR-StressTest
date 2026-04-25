import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/store/language'

type Status = 'safe' | 'warn' | 'alert' | 'danger' | 'neutral'

interface MetricCardProps {
  label: string
  labelZh: string
  value: string
  subValue?: string
  status?: Status
  size?: 'lg' | 'md' | 'sm'
  tooltip?: string
}

const statusStyle: Record<Status, string> = {
  safe:    'border-green-200 bg-green-50',
  warn:    'border-yellow-200 bg-yellow-50',
  alert:   'border-orange-200 bg-orange-50',
  danger:  'border-red-200 bg-red-50',
  neutral: 'border-slate-200 bg-white',
}

const valueStyle: Record<Status, string> = {
  safe:    'text-green-700',
  warn:    'text-yellow-700',
  alert:   'text-orange-700',
  danger:  'text-red-700',
  neutral: 'text-slate-900',
}

export function MetricCard({
  label, labelZh, value, subValue, status = 'neutral', size = 'md', tooltip,
}: MetricCardProps) {
  const { lang } = useLanguageStore()
  const primary = lang === 'zh' ? labelZh : label
  const secondary = lang === 'zh' ? label : labelZh

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col gap-1 transition-colors',
        statusStyle[status],
        size === 'lg' && 'p-6',
      )}
      title={tooltip}
    >
      <div className="flex items-center justify-between">
        <span className={cn('font-semibold text-xs text-slate-700 uppercase tracking-wide', size === 'lg' && 'text-sm')}>
          {primary}
        </span>
        {status === 'danger' && (
          <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-semibold">ALERT</span>
        )}
        {status === 'alert' && (
          <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded font-semibold">LOW</span>
        )}
      </div>
      <div className={cn('font-bold tabular-nums', valueStyle[status], size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-base')}>
        {value}
      </div>
      <div className="text-xs text-slate-400">{secondary}</div>
      {subValue && <div className="text-xs text-slate-400 mt-1">{subValue}</div>}
    </div>
  )
}
