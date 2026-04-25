from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import metrics, stress, instruments

app = FastAPI(title="IB Risk Tool", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api")
app.include_router(stress.router, prefix="/api")
app.include_router(instruments.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
