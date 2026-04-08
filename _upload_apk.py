import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('160.202.253.143', username='root', password=os.environ.get('SSH_PASS'))
sftp = ssh.open_sftp()

apk = r'e:\DuiJie\frontend\duijieReact\android\app\build\outputs\apk\release\app-release.apk'
sftp.put(apk, '/opt/duijie/downloads/duijie.apk')
size = os.path.getsize(apk) / 1048576
print(f'APK uploaded: {size:.1f} MB')

sftp.close()
ssh.close()
