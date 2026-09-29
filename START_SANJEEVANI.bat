@echo off
title Sanjeevani Launcher
echo ========================================================
echo   SANJEEVANI (संजीवनी) - Mental Health Care Platform
echo   Launching Persistent Backend and Frontend Servers...
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend Server on http://127.0.0.1:8000 ...
start "Sanjeevani Backend API" cmd /k "C:\Users\shreyansh\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Frontend Dev Server on http://127.0.0.1:5173 ...
start "Sanjeevani Frontend Web" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo ========================================================
echo   Both servers launched in persistent standalone windows!
echo   Frontend URL: http://127.0.0.1:5173
echo   Backend API : http://127.0.0.1:8000/docs
echo   These windows will NOT close even if the AI session resets!
echo ========================================================
pause
