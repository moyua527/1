const path = require('path');
const fs = require('fs');

const versionFile = path.resolve(__dirname, '../../../../../version.json');
const bundlePath = path.resolve(__dirname, '../../../../../downloads/dist.zip');

function info(req, res) {
  try {
    const versionInfo = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
    if (!fs.existsSync(bundlePath)) {
      return res.json({ success: false, message: 'No bundle available' });
    }

    const stat = fs.statSync(bundlePath);

    res.json({
      success: true,
      data: {
        version: versionInfo.version,
        url: '/api/app/bundle/download',
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      },
    });
  } catch (e) {
    res.json({ success: false, message: 'Bundle info unavailable' });
  }
}

function download(req, res) {
  if (!fs.existsSync(bundlePath)) {
    return res.status(404).json({ success: false, message: 'Bundle not found' });
  }
  const stat = fs.statSync(bundlePath);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', 'attachment; filename="dist.zip"');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  const stream = fs.createReadStream(bundlePath);
  stream.pipe(res);
}

module.exports = { info, download };
