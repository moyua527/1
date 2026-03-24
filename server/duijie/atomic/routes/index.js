const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const allStaff = roleGuard('admin', 'tech', 'business', 'member');
const salesTeam = roleGuard('admin', 'business');
const adminOnly = roleGuard('admin');
const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, Date.now() + '-' + decoded);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Auth (no auth middleware)
router.post('/auth/login', require('../controllers/auth/loginController'));
router.post('/auth/send-code', require('../controllers/auth/sendCodeController'));
router.post('/auth/login-by-code', require('../controllers/auth/loginByCodeController'));
router.post('/auth/verify-code', require('../controllers/auth/verifyCodeController'));
router.post('/auth/forgot-password', require('../controllers/auth/forgotPasswordController'));
router.post('/auth/reset-password', require('../controllers/auth/resetPasswordController'));
router.post('/auth/register', require('../controllers/auth/registerController'));
router.get('/auth/register-config', require('../controllers/auth/registerConfigController'));
router.post('/auth/logout', require('../controllers/auth/logoutController'));
router.get('/auth/me', auth, require('../controllers/auth/meController'));
router.put('/auth/profile', auth, require('../controllers/auth/profileController'));

// System config (admin)
const configCtrl = require('../controllers/system/configController');
router.get('/system/invite-code', auth, configCtrl.get);
router.put('/system/invite-code', auth, configCtrl.update);
router.get('/system/config', auth, adminOnly, configCtrl.getAll);
router.put('/system/config', auth, adminOnly, configCtrl.updateAll);

// Dashboard
router.get('/dashboard/stats', auth, require('../controllers/dashboard/statsController'));
router.get('/dashboard/report', auth, require('../controllers/dashboard/reportController'));
router.get('/dashboard/chart', auth, require('../controllers/dashboard/chartController'));

// Projects
const projectManagers = roleGuard('admin');
const projectStaff = roleGuard('admin', 'tech', 'business', 'member', 'client', 'viewer');
const projectEditors = roleGuard('admin', 'tech', 'business');
router.post('/projects', auth, projectManagers, require('../controllers/project/createController'));
router.get('/projects/team-users', auth, projectManagers, require('../controllers/project/teamUsersController'));
router.get('/projects', auth, projectStaff, require('../controllers/project/listController'));
router.get('/projects/:id', auth, projectStaff, require('../controllers/project/detailController'));
router.put('/projects/:id', auth, projectEditors, require('../controllers/project/updateController'));
router.delete('/projects/:id', auth, roleGuard('admin'), require('../controllers/project/deleteController'));
router.get('/projects/:id/available-users', auth, projectEditors, require('../controllers/project/availableUsersController'));
router.post('/projects/:id/members', auth, projectEditors, require('../controllers/project/addMemberController'));
router.delete('/projects/:id/members/:userId', auth, projectEditors, require('../controllers/project/removeMemberController'));

// Clients
router.get('/clients/available-members', auth, salesTeam, require('../controllers/client/availableMembersController'));
router.post('/clients', auth, salesTeam, require('../controllers/client/createController'));
router.get('/clients', auth, roleGuard('admin', 'business'), require('../controllers/client/listController'));
router.get('/clients/:id', auth, roleGuard('admin', 'business', 'member', 'client', 'viewer', 'tech'), require('../controllers/client/detailController'));
router.put('/clients/:id', auth, salesTeam, require('../controllers/client/updateController'));
router.delete('/clients/:id', auth, roleGuard('admin'), require('../controllers/client/deleteController'));
router.post('/clients/import', auth, roleGuard('admin'), require('../controllers/client/importController'));
router.get('/clients/:id/logs', auth, salesTeam, require('../controllers/client/logsController'));
router.get('/clients/:id/score', auth, salesTeam, require('../controllers/client/scoreController'));
router.get('/client-scores', auth, salesTeam, require('../controllers/client/scoresController'));

// AI
router.get('/clients/:clientId/ai-suggestion', auth, salesTeam, require('../controllers/ai/suggestionController'));

