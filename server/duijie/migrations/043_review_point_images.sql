-- 043: 审核要点支持图片附件
ALTER TABLE duijie_task_review_points ADD COLUMN images JSON DEFAULT NULL COMMENT '图片URL数组' AFTER content;
