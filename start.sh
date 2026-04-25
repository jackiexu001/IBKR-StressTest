#!/bin/bash
cd "$(dirname "$0")"

echo "Starting backend..."
cd backend
source .venv/bin/activate 2>/dev/null || pip3 install fastapi uvicorn pydantic yfinance httpx -q
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✓ Backend:  http://localhost:8000"
echo "✓ Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
