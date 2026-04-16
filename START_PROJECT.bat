@echo off
echo ========================================
echo  GeoSpatial Site Readiness Analyzer
echo ========================================
echo.
echo Starting the project...
echo.

echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting Frontend Server...
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  Project Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul