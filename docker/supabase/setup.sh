#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Zuklo — Supabase Self-Hosted Setup ==="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if ports are available
for port in 5432 9999 3001; do
  if lsof -i :$port > /dev/null 2>&1; then
    echo "ERROR: Port $port is already in use. Stop the process using it and try again."
    exit 1
  fi
done

echo "Starting Supabase services..."
cd "$SCRIPT_DIR"
docker compose up -d

echo ""
echo "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if docker exec zuklo-db pg_isready -U postgres > /dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: PostgreSQL did not start in time."
    exit 1
  fi
  sleep 1
done

echo ""
echo "Waiting for GoTrue (Auth) to be ready..."
for i in $(seq 1 30); do
  if curl -s http://localhost:9999/health > /dev/null 2>&1; then
    echo "GoTrue is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "WARNING: GoTrue may not be ready yet. Check with: docker logs zuklo-auth"
    break
  fi
  sleep 1
done

echo ""
echo "Running database migrations..."
cd "$PROJECT_ROOT"

# Run each migration in order
for migration in supabase/migrations/*.sql; do
  echo "  Running: $(basename $migration)"
  docker exec -i zuklo-db psql -U postgres -d zuklo < "$migration" 2>/dev/null || true
done

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Services running:"
echo "  PostgreSQL:  localhost:5432  (user: postgres, pass: postgres)"
echo "  GoTrue:      http://localhost:9999"
echo "  PostgREST:   http://localhost:3001"
echo ""
echo "Supabase URL:  http://localhost:8000 (if using Kong) or use direct endpoints"
echo ""
echo "Next steps:"
echo "  1. Copy the env vars below to your .env.local"
echo "  2. Run: npm run dev"
echo ""
echo "--- Add to .env.local ---"
echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:9999"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<run: docker exec zuklo-auth wget -qO- http://localhost:9999/settings | python3 -c 'import sys,json; print(json.load(sys.stdin)["jwt_secret"])'>"
echo "SUPABASE_SERVICE_ROLE_KEY=<same as anon key for local dev>"
