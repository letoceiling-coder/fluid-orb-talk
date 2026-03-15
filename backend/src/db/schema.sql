-- ============================================================
-- AI Gateway Platform — Database Schema
-- Engine: MySQL 8.0+ | Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS ai_gateway
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_gateway;

-- ── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  email         VARCHAR(255)    NOT NULL UNIQUE,
  password_hash VARCHAR(64)     NOT NULL,
  name          VARCHAR(255)    NOT NULL,
  role          ENUM('admin', 'user', 'viewer') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ── Workspaces ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  user_id       CHAR(36)        NOT NULL,
  name          VARCHAR(255)    NOT NULL,
  plan          ENUM('free', 'pro', 'enterprise') NOT NULL DEFAULT 'free',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_workspaces_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── API Keys ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  workspace_id  CHAR(36)        NOT NULL,
  key_hash      VARCHAR(64)     NOT NULL UNIQUE,
  name          VARCHAR(255)    NOT NULL,
  rate_limit    INT             NOT NULL DEFAULT 60,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  last_used_at  DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_api_keys_workspace (workspace_id),
  INDEX idx_api_keys_hash (key_hash),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Usage Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_logs (
  id                CHAR(36)        NOT NULL DEFAULT (UUID()),
  workspace_id      CHAR(36)        NULL,
  user_id           CHAR(36)        NULL,
  provider          VARCHAR(50)     NOT NULL,
  model             VARCHAR(100)    NULL,
  task_type         VARCHAR(50)     NOT NULL,
  status            ENUM('success', 'error') NOT NULL,
  latency_ms        INT             NOT NULL DEFAULT 0,
  prompt_tokens     INT             NOT NULL DEFAULT 0,
  completion_tokens INT             NOT NULL DEFAULT 0,
  total_tokens      INT             NOT NULL DEFAULT 0,
  error_message     TEXT            NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_usage_workspace (workspace_id),
  INDEX idx_usage_provider (provider),
  INDEX idx_usage_created (created_at)
) ENGINE=InnoDB;

-- ── Agents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  workspace_id  CHAR(36)        NOT NULL,
  type          VARCHAR(50)     NOT NULL,
  name          VARCHAR(255)    NOT NULL,
  state         ENUM('idle', 'starting', 'running', 'paused', 'stopped', 'error') NOT NULL DEFAULT 'idle',
  config_json   JSON            NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_agents_workspace (workspace_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Workflows ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  workspace_id  CHAR(36)        NOT NULL,
  name          VARCHAR(255)    NOT NULL,
  graph_json    LONGTEXT        NOT NULL,
  version       INT             NOT NULL DEFAULT 1,
  is_active     TINYINT(1)      NOT NULL DEFAULT 1,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_workflows_workspace (workspace_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Workflow Runs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_runs (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  workflow_id   CHAR(36)        NOT NULL,
  status        ENUM('running', 'complete', 'error') NOT NULL DEFAULT 'running',
  input_json    JSON            NULL,
  output_json   LONGTEXT        NULL,
  error_message TEXT            NULL,
  started_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at   DATETIME        NULL,
  PRIMARY KEY (id),
  INDEX idx_runs_workflow (workflow_id),
  INDEX idx_runs_started (started_at),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB;
