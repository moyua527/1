const express = require('express');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const upload = require('./upload');
const router = express.Router();

// Messages
router.post('/messages', auth, V.sendMessage, validate, require('../controllers/message/sendController'));
router.get('/messages', auth, require('../controllers/message/listController'));

// Direct Messages
router.get('/dm/conversations', auth, require('../controllers/dm/conversationsController'));
router.get('/dm/users', auth, require('../controllers/dm/usersController'));
router.get('/dm/:userId/history', auth, require('../controllers/dm/historyController'));
router.post('/dm/send', auth, require('../controllers/dm/sendController'));
router.patch('/dm/:id/recall', auth, require('../controllers/dm/recallController'));

// Tickets
router.post('/tickets', auth, upload.array('files', 10), require('../controllers/ticket/createController'));
router.get('/tickets', auth, require('../controllers/ticket/listController'));
router.get('/tickets/:id', auth, require('../controllers/ticket/detailController'));
router.put('/tickets/:id', auth, require('../controllers/ticket/updateController'));
router.post('/tickets/:id/reply', auth, upload.array('files', 10), require('../controllers/ticket/replyController'));
router.post('/tickets/:id/rate', auth, require('../controllers/ticket/rateController'));

// Notifications
router.get('/notifications', auth, require('../controllers/notification/listController'));
router.patch('/notifications/:id/read', auth, require('../controllers/notification/markReadController'));

module.exports = router;
