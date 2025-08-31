Write-Host "
Resetting Docker environment for project_raincoat...

"

# Go to project root
$root = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $root

# Stop and remove containers, networks, and volumes
docker compose -f "$root\docker-compose.dev.yaml" down --volumes --remove-orphans

# Remove any stopped containers
docker compose -f "$root\docker-compose.dev.yaml" rm -fsv
docker image prune -f

Write-Host "Rebuilding images without cache..."
docker compose -f "$root\docker-compose.dev.yaml" build --no-cache

Write-Host "

Reset complete. Run:"
Write-Host "docker compose -f docker-compose.dev.yaml up --build

"
