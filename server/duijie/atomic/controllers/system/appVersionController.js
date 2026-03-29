const APP_CONFIG = {
  version: '1.1.49',
  versionCode: 49,
  minVersion: '1.0.0',
  downloadUrl: 'http://160.202.253.143:8080/downloads/duijie.apk',
  forceUpdate: false,
  changelog: '修复连续刷新触发 Nginx 429 限速导致 HTML 错误内容显示在页面上的问题。',
};

module.exports = (req, res) => {
  res.json({ success: true, data: APP_CONFIG });
};
