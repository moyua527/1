const createRepo = require('../../repositories/ticket/createRepo');
const createAttachmentRepo = require('../../repositories/ticket/createAttachmentRepo');

module.exports = async (data, files) => {
  const ticketId = await createRepo(data);
  if (files && files.length > 0) {
    for (const f of files) {
      await createAttachmentRepo({
        ticket_id: ticketId,
        reply_id: null,
        filename: f.filename,
        original_name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
        file_size: f.size,
        mime_type: f.mimetype,
        created_by: data.created_by,
      });
    }
  }
  return ticketId;
};
