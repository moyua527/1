const express = require('express');
const auth = require('../middleware/auth');
const searchController = require('../controllers/searchController');
const router = express.Router();

router.get('/search', auth, searchController);

module.exports = router;
