const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const upload = require('./upload');
const db = require('../../config/db');
const router = express.Router();

// Messages
router.post('/messages', auth, upload.single('image'), require('../controllers/message/sendController'));
router.get('/messages', auth, require('../controllers/message/listController'));

// Direct Messages
router.get('/dm/conversations', auth, require('../controllers/dm/conversationsController'));
router.get('/dm/users', auth, require('../controllers/dm/usersController'));
router.get('/dm/:userId/history', auth, require('../controllers/dm/historyController'));
router.post('/dm/send', auth, V.sendDm, validate, require('../controllers/dm/sendController'));
router.patch('/dm/:id/recall', auth, require('../controllers/dm/recallController'));

// Tickets
router.post('/tickets', auth, upload.array('files', 10), require('../controllers/ticket/createController'));
router.get('/tickets', auth, require('../controllers/ticket/listController'));
router.get('/tickets/:id', auth, require('../controllers/ticket/detailController'));
router.put('/tickets/:id', auth, require('../controllers/ticket/updateController'));
router.post('/tickets/:id/reply', auth, upload.array('files', 10), require('../controllers/ticket/replyController'));
router.post('/tickets/:id/rate', auth, require('../controllers/ticket/rateController'));

// Notifications
router.get('/notifications/unread-summary', auth, require('../controllers/notification/unreadSummaryController'));
router.get('/notifications', auth, require('../controllers/notification/listController'));
router.patch('/notifications/read-by-tab', auth, require('../controllers/notification/markReadByTabController'));
router.patch('/notifications/:id/read', auth, require('../controllers/notification/markReadController'));
router.delete('/notifications/cleanup', auth, require('../controllers/notification/cleanupController'));
router.delete('/notifications/:id', auth, require('../controllers/notification/deleteController'));
router.post('/notifications/devices', auth, require('../controllers/notification/registerDeviceController'));
router.post('/notifications/devices/unregister', auth, require('../controllers/notification/unregisterDeviceController'));

// ========== User Nicknames (备注名) ==========

// 获取我设置的所有备注名
router.get('/nicknames', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT target_user_id, nickname FROM user_nicknames WHERE user_id = ?',
      [req.userId]
    );
    const map = {};
    rows.forEach(r => { map[r.target_user_id] = r.nickname });
    res.json({ success: true, data: map });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取备注名失败' });
  }
});

// 设置/更新备注名
router.put('/nicknames/:targetUserId', auth, async (req, res) => {
  try {
    const targetUserId = Number(req.params.targetUserId);
    const { nickname } = req.body;
    if (!nickname || !nickname.trim()) return res.status(400).json({ success: false, message: '备注名不能为空' });
    if (targetUserId === req.userId) return res.status(400).json({ success: false, message: '不能给自己设置备注名' });
    await db.query(
      `INSERT INTO user_nicknames (user_id, target_user_id, nickname) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE nickname = VALUES(nickname)`,
      [req.userId, targetUserId, nickname.trim()]
    );
    res.json({ success: true, message: '备注名已设置' });
  } catch (e) {
    res.status(500).json({ success: false, message: '设置备注名失败' });
  }
});

// 删除备注名
router.delete('/nicknames/:targetUserId', auth, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM user_nicknames WHERE user_id = ? AND target_user_id = ?',
      [req.userId, Number(req.params.targetUserId)]
    );
    res.json({ success: true, message: '备注名已删除' });
  } catch (e) {
    res.status(500).json({ success: false, message: '删除备注名失败' });
  }
});

// Friends
// 搜索用户（手机号）
router.get('/friends/search', auth, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || phone.length < 3) return res.json({ success: true, data: [] });
    const [rows] = await db.query(
      `SELECT id, username, nickname, phone, role FROM voice_users WHERE phone LIKE ? AND id != ? AND is_deleted = 0 LIMIT 10`,
      [`%${phone}%`, req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '搜索失败' });
  }
});

