export type Market = 'US' | 'HK' | 'JP' | 'KR' | 'SG'
export type Exchange = 'CME' | 'HKEX' | 'OSE' | 'KRX' | 'SGX' | 'CBOT' | 'NYMEX'
export type Currency = 'USD' | 'HKD' | 'JPY' | 'KRW' | 'SGD'
export type AccountType = 'RegT' | 'Cash'

export interface StockPosition {
  id: string
  symbol: string
  name: string
  market: Market
  shares: number          // negative = short
  avg_cost: number
  current_price: number
  currency: Currency
  initial_margin_rate: number
  maintenance_margin_rate: number
}

export interface FuturesPosition {
  id: string
  symbol: string
  name: string
  exchange: Exchange
  contracts: number       // negative = short
  multiplier: number
  avg_entry_price: number
  current_price: number
  currency: Currency
  initial_margin_per_contract: number
  maintenance_margin_per_contract: number
}

export interface Account {
  cash_balance: number
  base_currency: Currency
  fx_rates: Partial<Record<Currency, number>>  // foreign → USD, e.g. { HKD: 0.1282 }
  account_type: AccountType
  prev_day_elv?: number
}

export interface Portfolio {
  account: Account
  stocks: StockPosition[]
  futures: FuturesPosition[]
}

export interface PositionDetail {
  id: string
  symbol: string
  type: 'stock' | 'futures'
  market?: string
  exchange?: string
  shares?: number
  contracts?: number
  current_price: number
  currency: string
  market_value_usd?: number
  notional_usd?: number
  unrealized_pnl_usd: number
  initial_margin_usd: number
  maint_margin_usd: number
  pct_of_total_margin: number
}

export interface Metrics {
  nlv: number
  elv: number
  long_market_value: number
  short_market_value: number
  net_market_value: number
  futures_notional: number
  stock_initial_margin: number
  futures_initial_margin: number
  total_initial_margin: number
  stock_maint_margin: number
  futures_maint_margin: number
  total_maint_margin: number
  available_funds: number
  excess_liquidity: number
  cushion: number
  margin_ratio: number
  sma: number
  stock_buying_power: number
  option_buying_power: number
  securities_excess_liquidity: number
  commodities_excess_liquidity: number
  per_position: PositionDetail[]
}

export interface StressPoint {
  shock_pct: number
  excess_liquidity: number
  nlv: number
  available_funds: number
  cushion?: number
}

export interface BreakingPointResult {
  overall: { down_pct: number | null; up_pct: number | null }
  per_position: Array<{
    id: string
    symbol: string
    side: 'long' | 'short'
    breaking_pct_down: number | null
    breaking_pct_up: number | null
    primary_risk_pct: number | null
  }>
}

export interface HeatmapResult {
  x_shocks: number[]
  y_shocks: number[]
  pos_id_1: string
  pos_id_2: string
  matrix: number[][]
}

export interface InstrumentSearchResult {
  symbol: string
  name: string
  exchange: string
  type: 'stock' | 'futures'
  currency: string
  market: Market
  multiplier?: number
}
