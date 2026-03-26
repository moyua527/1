const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const enterprisePermGuard = require('../middleware/enterprisePermGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();

const staff = roleGuard('admin', 'member');

// Clients
router.get('/clients/available-members', auth, staff, require('../controllers/client/availableMembersController'));
router.post('/clients', auth, roleGuard('admin', 'member', { soft: true }), enterprisePermGuard('can_manage_client'), V.createClient, validate, require('../controllers/client/createController'));
router.get('/clients', auth, staff, require('../controllers/client/listController'));
router.get('/clients/:id', auth, staff, require('../controllers/client/detailController'));
router.put('/clients/:id', auth, staff, require('../controllers/client/updateController'));
router.delete('/clients/:id', auth, roleGuard('admin'), require('../controllers/client/deleteController'));
router.post('/clients/import', auth, roleGuard('admin'), require('../controllers/client/importController'));
router.get('/clients/:id/logs', auth, staff, require('../controllers/client/logsController'));
router.get('/clients/:id/score', auth, staff, require('../controllers/client/scoreController'));
router.get('/client-scores', auth, staff, require('../controllers/client/scoresController'));

// AI
router.get('/clients/:clientId/ai-suggestion', auth, staff, require('../controllers/ai/suggestionController'));

// My Enterprise
const myEntCtrl = require('../controllers/client/myEnterpriseController');
router.get('/my-enterprise', auth, myEntCtrl.get);
router.post('/my-enterprise', auth, V.createEnterprise, validate, myEntCtrl.create);
router.put('/my-enterprise', auth, V.updateEnterprise, validate, myEntCtrl.update);
router.delete('/my-enterprise', auth, myEntCtrl.remove);
router.get('/my-enterprise/all', auth, myEntCtrl.getAll);
router.get('/my-enterprise/projects', auth, myEntCtrl.listProjects);
router.get('/my-enterprise/search', auth, V.searchEnterprise, validate, myEntCtrl.searchEnterprise);
router.post('/my-enterprise/join', auth, V.joinEnterprise, validate, myEntCtrl.joinEnterprise);
router.get('/my-enterprise/join-requests', auth, myEntCtrl.listJoinRequests);
router.post('/my-enterprise/join-requests/:id/approve', auth, myEntCtrl.approveJoinRequest);
router.post('/my-enterprise/join-requests/:id/reject', auth, myEntCtrl.rejectJoinRequest);
router.get('/my-enterprise/my-requests', auth, myEntCtrl.myJoinRequests);
router.get('/my-enterprise/lookup-user', auth, myEntCtrl.lookupUser);
router.post('/my-enterprise/departments', auth, V.addDepartment, validate, myEntCtrl.addDepartment);
router.put('/my-enterprise/departments/:id', auth, V.updateDepartment, validate, myEntCtrl.updateDepartment);
router.delete('/my-enterprise/departments/:id', auth, myEntCtrl.removeDepartment);
router.post('/my-enterprise/members', auth, V.addMember, validate, myEntCtrl.addMember);
router.put('/my-enterprise/members/:id', auth, V.updateMember, validate, myEntCtrl.updateMember);
router.put('/my-enterprise/members/:id/role', auth, V.updateMemberRole, validate, myEntCtrl.updateMemberRole);
router.delete('/my-enterprise/members/:id', auth, myEntCtrl.removeMember);
router.put('/my-enterprise/switch', auth, myEntCtrl.switchEnterprise);

// Enterprise Roles
router.get('/my-enterprise/roles', auth, myEntCtrl.listRoles);
router.post('/my-enterprise/roles', auth, myEntCtrl.createRole);
router.put('/my-enterprise/roles/:id', auth, myEntCtrl.updateRole);
router.delete('/my-enterprise/roles/:id', auth, myEntCtrl.removeRole);
router.put('/my-enterprise/members/:id/assign-role', auth, myEntCtrl.assignRole);

// Client Members
const clientMembersCtrl = require('../controllers/client/clientMembersController');
router.get('/clients/:id/members', auth, staff, clientMembersCtrl.list);
router.post('/clients/:id/members', auth, staff, clientMembersCtrl.create);
router.put('/client-members/:id', auth, staff, clientMembersCtrl.update);
router.delete('/client-members/:id', auth, roleGuard('admin'), clientMembersCtrl.remove);

// Contacts
router.post('/contacts', auth, staff, require('../controllers/contact/createController'));
router.get('/clients/:clientId/contacts', auth, staff, require('../controllers/contact/listController'));
router.put('/contacts/:id', auth, staff, require('../controllers/contact/updateController'));
router.delete('/contacts/:id', auth, roleGuard('admin'), require('../controllers/contact/deleteController'));

// Tags
const clientTagsCtrl = require('../controllers/tag/clientTagsController');
router.post('/tags', auth, staff, require('../controllers/tag/createController'));
router.get('/tags', auth, staff, require('../controllers/tag/listController'));
router.delete('/tags/:id', auth, roleGuard('admin'), require('../controllers/tag/deleteController'));
router.get('/clients/:clientId/tags', auth, staff, clientTagsCtrl.get);
router.put('/clients/:clientId/tags', auth, staff, clientTagsCtrl.set);

// Contracts
router.post('/contracts', auth, staff, require('../controllers/contract/createController'));
router.get('/clients/:clientId/contracts', auth, staff, require('../controllers/contract/listController'));
router.put('/contracts/:id', auth, staff, require('../controllers/contract/updateController'));
router.delete('/contracts/:id', auth, roleGuard('admin'), require('../controllers/contract/deleteController'));

// Follow-ups
router.post('/follow-ups', auth, staff, require('../controllers/followUp/createController'));
router.get('/clients/:clientId/follow-ups', auth, staff, require('../controllers/followUp/listController'));
router.put('/follow-ups/:id', auth, staff, require('../controllers/followUp/updateController'));
router.delete('/follow-ups/:id', auth, staff, require('../controllers/followUp/deleteController'));

// Opportunities
router.post('/opportunities', auth, staff, require('../controllers/opportunity/createController'));
router.get('/opportunities', auth, staff, require('../controllers/opportunity/listController'));
router.put('/opportunities/:id', auth, staff, require('../controllers/opportunity/updateController'));
router.delete('/opportunities/:id', auth, roleGuard('admin'), require('../controllers/opportunity/deleteController'));

module.exports = router;