// 好友列表
router.get('/friends', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.id as friendship_id, f.created_at as friend_since,
              u.id, u.username, u.nickname, u.phone, u.email, u.role
       FROM duijie_friends f
       JOIN voice_users u ON (CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END) = u.id
       WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
       ORDER BY u.nickname ASC`,
      [req.userId, req.userId, req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取好友列表失败' });
  }
});

// 发送好友申请
router.post('/friends/request', auth, async (req, res) => {
  try {
    const { friend_id, message } = req.body;
    if (!friend_id) return res.status(400).json({ success: false, message: '请选择用户' });
    if (Number(friend_id) === req.userId) return res.status(400).json({ success: false, message: '不能添加自己' });
    // 检查是否已是好友
    const [existing] = await db.query(
      `SELECT id, status FROM duijie_friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [req.userId, friend_id, friend_id, req.userId]
    );
    if (existing.length > 0) {
      if (existing[0].status === 'accepted') return res.status(400).json({ success: false, message: '已经是好友了' });
      if (existing[0].status === 'pending') return res.status(400).json({ success: false, message: '已发送过申请，请等待对方确认' });
      // rejected: allow re-request by updating
      await db.query('UPDATE duijie_friends SET status = ?, message = ?, user_id = ?, friend_id = ?, updated_at = NOW() WHERE id = ?',
        ['pending', message || null, req.userId, friend_id, existing[0].id]);
      return res.json({ success: true, message: '好友申请已发送' });
    }
    await db.query('INSERT INTO duijie_friends (user_id, friend_id, message) VALUES (?, ?, ?)',
      [req.userId, friend_id, message || null]);
    res.json({ success: true, message: '好友申请已发送' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: '已发送过申请' });
    res.status(500).json({ success: false, message: '发送申请失败' });
  }
});

// 收到的好友申请列表
router.get('/friends/requests', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.id, f.message, f.created_at, f.status,
              u.id as user_id, u.username, u.nickname, u.phone, u.role
       FROM duijie_friends f
       JOIN voice_users u ON f.user_id = u.id
       WHERE f.friend_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取申请列表失败' });
  }
});

// 处理好友申请
router.patch('/friends/:id/respond', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    if (!['accept', 'reject'].includes(action)) return res.status(400).json({ success: false, message: '无效操作' });
    const [rows] = await db.query('SELECT * FROM duijie_friends WHERE id = ? AND friend_id = ? AND status = ?', [req.params.id, req.userId, 'pending']);
    if (rows.length === 0) return res.status(404).json({ success: false, message: '申请不存在' });
    await db.query('UPDATE duijie_friends SET status = ? WHERE id = ?', [action === 'accept' ? 'accepted' : 'rejected', req.params.id]);
    res.json({ success: true, message: action === 'accept' ? '已添加好友' : '已拒绝' });
  } catch (e) {
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// 删除好友
router.delete('/friends/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM duijie_friends WHERE id = ? AND (user_id = ? OR friend_id = ?)', [req.params.id, req.userId, req.userId]);
    res.json({ success: true, message: '已删除好友' });
  } catch (e) {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// ========== Groups ==========

// 创建群聊
router.post('/groups', auth, async (req, res) => {
  try {
    const { name, member_ids } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '请输入群名称' });
    if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) return res.status(400).json({ success: false, message: '请选择至少一个成员' });
    const [result] = await db.query('INSERT INTO duijie_groups (name, created_by) VALUES (?, ?)', [name.trim(), req.userId]);
    const groupId = result.insertId;
    // 创建者自动加入为admin
    await db.query('INSERT INTO duijie_group_members (group_id, user_id, role) VALUES (?, ?, ?)', [groupId, req.userId, 'admin']);
    // 添加其他成员
    const ids = [...new Set(member_ids.filter(id => Number(id) !== req.userId).map(Number))];
    if (ids.length > 0) {
      const vals = ids.map(uid => [groupId, uid, 'member']);
      await db.query('INSERT IGNORE INTO duijie_group_members (group_id, user_id, role) VALUES ?', [vals]);
    }
    res.json({ success: true, data: { id: groupId, name: name.trim() } });
  } catch (e) {
    res.status(500).json({ success: false, message: '创建群聊失败' });
  }
});

