#!/bin/bash
# Nursery Management System - Local Network Server
# Run this script to start the application for all users on your network

echo "============================================================"
echo "  Nursery Management System - Local Network Server"
echo "============================================================"
echo ""

# Get local IP address
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
else
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

echo "Your Local IP Address: $LOCAL_IP"
echo ""
echo "Users can access the application at:"
echo "   http://$LOCAL_IP:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "============================================================"
echo ""

# Navigate to backend
cd nursery-system/backend

# Copy local environment if exists
if [ -f .env.local ]; then
    cp .env.local .env
    echo "[OK] Backend configured for local network"
else
    echo "[WARNING] .env.local not found, using default .env"
fi

# Activate virtual environment
source venv/bin/activate

# Start backend in background
echo "[INFO] Starting Backend Server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "[OK] Backend running (PID: $BACKEND_PID)"
echo ""

# Navigate to frontend
cd ../frontend

# Copy local environment if exists
if [ -f .env.local ]; then
    cp .env.local .env
    echo "[OK] Frontend configured for local network"
else
    echo "[WARNING] .env.local not found, using default .env"
fi

# Wait for backend to start
sleep 3

# Start frontend in background
echo "[INFO] Starting Frontend Server..."
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
echo "[OK] Frontend running (PID: $FRONTEND_PID)"
echo ""

# Wait for frontend to start
sleep 3

echo "============================================================"
echo "  APPLICATION IS NOW RUNNING!"
echo "============================================================"
echo ""
echo "Access from this computer:"
echo "   http://localhost:5173"
echo "   http://127.0.0.1:5173"
echo ""
echo "Access from other devices on your network:"
echo "   http://$LOCAL_IP:5173"
echo ""
echo "Backend API:"
echo "   http://$LOCAL_IP:8000"
echo "   http://$LOCAL_IP:8000/docs"
echo ""
echo "Default Login:"
echo "   Email: admin@nursery.com"
echo "   Password: Admin123!"
echo ""
echo "============================================================"
echo ""
echo "Server is running. Press Ctrl+C to stop..."
echo ""

# Wait for user interrupt
wait
