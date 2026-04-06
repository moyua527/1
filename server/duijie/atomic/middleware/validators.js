const { body, param, query } = require('express-validator');

// === Auth ===
exports.login = [
  body('username').trim().notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码'),
];

exports.twoFactorLoginVerify = [
  body('challenge_token').trim().notEmpty().withMessage('缺少验证票据'),
  body('totp_code').matches(/^\d{6}$/).withMessage('动态验证码应为6位数字'),
];

exports.twoFactorCode = [
  body('totp_code').matches(/^\d{6}$/).withMessage('动态验证码应为6位数字'),
];

exports.register = [
  body('email').trim().isEmail().withMessage('请输入有效的邮箱地址'),
];

exports.profile = [
  body('nickname').optional().trim().isLength({ max: 50 }).withMessage('昵称不超过50字'),
  body('phone').optional().matches(/^\d{11}$/).withMessage('手机号格式不正确'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
];

// === Enterprise ===
exports.createEnterprise = [
  body('name').trim().notEmpty().withMessage('请输入企业名称').isLength({ max: 100 }).withMessage('企业名称不超过100字'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{7,15}$/).withMessage('电话格式不正确'),
  body('credit_code').optional({ values: 'falsy' }).isLength({ min: 18, max: 18 }).withMessage('统一社会信用代码应为18位'),
  body('website').optional({ values: 'falsy' }).isLength({ max: 200 }).withMessage('官网地址不超过200字'),
];

exports.updateEnterprise = [
  body('name').trim().notEmpty().withMessage('请输入企业名称').isLength({ max: 100 }).withMessage('企业名称不超过100字'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{7,15}$/).withMessage('电话格式不正确'),
  body('credit_code').optional({ values: 'falsy' }).isLength({ min: 18, max: 18 }).withMessage('统一社会信用代码应为18位'),
];

// === Members ===
exports.addMember = [
  body('name').trim().notEmpty().withMessage('请输入成员姓名').isLength({ max: 100 }).withMessage('姓名不超过100字'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{7,15}$/).withMessage('电话格式不正确'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确'),
  body('employee_id').optional({ values: 'falsy' }).isLength({ max: 50 }).withMessage('工号不超过50字'),
];

exports.updateMember = [
  param('id').isInt({ min: 1 }).withMessage('无效的成员ID'),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('姓名不超过100字'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{7,15}$/).withMessage('电话格式不正确'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确'),
];

exports.updateMemberRole = [
  param('id').isInt({ min: 1 }).withMessage('无效的成员ID'),
  body('role').isIn(['admin', 'member']).withMessage('角色只能是admin或member'),
];

// === Departments ===
exports.addDepartment = [
  body('name').trim().notEmpty().withMessage('请输入部门名称').isLength({ max: 100 }).withMessage('部门名称不超过100字'),
  body('parent_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('无效的上级部门ID'),
];

exports.updateDepartment = [
  param('id').isInt({ min: 1 }).withMessage('无效的部门ID'),
  body('name').trim().notEmpty().withMessage('请输入部门名称').isLength({ max: 100 }).withMessage('部门名称不超过100字'),
];

// === ID params ===
exports.idParam = [
  param('id').isInt({ min: 1 }).withMessage('无效的ID'),
];

// === Clients ===
exports.createClient = [
  body('name').trim().notEmpty().withMessage('请输入客户名称').isLength({ max: 100 }).withMessage('名称不超过100字'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{7,15}$/).withMessage('电话格式不正确'),
];

// === Projects ===
exports.createProject = [
  body('name').trim().notEmpty().withMessage('请输入项目名称').isLength({ max: 200 }).withMessage('项目名称不超过200字'),
];

// === Tasks ===
exports.createTask = [
  body('title').trim().notEmpty().withMessage('请输入任务标题').isLength({ max: 200 }).withMessage('任务标题不超过200字'),
];

// === Messages ===
exports.sendMessage = [
  body('content').trim().notEmpty().withMessage('消息不能为空').isLength({ max: 5000 }).withMessage('消息不超过5000字'),
];

// === Join enterprise ===
exports.joinEnterprise = [
  body('enterprise_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('无效的企业ID'),
  body('join_code').optional({ values: 'falsy' }).trim().isLength({ min: 6, max: 20 }).withMessage('推荐码长度应为6到20位'),
  body().custom((value) => {
    const hasEnterpriseId = !!value?.enterprise_id;
    const hasJoinCode = !!String(value?.join_code || '').trim();
    if (!hasEnterpriseId && !hasJoinCode) throw new Error('请选择企业或输入推荐码');
    return true;
  }),
];

exports.searchEnterprise = [
  query('name').trim().notEmpty().withMessage('请输入搜索关键词'),
];

// === Contacts ===
exports.createContact = [
  body('client_id').isInt({ min: 1 }).withMessage('无效的客户ID'),
  body('name').trim().notEmpty().withMessage('请输入联系人姓名').isLength({ max: 100 }).withMessage('姓名不超过100字'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{7,15}$/).withMessage('电话格式不正确'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确'),
];

exports.updateContact = [
  param('id').isInt({ min: 1 }).withMessage('无效的联系人ID'),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('姓名不超过100字'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{7,15}$/).withMessage('电话格式不正确'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确'),
];

// === Contracts ===
exports.createContract = [
  body('client_id').isInt({ min: 1 }).withMessage('无效的客户ID'),
  body('title').trim().notEmpty().withMessage('请输入合同标题').isLength({ max: 200 }).withMessage('标题不超过200字'),
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('金额格式不正确'),
];

exports.updateContract = [
  param('id').isInt({ min: 1 }).withMessage('无效的合同ID'),
  body('title').optional().trim().isLength({ max: 200 }).withMessage('标题不超过200字'),
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('金额格式不正确'),
];

// === Follow-ups ===
exports.createFollowUp = [
  body('client_id').isInt({ min: 1 }).withMessage('无效的客户ID'),
  body('content').trim().notEmpty().withMessage('请输入跟进内容').isLength({ max: 5000 }).withMessage('内容不超过5000字'),
];

exports.updateFollowUp = [
  param('id').isInt({ min: 1 }).withMessage('无效的跟进ID'),
  body('content').optional().trim().isLength({ max: 5000 }).withMessage('内容不超过5000字'),
];

// === Opportunities ===
exports.createOpportunity = [
  body('title').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('标题不超过200字'),
  body('name').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('名称不超过200字'),
  body('client_id').optional().isInt({ min: 1 }).withMessage('无效的客户ID'),
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('金额格式不正确'),
  body().custom((value) => {
    const title = String(value?.title || value?.name || '').trim();
    if (!title) throw new Error('请输入商机标题');
    return true;
  }),
];

exports.updateOpportunity = [
  param('id').isInt({ min: 1 }).withMessage('无效的商机ID'),
  body('title').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('标题不超过200字'),
  body('name').optional().trim().isLength({ max: 200 }).withMessage('名称不超过200字'),
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('金额格式不正确'),
];

// === Direct Messages ===
exports.sendDm = [
  body('to_user_id').isInt({ min: 1 }).withMessage('无效的接收者ID'),
  body('content').trim().notEmpty().withMessage('消息不能为空').isLength({ max: 5000 }).withMessage('消息不超过5000字'),
];

// === Users (admin) ===
exports.createUser = [
  body('username').trim().notEmpty().withMessage('请输入用户名').isLength({ max: 50 }).withMessage('用户名不超过50字'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('role').optional().isIn(['admin', 'member', 'client']).withMessage('角色无效'),
];

exports.updateUser = [
  param('id').isInt({ min: 1 }).withMessage('无效的用户ID'),
  body('nickname').optional().trim().isLength({ max: 100 }).withMessage('昵称不超过100字'),
  body('role').optional().isIn(['admin', 'member', 'client']).withMessage('角色无效'),
];

// === Client update ===
exports.updateClient = [
  param('id').isInt({ min: 1 }).withMessage('无效的客户ID'),
  body('name').optional().trim().isLength({ max: 100 }).withMessage('名称不超过100字'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('邮箱格式不正确'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{7,15}$/).withMessage('电话格式不正确'),
];
