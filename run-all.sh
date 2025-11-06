#!/bin/bash

# ========================================
#   Nursery Management System
#   Complete System Runner (Bash)
# ========================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8002
FRONTEND_PORT=5174
BACKEND_DIR="nursery-system/backend"
FRONTEND_DIR="nursery-system/frontend"
DATABASE_FILE="nursery-system/backend/nursery.db"

# PID files to track running processes
BACKEND_PID_FILE="/tmp/nursery_backend.pid"
FRONTEND_PID_FILE="/tmp/nursery_frontend.pid"

# ========================================
# Helper Functions
# ========================================

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -an 2>/dev/null | grep ":$port " | grep -q LISTEN; then
        return 0
    else
        return 1
    fi
}

# Kill process on port
kill_port() {
    local port=$1
    print_warning "Killing process on port $port..."
    
    # Try lsof first (Linux/Mac)
    if command -v lsof &> /dev/null; then
        local pid=$(lsof -ti:$port)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null
            sleep 1
        fi
    fi
    
    # Try fuser (Linux)
    if command -v fuser &> /dev/null; then
        fuser -k $port/tcp 2>/dev/null
        sleep 1
    fi
    
    # Try netstat/taskkill (Windows Git Bash)
    if command -v netstat &> /dev/null && command -v taskkill &> /dev/null; then
        local pid=$(netstat -ano | grep ":$port " | grep LISTENING | awk '{print $5}' | head -1)
        if [ ! -z "$pid" ]; then
            taskkill //PID $pid //F 2>/dev/null
            sleep 1
        fi
    fi
}

# Cleanup function
cleanup() {
    echo ""
    print_header "Shutting Down System"
    
    # Kill backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        print_info "Stopping backend (PID: $backend_pid)..."
        kill $backend_pid 2>/dev/null
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # Kill frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        print_info "Stopping frontend (PID: $frontend_pid)..."
        kill $frontend_pid 2>/dev/null
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # Kill any remaining processes on ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    
    print_success "System stopped successfully"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# ========================================
# Pre-flight Checks
# ========================================

print_header "System Pre-flight Checks"

# Check if we're in the right directory
if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Required directories not found!"
    print_info "Please run this script from: d:\\nursy"
    exit 1
fi

print_success "Directory structure verified"

# Check Python
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    print_error "Python is not installed!"
    exit 1
fi

PYTHON_CMD=$(command -v python3 2>/dev/null || command -v python)
print_success "Python found: $PYTHON_CMD"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    exit 1
fi

print_success "Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi

print_success "npm found: $(npm --version)"

# Check if ports are available
if check_port $BACKEND_PORT; then
    print_warning "Port $BACKEND_PORT is already in use"
    read -p "Kill process and continue? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port $BACKEND_PORT
    else
        print_error "Cannot start backend - port $BACKEND_PORT is in use"
        exit 1
    fi
fi

if check_port $FRONTEND_PORT; then
    print_warning "Port $FRONTEND_PORT is already in use"
    read -p "Kill process and continue? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port $FRONTEND_PORT
    else
        print_error "Cannot start frontend - port $FRONTEND_PORT is in use"
        exit 1
    fi
fi

# ========================================
# Backend Setup
# ========================================

print_header "Setting Up Backend"

cd "$BACKEND_DIR" || exit 1

# Check for virtual environment
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found. Creating..."
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        print_error "Failed to create virtual environment"
        exit 1
    fi
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    print_error "Cannot find virtual environment activation script"
    exit 1
fi

print_success "Virtual environment activated"

# Install dependencies if needed
if [ ! -f "venv/.deps_installed" ]; then
    print_info "Installing backend dependencies..."
    pip install -r requirements.txt --quiet
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    touch venv/.deps_installed
    print_success "Dependencies installed"
else
    print_info "Dependencies already installed"
fi

# Check database
if [ ! -f "nursery.db" ]; then
    print_warning "Database not found. Seeding database..."
    $PYTHON_CMD seed_db.py
    if [ $? -ne 0 ]; then
        print_error "Failed to seed database"
        exit 1
    fi
    print_success "Database seeded successfully"
else
    print_success "Database found: nursery.db"
fi

# ========================================
# Frontend Setup
# ========================================

cd "$(dirname "$0")" # Return to root
cd "$FRONTEND_DIR" || exit 1

print_header "Setting Up Frontend"

# Install node modules if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install --silent
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_success "Dependencies installed"
else
    print_info "Dependencies already installed"
fi

# ========================================
# Start Services
# ========================================

cd "$(dirname "$0")" # Return to root

print_header "Starting Services"

# Start Backend
print_info "Starting backend server on port $BACKEND_PORT..."
cd "$BACKEND_DIR"

# Start backend in background
$PYTHON_CMD run.py > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$BACKEND_PID_FILE"

# Wait for backend to start
sleep 3

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    print_error "Backend failed to start. Check logs/backend.log"
    exit 1
fi

print_success "Backend started (PID: $BACKEND_PID)"
print_info "Backend API: http://localhost:$BACKEND_PORT"
print_info "API Docs: http://localhost:$BACKEND_PORT/docs"

# Start Frontend
cd "$(dirname "$0")" # Return to root
cd "$FRONTEND_DIR"

print_info "Starting frontend server on port $FRONTEND_PORT..."

# Start frontend in background
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$FRONTEND_PID_FILE"

# Wait for frontend to start
sleep 5

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
    print_error "Frontend failed to start. Check logs/frontend.log"
    cleanup
    exit 1
fi

print_success "Frontend started (PID: $FRONTEND_PID)"
print_info "Frontend URL: http://localhost:$FRONTEND_PORT"

# ========================================
# System Ready
# ========================================

cd "$(dirname "$0")" # Return to root

print_header "System Ready! 🎉"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Nursery Management System - RUNNING${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}🌐 Frontend:${NC}  http://localhost:$FRONTEND_PORT"
echo -e "${CYAN}🔧 Backend:${NC}   http://localhost:$BACKEND_PORT"
echo -e "${CYAN}📚 API Docs:${NC}  http://localhost:$BACKEND_PORT/docs"
echo ""
echo -e "${YELLOW}👥 Test Accounts:${NC}"
echo -e "   ${BLUE}Admin:${NC}      admin@nursery.com / Admin123!"
echo -e "   ${BLUE}Manager:${NC}    manager@nursery.com / Manager123!"
echo -e "   ${BLUE}Supervisor:${NC} supervisor@nursery.com / Supervisor123!"
echo -e "   ${BLUE}Parent:${NC}     parent@nursery.com / Parent123!"
echo ""
echo -e "${CYAN}📁 Logs:${NC}"
echo -e "   Backend:  logs/backend.log"
echo -e "   Frontend: logs/frontend.log"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_warning "Press Ctrl+C to stop all services"
echo ""

# Monitor processes
while true; do
    sleep 5
    
    # Check backend
    if ! ps -p $BACKEND_PID > /dev/null; then
        print_error "Backend process died!"
        print_info "Check logs/backend.log for details"
        cleanup
        exit 1
    fi
    
    # Check frontend
    if ! ps -p $FRONTEND_PID > /dev/null; then
        print_error "Frontend process died!"
        print_info "Check logs/frontend.log for details"
        cleanup
        exit 1
    fi
done
