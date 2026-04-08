const path = require('path');
const fs = require('fs');

const versionFile = path.resolve(__dirname, '../../../../../version.json');
const changelogFile = path.resolve(__dirname, '../../../../../CHANGELOG.md');

function readVersionInfo() {
  return JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
}

function parseChangelog() {
  try {
    const md = fs.readFileSync(changelogFile, 'utf-8');
    const rows = [];
    for (const line of md.split('\n')) {
      const m = line.match(/^\|\s*v?([\d.]+)\s*\|\s*([\d-]+)\s*\|\s*(.+?)\s*\|$/);
      if (m && m[1] !== '版本') {
        rows.push({ ver: m[1], date: m[2], desc: m[3].replace(/\*\*/g, '') });
      }
    }
    return rows;
  } catch { return []; }
}

module.exports = (req, res) => {
  const versionInfo = readVersionInfo();
  const data = {
    version: versionInfo.version,
    versionCode: versionInfo.versionCode,
    minVersion: versionInfo.minVersion,
    downloadUrl: process.env.APK_DOWNLOAD_URL || 'http://160.202.253.143:8080/downloads/duijie.apk',
    forceUpdate: false,
    changelog: versionInfo.changelog,
  };
  if (req.query.changelog === '1') {
    data.changelogList = parseChangelog();
  }
  res.json({ success: true, data });
};
