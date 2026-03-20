const db = require('../../../config/db');

/**
 * 客户智能评分算法 (0-100)
 * 维度权重:
 *   跟进活跃度 30% - 最近跟进时间 + 跟进频率
 *   合同价值   25% - 合同总金额 + 生效合同数
 *   阶段进展   20% - 客户阶段越靠后分越高
 *   联系人深度 10% - 联系人数量
 *   信息完整度 15% - 基本信息填写情况
 */

const STAGE_SCORES = { potential: 10, intent: 40, signed: 70, active: 90, lost: 5 };

async function scoreOne(clientId) {
  const [[client]] = await db.query('SELECT * FROM duijie_clients WHERE id = ? AND is_deleted = 0', [clientId]);
  if (!client) return null;

  const [[{ followCount }]] = await db.query('SELECT COUNT(*) as followCount FROM duijie_follow_ups WHERE client_id = ?', [clientId]);
  const [[lastFollow]] = await db.query('SELECT created_at FROM duijie_follow_ups WHERE client_id = ? ORDER BY created_at DESC LIMIT 1', [clientId]);
  const [[{ contractTotal, contractCount }]] = await db.query('SELECT COALESCE(SUM(amount),0) as contractTotal, COUNT(*) as contractCount FROM duijie_contracts WHERE client_id = ?', [clientId]);
  const [[{ contactCount }]] = await db.query('SELECT COUNT(*) as contactCount FROM duijie_contacts WHERE client_id = ?', [clientId]);

  // 1. 跟进活跃度 (0-30)
  let followScore = 0;
  if (lastFollow && lastFollow.created_at) {
    const daysSince = (Date.now() - new Date(lastFollow.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 3) followScore += 15;
    else if (daysSince <= 7) followScore += 12;
    else if (daysSince <= 14) followScore += 8;
    else if (daysSince <= 30) followScore += 4;
    else followScore += 1;
  }
  followScore += Math.min(15, followCount * 2.5);

  // 2. 合同价值 (0-25)
  let contractScore = 0;
  contractScore += Math.min(15, contractTotal / 10000 * 3);
  contractScore += Math.min(10, contractCount * 5);

  // 3. 阶段进展 (0-20)
  const stageRaw = STAGE_SCORES[client.stage || 'potential'] || 10;
  const stageScore = stageRaw / 100 * 20;

  // 4. 联系人深度 (0-10)
  const contactScore = Math.min(10, contactCount * 4);

  // 5. 信息完整度 (0-15)
  let infoScore = 0;
  if (client.name) infoScore += 3;
  if (client.company) infoScore += 3;
  if (client.email) infoScore += 3;
  if (client.phone) infoScore += 3;
  if (client.channel) infoScore += 3;

  const total = Math.round(Math.min(100, followScore + contractScore + stageScore + contactScore + infoScore));

  return {
    total,
    breakdown: {
      follow: Math.round(followScore),
      contract: Math.round(contractScore),
      stage: Math.round(stageScore),
      contact: Math.round(contactScore),
      info: Math.round(infoScore),
    },
    label: total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : total >= 20 ? 'D' : 'E',
  };
}

async function scoreAll() {
  const [clients] = await db.query('SELECT id FROM duijie_clients WHERE is_deleted = 0');
  const scores = {};
  for (const c of clients) {
    scores[c.id] = await scoreOne(c.id);
  }
  return scores;
}

module.exports = { scoreOne, scoreAll };
