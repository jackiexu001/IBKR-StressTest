# IB Risk Tool — CLAUDE.md

## 项目概述

复刻 Interactive Brokers RegT 保证金指标体系，并为多市场（美/港/日/韩/新）股票+期货组合提供压力测试和爆仓临界点分析。目标部署在用户个人网站。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| 后端 | Python 3.11 + FastAPI + uvicorn |
| 图表 | Apache ECharts (echarts-for-react) |
| 状态 | Zustand + TanStack Query |
| 部署 | Vercel (前端) + Railway/Fly.io (后端) |

---

## 项目结构

```
ib-risk-tool/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── portfolio/
│   │   │   │   ├── PositionTable.tsx
│   │   │   │   ├── AddStockForm.tsx
│   │   │   │   ├── AddFuturesForm.tsx
│   │   │   │   ├── AccountSetup.tsx
│   │   │   │   └── SymbolSearch.tsx      # 代码搜索 + 自动填充
│   │   │   ├── metrics/
│   │   │   │   ├── MetricsDashboard.tsx
│   │   │   │   └── MetricCard.tsx
│   │   │   └── stress/
│   │   │       ├── SingleStressTest.tsx
│   │   │       ├── PortfolioStress.tsx
│   │   │       └── BreakingPointChart.tsx
│   │   ├── lib/
│   │   │   ├── types.ts
│   │   │   └── api.ts
│   │   ├── store/
│   │   │   └── portfolio.ts              # Zustand + localStorage 持久化
│   │   └── pages/
│   │       ├── Dashboard.tsx
│   │       ├── Portfolio.tsx
│   │       └── StressTest.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── metrics.py                # POST /api/metrics
│   │   │   ├── stress.py                 # POST /api/stress/*
│   │   │   └── instruments.py            # GET /api/instruments/*
│   │   ├── models/
│   │   │   ├── position.py               # StockPosition, FuturesPosition
│   │   │   └── account.py                # Account, Portfolio
│   │   ├── services/
│   │   │   ├── margin.py                 # ★ 核心 IB 指标计算
│   │   │   ├── stress_test.py            # 压力测试 + 二分法
│   │   │   └── fx.py                     # 汇率转换
│   │   └── data/
│   │       ├── market_rules.py           # 各市场保证金比率
│   │       └── futures_contracts.py      # 内置期货合约数据库
│   └── requirements.txt
└── docker-compose.yml
```

---

## 核心类型（frontend/src/lib/types.ts）

```typescript
type Market    = 'US' | 'HK' | 'JP' | 'KR' | 'SG'
type Exchange  = 'CME' | 'HKEX' | 'OSE' | 'KRX' | 'SGX' | 'CBOT' | 'NYMEX'
type Currency  = 'USD' | 'HKD' | 'JPY' | 'KRW' | 'SGD'
type AccountType = 'RegT' | 'Cash'

interface StockPosition {
  id: string; symbol: string; market: Market
  shares: number          // 负数 = 做空
  avgCost: number; currentPrice: number; currency: Currency
  initialMarginRate: number; maintenanceMarginRate: number
}

interface FuturesPosition {
  id: string; symbol: string; exchange: Exchange
  contracts: number       // 负数 = 空头
  multiplier: number; avgEntryPrice: number; currentPrice: number; currency: Currency
  initialMarginPerContract: number    // 从 IB 手动输入
  maintenanceMarginPerContract: number
}

interface Account {
  cashBalance: number; baseCurrency: Currency
  fxRates: Partial<Record<Currency, number>>  // 外币→USD，e.g. { HKD: 0.1282 }
  accountType: AccountType
  prevDayELV?: number     // 可选，用于精确计算 Buying Power
}
```

---

## IB 指标计算（来自 IBKR 官方文档，backend/services/margin.py）

### 账户两段式架构（重要）

