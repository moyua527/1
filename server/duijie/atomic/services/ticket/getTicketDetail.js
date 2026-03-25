const findByIdRepo = require('../../repositories/ticket/findByIdRepo');
const findRepliesRepo = require('../../repositories/ticket/findRepliesRepo');
const findAttachmentsRepo = require('../../repositories/ticket/findAttachmentsRepo');

module.exports = async (ticketId) => {
  const ticket = await findByIdRepo(ticketId);
  if (!ticket) return null;
  const replies = await findRepliesRepo(ticketId);
  const attachments = await findAttachmentsRepo(ticketId);
  const ticketAttachments = attachments.filter(a => !a.reply_id);
  for (const r of replies) {
    r.attachments = attachments.filter(a => a.reply_id === r.id);
  }
  return { ...ticket, replies, attachments: ticketAttachments };
};
