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
router.put('/clients/:id', auth, staff, V.updateClient, validate, require('../controllers/client/updateController'));
router.delete('/clients/:id', auth, roleGuard('admin'), require('../controllers/client/deleteController'));
router.post('/clients/import', auth, roleGuard('admin'), require('../controllers/client/importController'));
router.get('/clients/:id/logs', auth, staff, require('../controllers/client/logsController'));
router.get('/clients/:id/score', auth, staff, require('../controllers/client/scoreController'));
router.get('/client-scores', auth, staff, require('../controllers/client/scoresController'));

// Client Requests (添加客户审批)
const clientReqCtrl = require('../controllers/client/clientRequestController');
router.post('/client-requests', auth, staff, clientReqCtrl.send);
router.get('/client-requests/incoming', auth, staff, clientReqCtrl.incoming);
router.get('/client-requests/outgoing', auth, staff, clientReqCtrl.outgoing);
router.post('/client-requests/:id/approve', auth, staff, clientReqCtrl.approve);
router.post('/client-requests/:id/reject', auth, staff, clientReqCtrl.reject);

// AI
router.get('/clients/:clientId/ai-suggestion', auth, staff, require('../controllers/ai/suggestionController'));

// Client Members
const clientMembersCtrl = require('../controllers/client/clientMembersController');
router.get('/clients/:id/members', auth, staff, clientMembersCtrl.list);
router.post('/clients/:id/members', auth, staff, clientMembersCtrl.create);
router.put('/client-members/:id', auth, staff, clientMembersCtrl.update);
router.delete('/client-members/:id', auth, roleGuard('admin'), clientMembersCtrl.remove);

module.exports = router;
