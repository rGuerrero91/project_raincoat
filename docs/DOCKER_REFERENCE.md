# Docker Reference Guide - Project Raincoat

Quick reference for common Docker commands used in this project.

## Container Management

### Start/Stop Containers

```bash
# Start all containers (db, redis, rails)
docker-compose up -d

# Start specific container
docker-compose up -d rails
docker-compose up -d db

# Stop all containers
docker-compose down

# Stop without removing containers
docker-compose stop

# Restart a specific container
docker restart project_raincoat-rails-1
docker restart project_raincoat-db-1
docker restart project_raincoat-redis-1

# View running containers
docker ps

# View all containers (including stopped)
docker ps -a
```

### Container Logs

```bash
# View Rails logs (real-time)
docker logs -f project_raincoat-rails-1

# View last 50 lines
docker logs --tail 50 project_raincoat-rails-1

# View database logs
docker logs -f project_raincoat-db-1

# View Redis logs
docker logs -f project_raincoat-redis-1
```

## Database Commands

### Migrations

```bash
# Run pending migrations
docker exec project_raincoat-rails-1 bundle exec rails db:migrate

# Rollback last migration
docker exec project_raincoat-rails-1 bundle exec rails db:rollback

# Rollback multiple migrations
docker exec project_raincoat-rails-1 bundle exec rails db:rollback STEP=3

# Check migration status
docker exec project_raincoat-rails-1 bundle exec rails db:migrate:status

# Reset database (drop, create, migrate, seed)
docker exec project_raincoat-rails-1 bundle exec rails db:reset

# Drop and recreate database
docker exec project_raincoat-rails-1 bundle exec rails db:drop db:create db:migrate
```

### Seeding

```bash
# Run seeds
docker exec project_raincoat-rails-1 bundle exec rails db:seed

# Reset and seed
docker exec project_raincoat-rails-1 bundle exec rails db:reset
```

### Direct Database Access

```bash
# Open PostgreSQL console
docker exec -it project_raincoat-db-1 psql -U postgres -d raincoat_api_development

# Run SQL query directly
docker exec project_raincoat-db-1 psql -U postgres -d raincoat_api_development -c "SELECT COUNT(*) FROM users;"

# Dump database to file
docker exec project_raincoat-db-1 pg_dump -U postgres raincoat_api_development > backup.sql

# Restore database from file
cat backup.sql | docker exec -i project_raincoat-db-1 psql -U postgres raincoat_api_development
```

## Rails Console

```bash
# Open Rails console in Docker (use this to access Docker database)
docker exec -it project_raincoat-rails-1 bundle exec rails console

# Or use the helper script (Windows)
bin\docker-console.bat

# Run a single Ruby command
docker exec project_raincoat-rails-1 bundle exec rails runner "puts User.count"
```

## Rake Tasks

```bash
# List all rake tasks
docker exec project_raincoat-rails-1 bundle exec rails -T

# Run custom embedding tasks
docker exec project_raincoat-rails-1 bundle exec rails embeddings:generate_from_images
docker exec project_raincoat-rails-1 bundle exec rails embeddings:load

# Run specific rake task
docker exec project_raincoat-rails-1 bundle exec rails your_namespace:your_task
```

## Troubleshooting

### Stale PID File

```bash
# If Rails won't start due to "server already running"
# Remove stale PID file from local filesystem
cd raincoat_api
rm -f tmp/pids/server.pid

# Then restart container
docker restart project_raincoat-rails-1
```

### View Container Details

```bash
# Inspect container configuration
docker inspect project_raincoat-rails-1

# View container resource usage
docker stats

# View container processes
docker exec project_raincoat-rails-1 ps aux
```

### Access Container Shell

```bash
# Open bash shell in Rails container
docker exec -it project_raincoat-rails-1 bash

# Open bash shell in database container
docker exec -it project_raincoat-db-1 bash
```

### Clean Up

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes (BE CAREFUL - this deletes data!)
docker volume prune

# Nuclear option - remove everything (BE VERY CAREFUL!)
docker system prune -a --volumes
```

## Development Workflow

### Typical Development Session

```bash
# 1. Start containers
docker-compose up -d

# 2. Check they're running
docker ps

