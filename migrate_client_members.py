import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password='Xiao134679')
cmd = """mysql -u duijie -p'DuiJie@2024!' duijie_db -e "
CREATE TABLE IF NOT EXISTS duijie_client_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL COMMENT '关联企业客户',
  name VARCHAR(100) NOT NULL COMMENT '成员姓名',
  position VARCHAR(100) COMMENT '职位',
  department VARCHAR(100) COMMENT '部门',
  phone VARCHAR(30) COMMENT '电话',
  email VARCHAR(200) COMMENT '邮箱',
  notes TEXT COMMENT '备注',
  created_by INT COMMENT '添加人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT(1) DEFAULT 0,
  INDEX idx_client_id (client_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
" """
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
err = stderr.read().decode()
if 'ERROR' in err:
    print('ERR:', err)
else:
    print('OK: duijie_client_members table created')
ssh.close()
