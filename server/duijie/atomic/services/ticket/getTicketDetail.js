const findByIdRepo = require('../../repositories/ticket/findByIdRepo');
const findRepliesRepo = require('../../repositories/ticket/findRepliesRepo');
const findAttachmentsRepo = require('../../repositories/ticket/findAttachmentsRepo');

module.exports = async (ticketId) => {
  const ticket = await findByIdRepo(ticketId);
  if (!ticket) return null;
  const [replies, attachments] = await Promise.all([
    findRepliesRepo(ticketId),
    findAttachmentsRepo(ticketId),
  ]);
  // 使用 Map 按 reply_id 分组附件，避免 O(M*N) 复杂度
  const attachmentMap = new Map();
  const ticketAttachments = [];
  for (const a of attachments) {
    if (!a.reply_id) { ticketAttachments.push(a); continue; }
    if (!attachmentMap.has(a.reply_id)) attachmentMap.set(a.reply_id, []);
    attachmentMap.get(a.reply_id).push(a);
  }
  for (const r of replies) {
    r.attachments = attachmentMap.get(r.id) || [];
  }
  return { ...ticket, replies, attachments: ticketAttachments };
};
