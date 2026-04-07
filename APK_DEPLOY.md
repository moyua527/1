# DuiJie APK 打包与发版指南

## 项目结构

`E:\DuiJie\frontend\duijieReact\android` — 这是一个 Capacitor WebView 壳，所有界面由远程服务器提供，APK 只是浏览器壳。

---

## 打包步骤

### 1. 更新版本号

修改 `android/app/version.properties`：

```properties
VERSION_CODE=53
VERSION_NAME=1.1.53
```

- `VERSION_CODE` 递增 1
- `VERSION_NAME` 末位递增（如 1.1.52 → 1.1.53）

同步修改项目根目录的 `version.json`（后端版本检测接口读取此文件）：

```json
{
  "version": "1.1.53",
  "versionCode": 53,
  "minVersion": "1.0.0",
  "changelog": "本次更新说明"
}
```

### 2. 执行构建

在 `frontend/duijieReact/android` 目录下运行：

```powershell
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot'
$env:ANDROID_HOME = 'C:\Android\Sdk'

cd E:\DuiJie\frontend\duijieReact\android
.\gradlew.bat assembleRelease
```

生成签名 APK：`app/build/outputs/apk/release/app-release.apk`

### 3. 上传到服务器

```powershell
scp E:\DuiJie\frontend\duijieReact\android\app\build\outputs\apk\release\app-release.apk root@160.202.253.143:/opt/duijie/downloads/duijie.apk
```

### 4. 同步版本号到服务器

上传 `version.json` 并重启后端，客户端才能检测到新版本：

```powershell
scp E:\DuiJie\version.json root@160.202.253.143:/opt/duijie/version.json
ssh root@160.202.253.143 "cd /opt/duijie/server/duijie && pm2 restart duijie"
```

### 5. 验证

- 下载测试：`http://160.202.253.143:8080/downloads/duijie.apk`
- 版本接口：`http://160.202.253.143:8080/api/app/version`（确认返回新版本号）

---

## APK 核心逻辑

- APK 是 Capacitor WebView 壳，启动后加载远程服务器前端页面（`http://160.202.253.143:8080`）
- 前端代码独立于 APK 更新（改前端不需要重新打包 APK）
- 只有原生层改动（如 WebView 配置、权限、插件等）才需要重新打包 APK

---

## 签名密钥信息

- 密钥文件：`android/app/duijie-release.keystore`
- 密钥别名：`duijie`
- 密钥密码：`DuiJie2026`
- 有效期：100 年

> ⚠️ `duijie-release.keystore` 是 APK 签名的唯一凭证，丢失后无法发布同签名的更新包。请妥善备份。

---

## 用户更新流程

1. 用户打开 APP
2. APP 调用 `/api/app/version` 检查版本
3. 发现新版本 → 弹出更新弹窗（显示版本号 + 更新内容）
4. 用户点击"立即下载安装" → 系统浏览器下载 APK
5. 下载完成 → 点击安装 → 覆盖旧版 → 完成

如果 `forceUpdate: true` 或用户版本低于 `minVersion`，弹窗无法关闭，必须更新。

---

## 首次服务器准备（只需做一次）

### 创建 APK 下载目录

```bash
ssh root@160.202.253.143
mkdir -p /opt/duijie/downloads
```

### Nginx 添加下载路径

在 Nginx 配置的 `server` 块内添加：

```nginx
location /downloads/ {
    alias /opt/duijie/downloads/;
    add_header Content-Disposition "attachment";
    types {
        application/vnd.android.package-archive apk;
    }
}
```

```bash
nginx -t && systemctl reload nginx
```
