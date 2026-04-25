import httpx
import yfinance as yf
from fastapi import APIRouter, Query, HTTPException
from app.data.futures_contracts import search_futures, get_futures_info

router = APIRouter(prefix="/instruments", tags=["instruments"])

YAHOO_SUGGEST_URL = "https://query2.finance.yahoo.com/v1/finance/search"


@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    """Search symbols: futures from internal DB first, then Yahoo Finance."""
    results = []

    # 1. Internal futures DB (fuzzy match)
    futures_hits = search_futures(q)
    results.extend(futures_hits)

    # 2. Yahoo Finance suggest API for stocks
    if len(results) < 8:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    YAHOO_SUGGEST_URL,
                    params={"q": q, "quotesCount": 8, "newsCount": 0},
                    headers={"User-Agent": "Mozilla/5.0"},
                )
                data = resp.json()
                for item in data.get("quotes", []):
                    q_type = item.get("quoteType", "")
                    if q_type not in ("EQUITY", "ETF", "INDEX"):
                        continue
                    results.append({
                        "symbol": item.get("symbol", ""),
                        "name": item.get("longname") or item.get("shortname", ""),
                        "exchange": item.get("exchange", ""),
                        "type": "stock",
                        "currency": "",
                        "market": _infer_market(item.get("exchange", ""), item.get("symbol", "")),
                    })
        except Exception:
            pass  # Yahoo unavailable → return futures results only

    return results[:10]


@router.get("/price/{symbol}")
def get_price(symbol: str):
    """Get latest closing price via yfinance."""
    # Check internal futures DB first for yahoo_symbol mapping
    futures_info = get_futures_info(symbol)
    yahoo_sym = futures_info["yahoo_symbol"] if futures_info else symbol

    if not yahoo_sym:
        raise HTTPException(status_code=404, detail=f"No Yahoo symbol for {symbol}")

    try:
        ticker = yf.Ticker(yahoo_sym)
        hist = ticker.history(period="2d")
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No price data for {symbol}")
        price = float(hist["Close"].iloc[-1])
        currency = ticker.info.get("currency", "USD")
        return {"symbol": symbol, "price": price, "currency": currency}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info/{symbol}")
def get_info(symbol: str):
    """Get contract info (futures from internal DB, stocks from yfinance)."""
    futures_info = get_futures_info(symbol)
    if futures_info:
        return {
            **futures_info,
            "type": "futures",
            "typical_im": futures_info.get("typical_im", 0),
            "typical_mm": futures_info.get("typical_mm", 0),
        }

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        return {
            "symbol": symbol,
            "name": info.get("longName", ""),
            "type": "stock",
            "currency": info.get("currency", "USD"),
            "exchange": info.get("exchange", ""),
            "market": _infer_market(info.get("exchange", ""), symbol),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _infer_market(exchange: str, symbol: str) -> str:
    ex = exchange.upper()
    sym = symbol.upper()
    if any(x in ex for x in ("NYS", "NAS", "PCX", "BATS", "AMEX", "NYSE", "NASDAQ")):
        return "US"
    if any(x in ex for x in ("HKG", "HKEX", "HKS")):
        return "HK"
    if any(x in ex for x in ("TYO", "OSA", "JPX")):
        return "JP"
    if any(x in ex for x in ("KSC", "KOE", "KRX")):
        return "KR"
    if any(x in ex for x in ("SES", "SGX")):
        return "SG"
    if sym.endswith(".HK"):
        return "HK"
    if sym.endswith(".T") or sym.endswith(".OS"):
        return "JP"
    if sym.endswith(".KS") or sym.endswith(".KQ"):
        return "KR"
    if sym.endswith(".SI"):
        return "SG"
    return "US"
