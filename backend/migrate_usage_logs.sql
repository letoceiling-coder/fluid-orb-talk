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
  INDEX idx_usage_provider  (provider),
  INDEX idx_usage_created   (created_at)
) ENGINE=InnoDB;

DESCRIBE usage_logs;
