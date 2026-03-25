const db = require('../../../config/db');
const { chat } = require('./llmService');
const logger = require('../../../config/logger');

const stageLabels = { potential: '潜在', intent: '意向', signed: '签约', active: '合作中', lost: '流失' };
const typeLabels = { phone: '电话', wechat: '微信', visit: '拜访', email: '邮件', other: '其他' };
const channelLabels = { referral: '转介绍', website: '官网', exhibition: '展会', cold_call: '陌拜', social: '社交媒体', advertising: '广告', other: '其他' };

function buildRuleBasedSuggestion(client, followUps, contracts, contacts) {
  const tips = [];
  const stage = client.stage || 'potential';
  const daysSinceLastFollowUp = followUps.length > 0
    ? Math.floor((Date.now() - new Date(followUps[0].created_at).getTime()) / 86400000)
    : null;

  if (daysSinceLastFollowUp === null) {
    tips.push('⚠️ 该客户尚无跟进记录，建议尽快进行首次联络，了解客户需求和痛点。');
  } else if (daysSinceLastFollowUp > 30) {
    tips.push(`⚠️ 距上次跟进已 ${daysSinceLastFollowUp} 天，客户可能已遗忘，建议立即跟进以维持关系。`);
  } else if (daysSinceLastFollowUp > 14) {
    tips.push(`📋 距上次跟进 ${daysSinceLastFollowUp} 天，建议近期安排一次跟进。`);
  } else {
    tips.push(`✅ 跟进节奏良好（${daysSinceLastFollowUp} 天前有跟进）。`);
  }

  if (stage === 'potential') {
    tips.push('💡 客户处于"潜在"阶段，建议重点了解需求，提供案例展示以建立信任，推动向"意向"转化。');
  } else if (stage === 'intent') {
    tips.push('💡 客户已有意向，建议准备方案报价，安排高层拜访或产品演示，加速签约进程。');
  } else if (stage === 'signed') {
    tips.push('💡 客户已签约，建议关注项目启动与交付进度，确保客户体验良好。');
  } else if (stage === 'active') {
    tips.push('💡 合作中客户，建议定期回访了解使用情况，挖掘增购/续费机会。');
  } else if (stage === 'lost') {
    tips.push('💡 客户已流失，可分析流失原因，评估是否有挽回价值，适时尝试重新激活。');
  }

  if (contracts.length > 0) {
    const totalAmount = contracts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
    tips.push(`📊 历史合同 ${contracts.length} 笔，总金额 ¥${totalAmount.toLocaleString()}。`);
  }

  if (contacts.length === 0) {
    tips.push('⚠️ 暂无联系人信息，建议补充关键决策人联系方式。');
  }

  const nextFollowDate = followUps.find(f => f.next_follow_date);
  if (nextFollowDate) {
    const d = new Date(nextFollowDate.next_follow_date);
    if (d >= new Date()) {
      tips.push(`📅 计划下次跟进：${d.toLocaleDateString('zh-CN')}，请及时准备。`);
    } else {
      tips.push(`⚠️ 计划跟进日期（${d.toLocaleDateString('zh-CN')}）已过期，请尽快安排跟进。`);
    }
  }

  return tips.join('\n\n');
}

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
  const [opportunities] = await db.query(
    'SELECT title, amount, probability, stage FROM duijie_opportunities WHERE client_id = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT 5',
    [clientId]
  );

  if (!process.env.LLM_API_KEY) {
    return buildRuleBasedSuggestion(client, followUps, contracts, contacts);
  }

  let context = `客户信息:\n`;
  context += `- 名称: ${client.name}\n`;
  context += `- 公司: ${client.company || '未知'}\n`;
  context += `- 阶段: ${stageLabels[client.stage] || '潜在'}\n`;
  context += `- 渠道: ${channelLabels[client.channel] || client.channel || '未知'}\n`;
  if (client.score) context += `- 客户评级: ${client.score}\n`;

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

  if (opportunities.length > 0) {
    const oppStageLabels = { lead: '线索', qualified: '验证', proposal: '方案', negotiation: '谈判', won: '赢单', lost: '丢单' };
    context += `\n商机情况:\n`;
    opportunities.forEach(o => {
      context += `- ${o.title}: ¥${o.amount} (${oppStageLabels[o.stage] || o.stage}, 概率${o.probability}%)\n`;
    });
  }

  const messages = [
    {
      role: 'system',
      content: `你是一位资深的CRM销售顾问。根据客户的完整信息和历史跟进记录，给出专业的下一步跟进建议。
要求:
1. 分析当前客户状态和跟进节奏（是否存在跟进断档）
2. 给出具体的跟进建议（时机、方式、话题、需要准备的材料）
3. 指出潜在风险和机会
4. 如有商机，分析推进策略
5. 建议控制在300字以内，分点列出，简洁实用
请用中文回复。`,
    },
    {
      role: 'user',
      content: context,
    },
  ];

  try {
    return await chat(messages, { temperature: 0.7, max_tokens: 512 });
  } catch (err) {
    logger.warn('LLM API 调用失败，降级为规则建议: ' + err.message);
    return buildRuleBasedSuggestion(client, followUps, contracts, contacts);
  }
};
