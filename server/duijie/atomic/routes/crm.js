const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();

const staff = roleGuard('admin', 'member');

// Contacts
router.get('/contacts', auth, staff, require('../controllers/contact/listAllController'));
router.post('/contacts', auth, staff, V.createContact, validate, require('../controllers/contact/createController'));
router.get('/clients/:clientId/contacts', auth, staff, require('../controllers/contact/listController'));
router.put('/contacts/:id', auth, staff, V.updateContact, validate, require('../controllers/contact/updateController'));
router.delete('/contacts/:id', auth, roleGuard('admin'), require('../controllers/contact/deleteController'));

// Tags
const clientTagsCtrl = require('../controllers/tag/clientTagsController');
router.post('/tags', auth, staff, require('../controllers/tag/createController'));
router.get('/tags', auth, staff, require('../controllers/tag/listController'));
router.delete('/tags/:id', auth, roleGuard('admin'), require('../controllers/tag/deleteController'));
router.get('/clients/:clientId/tags', auth, staff, clientTagsCtrl.get);
router.put('/clients/:clientId/tags', auth, staff, clientTagsCtrl.set);

// Contracts
router.post('/contracts', auth, staff, V.createContract, validate, require('../controllers/contract/createController'));
router.get('/clients/:clientId/contracts', auth, staff, require('../controllers/contract/listController'));
router.put('/contracts/:id', auth, staff, V.updateContract, validate, require('../controllers/contract/updateController'));
router.delete('/contracts/:id', auth, roleGuard('admin'), require('../controllers/contract/deleteController'));

// Follow-ups
router.get('/follow-ups', auth, staff, require('../controllers/followUp/listAllController'));
router.post('/follow-ups', auth, staff, V.createFollowUp, validate, require('../controllers/followUp/createController'));
router.get('/clients/:clientId/follow-ups', auth, staff, require('../controllers/followUp/listController'));
router.put('/follow-ups/:id', auth, staff, V.updateFollowUp, validate, require('../controllers/followUp/updateController'));
router.delete('/follow-ups/:id', auth, staff, require('../controllers/followUp/deleteController'));

module.exports = router;
