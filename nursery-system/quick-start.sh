#!/bin/bash
# Nursery Management System - Quick Start Script for Unix/Linux/macOS
# This script sets up and runs the system in development mode

set -e  # Exit on error

echo "🚀 Nursery Management System - Quick Start"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0.32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Python 3 not found. Please install Python 3.11 or higher.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Backend setup
echo -e "${BLUE}Setting up backend...${NC}"

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration${NC}"
fi

# Initialize database
if [ ! -f "nursery.db" ]; then
    echo "Initializing database..."
    python seed_db.py
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Frontend setup
echo -e "${BLUE}Setting up frontend...${NC}"

cd ../frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install --silent
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "VITE_API_URL=http://localhost:8000" > .env
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"
echo ""

# Start services
echo -e "${BLUE}Starting services...${NC}"
echo ""

# Start backend in background
echo "Starting backend server..."
cd ../backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend running on http://localhost:8000${NC}"
echo "  API Docs: http://localhost:8000/docs"
echo ""

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend development server..."
cd ../frontend
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend running on http://localhost:5173${NC}"
echo ""

# Display info
echo "=========================================="
echo -e "${GREEN}🎉 System is now running!${NC}"
echo "=========================================="
echo ""
echo "📱 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "👤 Default credentials:"
echo "   Email: admin@nursery.com"
echo "   Password: Admin123!"
echo ""
echo "To stop the services, press Ctrl+C"
echo ""

# Wait for user interrupt
wait
