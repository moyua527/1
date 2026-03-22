const BLOCKED_UA = /scrapy|python-requests|java\/|httpclient|libwww|nikto|sqlmap|nmap|masscan|zgrab|go-http|fasthttp/i;
const SUSPICIOUS_PATHS = /\.(env|git|svn|bak|sql|log|conf|ini)$|wp-|phpmyadmin|cgi-bin|xmlrpc/i;

module.exports = (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!ua || BLOCKED_UA.test(ua)) {
    return res.status(403).json({ success: false, message: '请求被拒绝' });
  }
  if (SUSPICIOUS_PATHS.test(req.path)) {
    return res.status(404).json({ success: false, message: '未找到' });
  }
  next();
};
