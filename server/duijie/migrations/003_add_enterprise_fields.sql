ALTER TABLE duijie_clients ADD COLUMN credit_code VARCHAR(30) DEFAULT NULL COMMENT '统一社会信用代码';
ALTER TABLE duijie_clients ADD COLUMN legal_person VARCHAR(50) DEFAULT NULL COMMENT '法定代表人';
ALTER TABLE duijie_clients ADD COLUMN registered_capital VARCHAR(50) DEFAULT NULL COMMENT '注册资本';
ALTER TABLE duijie_clients ADD COLUMN established_date DATE DEFAULT NULL COMMENT '成立日期';
ALTER TABLE duijie_clients ADD COLUMN business_scope TEXT COMMENT '经营范围';
ALTER TABLE duijie_clients ADD COLUMN company_type VARCHAR(50) DEFAULT NULL COMMENT '企业类型';
ALTER TABLE duijie_clients ADD COLUMN website VARCHAR(200) DEFAULT NULL COMMENT '官网';
