const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();

const projectManagers = roleGuard('admin', 'sales_manager');
const projectStaff = roleGuard('admin', 'sales_manager', 'tech', 'business', 'member', 'viewer');
const projectEditors = roleGuard('admin', 'sales_manager', 'tech', 'business');

router.post('/projects', auth, projectManagers, V.createProject, validate, require('../controllers/project/createController'));
router.get('/projects/team-users', auth, projectManagers, require('../controllers/project/teamUsersController'));
router.get('/projects', auth, projectStaff, require('../controllers/project/listController'));
router.get('/projects/:id', auth, projectStaff, require('../controllers/project/detailController'));
router.put('/projects/:id', auth, projectEditors, require('../controllers/project/updateController'));
router.delete('/projects/:id', auth, roleGuard('admin'), require('../controllers/project/deleteController'));
router.get('/projects/:id/available-users', auth, projectEditors, require('../controllers/project/availableUsersController'));
router.post('/projects/:id/members', auth, projectEditors, require('../controllers/project/addMemberController'));
router.delete('/projects/:id/members/:userId', auth, projectEditors, require('../controllers/project/removeMemberController'));
router.get('/projects/:id/client-available-users', auth, require('../controllers/project/clientAvailableUsersController'));
router.post('/projects/:id/client-members', auth, require('../controllers/project/addClientMemberController'));
router.delete('/projects/:id/client-members/:userId', auth, require('../controllers/project/removeClientMemberController'));

module.exports = router;
