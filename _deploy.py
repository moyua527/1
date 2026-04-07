import paramiko, os, subprocess, time

t0 = time.time()
def ts(): return f"[{time.time()-t0:.1f}s]"

dist = r"E:\DuiJie\frontend\duijieReact\dist"
tar = r"E:\DuiJie\dist.tar.gz"
REMOTE = '/opt/duijie/frontend/duijieReact'

print(f"{ts()} Packing...")
subprocess.run(["tar", "-czf", tar, "-C", os.path.dirname(dist), "dist"], check=True)
print(f"{ts()} Connecting...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', 22, 'root', 'Xiao134679', timeout=10)
print(f"{ts()} Uploading...")
sftp = ssh.open_sftp()
sftp.put(tar, '/tmp/dist.tar.gz')
sftp.close()
print(f"{ts()} Extracting to {REMOTE}/dist ...")
stdin, stdout, stderr = ssh.exec_command(f'rm -rf {REMOTE}/dist && tar -xzf /tmp/dist.tar.gz -C {REMOTE}/ && rm /tmp/dist.tar.gz')
stdout.channel.recv_exit_status()
print(f"{ts()} Done!")
ssh.close()
os.remove(tar)
