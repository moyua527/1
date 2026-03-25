const bcrypt = require('bcryptjs');
const generateInviteCode = require('../../utils/generateInviteCode');
const findByUsernameRepo = require('../../repositories/user/findByUsernameRepo');
const createRepo = require('../../repositories/user/createRepo');

module.exports = async ({ username, password, nickname, role, client_id, manager_id }) => {
  const existing = await findByUsernameRepo(username);
  if (existing.length > 0) return { duplicate: true };

  const personalCode = await generateInviteCode();
  const hashedPassword = await bcrypt.hash(password, 10);
  const insertId = await createRepo({
    username,
    password: hashedPassword,
    nickname: nickname || username,
    role,
    client_id,
    manager_id,
    personal_invite_code: personalCode,
  });
  return { id: insertId };
};