IB 内部分两个独立分部：
- **Securities（证券）分部**：股票 → 用 ELV 计算 ExLiq
- **Commodities（商品）分部**：期货 → 用 NLV 计算 ExLiq
- 本工具用 NLV ≈ ELV 的简化统一公式（RegT 无借贷账户下近似成立）

### 官方公式对照表

| 指标 | 证券分部 | 商品分部（期货）|
|---|---|---|
| Available Funds | ELV - Initial Margin | NLV - Initial Margin |
| Excess Liquidity | ELV - Maintenance Margin | NLV - Maintenance Margin |
| SMA | max(ELV-IM, PrevSMA+CashΔ-NewIM) | **无**（仅证券有）|
| Buying Power | min(ELV,PrevDayELV) - IM × 2(非PDT) / × 4(PDT) | N/A |
| Margin Ratio | IM / NLV | IM / NLV |

### 计算逻辑

```
NLV = Cash + Long_Stock_MV - Short_Stock_MV
ELV ≈ NLV（无保证金借款时）

Stock Initial Margin:
  多头: 50%(US/HK/SG) / 30%(JP) / 40%(KR) × market_value
  空头: 50% × market_value（额外，卖空收益已在现金中）

Stock Maintenance Margin:
  多头: 25%(US/HK/SG) / 20%(JP/KR) × market_value
  空头: 30% × market_value（额外）

空头对 ExLiq 净影响 = -(1.0 + 0.30) × short_MV = -130% short_MV
  （1.0 来自 ELV 中的空头负债，0.30 来自维持保证金）

Futures Margin: 用户从 IB 手动输入，不随价格变化（SPAN 计算）

Available Funds   = ELV - Total_IM   （负数 → 不能开新仓）
Excess Liquidity  = ELV - Total_MM   （负数 → 强制平仓 ★）
Cushion           = ExLiq / NLV
Margin Ratio      = Total_IM / NLV

SMA ≈ max(0, ELV - Stock_IM)  [仅股票IM，快照近似，用户可手动覆盖]
Stock Buying Power = min(ELV, PrevDayELV) - Total_IM × 2
Option Buying Power = Available Funds
```

---

## 各市场默认保证金比率（可被每个持仓覆盖）

| 市场 | 多头 IM | 多头 MM | 空头 IM（额外）| 空头 MM（额外）|
|---|---|---|---|---|
| US | 50% | 25% | 50% | 30% |
| HK | 50% | 25% | 50% | 30% |
| JP | 30% | 20% | 50% | 30% |
| KR | 40% | 20% | 50% | 30% |
| SG | 50% | 25% | 50% | 30% |

期货保证金：用户手动输入（因 IB 按 SPAN 计算，随市场波动调整，不可硬编码）

---

## 压力测试逻辑（backend/services/stress_test.py）

### 1. 单持仓压力曲线
对一个持仓施加 shock ∈ [-100%, +100%]，计算每个点的 Excess Liquidity。

### 2. 组合统一压力曲线
所有持仓同时按相同比例变化。

### 3. 爆仓临界点（二分法，精度 < 0.001%）
```
search(direction):
  if calc_metrics(apply_shock(portfolio, direction * 100%)).ExLiq >= 0: return None
  binary search lo=0, hi=1 for 60 iterations
  return lo * 100  # 最小触发爆仓的幅度
返回: { down_pct, up_pct }（多头看下跌，空头看上涨）
```
逐持仓版本：每个持仓单独冲击，其余不变，分别找临界点。

### 4. 双资产热力图
两个持仓 × 两个冲击范围 → Excess Liquidity 矩阵（ECharts heatmap）

---

## API 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/metrics` | 计算完整 IB 指标 |
| POST | `/api/stress/single` | 单持仓压力曲线 |
| POST | `/api/stress/portfolio` | 组合统一压力曲线 |
| POST | `/api/stress/breaking-point` | 爆仓临界点（全组合 + 逐持仓）|
| POST | `/api/stress/heatmap` | 双持仓二维热力图 |
| GET  | `/api/instruments/search` | 代码搜索（Yahoo Suggest API + 内置期货库）|
| GET  | `/api/instruments/price/{symbol}` | 最新收盘价（yfinance）|
| GET  | `/api/instruments/info/{symbol}` | 合约参数（内置数据库）|

