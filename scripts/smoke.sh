#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE} Nursery System - Smoke Tests${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Function to print test result
test_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
    else
        echo -e "${RED}✗ FAIL${NC}"
        exit 1
    fi
}

# Test 1: Backend Health
echo -n "1. Backend health check... "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
    exit 1
fi

# Test 2: Frontend Health
echo -n "2. Frontend health check... "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/health)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
    exit 1
fi

# Test 3: API Proxy (Frontend -> Backend)
echo -n "3. API proxy (/api/health)... "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/api/health)
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
    exit 1
fi

# Test 4: Governorates API
echo -n "4. Governorates API... "
gov_count=$(curl -s http://localhost:8000/admin/settings/governorates | jq -r '.governorates | length' 2>/dev/null || echo "0")
if [ "$gov_count" -ge "12" ]; then
    echo -e "${GREEN}✓ PASS${NC} ($gov_count governorates)"
else
    echo -e "${RED}✗ FAIL${NC} (expected ≥12, got $gov_count)"
    exit 1
fi

# Test 5: UTF-8 Encoding (Arabic text)
echo -n "5. UTF-8 encoding (Arabic)... "
arabic_test=$(curl -s http://localhost:8000/admin/settings/governorates | jq -r '.governorates[0].name_ar' 2>/dev/null || echo "error")
if [[ "$arabic_test" =~ [ء-ي] ]]; then
    echo -e "${GREEN}✓ PASS${NC} (Arabic: $arabic_test)"
else
    echo -e "${RED}✗ FAIL${NC} (Got: $arabic_test)"
    exit 1
fi

# Test 6: Database Connection
echo -n "6. Database connectivity... "
db_check=$(docker compose exec -T db pg_isready -U nursery_user -d nursery_db 2>&1)
if echo "$db_check" | grep -q "accepting connections"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    exit 1
fi

# Test 7: Redis Connection
echo -n "7. Redis connectivity... "
redis_check=$(docker compose exec -T redis redis-cli -a redis_password123 ping 2>/dev/null || echo "error")
if [ "$redis_check" = "PONG" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
    exit 1
fi

# Test 8: Admin User Exists
echo -n "8. Admin user seeded... "
# Try to login with admin credentials
login_response=$(curl -s -X POST http://localhost:8000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"admin@nursery.local","password":"Admin123!"}' \
    -w "%{http_code}" -o /tmp/login_response.json)

if [ "$login_response" = "200" ]; then
    access_token=$(jq -r '.access_token' /tmp/login_response.json 2>/dev/null || echo "")
    if [ -n "$access_token" ] && [ "$access_token" != "null" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Token: ${access_token:0:20}...)"
    else
        echo -e "${YELLOW}⚠ WARN${NC} (Login succeeded but no token)"
    fi
else
    echo -e "${YELLOW}⚠ WARN${NC} (HTTP $login_response - admin may not be seeded yet)"
fi

# Test 9: CORS Headers
echo -n "9. CORS headers present... "
cors_header=$(curl -s -I http://localhost:8000/health | grep -i "access-control-allow-origin" || echo "")
if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ WARN${NC} (CORS headers not found)"
fi

# Test 10: Container Health
echo -n "10. All containers healthy... "
unhealthy=$(docker compose ps --format json | jq -r 'select(.Health != "" and .Health != "healthy") | .Service' 2>/dev/null || echo "")
if [ -z "$unhealthy" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC} (Unhealthy: $unhealthy)"
    exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN} All Smoke Tests Passed! ✓${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}System is ready for development!${NC}"
echo ""
echo "Access points:"
echo "  • Frontend: http://localhost:4173"
echo "  • Backend:  http://localhost:8000"
echo "  • Adminer:  http://localhost:8080"
echo ""
echo "Admin credentials:"
echo "  • Email: admin@nursery.local"
echo "  • Password: Admin123!"
echo ""

exit 0