# 3. Run any new migrations
docker exec project_raincoat-rails-1 bundle exec rails db:migrate

# 4. View Rails logs
docker logs -f project_raincoat-rails-1

# 5. Open Rails console if needed
docker exec -it project_raincoat-rails-1 bundle exec rails console

# 6. When done, stop containers
docker-compose stop
```

### After Pulling Code Changes

```bash
# 1. Rebuild Rails container (if Dockerfile or Gemfile changed)
docker-compose build rails

# 2. Restart containers
docker-compose up -d

# 3. Run migrations
docker exec project_raincoat-rails-1 bundle exec rails db:migrate

# 4. Check status
docker ps
docker logs --tail 20 project_raincoat-rails-1
```

### Database Sync Issues

If your local Rails console shows different data than Docker:

```bash
# Option 1: Always use Docker console
docker exec -it project_raincoat-rails-1 bundle exec rails console

# Option 2: Verify which database you're connected to
# In local Rails console, run:
ActiveRecord::Base.connection_db_config.configuration_hash
# Should show host: "localhost", database: "raincoat_api_development"
```

## Environment Variables

### View Container Environment

```bash
# View all environment variables in Rails container
docker exec project_raincoat-rails-1 env

# View specific variable
docker exec project_raincoat-rails-1 env | grep DATABASE
```

## Port Mappings

- Rails API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Common Errors & Solutions

### Error: "no configuration file provided: not found"

**Solution**: You're running `docker-compose` from the wrong directory or the compose file is named differently. Make sure you're in the directory with your Docker Compose file.

### Error: "port is already allocated"

**Solution**: Another service is using that port. Find and stop it:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Error: "A server is already running"

**Solution**: Stale PID file. Remove it and restart:
```bash
cd raincoat_api
rm -f tmp/pids/server.pid
docker restart project_raincoat-rails-1
```

### Error: "PG::ConnectionBad"

**Solution**: Database container isn't ready. Wait a moment and check:
```bash
docker ps
docker logs project_raincoat-db-1

# Restart database container
docker restart project_raincoat-db-1

# Wait for it to be healthy, then restart Rails
docker restart project_raincoat-rails-1
```

## Quick Tips

1. **Always use Docker commands for Docker database** - Don't mix local Rails console with Docker database
2. **Check logs first** - Most issues show up in `docker logs`
3. **Container names** - Your containers are named:
   - `project_raincoat-rails-1`
   - `project_raincoat-db-1`
   - `project_raincoat-redis-1`
4. **Migrations in Docker** - Always run migrations in the Docker container, not locally
5. **Seeds in Docker** - Run `db:seed` in Docker to populate the Docker database

## Useful Aliases (Optional)

Add these to your shell profile for quicker access:

```bash
# Windows PowerShell ($PROFILE)
function drails { docker exec -it project_raincoat-rails-1 bundle exec rails $args }
function dconsole { docker exec -it project_raincoat-rails-1 bundle exec rails console }
function dlogs { docker logs -f project_raincoat-rails-1 }
function dps { docker ps }

# Then use like:
# drails db:migrate
# dconsole
# dlogs
```

## Database Backup & Restore

### Backup

```bash
# Full database backup
docker exec project_raincoat-db-1 pg_dump -U postgres -d raincoat_api_development -F c -f /tmp/backup.dump

# Copy backup to host
docker cp project_raincoat-db-1:/tmp/backup.dump ./db/backups/backup_$(date +%Y%m%d).dump
```

### Restore

```bash
# Copy backup to container
docker cp ./db/backups/backup.dump project_raincoat-db-1:/tmp/backup.dump

# Restore database
docker exec project_raincoat-rails-1 bundle exec rails db:drop db:create
docker exec project_raincoat-db-1 pg_restore -U postgres -d raincoat_api_development /tmp/backup.dump
```

## Performance Monitoring

```bash
# View resource usage
docker stats

# View container processes
docker exec project_raincoat-rails-1 top

# Check database connections
docker exec project_raincoat-db-1 psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

---

For more information, see:
- [Docker Documentation](https://docs.docker.com/)
- [Rails Guide - Using PostgreSQL](https://guides.rubyonrails.org/configuring.html#configuring-a-postgresql-database)
