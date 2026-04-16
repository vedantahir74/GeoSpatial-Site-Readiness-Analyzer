#!/bin/bash

echo "========================================"
echo " GeoSpatial Site Readiness Analyzer"
echo "========================================"
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

echo "Setting up backend..."
cd backend

if [ ! -f "requirements.txt" ]; then
    echo "ERROR: requirements.txt not found in backend directory"
    exit 1
fi

echo "Installing Python dependencies..."
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Python dependencies"
    exit 1
fi

echo
echo "Setting up frontend..."
cd ../frontend

if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found in frontend directory"
    exit 1
fi

echo "Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Node.js dependencies"
    exit 1
fi

echo
echo "========================================"
echo " Setup Complete! Starting Services..."
echo "========================================"
echo

# Start backend in background
echo "Starting backend server..."
echo "Backend will be available at: http://localhost:8000"
cd ../backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server..."
echo "Frontend will be available at: http://localhost:3000"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo
echo "========================================"
echo " Both servers are starting..."
echo "========================================"
echo
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo
echo "Wait a moment for both servers to fully start,"
echo "then open http://localhost:3000 in your browser."
echo
echo "Press Ctrl+C to stop both servers."

# Function to cleanup on exit
cleanup() {
    echo
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for user to stop
wait