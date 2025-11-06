@echo off
REM Helper script to run Rails console in Docker container
docker exec -it project_raincoat-rails-1 bundle exec rails console
