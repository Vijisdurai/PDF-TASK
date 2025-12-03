@echo off
REM Setup script for UV Python package manager on Windows

echo ========================================
echo UV Setup for Document Annotation System
echo ========================================
echo.

REM Check if uv is installed
where uv >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo UV is not installed. Installing UV...
    echo.
    echo Please install UV using one of these methods:
    echo 1. PowerShell: irm https://astral.sh/uv/install.ps1 ^| iex
    echo 2. pip: pip install uv
    echo 3. Scoop: scoop install uv
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo UV is installed!
echo.

REM Check Python version
echo Checking Python version...
uv python list
echo.

REM Install Python 3.11 if needed
echo Installing/verifying Python 3.11...
uv python install 3.11
echo.

REM Create virtual environment and install dependencies
echo Creating virtual environment and installing dependencies...
uv sync
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To activate the virtual environment:
echo   .venv\Scripts\activate
echo.
echo To run the backend server:
echo   uv run python modules/main.py
echo.
echo To run tests:
echo   uv run pytest
echo.
pause
