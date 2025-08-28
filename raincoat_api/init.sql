-- init.sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create test database
CREATE DATABASE raincoat_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE raincoat_development TO postgres;
GRANT ALL PRIVILEGES ON DATABASE raincoat_test TO postgres;