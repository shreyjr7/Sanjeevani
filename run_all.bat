@echo off
title NovaFlow - Launch Both Backend and Frontend
echo ====================================================
echo Launching NovaFlow Full Stack Application...
echo ====================================================
start "NovaFlow Backend" cmd /k run_backend.bat
timeout /t 3 /nobreak >nul
start "NovaFlow Frontend" cmd /k run_frontend.bat
timeout /t 3 /nobreak >nul

echo.
echo NovaFlow is launching!
echo Backend:  http://127.0.0.1:8000 (API & Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://127.0.0.1:5173
echo.
start http://127.0.0.1:5173
pause
