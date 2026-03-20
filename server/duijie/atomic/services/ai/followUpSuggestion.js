const db = require('../../../config/db');
const { chat } = require('./llmService');

module.exports = async (clientId) => {
  const [[client]] = await db.query('SELECT * FROM duijie_clients WHERE id = ? AND is_deleted = 0', [clientId]);
  if (!client) throw new Error('客户不存在');

  const [followUps] = await db.query(
    'SELECT content, follow_type, next_follow_date, created_at FROM duijie_follow_ups WHERE client_id = ? ORDER BY created_at DESC LIMIT 10',
    [clientId]
  );
  const [contracts] = await db.query(
    'SELECT title, amount, status, signed_date FROM duijie_contracts WHERE client_id = ? ORDER BY created_at DESC LIMIT 5',
    [clientId]
  );
  const [contacts] = await db.query(
    'SELECT name, position, is_primary FROM duijie_contacts WHERE client_id = ?',
    [clientId]
  );

  const stageLabels = { potential: '潜在', intent: '意向', signed: '签约', active: '合作中', lost: '流失' };
  const typeLabels = { phone: '电话', wechat: '微信', visit: '拜访', email: '邮件', other: '其他' };

  let context = `客户信息:\n`;
  context += `- 名称: ${client.name}\n`;
  context += `- 公司: ${client.company || '未知'}\n`;
  context += `- 阶段: ${stageLabels[client.stage] || '潜在'}\n`;
  context += `- 渠道: ${client.channel || '未知'}\n`;

  if (contacts.length > 0) {
    context += `\n联系人:\n`;
    contacts.forEach(c => {
      context += `- ${c.name}${c.position ? ` (${c.position})` : ''}${c.is_primary ? ' [主要]' : ''}\n`;
    });
  }

  if (followUps.length > 0) {
    context += `\n最近跟进记录 (最新在前):\n`;
    followUps.forEach(f => {
      const date = new Date(f.created_at).toLocaleDateString('zh-CN');
      context += `- [${date}] ${typeLabels[f.follow_type] || f.follow_type}: ${f.content}`;
      if (f.next_follow_date) context += ` (计划下次: ${new Date(f.next_follow_date).toLocaleDateString('zh-CN')})`;
      context += '\n';
    });
  } else {
    context += '\n暂无跟进记录。\n';
  }

  if (contracts.length > 0) {
    context += `\n合同情况:\n`;
    contracts.forEach(c => {
      context += `- ${c.title}: ¥${c.amount} (${c.status})\n`;
    });
  }

  const messages = [
    {
      role: 'system',
      content: `你是一位资深的CRM销售顾问。根据客户的完整信息和历史跟进记录，给出专业的下一步跟进建议。
要求:
1. 分析当前客户状态和跟进节奏
2. 给出具体的跟进建议（时机、方式、话题）
3. 指出潜在风险和机会
4. 建议控制在200字以内，简洁实用
请用中文回复。`,
    },
    {
      role: 'user',
      content: context,
    },
  ];

  return await chat(messages, { temperature: 0.7, max_tokens: 512 });
};
