ALTER TABLE duijie_projects
ADD COLUMN task_title_presets TEXT NULL AFTER app_url;

CREATE TABLE IF NOT EXISTS duijie_task_title_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_task_title_history_user_project_title (user_id, project_id, title),
  KEY idx_task_title_history_user_project_last_used (user_id, project_id, last_used_at),
  CONSTRAINT fk_task_title_history_user FOREIGN KEY (user_id) REFERENCES voice_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_task_title_history_project FOREIGN KEY (project_id) REFERENCES duijie_projects(id) ON DELETE CASCADE
);
