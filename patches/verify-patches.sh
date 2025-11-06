#!/bin/bash

# Admin Accessibility Patches Verification Script
# Run this after applying all patches to verify implementation

set -e

echo "========================================="
echo "Admin Accessibility Verification"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0

# Function to check result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

echo -e "${BLUE}1. Checking if patches exist...${NC}"
if [ -f "patches/patch-admin-dashboard-a11y.diff" ] && \
   [ -f "patches/patch-admin-users-a11y.diff" ] && \
   [ -f "patches/patch-admin-notifications-a11y.diff" ] && \
   [ -f "patches/patch-admin-auditlogs-a11y.diff" ] && \
   [ -f "patches/patch-admin-settings-a11y.diff" ] && \
   [ -f "patches/patch-shared-components-a11y.diff" ]; then
    echo -e "${GREEN}✓ All 6 patches found${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Missing patch files${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}2. Checking foundation components...${NC}"
if [ -f "nursery-system/frontend/src/components/ErrorAlert.jsx" ] && \
   [ -f "nursery-system/frontend/src/components/LoadingAnnouncer.jsx" ]; then
    echo -e "${GREEN}✓ Foundation components exist${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Missing foundation components${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}3. Checking global focus styles...${NC}"
if grep -q "focus-visible" "nursery-system/frontend/src/index.css"; then
    echo -e "${GREEN}✓ Focus styles implemented${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Focus styles missing${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}4. Checking skip link in layout...${NC}"
if grep -q "skip" "nursery-system/frontend/src/layouts/DashboardLayout.jsx"; then
    echo -e "${GREEN}✓ Skip link implemented${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Skip link missing${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}5. Running linter...${NC}"
cd nursery-system/frontend
npm run lint > /dev/null 2>&1
check_result
cd ../..
echo ""

echo -e "${BLUE}6. Running tests...${NC}"
cd nursery-system/frontend
npm test -- --passWithNoTests > /dev/null 2>&1
check_result
cd ../..
echo ""

echo -e "${BLUE}7. Checking for ARIA attributes...${NC}"
ARIA_COUNT=$(grep -r "aria-" nursery-system/frontend/src/pages/admin/*.jsx | wc -l)
if [ "$ARIA_COUNT" -gt 100 ]; then
    echo -e "${GREEN}✓ ARIA attributes found ($ARIA_COUNT occurrences)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Limited ARIA attributes ($ARIA_COUNT occurrences)${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}8. Checking for role attributes...${NC}"
ROLE_COUNT=$(grep -r 'role=' nursery-system/frontend/src/pages/admin/*.jsx | wc -l)
if [ "$ROLE_COUNT" -gt 20 ]; then
    echo -e "${GREEN}✓ Role attributes found ($ROLE_COUNT occurrences)${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Limited role attributes ($ROLE_COUNT occurrences)${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}9. Checking for semantic landmarks...${NC}"
MAIN_COUNT=$(grep -r '<main' nursery-system/frontend/src/pages/admin/*.jsx | wc -l)
if [ "$MAIN_COUNT" -ge 5 ]; then
    echo -e "${GREEN}✓ Main landmarks found ($MAIN_COUNT pages)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Missing main landmarks ($MAIN_COUNT pages)${NC}"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}10. Checking for proper headings...${NC}"
H1_COUNT=$(grep -r '<h1' nursery-system/frontend/src/pages/admin/*.jsx | wc -l)
if [ "$H1_COUNT" -ge 5 ]; then
    echo -e "${GREEN}✓ H1 headings found ($H1_COUNT pages)${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Missing H1 headings ($H1_COUNT pages)${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo "========================================="
echo -e "${BLUE}Verification Summary${NC}"
echo "========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Manual keyboard testing (Tab through pages)"
    echo "2. Screen reader testing (NVDA/JAWS)"
    echo "3. Visual inspection (focus indicators)"
    echo "4. Run: make a11y"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please review:"
    echo "1. PATCH_APPLICATION_GUIDE.md"
    echo "2. ADMIN_AUDIT_REMEDIATION_PLAN.md"
    echo "3. Run: make a11y"
    echo ""
    exit 1
fi
