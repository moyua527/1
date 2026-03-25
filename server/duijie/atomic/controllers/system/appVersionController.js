const APP_CONFIG = {
  version: '1.0.0',
  versionCode: 1,
  minVersion: '1.0.0',
  downloadUrl: 'http://160.202.253.143:8080/downloads/duijie.apk',
  forceUpdate: false,
  changelog: '',
};

module.exports = (req, res) => {
  res.json({ success: true, data: APP_CONFIG });
};
