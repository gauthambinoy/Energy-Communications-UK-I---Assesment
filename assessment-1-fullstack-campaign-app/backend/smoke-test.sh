#!/usr/bin/env bash
# ============================================================
# Smoke Test — verifies the main user flow against a running backend.
# Run:  npm test            (or bash smoke-test.sh)
# Requires: the backend running on localhost:3001 (npm run dev)
# ============================================================

set -e

BASE="http://localhost:3001"
PASS=0
FAIL=0

# Utility: run a single test, check HTTP status code
check() {
  local label="$1" method="$2" url="$3" expected="$4" body="$5"

  if [ "$method" = "POST" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$url" \
      -H "Content-Type: application/json" -d "$body")
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  fi

  if [ "$status" = "$expected" ]; then
    echo "  ✓ $label (HTTP $status)"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $label — expected $expected, got $status"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "Running smoke tests against $BASE ..."
echo ""

# 1. Health check
check "Health check" \
  GET "$BASE/api/health" 200

# 2. List campaigns
check "List campaigns" \
  GET "$BASE/api/campaigns" 200

# 3. Get single campaign
check "Get campaign by ID" \
  GET "$BASE/api/campaigns/1" 200

# 4. Send campaign email (returns 202 Accepted)
check "Send campaign email" \
  POST "$BASE/api/campaigns/1/send" 202 \
  '{"recipientEmail":"smoke@test.com"}'

# 5. Email log persisted
check "Email log recorded" \
  GET "$BASE/api/email-logs" 200

# 6. Submit landing page form (returns 201 Created)
check "Landing page submission" \
  POST "$BASE/api/landing/summer-brand-awareness/submit" 201 \
  '{"firstName":"Smoke","lastName":"Test","email":"smoke@test.com","company":"TestCo"}'

# 7. List submissions
check "List submissions" \
  GET "$BASE/api/submissions" 200

# 8. Export submissions as CSV
check "Export CSV" \
  GET "$BASE/api/submissions/export" 200

# 9. Validation — missing email should return 400
check "Reject blank email (send)" \
  POST "$BASE/api/campaigns/1/send" 400 \
  '{"recipientEmail":""}'

# 10. Validation — missing fields should return 400
check "Reject incomplete form (submit)" \
  POST "$BASE/api/landing/summer-brand-awareness/submit" 400 \
  '{"firstName":"","lastName":"","email":"","company":""}'

echo ""
echo "Results: $PASS passed, $FAIL failed"
echo ""

# Exit with non-zero if any test failed
[ "$FAIL" -eq 0 ]
