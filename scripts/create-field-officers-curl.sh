#!/usr/bin/env bash
# Create three field officers (Ronaldo, Messi, Neymar) on backend running at 8080.
# Requires a tenant to exist. Usage:
#   TENANT_EMAIL=admin@example.com TENANT_PASSWORD=secret ./scripts/create-field-officers-curl.sh
#   Or: ./scripts/create-field-officers-curl.sh admin@example.com secret

set -e
BASE="${BASE_URL:-http://localhost:8080}"
TENANT_EMAIL="${TENANT_EMAIL:-$1}"
TENANT_PASSWORD="${TENANT_PASSWORD:-$2}"

if [ -z "$TENANT_EMAIL" ] || [ -z "$TENANT_PASSWORD" ]; then
  echo "Usage: TENANT_EMAIL=... TENANT_PASSWORD=... $0"
  echo "   Or: $0 <tenant_email> <tenant_password>"
  echo "Example: TENANT_EMAIL=exampletenant@gmail.com TENANT_PASSWORD=abcd1234 $0"
  echo "First register a tenant: curl -s -X POST $BASE/api/auth/register -H 'Content-Type: application/json' -d '{\"name\":\"Example Tenant\",\"email\":\"exampletenant@gmail.com\",\"password\":\"abcd1234\"}'"
  exit 1
fi

# Login as tenant and get token
RESP=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TENANT_EMAIL\",\"password\":\"$TENANT_PASSWORD\"}")
TOKEN=$(echo "$RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -z "$TOKEN" ]; then
  echo "Login failed. Response: $RESP"
  exit 1
fi

echo "Logged in as tenant. Creating field officers..."

# Create Ronaldo
curl -s -X POST "$BASE/api/auth/field-officers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"ronaldo@khetibuddy.local","password":"field123"}' && echo " -> Ronaldo created"

# Create Messi
curl -s -X POST "$BASE/api/auth/field-officers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"messi@khetibuddy.local","password":"field123"}' && echo " -> Messi created"

# Create Neymar
curl -s -X POST "$BASE/api/auth/field-officers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"neymar@khetibuddy.local","password":"field123"}' && echo " -> Neymar created"

echo "Done. Field officers: ronaldo@khetibuddy.local, messi@khetibuddy.local, neymar@khetibuddy.local (password: field123)"