// My Enterprise (成员管理自己企业)
const myEntCtrl = require('../controllers/client/myEnterpriseController');
router.get('/my-enterprise', auth, myEntCtrl.get);
router.post('/my-enterprise', auth, myEntCtrl.create);
router.put('/my-enterprise', auth, myEntCtrl.update);
router.delete('/my-enterprise', auth, myEntCtrl.remove);
router.get('/my-enterprise/search', auth, myEntCtrl.searchEnterprise);
router.post('/my-enterprise/join', auth, myEntCtrl.joinEnterprise);
router.get('/my-enterprise/join-requests', auth, myEntCtrl.listJoinRequests);
router.post('/my-enterprise/join-requests/:id/approve', auth, myEntCtrl.approveJoinRequest);
router.post('/my-enterprise/join-requests/:id/reject', auth, myEntCtrl.rejectJoinRequest);
router.get('/my-enterprise/my-requests', auth, myEntCtrl.myJoinRequests);
router.get('/my-enterprise/lookup-user', auth, myEntCtrl.lookupUser);
router.post('/my-enterprise/departments', auth, myEntCtrl.addDepartment);
router.put('/my-enterprise/departments/:id', auth, myEntCtrl.updateDepartment);
router.delete('/my-enterprise/departments/:id', auth, myEntCtrl.removeDepartment);
router.post('/my-enterprise/members', auth, myEntCtrl.addMember);
router.put('/my-enterprise/members/:id', auth, myEntCtrl.updateMember);
router.put('/my-enterprise/members/:id/role', auth, myEntCtrl.updateMemberRole);
router.delete('/my-enterprise/members/:id', auth, myEntCtrl.removeMember);

// Client Members (企业成员)
const clientMembersCtrl = require('../controllers/client/clientMembersController');
router.get('/clients/:id/members', auth, roleGuard('admin', 'business'), clientMembersCtrl.list);
router.post('/clients/:id/members', auth, salesTeam, clientMembersCtrl.create);
router.put('/client-members/:id', auth, salesTeam, clientMembersCtrl.update);
router.delete('/client-members/:id', auth, roleGuard('admin'), clientMembersCtrl.remove);

// Contacts
router.post('/contacts', auth, salesTeam, require('../controllers/contact/createController'));
router.get('/clients/:clientId/contacts', auth, roleGuard('admin', 'business'), require('../controllers/contact/listController'));
router.put('/contacts/:id', auth, salesTeam, require('../controllers/contact/updateController'));
router.delete('/contacts/:id', auth, roleGuard('admin'), require('../controllers/contact/deleteController'));

// Tags
const clientTagsCtrl = require('../controllers/tag/clientTagsController');
router.post('/tags', auth, salesTeam, require('../controllers/tag/createController'));
router.get('/tags', auth, salesTeam, require('../controllers/tag/listController'));
router.delete('/tags/:id', auth, roleGuard('admin'), require('../controllers/tag/deleteController'));
router.get('/clients/:clientId/tags', auth, salesTeam, clientTagsCtrl.get);
router.put('/clients/:clientId/tags', auth, salesTeam, clientTagsCtrl.set);

// Contracts
router.post('/contracts', auth, roleGuard('admin', 'business'), require('../controllers/contract/createController'));
router.get('/clients/:clientId/contracts', auth, roleGuard('admin', 'business'), require('../controllers/contract/listController'));
router.put('/contracts/:id', auth, roleGuard('admin', 'business'), require('../controllers/contract/updateController'));
router.delete('/contracts/:id', auth, roleGuard('admin'), require('../controllers/contract/deleteController'));

// Follow-ups
router.post('/follow-ups', auth, salesTeam, require('../controllers/followUp/createController'));
router.get('/clients/:clientId/follow-ups', auth, roleGuard('admin', 'business'), require('../controllers/followUp/listController'));
router.put('/follow-ups/:id', auth, roleGuard('admin', 'business'), require('../controllers/followUp/updateController'));
router.delete('/follow-ups/:id', auth, roleGuard('admin', 'business'), require('../controllers/followUp/deleteController'));

// Opportunities
router.post('/opportunities', auth, roleGuard('admin', 'business'), require('../controllers/opportunity/createController'));
router.get('/opportunities', auth, roleGuard('admin', 'business'), require('../controllers/opportunity/listController'));
router.put('/opportunities/:id', auth, roleGuard('admin', 'business'), require('../controllers/opportunity/updateController'));
router.delete('/opportunities/:id', auth, roleGuard('admin'), require('../controllers/opportunity/deleteController'));

