-- Automator67 Database Schema
-- PostgreSQL 16+

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  created_at BIGINT,
  updated_at BIGINT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE
);

-- Create nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'initializing',
  capabilities JSONB NOT NULL,
  health JSONB DEFAULT '{"cpuPercent": 0, "memoryPercent": 0, "diskPercent": 0, "uptime": 0, "lastHeartbeat": 0}'::jsonb,
  credentials JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_metrics_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  app_type VARCHAR(50) NOT NULL,
  runtime VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  source_url VARCHAR(255),
  entrypoint VARCHAR(255) NOT NULL,
  port INT,
  instances INT DEFAULT 1,
  resources JSONB NOT NULL,
  env_vars JSONB DEFAULT '[]'::jsonb,
  health_check JSONB,
  target_node_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_nodes_user_id ON nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_nodes_provider ON nodes(provider);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to deployments
CREATE TRIGGER update_deployments_timestamp
  BEFORE UPDATE ON deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Insert test user for development
INSERT INTO users (email, password_hash, active)
VALUES ('dev@automator67.local', '$2a$10$test', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Log
SELECT 'Database schema initialized successfully' as status;
