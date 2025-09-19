#project_raincoat/init.sql
-- init.sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create test database
CREATE DATABASE raincoat_api_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE raincoat_api_development TO postgres;
GRANT ALL PRIVILEGES ON DATABASE raincoat_api_test TO postgres;