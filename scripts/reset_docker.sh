#!/usr/bin/env bash
set -e

echo "
Resetting Docker environment for project_raincoat...

"

# Go to project root
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

# Stop and remove containers, networks, and volumes
docker compose -f "$ROOT_DIR/docker-compose.dev.yaml" down --volumes --remove-orphans

# Remove any stopped containers
docker compose -f "$ROOT_DIR/docker-compose.dev.yaml" rm -fsv
docker image prune -f

echo "Rebuilding images without cache..."
docker compose -f "$ROOT_DIR/docker-compose.dev.yaml" build --no-cache

echo "Reset complete. Run:
"
echo "docker compose -f docker-compose.dev.yaml up --build

"
