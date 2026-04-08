const path = require('path');
const fs = require('fs');

const versionFile = path.resolve(__dirname, '../../../../../version.json');
const bundlePath = path.resolve(__dirname, '../../../../../downloads/dist.zip');

module.exports = (req, res) => {
  try {
    const versionInfo = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
    const bundleExists = fs.existsSync(bundlePath);

    if (!bundleExists) {
      return res.json({ success: false, message: 'No bundle available' });
    }

    const stat = fs.statSync(bundlePath);
    const downloadUrl = `${req.protocol}://${req.get('host')}/downloads/dist.zip`;

    res.json({
      success: true,
      data: {
        version: versionInfo.version,
        url: downloadUrl,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      },
    });
  } catch (e) {
    res.json({ success: false, message: 'Bundle info unavailable' });
  }
};
