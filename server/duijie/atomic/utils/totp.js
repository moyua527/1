const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function bufferToBase32(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    if (chunk.length < 5) {
      output += BASE32_ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)];
    } else {
      output += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
  }
  return output;
}

function base32ToBuffer(input) {
  const normalized = String(input || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of normalized) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 secret');
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateSecret(size = 20) {
  return bufferToBase32(crypto.randomBytes(size));
}

function generateToken(secret, timestamp = Date.now(), period = 30, digits = 6) {
  const counter = Math.floor(timestamp / 1000 / period);
  const key = base32ToBuffer(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);
  return String(binary % (10 ** digits)).padStart(digits, '0');
}

function verifyToken(secret, token, windowSize = 1, timestamp = Date.now(), period = 30, digits = 6) {
  const normalized = String(token || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  for (let offset = -windowSize; offset <= windowSize; offset += 1) {
    if (generateToken(secret, timestamp + offset * period * 1000, period, digits) === normalized) {
      return true;
    }
  }
  return false;
}

function buildOtpAuthUrl({ issuer, accountName, secret }) {
  const label = `${issuer}:${accountName}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = {
  generateSecret,
  generateToken,
  verifyToken,
  buildOtpAuthUrl,
};
