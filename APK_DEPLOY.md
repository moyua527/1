# APK 打包与发版指南

## 一、服务器准备（首次，只需做一次）

### 1. 创建 APK 下载目录

```bash
ssh root@160.202.253.143
mkdir -p /opt/duijie/downloads
```

### 2. Nginx 添加下载路径

编辑 Nginx 配置文件（通常在 `/etc/nginx/sites-available/duijie` 或 `/etc/nginx/conf.d/duijie.conf`），
在 `server` 块内添加：

```nginx
# APK 下载
location /downloads/ {
    alias /opt/duijie/downloads/;
    add_header Content-Disposition "attachment";
    types {
        application/vnd.android.package-archive apk;
    }
}
```

重载 Nginx：

```bash
nginx -t && systemctl reload nginx
```

---

## 二、打包 APK（本地电脑）

```powershell
# 设置环境变量（新终端需要）
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot'
$env:ANDROID_HOME = 'C:\Android\Sdk'

# 进入前端目录
cd E:\DuiJie\frontend\duijieReact

# 1. 构建前端
npm run build

# 2. 同步到 Android 项目
npx cap sync android

# 3. 打包 Debug APK
cd android
.\gradlew.bat assembleDebug

# 产物位置：
# android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 三、发版流程

### 1. 修改版本号（单一版本源）

只需修改项目根目录的 **`version.json`**，前端和后端会自动读取：

```jsonc
// E:\DuiJie\version.json
{
  "version": "1.2.0",         // 版本号
  "versionCode": 52,          // 递增，与 Android versionCode 一致
  "minVersion": "1.0.0",      // 最低兼容版本（低于此版本强制更新）
  "changelog": "新增某某功能"  // 更新说明
}
```

**同步规则：**
- **前端** — `capacitor.ts` 的 `APP_VERSION` / `APP_VERSION_CODE` 在 Vite 构建时自动从 `version.json` 注入（通过 `vite.config.ts` 的 `define`）
- **后端** — `appVersionController.js` 在运行时读取 `version.json`，下载地址可通过 `.env` 的 `APK_DOWNLOAD_URL` 覆盖
- **部署脚本** — `deploy_update.py` 会自动将 `version.json` 上传到服务器

**Android** — `android/app/build.gradle` 仍需手动同步：
```gradle
versionCode 52         // 与 version.json 中的 versionCode 一致
versionName "1.2.0"    // 与 version.json 中的 version 一致
```

### 2. 打包新 APK

按"二、打包 APK"执行。

### 3. 上传 APK 到服务器

```powershell
scp E:\DuiJie\frontend\duijieReact\android\app\build\outputs\apk\debug\app-debug.apk root@160.202.253.143:/opt/duijie/downloads/duijie.apk
```

### 4. 部署前后端

使用统一部署脚本（自动上传后端代码、前端构建产物、version.json，运行迁移，重启服务并健康检查）：

```powershell
cd E:\DuiJie\frontend\duijieReact
npm run build

cd E:\DuiJie
$env:SSH_PASS = "你的SSH密码"
python deploy_update.py
```

部署脚本执行流程：
1. 上传后端 JS/JSON 文件
2. `npm install --production`
3. 运行数据库迁移
4. 上传前端 dist
5. 上传 version.json
6. PM2 restart + API 健康检查（HTTP 200）
7. 写入 deploy.log

### 5. 验证

浏览器访问 `http://160.202.253.143:8080/downloads/duijie.apk`，确认能下载。
访问 `http://160.202.253.143:8080/api/app/version`，确认返回新版本号。

---

## 四、用户更新流程

1. 用户打开 APP
2. APP 调用 `/api/app/version` 检查版本
3. 发现新版本 → 弹出更新弹窗（显示版本号 + 更新内容）
4. 用户点击"立即下载安装"→ 系统浏览器下载 APK
5. 下载完成 → 点击安装 → 覆盖旧版 → 完成

如果 `forceUpdate: true` 或用户版本低于 `minVersion`，弹窗无法关闭，必须更新。