---

## 持仓录入 UX（两阶段）

1. **代码搜索**：输入关键词 → 后端调 Yahoo Finance Suggest API 或内置期货库 → 下拉选择
2. **参数确认**：自动填充（收盘价/乘数/货币/保证金）→ 用户确认或修改 → 保存

自动填充字段（均可编辑）：
- 股票：当前收盘价（yfinance）、交易币种、所属市场
- 期货：合约乘数、交易币种、当前收盘价、建议保证金（**用户必须核对并按 IB 实际值修改**）

---

## 内置期货合约数据库（data/futures_contracts.py）

| 代码 | 名称 | 交易所 | 乘数 | 币种 |
|---|---|---|---|---|
| ES | E-mini S&P 500 | CME | 50 | USD |
| NQ | E-mini Nasdaq | CME | 20 | USD |
| RTY | E-mini Russell | CME | 50 | USD |
| YM | Mini Dow | CBOT | 5 | USD |
| HSI | 恒生指数 | HKEX | 50 | HKD |
| MHI | 小型恒生 | HKEX | 10 | HKD |
| NK | 日经225 | OSE | 1000 | JPY |
| NK_M | 日经迷你 | OSE | 100 | JPY |
| K200 | KOSPI200 | KRX | 250000 | KRW |
| SIMSCI | MSCI Singapore | SGX | 200 | SGD |

---

## Dashboard 布局（对应 IB TWS Account 页面）

**行1（大卡片）**：NLV / Excess Liquidity ★ / Cushion  
**行2（中卡片）**：ELV / Available Funds / Initial Margin / Maintenance Margin  
**行3（中卡片）**：Net Market Value / SMA / Stock Buying Power / Option Buying Power / Margin Ratio  
**分部表格**：Securities 行 + Commodities 行 + Total 行（对应 IB TWS 三行结构）  
**持仓明细**：代码 / 市值 / 浮盈亏 / IM / MM / 占比% / 单仓爆仓临界点  
**右侧快速测试**：全局冲击滑块，实时更新所有指标

---

## 开发顺序

1. **Phase 1 - 核心指标**
   - 后端：Pydantic 模型 + margin.py + `/api/metrics`
   - 前端：AccountSetup + AddStockForm + AddFuturesForm + MetricsDashboard
   - 验证：与 IB TWS Account 页面对比，NLV/ExLiq/IM 误差 < 5%

2. **Phase 2 - 压力测试**
   - 后端：stress_test.py 全部算法
   - 前端：StressTest 页面（折线图 + 爆仓临界点 + 热力图）

3. **Phase 3 - 体验完善**
   - 代码搜索（SymbolSearch.tsx + instruments.py）
   - 数据导出/导入 JSON
   - docker-compose 部署配置

---

## 验证方法

1. 在 IB TWS 打开 Account 页面截图
2. 把相同持仓录入工具，对比每个指标（目标误差 < 5%）
3. 手动计算单个持仓跌 20% 后的 ExLiq，与工具输出对比
4. 验证二分法爆仓临界点（用 Excel 手动算）

---

## 注意事项

- **SMA 是近似值**：精确 SMA 需完整交易历史（IB 内部维护），工具显示当日快照近似值，用户可手动覆盖
- **期货保证金必须手动输入**：IB 用 SPAN 计算，随市场调整，不能硬编码
- **价格数据有延迟**：yfinance 提供收盘价，盘中请手动输入实时价格
- **两段架构简化**：工具用统一公式，与 IB 内部分段计算存在微小差异
- **不支持 Portfolio Margin**：PM 使用10种压力场景模型，无法公开复现
