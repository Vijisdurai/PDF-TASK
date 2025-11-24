@echo off
echo Starting Backend and Frontend in Windows Terminal...

REM Check if Windows Terminal is available
where wt >nul 2>nul


REM Start Windows Terminal with two tabs
wt -w 0 new-tab --title "Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn main:app --reload" ; new-tab --title "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Servers started in Windows Terminal
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
