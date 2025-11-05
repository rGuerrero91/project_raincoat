#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
bundle install

# Precompile assets (if needed)
# bundle exec rake assets:precompile
# bundle exec rake assets:clean

# Run database migrations for all databases (primary, cache, queue, cable)
bundle exec rails db:prepare

# Enable pgvector extension
bundle exec rails runner "ActiveRecord::Base.connection.execute('CREATE EXTENSION IF NOT EXISTS vector')"

# Optionally seed the database
# bundle exec rake db:seed
