const express = require('express');
const router = express.Router();

router.use(require('./auth'));
router.use(require('./admin'));
router.use(require('./project'));
router.use(require('./client'));
router.use(require('./task'));
router.use(require('./communication'));
router.use(require('./partner'));

module.exports = router;
