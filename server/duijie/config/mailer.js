const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn('SMTP 未配置（缺少 SMTP_HOST/SMTP_USER/SMTP_PASS），邮件发送将跳过');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  transporter.verify().then(() => {
    logger.info(`SMTP 连接成功: ${user}@${host}:${port}`);
  }).catch(err => {
    logger.error(`SMTP 连接失败: ${err.message}`);
  });

  return transporter;
}

const SENDER_NAME = process.env.SMTP_FROM_NAME || 'DuiJie 对接平台';

async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    logger.warn(`邮件跳过（SMTP 未配置）: to=${to}, subject=${subject}`);
    return false;
  }
  try {
    const from = `"${SENDER_NAME}" <${process.env.SMTP_USER}>`;
    await t.sendMail({ from, to, subject, text, html });
    logger.info(`邮件发送成功: to=${to}, subject=${subject}`);
    return true;
  } catch (err) {
    logger.error(`邮件发送失败: to=${to}, err=${err.message}`);
    return false;
  }
}

async function sendVerificationCode(email, code, purpose = '验证') {
  return sendMail({
    to: email,
    subject: `【DuiJie】${purpose}验证码: ${code}`,
    html: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1e40af; margin: 0;">DuiJie 对接平台</h2>
        </div>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">您好，</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">您的${purpose}验证码为：</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 12px 32px; border-radius: 8px; border: 2px dashed #93c5fd;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6;">验证码 <strong>5 分钟</strong>内有效，请勿泄露给他人。</p>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6;">如非本人操作，请忽略此邮件。</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">此邮件由系统自动发送，请勿直接回复。</p>
      </div>
    `,
  });
}

module.exports = { sendMail, sendVerificationCode, getTransporter };
