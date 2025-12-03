@echo off
echo ========================================
echo AATRAL Document Annotation System
echo ========================================
echo.

echo Starting Backend (FastAPI)...
start "Backend Server" cmd /k "cd modules && python main.py"

timeout /t 3 /nobreak > nul

echo Starting Frontend (React + Vite)...
start "Frontend Server" cmd /k "cd apps\web && npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Press any key to stop all servers...
pause > nul

taskkill /FI "WindowTitle eq Backend Server*" /T /F
taskkill /FI "WindowTitle eq Frontend Server*" /T /F