// 我的群聊列表
router.get('/groups', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT g.id, g.name, g.created_by, g.created_at,
              (SELECT COUNT(*) FROM duijie_group_members WHERE group_id = g.id) as member_count,
              (SELECT gm2.content FROM duijie_group_messages gm2 WHERE gm2.group_id = g.id ORDER BY gm2.created_at DESC LIMIT 1) as last_message,
              (SELECT gm2.created_at FROM duijie_group_messages gm2 WHERE gm2.group_id = g.id ORDER BY gm2.created_at DESC LIMIT 1) as last_time
       FROM duijie_groups g
       JOIN duijie_group_members gm ON g.id = gm.group_id AND gm.user_id = ?
       ORDER BY last_time DESC, g.created_at DESC`,
      [req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取群聊列表失败' });
  }
});

// 群聊详情（成员列表）
router.get('/groups/:id', auth, async (req, res) => {
  try {
    const [[group]] = await db.query('SELECT g.* FROM duijie_groups g JOIN duijie_group_members gm ON g.id = gm.group_id AND gm.user_id = ? WHERE g.id = ?', [req.userId, req.params.id]);
    if (!group) return res.status(404).json({ success: false, message: '群聊不存在' });
    const [members] = await db.query(
      `SELECT gm.role, gm.joined_at, u.id, u.username, u.nickname, u.phone
       FROM duijie_group_members gm JOIN voice_users u ON gm.user_id = u.id
       WHERE gm.group_id = ? ORDER BY gm.role DESC, gm.joined_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...group, members } });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取群详情失败' });
  }
});

// 群消息历史
router.get('/groups/:id/history', auth, async (req, res) => {
  try {
    // 检查是否群成员
    const [[member]] = await db.query('SELECT id FROM duijie_group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!member) return res.status(403).json({ success: false, message: '您不是群成员' });
    const [rows] = await db.query(
      `SELECT m.id, m.group_id, m.sender_id, m.content, m.is_recalled, m.created_at,
              u.username as sender_username, u.nickname as sender_nickname
       FROM duijie_group_messages m
       JOIN voice_users u ON m.sender_id = u.id
       WHERE m.group_id = ?
       ORDER BY m.created_at ASC LIMIT 200`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取消息失败' });
  }
});

// 发送群消息
router.post('/groups/:id/send', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ success: false, message: '消息不能为空' });
    const [[member]] = await db.query('SELECT id FROM duijie_group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!member) return res.status(403).json({ success: false, message: '您不是群成员' });
    await db.query('INSERT INTO duijie_group_messages (group_id, sender_id, content) VALUES (?, ?, ?)', [req.params.id, req.userId, content.trim()]);
    // 通过socket通知群成员
    const [members] = await db.query('SELECT user_id FROM duijie_group_members WHERE group_id = ? AND user_id != ?', [req.params.id, req.userId]);
    const io = req.app.get('io');
    if (io) {
      members.forEach(m => {
        io.to(`user_${m.user_id}`).emit('new_group_msg', { group_id: Number(req.params.id), sender_id: req.userId });
      });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '发送失败' });
  }
});

// 撤回群消息
router.patch('/groups/:id/messages/:msgId/recall', auth, async (req, res) => {
  try {
    const [[msg]] = await db.query('SELECT id, sender_id FROM duijie_group_messages WHERE id = ? AND group_id = ?', [req.params.msgId, req.params.id]);
    if (!msg) return res.status(404).json({ success: false, message: '消息不存在' });
    if (msg.sender_id !== req.userId) return res.status(403).json({ success: false, message: '只能撤回自己的消息' });
    await db.query('UPDATE duijie_group_messages SET is_recalled = 1 WHERE id = ?', [req.params.msgId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '撤回失败' });
  }
});

// 添加群成员
router.post('/groups/:id/members', auth, async (req, res) => {
  try {
    const { user_ids } = req.body;
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) return res.status(400).json({ success: false, message: '请选择成员' });
    // 检查是否群成员
    const [[member]] = await db.query('SELECT role FROM duijie_group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!member) return res.status(403).json({ success: false, message: '您不是群成员' });
    const vals = user_ids.map(uid => [Number(req.params.id), Number(uid), 'member']);
    await db.query('INSERT IGNORE INTO duijie_group_members (group_id, user_id, role) VALUES ?', [vals]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '添加成员失败' });
  }
});

// 退出群聊
router.delete('/groups/:id/leave', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM duijie_group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.userId]);
    // 如果群内没有成员了，删除群
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) as cnt FROM duijie_group_members WHERE group_id = ?', [req.params.id]);
    if (cnt === 0) {
      await db.query('DELETE FROM duijie_group_messages WHERE group_id = ?', [req.params.id]);
      await db.query('DELETE FROM duijie_groups WHERE id = ?', [req.params.id]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '退出失败' });
  }
});

module.exports = router;
