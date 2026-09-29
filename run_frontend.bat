@echo off
title NovaFlow Frontend (React + Vite)
echo ====================================================
echo Starting NovaFlow Frontend on http://localhost:5173
echo ====================================================
cd frontend
call npm run dev -- --host 127.0.0.1 --port 5173
pause
