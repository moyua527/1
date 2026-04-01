const path = require('path');
const fs = require('fs');

const versionFile = path.resolve(__dirname, '../../../../../version.json');
const versionInfo = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));

const APP_CONFIG = {
  version: versionInfo.version,
  versionCode: versionInfo.versionCode,
  minVersion: versionInfo.minVersion,
  downloadUrl: process.env.APK_DOWNLOAD_URL || 'http://160.202.253.143:8080/downloads/duijie.apk',
  forceUpdate: false,
  changelog: versionInfo.changelog,
};

module.exports = (req, res) => {
  res.json({ success: true, data: APP_CONFIG });
};
