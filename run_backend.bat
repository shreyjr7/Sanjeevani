@echo off
title NovaFlow Backend (FastAPI)
echo ====================================================
echo Starting NovaFlow Backend on http://127.0.0.1:8000
echo Swagger API Docs: http://127.0.0.1:8000/docs
echo ====================================================

if exist "C:\Users\shreyansh\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
    "C:\Users\shreyansh\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
)
pause
