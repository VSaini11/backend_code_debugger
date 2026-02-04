@echo off
echo ========================================
echo Backend Debugging Assistant Setup
echo ========================================
echo.

REM Check if .env exists
if not exist backend\.env (
    echo [ERROR] backend\.env file not found!
    echo.
    echo Please create backend\.env file with your Gemini API key:
    echo   1. Copy backend\.env.example to backend\.env
    echo   2. Add your Gemini API key to GEMINI_API_KEY
    echo.
    echo Get your API key from: https://makersuite.google.com/app/apikey
    echo.
    pause
    exit /b 1
)

echo [1/3] Activating Python virtual environment...
call backend\venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    echo Please run: cd backend ^&^& python -m venv venv
    pause
    exit /b 1
)

echo [2/3] Starting FastAPI backend on port 8000...
start "FastAPI Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak > nul

echo [3/3] Starting Next.js frontend on port 3000...
start "Next.js Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000/docs
echo.
echo Press any key to exit this window...
pause > nul
