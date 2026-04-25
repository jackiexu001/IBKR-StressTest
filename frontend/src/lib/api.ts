import axios from 'axios'
import type {
  Portfolio, Metrics, StressPoint, BreakingPointResult,
  HeatmapResult, InstrumentSearchResult,
} from './types'

const http = axios.create({ baseURL: '/api' })

export const api = {
  getMetrics: (portfolio: Portfolio) =>
    http.post<Metrics>('/metrics', portfolio).then(r => r.data),

  stressSingle: (portfolio: Portfolio, position_id: string, shock_min = -60, shock_max = 60) =>
    http.post<StressPoint[]>('/stress/single', { portfolio, position_id, shock_min, shock_max, step: 1 }).then(r => r.data),

  stressPortfolio: (portfolio: Portfolio, shock_min = -60, shock_max = 60) =>
    http.post<StressPoint[]>('/stress/portfolio', { portfolio, shock_min, shock_max, step: 1 }).then(r => r.data),

  breakingPoint: (portfolio: Portfolio) =>
    http.post<BreakingPointResult>('/stress/breaking-point', portfolio).then(r => r.data),

  heatmap: (portfolio: Portfolio, pos_id_1: string, pos_id_2: string, shock_range?: number[]) =>
    http.post<HeatmapResult>('/stress/heatmap', { portfolio, pos_id_1, pos_id_2, shock_range }).then(r => r.data),

  searchInstruments: (q: string) =>
    http.get<InstrumentSearchResult[]>('/instruments/search', { params: { q } }).then(r => r.data),

  getPrice: (symbol: string) =>
    http.get<{ symbol: string; price: number; currency: string }>(`/instruments/price/${symbol}`).then(r => r.data),

  getInfo: (symbol: string) =>
    http.get<InstrumentSearchResult & { multiplier?: number }>(`/instruments/info/${symbol}`).then(r => r.data),
}
