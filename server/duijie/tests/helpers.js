const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

let cachedTokens = new Map();
let cachedAdminToken = null;

async function getJwtSecret() {
  const [rows] = await db.query("SELECT config_value FROM system_config WHERE config_key = 'JWT_SECRET'");
  return rows[0]?.config_value;
}

async function loginAsUser(phone) {
  if (cachedTokens.has(phone)) return cachedTokens.get(phone);
  // 查找测试用户或使用已有用户
  const [users] = await db.query("SELECT id, username FROM voice_users WHERE phone = ? AND is_deleted = 0 LIMIT 1", [phone]);
  if (!users[0]) throw new Error(`Test user with phone ${phone} not found`);
  const secret = await getJwtSecret();
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: users[0].id, role: 'member', clientId: null }, secret, { expiresIn: '1h' });
  cachedTokens.set(phone, token);
  return token;
}

async function loginAsAdmin() {
  if (cachedAdminToken) return cachedAdminToken;
  const [users] = await db.query("SELECT id FROM voice_users WHERE role = 'admin' AND is_deleted = 0 LIMIT 1");
  if (!users[0]) throw new Error('No admin user found');
  const secret = await getJwtSecret();
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: users[0].id, role: 'admin', clientId: null }, secret, { expiresIn: '1h' });
  cachedAdminToken = token;
  return token;
}

async function getTestUserId(phone) {
  const [users] = await db.query("SELECT id FROM voice_users WHERE phone = ? AND is_deleted = 0 LIMIT 1", [phone]);
  return users[0]?.id;
}

const UA = 'Mozilla/5.0 (Jest Test Runner)';

function authGet(path, token) {
  return request(app).get(path).set('Authorization', `Bearer ${token}`).set('User-Agent', UA);
}
function authPost(path, token, body) {
  return request(app).post(path).set('Authorization', `Bearer ${token}`).set('User-Agent', UA).send(body);
}
function authPut(path, token, body) {
  return request(app).put(path).set('Authorization', `Bearer ${token}`).set('User-Agent', UA).send(body);
}
function authDelete(path, token) {
  return request(app).delete(path).set('Authorization', `Bearer ${token}`).set('User-Agent', UA);
}
function publicReq(method, path) {
  return request(app)[method](path).set('User-Agent', UA);
}

function resetTokenCache() {
  cachedTokens = new Map();
  cachedAdminToken = null;
}

async function closeDb() {
  await db.end();
}

module.exports = { loginAsUser, loginAsAdmin, getTestUserId, authGet, authPost, authPut, authDelete, publicReq, resetTokenCache, closeDb, db, app, UA };
