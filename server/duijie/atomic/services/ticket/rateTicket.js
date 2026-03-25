const findBasicByIdRepo = require('../../repositories/ticket/findBasicByIdRepo');
const rateRepo = require('../../repositories/ticket/rateRepo');

async function findTicket(ticketId) {
  return await findBasicByIdRepo(ticketId);
}

async function rate(ticketId, rating, ratingComment) {
  await rateRepo(ticketId, rating, ratingComment);
}

module.exports = { findTicket, rate };
