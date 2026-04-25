from typing import TypedDict


class FuturesContract(TypedDict):
    name: str
    exchange: str
    multiplier: float
    currency: str
    yahoo_symbol: str
    # Approximate IB margins in the contract's native currency.
    # These are reference values only — IB adjusts margins frequently.
    typical_im: float
    typical_mm: float


FUTURES_CONTRACTS: dict[str, FuturesContract] = {
    # US - CME/CBOT (margins in USD, approximate as of 2025)
    "ES":    {"name": "E-mini S&P 500",       "exchange": "CME",  "multiplier": 50,     "currency": "USD", "yahoo_symbol": "ES=F",  "typical_im": 15000,  "typical_mm": 13500},
    "NQ":    {"name": "E-mini Nasdaq-100",     "exchange": "CME",  "multiplier": 20,     "currency": "USD", "yahoo_symbol": "NQ=F",  "typical_im": 21000,  "typical_mm": 19000},
    "RTY":   {"name": "E-mini Russell 2000",   "exchange": "CME",  "multiplier": 50,     "currency": "USD", "yahoo_symbol": "RTY=F", "typical_im": 7500,   "typical_mm": 6800},
    "YM":    {"name": "E-mini Dow Jones",      "exchange": "CBOT", "multiplier": 5,      "currency": "USD", "yahoo_symbol": "YM=F",  "typical_im": 8000,   "typical_mm": 7200},
    "MES":   {"name": "Micro E-mini S&P 500",  "exchange": "CME",  "multiplier": 5,      "currency": "USD", "yahoo_symbol": "MES=F", "typical_im": 1500,   "typical_mm": 1350},
    "MNQ":   {"name": "Micro E-mini Nasdaq",   "exchange": "CME",  "multiplier": 2,      "currency": "USD", "yahoo_symbol": "MNQ=F", "typical_im": 2100,   "typical_mm": 1900},
    "MYM":   {"name": "Micro E-mini Dow",      "exchange": "CME",  "multiplier": 0.5,    "currency": "USD", "yahoo_symbol": "MYM=F", "typical_im": 800,    "typical_mm": 720},
    "M2K":   {"name": "Micro E-mini Russell",  "exchange": "CME",  "multiplier": 5,      "currency": "USD", "yahoo_symbol": "M2K=F", "typical_im": 750,    "typical_mm": 680},
    "CL":    {"name": "Crude Oil (WTI)",       "exchange": "NYMEX","multiplier": 1000,   "currency": "USD", "yahoo_symbol": "CL=F",  "typical_im": 5500,   "typical_mm": 5000},
    "GC":    {"name": "Gold",                  "exchange": "NYMEX","multiplier": 100,    "currency": "USD", "yahoo_symbol": "GC=F",  "typical_im": 12000,  "typical_mm": 11000},
    "SI":    {"name": "Silver",                "exchange": "NYMEX","multiplier": 5000,   "currency": "USD", "yahoo_symbol": "SI=F",  "typical_im": 10000,  "typical_mm": 9000},
    "ZB":    {"name": "US Treasury Bond",      "exchange": "CBOT", "multiplier": 1000,   "currency": "USD", "yahoo_symbol": "ZB=F",  "typical_im": 3500,   "typical_mm": 3200},
    "ZN":    {"name": "10-Year T-Note",        "exchange": "CBOT", "multiplier": 1000,   "currency": "USD", "yahoo_symbol": "ZN=F",  "typical_im": 2000,   "typical_mm": 1800},
    # HK - HKEX (margins in HKD)
    "HSI":   {"name": "Hang Seng Index",       "exchange": "HKEX", "multiplier": 50,     "currency": "HKD", "yahoo_symbol": "HSI=F", "typical_im": 110000, "typical_mm": 88000},
    "MHI":   {"name": "Mini Hang Seng",        "exchange": "HKEX", "multiplier": 10,     "currency": "HKD", "yahoo_symbol": "MHI=F", "typical_im": 22000,  "typical_mm": 18000},
    "HHI":   {"name": "H-Share Index (HSCEI)", "exchange": "HKEX", "multiplier": 50,     "currency": "HKD", "yahoo_symbol": "HHI=F", "typical_im": 55000,  "typical_mm": 44000},
    "MCH":   {"name": "Mini H-Share Index",    "exchange": "HKEX", "multiplier": 10,     "currency": "HKD", "yahoo_symbol": "MCH=F", "typical_im": 11000,  "typical_mm": 9000},
    # Japan - OSE (margins in JPY)
    "NK":    {"name": "Nikkei 225",            "exchange": "OSE",  "multiplier": 1000,   "currency": "JPY", "yahoo_symbol": "NK=F",  "typical_im": 1600000,"typical_mm": 1300000},
    "NKM":   {"name": "Nikkei 225 Mini",       "exchange": "OSE",  "multiplier": 100,    "currency": "JPY", "yahoo_symbol": "NKM=F", "typical_im": 160000, "typical_mm": 130000},
    "TOPIX": {"name": "TOPIX Futures",         "exchange": "OSE",  "multiplier": 10000,  "currency": "JPY", "yahoo_symbol": "",       "typical_im": 600000, "typical_mm": 500000},
    # Korea - KRX (margins in KRW)
    "K200":  {"name": "KOSPI 200",             "exchange": "KRX",  "multiplier": 250000, "currency": "KRW", "yahoo_symbol": "",       "typical_im": 9000000,"typical_mm": 7500000},
    "K200M": {"name": "KOSPI 200 Mini",        "exchange": "KRX",  "multiplier": 50000,  "currency": "KRW", "yahoo_symbol": "",       "typical_im": 1800000,"typical_mm": 1500000},
    # Singapore - SGX
    "SIMSCI":{"name": "MSCI Singapore",        "exchange": "SGX",  "multiplier": 200,    "currency": "SGD", "yahoo_symbol": "",       "typical_im": 3000,   "typical_mm": 2500},
    "CN":    {"name": "FTSE China A50",        "exchange": "SGX",  "multiplier": 1,      "currency": "USD", "yahoo_symbol": "",       "typical_im": 1200,   "typical_mm": 1000},
    "TWN":   {"name": "MSCI Taiwan",           "exchange": "SGX",  "multiplier": 100,    "currency": "USD", "yahoo_symbol": "",       "typical_im": 2500,   "typical_mm": 2000},
    "NK_SGX":{"name": "Nikkei 225 (SGX)",      "exchange": "SGX",  "multiplier": 500,    "currency": "JPY", "yahoo_symbol": "",       "typical_im": 800000, "typical_mm": 650000},
}


def search_futures(query: str) -> list[dict]:
    q = query.upper().strip()
    results = []
    for code, info in FUTURES_CONTRACTS.items():
        if q in code or q in info["name"].upper():
            results.append({"symbol": code, **info, "type": "futures"})
    return results[:8]


def get_futures_info(symbol: str) -> dict | None:
    info = FUTURES_CONTRACTS.get(symbol.upper())
    if info:
        return {"symbol": symbol.upper(), **info}
    return None
