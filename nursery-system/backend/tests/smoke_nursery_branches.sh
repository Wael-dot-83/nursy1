#!/bin/bash
# Smoke test for nursery creation with branches

set -e

API_URL="${API_URL:-http://localhost:8000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@nursery.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"

echo "🔥 Nursery Branches Smoke Test"
echo "================================"
echo ""

# Step 1: Login as admin
echo "📝 Step 1: Login as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Get governorates
echo "📝 Step 2: Fetch governorates..."
GOV_RESPONSE=$(curl -s -X GET "$API_URL/admin/settings/governorates" \
  -H "Authorization: Bearer $TOKEN")

GOV_COUNT=$(echo $GOV_RESPONSE | jq '.governorates | length')
echo "✅ Found $GOV_COUNT governorates"
echo ""

# Step 3: Create nursery with 2 branches
echo "📝 Step 3: Create nursery with 2 branches..."
NURSERY_RESPONSE=$(curl -s -X POST "$API_URL/admin/nurseries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smoke Test Nursery",
    "mainPhone": "0791111111",
    "email": "smoke@test.com",
    "governorateId": 1,
    "city": "Amman",
    "minAgeDays": 70,
    "maxAgeMonths": 52,
    "hasBranches": true,
    "numberOfBranches": 2,
    "branches": [
      {"name": "فرع الاختبار 1", "phone": "0792222222"},
      {"name": "فرع الاختبار 2", "phone": "0793333333"}
    ],
    "branchManagersEnabled": true
  }')

NURSERY_ID=$(echo $NURSERY_RESPONSE | jq -r '.nursery.id')
MANAGER_COUNT=$(echo $NURSERY_RESPONSE | jq '.managers | length')

if [ "$NURSERY_ID" == "null" ] || [ -z "$NURSERY_ID" ]; then
  echo "❌ Nursery creation failed"
  echo $NURSERY_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Nursery created with ID: $NURSERY_ID"
echo "✅ Created $MANAGER_COUNT manager accounts"
echo ""

# Step 4: Verify managers in users list
echo "📝 Step 4: Verify managers appear in /admin/users..."
sleep 1  # Give DB a moment to commit

USERS_RESPONSE=$(curl -s -X GET "$API_URL/admin/users" \
  -H "Authorization: Bearer $TOKEN")

MANAGER_EMAILS=$(echo $NURSERY_RESPONSE | jq -r '.managers[].email')
FOUND_COUNT=0

for EMAIL in $MANAGER_EMAILS; do
  if echo $USERS_RESPONSE | jq -e ".data[] | select(.email == \"$EMAIL\")" > /dev/null; then
    echo "✅ Found manager: $EMAIL"
    FOUND_COUNT=$((FOUND_COUNT + 1))
  else
    echo "❌ Manager not found: $EMAIL"
  fi
done

if [ $FOUND_COUNT -eq $MANAGER_COUNT ]; then
  echo "✅ All managers visible in users list"
else
  echo "❌ Only $FOUND_COUNT/$MANAGER_COUNT managers found"
  exit 1
fi

echo ""

# Step 5: Verify branches created
echo "📝 Step 5: Verify branches created..."
NURSERY_DETAIL=$(curl -s -X GET "$API_URL/admin/nurseries/$NURSERY_ID" \
  -H "Authorization: Bearer $TOKEN")

BRANCH_COUNT=$(echo $NURSERY_DETAIL | jq '.branches | length')

if [ "$BRANCH_COUNT" == "2" ]; then
  echo "✅ Exactly 2 branches created"
else
  echo "❌ Expected 2 branches, found $BRANCH_COUNT"
  exit 1
fi

echo ""
echo "================================"
echo "🎉 All smoke tests passed!"
echo "================================"
