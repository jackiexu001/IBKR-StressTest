from typing import TypedDict


class FuturesContract(TypedDict):
    name: str
    exchange: str
    multiplier: float
    currency: str
    yahoo_symbol: str   # for price lookup via yfinance


FUTURES_CONTRACTS: dict[str, FuturesContract] = {
    # US - CME/CBOT
    "ES":    {"name": "E-mini S&P 500",        "exchange": "CME",  "multiplier": 50,      "currency": "USD", "yahoo_symbol": "ES=F"},
    "NQ":    {"name": "E-mini Nasdaq-100",      "exchange": "CME",  "multiplier": 20,      "currency": "USD", "yahoo_symbol": "NQ=F"},
    "RTY":   {"name": "E-mini Russell 2000",    "exchange": "CME",  "multiplier": 50,      "currency": "USD", "yahoo_symbol": "RTY=F"},
    "YM":    {"name": "E-mini Dow Jones",       "exchange": "CBOT", "multiplier": 5,       "currency": "USD", "yahoo_symbol": "YM=F"},
    "MES":   {"name": "Micro E-mini S&P 500",   "exchange": "CME",  "multiplier": 5,       "currency": "USD", "yahoo_symbol": "MES=F"},
    "MNQ":   {"name": "Micro E-mini Nasdaq",    "exchange": "CME",  "multiplier": 2,       "currency": "USD", "yahoo_symbol": "MNQ=F"},
    "MYM":   {"name": "Micro E-mini Dow",       "exchange": "CME",  "multiplier": 0.5,     "currency": "USD", "yahoo_symbol": "MYM=F"},
    "M2K":   {"name": "Micro E-mini Russell",   "exchange": "CME",  "multiplier": 5,       "currency": "USD", "yahoo_symbol": "M2K=F"},
    "CL":    {"name": "Crude Oil (WTI)",        "exchange": "NYMEX","multiplier": 1000,    "currency": "USD", "yahoo_symbol": "CL=F"},
    "GC":    {"name": "Gold",                   "exchange": "NYMEX","multiplier": 100,     "currency": "USD", "yahoo_symbol": "GC=F"},
    "SI":    {"name": "Silver",                 "exchange": "NYMEX","multiplier": 5000,    "currency": "USD", "yahoo_symbol": "SI=F"},
    "ZB":    {"name": "US Treasury Bond",       "exchange": "CBOT", "multiplier": 1000,    "currency": "USD", "yahoo_symbol": "ZB=F"},
    "ZN":    {"name": "10-Year T-Note",         "exchange": "CBOT", "multiplier": 1000,    "currency": "USD", "yahoo_symbol": "ZN=F"},
    # HK - HKEX
    "HSI":   {"name": "Hang Seng Index",        "exchange": "HKEX", "multiplier": 50,      "currency": "HKD", "yahoo_symbol": "HSI=F"},
    "MHI":   {"name": "Mini Hang Seng",         "exchange": "HKEX", "multiplier": 10,      "currency": "HKD", "yahoo_symbol": "MHI=F"},
    "HHI":   {"name": "H-Share Index (HSCEI)",  "exchange": "HKEX", "multiplier": 50,      "currency": "HKD", "yahoo_symbol": "HHI=F"},
    "MCH":   {"name": "Mini H-Share Index",     "exchange": "HKEX", "multiplier": 10,      "currency": "HKD", "yahoo_symbol": "MCH=F"},
    # Japan - OSE
    "NK":    {"name": "Nikkei 225",             "exchange": "OSE",  "multiplier": 1000,    "currency": "JPY", "yahoo_symbol": "NK=F"},
    "NKM":   {"name": "Nikkei 225 Mini",        "exchange": "OSE",  "multiplier": 100,     "currency": "JPY", "yahoo_symbol": "NKM=F"},
    "TOPIX": {"name": "TOPIX Futures",          "exchange": "OSE",  "multiplier": 10000,   "currency": "JPY", "yahoo_symbol": ""},
    # Korea - KRX
    "K200":  {"name": "KOSPI 200",              "exchange": "KRX",  "multiplier": 250000,  "currency": "KRW", "yahoo_symbol": ""},
    "K200M": {"name": "KOSPI 200 Mini",         "exchange": "KRX",  "multiplier": 50000,   "currency": "KRW", "yahoo_symbol": ""},
    # Singapore - SGX
    "SIMSCI":{"name": "MSCI Singapore",         "exchange": "SGX",  "multiplier": 200,     "currency": "SGD", "yahoo_symbol": ""},
    "CN":    {"name": "FTSE China A50",         "exchange": "SGX",  "multiplier": 1,       "currency": "USD", "yahoo_symbol": ""},
    "TWN":   {"name": "MSCI Taiwan",            "exchange": "SGX",  "multiplier": 100,     "currency": "USD", "yahoo_symbol": ""},
    "NK_SGX":{"name": "Nikkei 225 (SGX)",       "exchange": "SGX",  "multiplier": 500,     "currency": "JPY", "yahoo_symbol": ""},
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
