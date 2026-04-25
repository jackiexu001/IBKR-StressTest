import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Metrics } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(value: number, decimals = 0): string {
  if (!isFinite(value)) return '—'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function fmtUSD(value: number): string {
  if (!isFinite(value)) return '—'
  const sign = value < 0 ? '-' : ''
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtPct(value: number, decimals = 1): string {
  if (!isFinite(value)) return '—'
  return `${(value * 100).toFixed(decimals)}%`
}

export function cushionColor(cushion: number): string {
  if (cushion > 0.15) return 'text-green-600'
  if (cushion > 0.05) return 'text-yellow-600'
  if (cushion > 0.02) return 'text-orange-600'
  return 'text-red-600'
}

export function cushionBg(cushion: number): string {
  if (cushion > 0.15) return 'bg-green-50 border-green-200'
  if (cushion > 0.05) return 'bg-yellow-50 border-yellow-200'
  if (cushion > 0.02) return 'bg-orange-50 border-orange-200'
  return 'bg-red-50 border-red-200'
}

export function exliqStatus(metrics: Metrics): 'safe' | 'warn' | 'alert' | 'danger' {
  if (metrics.excess_liquidity < 0) return 'danger'
  if (metrics.cushion < 0.02) return 'alert'
  if (metrics.cushion < 0.05) return 'warn'
  return 'safe'
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10)
}
