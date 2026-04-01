const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();

const myEntCtrl = require('../controllers/enterprise/myEnterpriseController');

// Enterprise CRUD
router.get('/my-enterprise', auth, myEntCtrl.get);
router.post('/my-enterprise', auth, V.createEnterprise, validate, myEntCtrl.create);
router.put('/my-enterprise', auth, V.updateEnterprise, validate, myEntCtrl.update);
router.delete('/my-enterprise', auth, myEntCtrl.remove);
router.get('/my-enterprise/all', auth, myEntCtrl.getAll);
router.get('/my-enterprise/projects', auth, myEntCtrl.listProjects);
router.get('/my-enterprise/search', auth, V.searchEnterprise, validate, myEntCtrl.searchEnterprise);
router.get('/my-enterprise/recommended', auth, myEntCtrl.recommendedEnterprises);
router.post('/my-enterprise/join', auth, V.joinEnterprise, validate, myEntCtrl.joinEnterprise);
router.post('/my-enterprise/join-code/regenerate', auth, myEntCtrl.regenerateJoinCode);
router.get('/my-enterprise/join-requests', auth, myEntCtrl.listJoinRequests);
router.post('/my-enterprise/join-requests/:id/approve', auth, myEntCtrl.approveJoinRequest);
router.post('/my-enterprise/join-requests/:id/reject', auth, myEntCtrl.rejectJoinRequest);
router.get('/my-enterprise/my-requests', auth, myEntCtrl.myJoinRequests);
router.get('/my-enterprise/lookup-user', auth, myEntCtrl.lookupUser);
router.put('/my-enterprise/switch', auth, myEntCtrl.switchEnterprise);

// Enterprise Departments
router.post('/my-enterprise/departments', auth, V.addDepartment, validate, myEntCtrl.addDepartment);
router.put('/my-enterprise/departments/:id', auth, V.updateDepartment, validate, myEntCtrl.updateDepartment);
router.delete('/my-enterprise/departments/:id', auth, myEntCtrl.removeDepartment);

// Enterprise Members
router.post('/my-enterprise/members', auth, V.addMember, validate, myEntCtrl.addMember);
router.put('/my-enterprise/members/:id', auth, V.updateMember, validate, myEntCtrl.updateMember);
router.put('/my-enterprise/members/:id/role', auth, V.updateMemberRole, validate, myEntCtrl.updateMemberRole);
router.delete('/my-enterprise/members/:id', auth, myEntCtrl.removeMember);

// Enterprise Roles
router.get('/my-enterprise/roles', auth, myEntCtrl.listRoles);
router.post('/my-enterprise/roles', auth, myEntCtrl.createRole);
router.put('/my-enterprise/roles/:id', auth, myEntCtrl.updateRole);
router.delete('/my-enterprise/roles/:id', auth, myEntCtrl.removeRole);
router.put('/my-enterprise/members/:id/assign-role', auth, myEntCtrl.assignRole);

module.exports = router;
