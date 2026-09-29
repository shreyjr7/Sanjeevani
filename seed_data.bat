@echo off
title NovaFlow Data Seeder
echo ====================================================
echo Generating synthetic data and seeding SQLite database...
echo ====================================================
"C:\Users\shreyansh\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" data/generate_data.py
"C:\Users\shreyansh\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" backend/seed_data.py
pause
