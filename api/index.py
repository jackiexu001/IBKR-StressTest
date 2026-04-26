"""
Vercel serverless entry point for the FastAPI backend.
Vercel routes /api/* requests to this file; FastAPI matches them via its /api/* routes.
"""
import sys
import os

# Add the backend directory to the Python path so app.* imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.main import app  # noqa: F401 — Vercel ASGI runtime picks up `app`
