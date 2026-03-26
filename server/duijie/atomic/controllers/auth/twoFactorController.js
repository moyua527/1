const db = require('../../../config/db');
const { generateSecret, verifyToken, buildOtpAuthUrl } = require('../../utils/totp');
const { buildUserPayload, signAccessToken, verifyTwoFactorChallenge } = require('../../utils/authToken');

function authCookie(token) {
  return { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 };
}

async function getSiteName() {
  const [rows] = await db.query("SELECT config_value FROM system_config WHERE config_key = 'SITE_NAME' LIMIT 1");
  return rows[0]?.config_value || 'DuiJie';
}

exports.status = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT totp_enabled, totp_secret FROM voice_users WHERE id = ? AND is_deleted = 0', [req.userId]);
    if (!rows[0]) return res.status(404).json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: { enabled: rows[0].totp_enabled === 1, has_secret: !!rows[0].totp_secret } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.setup = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT username, email, totp_enabled FROM voice_users WHERE id = ? AND is_deleted = 0', [req.userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    if (user.totp_enabled === 1) return res.status(400).json({ success: false, message: '已启用两步验证，如需重置请先关闭' });

    const secret = generateSecret();
    const issuer = await getSiteName();
    const accountName = user.email || user.username || `user${req.userId}`;
    const otpauthUrl = buildOtpAuthUrl({ issuer, accountName, secret });

    await db.query('UPDATE voice_users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?', [secret, req.userId]);

    res.json({ success: true, data: { secret, issuer, account_name: accountName, otpauth_url: otpauthUrl } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.enable = async (req, res) => {
  try {
    const totpCode = String(req.body?.totp_code || '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(totpCode)) return res.status(400).json({ success: false, message: '请输入6位动态验证码' });

    const [rows] = await db.query('SELECT totp_secret FROM voice_users WHERE id = ? AND is_deleted = 0', [req.userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    if (!user.totp_secret) return res.status(400).json({ success: false, message: '请先生成验证器密钥' });
    if (!verifyToken(user.totp_secret, totpCode)) return res.status(400).json({ success: false, message: '动态验证码错误' });

    await db.query('UPDATE voice_users SET totp_enabled = 1 WHERE id = ?', [req.userId]);
    res.json({ success: true, data: { totp_enabled: true } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.disable = async (req, res) => {
  try {
    const totpCode = String(req.body?.totp_code || '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(totpCode)) return res.status(400).json({ success: false, message: '请输入6位动态验证码' });

    const [rows] = await db.query('SELECT totp_enabled, totp_secret FROM voice_users WHERE id = ? AND is_deleted = 0', [req.userId]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    if (user.totp_enabled !== 1 || !user.totp_secret) return res.status(400).json({ success: false, message: '当前未启用两步验证' });
    if (!verifyToken(user.totp_secret, totpCode)) return res.status(400).json({ success: false, message: '动态验证码错误' });

    await db.query('UPDATE voice_users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?', [req.userId]);
    res.json({ success: true, data: { totp_enabled: false } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

exports.verifyLogin = async (req, res) => {
  try {
    const challengeToken = req.body?.challenge_token;
    const totpCode = String(req.body?.totp_code || '').replace(/\D/g, '');
    if (!challengeToken) return res.status(400).json({ success: false, message: '缺少验证票据' });
    if (!/^\d{6}$/.test(totpCode)) return res.status(400).json({ success: false, message: '请输入6位动态验证码' });

    const decoded = await verifyTwoFactorChallenge(challengeToken);
    const [rows] = await db.query(
      'SELECT id, username, nickname, avatar, role, client_id, is_active, totp_enabled, totp_secret FROM voice_users WHERE id = ? AND is_deleted = 0',
      [decoded.userId]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    if (user.is_active === 0) return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' });
    if (user.totp_enabled !== 1 || !user.totp_secret) return res.status(400).json({ success: false, message: '当前账号未启用两步验证' });
    if (!verifyToken(user.totp_secret, totpCode)) return res.status(400).json({ success: false, message: '动态验证码错误' });

    const token = await signAccessToken(user);
    db.query('UPDATE voice_users SET last_login_at = NOW() WHERE id = ?', [user.id]).catch(() => {});
    res.cookie('token', token, authCookie(token));
    res.json({ success: true, data: buildUserPayload(user), token });
  } catch (e) {
    res.status(401).json({ success: false, message: '两步验证失败' });
  }
};