// Tasks (client can create & list only)
const taskStaff = roleGuard('admin', 'tech', 'business', 'member', 'client', 'viewer');
router.post('/tasks', auth, upload.array('files', 10), require('../controllers/task/createController'));
router.get('/tasks', auth, require('../controllers/task/listController'));
router.put('/tasks/:id', auth, taskStaff, require('../controllers/task/updateController'));
router.patch('/tasks/:id/move', auth, taskStaff, require('../controllers/task/moveController'));
router.delete('/tasks/:id', auth, taskStaff, require('../controllers/task/deleteController'));
router.post('/tasks/:id/attachments', auth, taskStaff, upload.array('files', 10), require('../controllers/task/uploadAttachmentController'));
router.delete('/tasks/attachments/:attachmentId', auth, taskStaff, require('../controllers/task/deleteAttachmentController'));
router.get('/tasks/attachments/:attachmentId/download', auth, require('../controllers/task/downloadAttachmentController'));

// Milestones
router.post('/milestones', auth, require('../controllers/milestone/createController'));
router.get('/milestones', auth, require('../controllers/milestone/listController'));
router.put('/milestones/:id', auth, require('../controllers/milestone/updateController'));
router.delete('/milestones/:id', auth, require('../controllers/milestone/deleteController'));
router.patch('/milestones/:id/toggle', auth, require('../controllers/milestone/toggleController'));

// Files
router.post('/files/upload', auth, upload.single('file'), require('../controllers/file/uploadController'));
router.get('/files/all', auth, require('../controllers/file/listAllController'));
router.get('/files', auth, require('../controllers/file/listController'));
router.delete('/files/:id', auth, require('../controllers/file/deleteController'));
router.get('/files/:id/download', auth, require('../controllers/file/downloadController'));
router.get('/files/:id/preview', auth, require('../controllers/file/previewController'));

// Messages
router.post('/messages', auth, require('../controllers/message/sendController'));
router.get('/messages', auth, require('../controllers/message/listController'));

// Direct Messages
router.get('/dm/conversations', auth, require('../controllers/dm/conversationsController'));
router.get('/dm/users', auth, require('../controllers/dm/usersController'));
router.get('/dm/:userId/history', auth, require('../controllers/dm/historyController'));
router.post('/dm/send', auth, require('../controllers/dm/sendController'));
router.patch('/dm/:id/recall', auth, require('../controllers/dm/recallController'));

// Tickets (all authenticated)
router.post('/tickets', auth, upload.array('files', 10), require('../controllers/ticket/createController'));
router.get('/tickets', auth, require('../controllers/ticket/listController'));
router.get('/tickets/:id', auth, require('../controllers/ticket/detailController'));
router.put('/tickets/:id', auth, require('../controllers/ticket/updateController'));
router.post('/tickets/:id/reply', auth, upload.array('files', 10), require('../controllers/ticket/replyController'));
router.post('/tickets/:id/rate', auth, require('../controllers/ticket/rateController'));

// Invite Links
router.post('/invite-links', auth, adminOnly, require('../controllers/invite/createController'));
router.get('/invite-links', auth, adminOnly, require('../controllers/invite/listController'));
router.get('/invite-links/:token/validate', require('../controllers/invite/validateController'));
router.delete('/invite-links/:id', auth, adminOnly, async (req, res) => {
  try {
    const db = require('../../config/db');
    await db.query('DELETE FROM duijie_invite_links WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Users (admin only)
router.get('/users', auth, adminOnly, require('../controllers/user/listController'));
router.post('/users', auth, adminOnly, require('../controllers/user/createController'));
router.put('/users/:id', auth, adminOnly, require('../controllers/user/updateController'));
router.delete('/users/:id', auth, adminOnly, require('../controllers/user/deleteController'));

// Audit Logs (admin only)
router.get('/audit-logs', auth, adminOnly, require('../controllers/audit/listController'));

// Notifications
router.get('/notifications', auth, require('../controllers/notification/listController'));
router.patch('/notifications/:id/read', auth, require('../controllers/notification/markReadController'));

module.exports = router;
