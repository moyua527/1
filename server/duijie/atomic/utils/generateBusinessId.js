const db = require('../../config/db');

/**
 * 企业 display_id: q + 6位自增 (q000001 ~ q999999)
 */
async function generateEnterpriseDisplayId() {
  const [[row]] = await db.query(
    "SELECT display_id FROM duijie_clients WHERE display_id IS NOT NULL ORDER BY display_id DESC LIMIT 1"
  );
  let seq = 1;
  if (row?.display_id) {
    seq = parseInt(row.display_id.substring(1), 10) + 1;
  }
  return 'q' + String(seq).padStart(6, '0');
}

/**
 * 项目 display_id:
 *   企业项目: x + 企业序号(3位) + 项目序号(6位) = x + 9位
 *   个人项目: x + 00000000 格式的 8位自增 = x + 8位
 */
async function generateProjectDisplayId(enterpriseId) {
  if (enterpriseId) {
    const [[ent]] = await db.query(
      "SELECT display_id FROM duijie_clients WHERE id = ?", [enterpriseId]
    );
    const entSeq = ent?.display_id ? ent.display_id.substring(1) : '000000';
    const entShort = entSeq.slice(-3);

    const [[row]] = await db.query(
      "SELECT display_id FROM duijie_projects WHERE display_id LIKE ? ORDER BY display_id DESC LIMIT 1",
      ['x' + entShort + '%']
    );
    let seq = 1;
    if (row?.display_id) {
      seq = parseInt(row.display_id.substring(4), 10) + 1;
    }
    return 'x' + entShort + String(seq).padStart(6, '0');
  }

  const [[row]] = await db.query(
    "SELECT display_id FROM duijie_projects WHERE display_id LIKE 'x0%' ORDER BY display_id DESC LIMIT 1"
  );
  let seq = 1;
  if (row?.display_id) {
    seq = parseInt(row.display_id.substring(1), 10) + 1;
  }
  return 'x' + String(seq).padStart(8, '0');
}

module.exports = { generateEnterpriseDisplayId, generateProjectDisplayId };
