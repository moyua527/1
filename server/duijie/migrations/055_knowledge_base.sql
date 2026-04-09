-- Knowledge base categories
CREATE TABLE IF NOT EXISTS duijie_kb_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enterprise_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id INT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enterprise (enterprise_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Knowledge base articles
CREATE TABLE IF NOT EXISTS duijie_kb_articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enterprise_id INT NOT NULL,
  category_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  content MEDIUMTEXT,
  tags VARCHAR(500) DEFAULT NULL,
  status ENUM('draft','published') DEFAULT 'draft',
  view_count INT DEFAULT 0,
  created_by INT NOT NULL,
  updated_by INT DEFAULT NULL,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enterprise (enterprise_id),
  INDEX idx_category (category_id),
  INDEX idx_status (status),
  FULLTEXT idx_search (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
