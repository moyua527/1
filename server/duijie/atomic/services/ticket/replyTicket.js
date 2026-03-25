const findBasicByIdRepo = require('../../repositories/ticket/findBasicByIdRepo');
const updateStatusRepo = require('../../repositories/ticket/updateStatusRepo');
const createReplyRepo = require('../../repositories/ticket/createReplyRepo');
const createAttachmentRepo = require('../../repositories/ticket/createAttachmentRepo');

async function findTicket(ticketId) {
  return await findBasicByIdRepo(ticketId);
}

async function createReply(ticketId, content, createdBy, files) {
  await updateStatusRepo(ticketId, 'open', 'processing');
  const replyId = await createReplyRepo(ticketId, content, createdBy);
  if (files && files.length > 0) {
    for (const f of files) {
      await createAttachmentRepo({
        ticket_id: ticketId,
        reply_id: replyId,
        filename: f.filename,
        original_name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
        file_size: f.size,
        mime_type: f.mimetype,
        created_by: createdBy,
      });
    }
  }
  return replyId;
}

module.exports = { findTicket, createReply };
