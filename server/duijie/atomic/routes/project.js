const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const enterprisePermGuard = require('../middleware/enterprisePermGuard');
const projectAccessGuard = require('../middleware/projectAccessGuard');
const projectPermGuard = require('../middleware/projectPermGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();

const projectStaff = roleGuard('admin', 'member');
const pag = projectAccessGuard();

router.post('/projects', auth, V.createProject, validate, require('../controllers/project/createController'));
router.get('/projects/team-users', auth, require('../controllers/project/teamUsersController'));
router.get('/projects/export', auth, require('../controllers/project/exportController'));
// 项目加入码搜索
router.get('/projects/search-by-code', auth, require('../controllers/project/searchByCodeController'));
// 项目加入申请
router.post('/projects/join-request', auth, require('../controllers/project/joinRequestController'));
// 项目关联客户企业审批流程 (放在 :id 路由之前)
router.get('/projects/client-requests', auth, require('../controllers/project/clientRequestListController'));
router.get('/projects/client-requests/sent', auth, require('../controllers/project/clientRequestSentController'));
router.post('/projects/client-requests/:id/approve', auth, require('../controllers/project/clientRequestApproveController'));
router.post('/projects/client-requests/:id/reject', auth, require('../controllers/project/clientRequestRejectController'));
router.get('/projects', auth, projectStaff, require('../controllers/project/listController'));
// 项目回收站
router.get('/projects/trash', auth, projectStaff, require('../controllers/project/trashController'));
router.patch('/projects/:id/restore', auth, projectStaff, require('../controllers/project/restoreController'));
router.get('/projects/:id', auth, projectStaff, require('../controllers/project/detailController'));
router.get('/projects/:id/task-title-options', auth, pag, projectPermGuard('can_manage_task'), require('../controllers/project/taskTitleOptionsController'));
router.post('/projects/:id/task-title-history', auth, pag, projectPermGuard('can_manage_task'), require('../controllers/project/rememberTaskTitleController'));
router.delete('/projects/:id/task-title-history/:historyId', auth, pag, projectPermGuard('can_manage_task'), require('../controllers/project/deleteTaskTitleHistoryController'));
router.patch('/projects/:id/task-title-presets', auth, pag, projectPermGuard('can_manage_task'), require('../controllers/project/updatePresetsController'));
router.put('/projects/:id', auth, pag, projectPermGuard('can_edit_project'), require('../controllers/project/updateController'));
router.delete('/projects/:id', auth, pag, projectPermGuard('can_delete_project'), require('../controllers/project/deleteController'));
router.get('/projects/:id/available-users', auth, pag, require('../controllers/project/availableUsersController'));
router.post('/projects/:id/members', auth, pag, projectPermGuard('can_manage_members'), require('../controllers/project/addMemberController'));
router.put('/projects/:id/members/:memberId', auth, pag, projectPermGuard('can_manage_members'), require('../controllers/project/updateMemberRoleController'));
router.delete('/projects/:id/members/:userId', auth, pag, projectPermGuard('can_manage_members'), require('../controllers/project/removeMemberController'));
router.get('/projects/:id/my-perms', auth, require('../controllers/project/myPermsController'));
// 项目角色管理
const projectRoleCtrl = require('../controllers/project/projectRoleController');
router.get('/projects/:id/roles', auth, pag, projectRoleCtrl.list);
router.post('/projects/:id/roles', auth, pag, projectPermGuard('can_manage_roles'), projectRoleCtrl.create);
router.put('/projects/:id/roles/:roleId', auth, pag, projectPermGuard('can_manage_roles'), projectRoleCtrl.update);
router.delete('/projects/:id/roles/:roleId', auth, pag, projectPermGuard('can_manage_roles'), projectRoleCtrl.remove);
router.get('/projects/:id/client-available-users', auth, pag, require('../controllers/project/clientAvailableUsersController'));
router.post('/projects/:id/client-members', auth, pag, projectPermGuard('can_manage_members'), require('../controllers/project/addClientMemberController'));
router.delete('/projects/:id/client-members/:userId', auth, pag, projectPermGuard('can_manage_members'), require('../controllers/project/removeClientMemberController'));
router.post('/projects/:id/client-request', auth, pag, require('../controllers/project/clientRequestController'));
// 项目加入请求管理
router.get('/projects/:id/join-requests', auth, pag, require('../controllers/project/joinRequestListController'));
router.post('/projects/:id/join-requests/:requestId/approve', auth, pag, projectPermGuard('can_manage_members'), require('../controllers/project/joinRequestReviewController'));
router.post('/projects/:id/join-requests/:requestId/reject', auth, pag, projectPermGuard('can_manage_members'), require('../controllers/project/joinRequestReviewController'));
// 项目成员邀请（任何成员可发起，需管理审批）
router.post('/projects/:id/invite', auth, pag, require('../controllers/project/inviteMemberController'));
// 搜索可邀请用户（全局搜索，通过ID/昵称/手机号）
router.get('/projects/:id/search-users', auth, pag, require('../controllers/project/searchUsersForInviteController'));

module.exports = router;
