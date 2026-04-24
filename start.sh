#!/bin/bash

# ============================================================
# ESG Sustainability Reporter - Startup Script
# ============================================================

set -e

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

BACKEND_PID=""
FRONTEND_PID=""

# --- Cleanup function ---
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null
    echo -e "${GREEN}Backend stopped.${NC}"
  fi
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null
    echo -e "${GREEN}Frontend stopped.${NC}"
  fi
  echo -e "${GREEN}Goodbye!${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# --- Helper functions ---
print_step() {
  echo -e "${CYAN}${BOLD}[$1]${NC} $2"
}

print_success() {
  echo -e "${GREEN}  ✔ $1${NC}"
}

print_warn() {
  echo -e "${YELLOW}  ⚠ $1${NC}"
}

print_error() {
  echo -e "${RED}  ✖ $1${NC}"
}

# ============================================================
# 1. ASCII Banner
# ============================================================
echo ""
echo -e "${GREEN}${BOLD}"
cat << 'BANNER'
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║   ███████╗███████╗ ██████╗                                    ║
  ║   ██╔════╝██╔════╝██╔════╝                                    ║
  ║   █████╗  ███████╗██║  ███╗                                   ║
  ║   ██╔══╝  ╚════██║██║   ██║                                   ║
  ║   ███████╗███████║╚██████╔╝                                   ║
  ║   ╚══════╝╚══════╝ ╚═════╝                                   ║
  ║                                                               ║
  ║   ███████╗██╗   ██╗███████╗████████╗ █████╗ ██╗███╗   ██╗    ║
  ║   ██╔════╝██║   ██║██╔════╝╚══██╔══╝██╔══██╗██║████╗  ██║    ║
  ║   ███████╗██║   ██║███████╗   ██║   ███████║██║██╔██╗ ██║    ║
  ║   ╚════██║██║   ██║╚════██║   ██║   ██╔══██║██║██║╚██╗██║    ║
  ║   ███████║╚██████╔╝███████║   ██║   ██║  ██║██║██║ ╚████║    ║
  ║   ╚══════╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ║
  ║                                                               ║
  ║           R E P O R T E R                                     ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"
echo -e "${BOLD}  AI-Powered ESG Sustainability Reporting Platform${NC}"
echo ""

# ============================================================
# 2. Kill processes on ports 3000 and 3001
# ============================================================
print_step "1/8" "Cleaning up ports 3000 and 3001..."

for PORT in 3000 3001; do
  PIDS=$(lsof -ti :$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    print_warn "Killed existing process(es) on port $PORT"
  else
    print_success "Port $PORT is free"
  fi
done

# ============================================================
# 3. Check PostgreSQL
# ============================================================
print_step "2/8" "Checking PostgreSQL..."

if pg_isready -q 2>/dev/null; then
  print_success "PostgreSQL is already running"
else
  print_warn "PostgreSQL is not running. Starting with brew services..."
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
    print_error "Failed to start PostgreSQL via brew. Please start it manually."
    exit 1
  }

  # Wait for PostgreSQL to be ready
  RETRIES=0
  MAX_RETRIES=30
  until pg_isready -q 2>/dev/null; do
    RETRIES=$((RETRIES + 1))
    if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
      print_error "PostgreSQL did not become ready in time. Please check your installation."
      exit 1
    fi
    sleep 1
  done
  print_success "PostgreSQL is now running"
fi

# ============================================================
# 4. Create database if it doesn't exist
# ============================================================
print_step "3/8" "Ensuring database exists..."

createdb esg_sustainability_db 2>/dev/null && print_success "Created database esg_sustainability_db" || print_success "Database esg_sustainability_db already exists"

# ============================================================
# 5. Install backend dependencies
# ============================================================
print_step "4/8" "Installing backend dependencies..."

cd "$BACKEND_DIR"
npm install --silent 2>&1 | tail -1 || {
  print_error "Backend npm install failed"
  exit 1
}
print_success "Backend dependencies installed"

# ============================================================
# 6. Install frontend dependencies
# ============================================================
print_step "5/8" "Installing frontend dependencies..."

cd "$FRONTEND_DIR"
npm install --silent 2>&1 | tail -1 || {
  print_error "Frontend npm install failed"
  exit 1
}
print_success "Frontend dependencies installed"

# ============================================================
# 7. Seed the database
# ============================================================
print_step "6/8" "Seeding the database..."

cd "$BACKEND_DIR"
if [ -f seeds/seed.js ]; then
  node seeds/seed.js || {
    print_warn "Database seeding encountered issues (may be non-fatal)"
  }
  print_success "Database seeded"
else
  print_warn "seeds/seed.js not found -- skipping database seeding"
fi

# ============================================================
# 8. Start backend
# ============================================================
print_step "7/8" "Starting backend server..."

cd "$BACKEND_DIR"
npx nodemon server.js &
BACKEND_PID=$!

# Wait for backend health check
RETRIES=0
MAX_RETRIES=60
echo -ne "  Waiting for backend health check"
until curl -sf http://localhost:3001/api/health > /dev/null 2>&1; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo ""
    print_error "Backend did not start in time. Check logs above for errors."
    cleanup
    exit 1
  fi
  echo -ne "."
  sleep 1
done
echo ""
print_success "Backend is healthy at http://localhost:3001"

# ============================================================
# 9. Start frontend
# ============================================================
print_step "8/8" "Starting frontend..."

cd "$FRONTEND_DIR"
BROWSER=none PORT=3000 npm start &
FRONTEND_PID=$!

# Give frontend a few seconds to compile
sleep 5

# ============================================================
# 10. Success banner
# ============================================================
echo ""
echo -e "${GREEN}${BOLD}"
cat << 'SUCCESS'
  ╔═══════════════════════════════════════════════════════════════╗
  ║                                                               ║
  ║           ALL SYSTEMS GO -- Ready to Report!                  ║
  ║                                                               ║
  ╚═══════════════════════════════════════════════════════════════╝
SUCCESS
echo -e "${NC}"
echo -e "  ${GREEN}${BOLD}Frontend:${NC}    http://localhost:3000"
echo -e "  ${GREEN}${BOLD}Backend:${NC}     http://localhost:3001"
echo ""
echo -e "  ${YELLOW}${BOLD}Demo Credentials:${NC}"
echo -e "  ${CYAN}Email:${NC}       admin@esgreporter.com"
echo -e "  ${CYAN}Password:${NC}    password123"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo ""

# ============================================================
# Wait for background processes
# ============================================================
wait
