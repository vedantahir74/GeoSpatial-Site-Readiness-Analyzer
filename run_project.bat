@echo off
echo ========================================
echo  GeoSpatial Site Readiness Analyzer
echo ========================================
echo.

echo Checking if Python is installed...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)

echo.
echo Setting up backend...
cd backend
if not exist "requirements.txt" (
    echo ERROR: requirements.txt not found in backend directory
    pause
    exit /b 1
)

echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo Setting up frontend...
cd ..\frontend
if not exist "package.json" (
    echo ERROR: package.json not found in frontend directory
    pause
    exit /b 1
)

echo Installing Node.js dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Setup Complete! Starting Services...
echo ========================================
echo.
echo Starting backend server...
echo Backend will be available at: http://localhost:8000
echo.

cd ..\backend
start "Backend Server" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
echo Frontend will be available at: http://localhost:3000
echo.

cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo  Both servers are starting...
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Wait a moment for both servers to fully start,
echo then open http://localhost:3000 in your browser.
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:3000

echo.
echo Application opened in browser!
echo Keep both terminal windows open to keep the servers running.
echo Close this window when you're done using the application.
echo.
pause