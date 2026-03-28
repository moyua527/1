const APP_CONFIG = {
  version: '1.1.48',
  versionCode: 48,
  minVersion: '1.0.0',
  downloadUrl: 'http://160.202.253.143:8080/downloads/duijie.apk',
  forceUpdate: false,
  changelog: '修复网页登录刷新会话丢失，以及项目详情页多次刷新后卡在加载中的问题。',
};

module.exports = (req, res) => {
  res.json({ success: true, data: APP_CONFIG });
};
