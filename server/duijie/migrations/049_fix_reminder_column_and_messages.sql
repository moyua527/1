-- Fix: rename 'note' column to 'message' in reminders table (created by 039 with 'note', 048 expected 'message')
ALTER TABLE duijie_milestone_reminders CHANGE COLUMN note message VARCHAR(500) DEFAULT NULL;

-- Ensure milestone_messages table exists (048 may have failed silently if participants table already existed)
CREATE TABLE IF NOT EXISTS duijie_milestone_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  milestone_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  mentioned_users JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_milestone (milestone_id),
  INDEX idx_user (user_id)
);
