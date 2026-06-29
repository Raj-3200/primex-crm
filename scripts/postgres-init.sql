-- PrimeX Services CRM — PostgreSQL Init Script
-- This runs automatically when the Docker container first starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for full-text search performance
-- These will be applied after Alembic creates the tables

-- Ensure timezone is set
SET timezone = 'Asia/Kolkata';
