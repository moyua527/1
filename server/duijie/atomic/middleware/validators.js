const { body, param, query } = require('express-validator');

// === Auth ===
exports.login = [
  body('username').trim().notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码'),
];

exports.register = [
  body('phone').optional().matches(/^\d{11}$/).withMessage('手机号格式不正确'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  body('password').optional().isLength({ min: 6 }).withMessage('密码至少6位'),
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
  body('enterprise_id').isInt({ min: 1 }).withMessage('无效的企业ID'),
];

exports.searchEnterprise = [
  query('name').trim().notEmpty().withMessage('请输入搜索关键词'),
];
