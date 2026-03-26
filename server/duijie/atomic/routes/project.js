const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const enterprisePermGuard = require('../middleware/enterprisePermGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();

const projectStaff = roleGuard('admin', 'sales_manager', 'tech', 'business', 'member', 'viewer', 'marketing');

router.post('/projects', auth, V.createProject, validate, require('../controllers/project/createController'));
router.get('/projects/team-users', auth, require('../controllers/project/teamUsersController'));
router.get('/projects/export', auth, require('../controllers/project/exportController'));
router.get('/projects', auth, projectStaff, require('../controllers/project/listController'));
router.get('/projects/:id', auth, projectStaff, require('../controllers/project/detailController'));
router.put('/projects/:id', auth, require('../controllers/project/updateController'));
router.delete('/projects/:id', auth, require('../controllers/project/deleteController'));
router.get('/projects/:id/available-users', auth, require('../controllers/project/availableUsersController'));
router.post('/projects/:id/members', auth, require('../controllers/project/addMemberController'));
router.put('/projects/:id/members/:memberId', auth, require('../controllers/project/updateMemberRoleController'));
router.delete('/projects/:id/members/:userId', auth, require('../controllers/project/removeMemberController'));
router.get('/projects/:id/my-perms', auth, require('../controllers/project/myPermsController'));
router.get('/projects/:id/client-available-users', auth, require('../controllers/project/clientAvailableUsersController'));
router.post('/projects/:id/client-members', auth, require('../controllers/project/addClientMemberController'));
router.delete('/projects/:id/client-members/:userId', auth, require('../controllers/project/removeClientMemberController'));

module.exports = router;
