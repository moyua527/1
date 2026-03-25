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

### 1. 修改版本号

**前端** — `src/utils/capacitor.ts`：
```typescript
export const APP_VERSION = '1.1.0'       // 改为新版本号
export const APP_VERSION_CODE = 2        // 递增
```

**Android** — `android/app/build.gradle`：
```gradle
versionCode 2          // 递增，和 APP_VERSION_CODE 一致
versionName "1.1.0"    // 和 APP_VERSION 一致
```

**后端** — `server/duijie/atomic/controllers/system/appVersionController.js`：
```javascript
const APP_CONFIG = {
  version: '1.1.0',       // 改为新版本号
  versionCode: 2,          // 递增
  minVersion: '1.0.0',     // 最低兼容版本（低于此版本强制更新）
  downloadUrl: 'http://160.202.253.143:8080/downloads/duijie.apk',
  forceUpdate: false,       // true = 强制更新
  changelog: '修复了某某问题，新增了某某功能',
};
```

### 2. 打包新 APK

按"二、打包 APK"执行。

### 3. 上传 APK 到服务器

```powershell
scp E:\DuiJie\frontend\duijieReact\android\app\build\outputs\apk\debug\app-debug.apk root@160.202.253.143:/opt/duijie/downloads/duijie.apk
```

### 4. 部署后端（更新版本接口）

```bash
ssh root@160.202.253.143
cd /opt/duijie && git pull origin main
cd server/duijie && npm install --production
pm2 restart duijie
```

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
