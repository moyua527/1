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
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.post('/projects/import', auth, upload.single('file'), require('../controllers/project/importController'));
// 项目加入码搜索
router.get('/projects/search-by-code', auth, require('../controllers/project/searchByCodeController'));
// 项目加入申请
router.post('/projects/join-request', auth, require('../controllers/project/joinRequestController'));
// 通过邀请令牌直接加入项目
router.post('/projects/join-by-invite', auth, require('../controllers/project/joinByInviteController'));
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
router.get('/projects/:id/task-title-options', auth, pag, projectPermGuard('can_view_title_options'), require('../controllers/project/taskTitleOptionsController'));
router.post('/projects/:id/task-title-history', auth, pag, projectPermGuard('can_record_title_history'), require('../controllers/project/rememberTaskTitleController'));
router.delete('/projects/:id/task-title-history/:historyId', auth, pag, projectPermGuard('can_delete_title_history'), require('../controllers/project/deleteTaskTitleHistoryController'));
router.patch('/projects/:id/task-title-presets', auth, pag, projectPermGuard('can_edit_title_presets'), require('../controllers/project/updatePresetsController'));
router.put('/projects/:id', auth, pag, projectPermGuard(['can_edit_project_name', 'can_edit_project_desc', 'can_edit_project_status', 'can_send_client_request', 'can_cancel_client_link', 'can_change_client_link']), require('../controllers/project/updateController'));
router.delete('/projects/:id', auth, pag, projectPermGuard('can_delete_project'), require('../controllers/project/deleteController'));
router.get('/projects/:id/available-users', auth, pag, require('../controllers/project/availableUsersController'));
router.post('/projects/:id/members', auth, pag, projectPermGuard('can_add_member'), require('../controllers/project/addMemberController'));
router.put('/projects/:id/members/:memberId', auth, pag, projectPermGuard(['can_update_member_legacy_role', 'can_update_member_ent_role', 'can_update_member_proj_role']), require('../controllers/project/updateMemberRoleController'));
router.delete('/projects/:id/members/:userId', auth, pag, projectPermGuard('can_remove_member'), require('../controllers/project/removeMemberController'));
router.get('/projects/:id/my-perms', auth, require('../controllers/project/myPermsController'));
// 项目角色管理
const projectRoleCtrl = require('../controllers/project/projectRoleController');
router.get('/projects/:id/roles', auth, pag, projectRoleCtrl.list);
router.post('/projects/:id/roles', auth, pag, projectPermGuard('can_create_role'), projectRoleCtrl.create);
router.put('/projects/:id/roles/:roleId', auth, pag, projectPermGuard(['can_edit_role_name', 'can_edit_role_color', 'can_edit_role_perms']), projectRoleCtrl.update);
router.delete('/projects/:id/roles/:roleId', auth, pag, projectPermGuard('can_delete_role'), projectRoleCtrl.remove);
router.get('/projects/:id/client-available-users', auth, pag, require('../controllers/project/clientAvailableUsersController'));
router.post('/projects/:id/client-members', auth, pag, projectPermGuard('can_add_client_member'), require('../controllers/project/addClientMemberController'));
router.delete('/projects/:id/client-members/:userId', auth, pag, projectPermGuard('can_remove_client_member'), require('../controllers/project/removeClientMemberController'));
router.post('/projects/:id/client-request', auth, pag, require('../controllers/project/clientRequestController'));
// 项目加入请求管理
router.get('/projects/:id/join-requests', auth, pag, require('../controllers/project/joinRequestListController'));
router.post('/projects/:id/join-requests/:requestId/approve', auth, pag, projectPermGuard('can_approve_join'), require('../controllers/project/joinRequestReviewController'));
router.post('/projects/:id/join-requests/:requestId/reject', auth, pag, projectPermGuard('can_reject_join'), require('../controllers/project/joinRequestReviewController'));
// 项目成员邀请（任何成员可发起，需管理审批）
router.post('/projects/:id/invite', auth, pag, require('../controllers/project/inviteMemberController'));
// 生成一次性邀请令牌
router.post('/projects/:id/invite-token', auth, pag, require('../controllers/project/generateInviteTokenController'));
// 搜索可邀请用户（全局搜索，通过ID/昵称/手机号）
router.get('/projects/:id/search-users', auth, pag, require('../controllers/project/searchUsersForInviteController'));
// 项目活动动态
router.get('/projects/:id/activity', auth, pag, require('../controllers/project/activityController'));

module.exports = router;
