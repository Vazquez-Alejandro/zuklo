#!/bin/bash
# Generate Supabase JWT keys for local development
# Run this after starting Docker: bash docker/supabase/generate-keys.sh

JWT_SECRET="${JWT_SECRET:-super-secret-jwt-token-with-at-least-32-characters-long}"

echo "=== Supabase JWT Keys ==="
echo ""
echo "JWT_SECRET: $JWT_SECRET"
echo ""

# Generate anon key
ANON_PAYLOAD=$(echo -n '{"role":"anon","iss":"supabase","iat":1700000000,"exp":1800000000}' | base64 -w 0 2>/dev/null || echo -n '{"role":"anon","iss":"supabase","iat":1700000000,"exp":1800000000}' | base64)
ANON_HEADER=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 -w 0 2>/dev/null || echo -n '{"alg":"HS256","typ":"JWT"}' | base64)

# Use node for proper JWT generation
ANON_KEY=$(node -e "
const crypto = require('crypto');
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload = Buffer.from(JSON.stringify({role:'anon',iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+9999999})).toString('base64url');
const signature = crypto.createHmac('sha256','${JWT_SECRET}').update(header+'.'+payload).digest('base64url');
console.log(header+'.'+payload+'.'+signature);
")

SERVICE_ROLE_KEY=$(node -e "
const crypto = require('crypto');
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload = Buffer.from(JSON.stringify({role:'service_role',iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+9999999})).toString('base64url');
const signature = crypto.createHmac('sha256','${JWT_SECRET}').update(header+'.'+payload).digest('base64url');
console.log(header+'.'+payload+'.'+signature);
")

echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
echo ""
echo "Copy these to your .env.local"
