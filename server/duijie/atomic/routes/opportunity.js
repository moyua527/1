const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();

const staff = roleGuard('admin', 'member');

router.post('/opportunities', auth, staff, V.createOpportunity, validate, require('../controllers/opportunity/createController'));
router.get('/opportunities', auth, staff, require('../controllers/opportunity/listController'));
router.put('/opportunities/:id', auth, staff, V.updateOpportunity, validate, require('../controllers/opportunity/updateController'));
router.delete('/opportunities/:id', auth, roleGuard('admin'), require('../controllers/opportunity/deleteController'));

module.exports = router;
