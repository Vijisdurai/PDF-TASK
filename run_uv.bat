@echo off
REM Run script using UV for Document Annotation System

echo Starting Document Annotation System with UV...
echo.

REM Check if uv is installed
where uv >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: UV is not installed!
    echo Please run: tools\scripts\setup_uv.bat
    pause
    exit /b 1
)

REM Check if .venv exists
if not exist ".venv" (
    echo Virtual environment not found. Running setup...
    call tools\scripts\setup_uv.bat
)

echo Starting backend server...
uv run python modules/main.py

pause
