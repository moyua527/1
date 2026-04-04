const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();
const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: (_, file, cb) => cb(null, /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype)) });

router.post('/auth/login', V.login, validate, require('../controllers/auth/loginController'));
router.post('/auth/send-code', require('../controllers/auth/sendCodeController'));
router.post('/auth/login-by-code', require('../controllers/auth/loginByCodeController'));
router.post('/auth/verify-code', require('../controllers/auth/verifyCodeController'));
router.post('/auth/forgot-password', require('../controllers/auth/forgotPasswordController'));
router.post('/auth/reset-password', require('../controllers/auth/resetPasswordController'));
router.post('/auth/register', V.register, validate, require('../controllers/auth/registerController'));
router.get('/auth/register-config', require('../controllers/auth/registerConfigController'));
router.post('/auth/logout', require('../controllers/auth/logoutController'));
router.post('/auth/refresh', require('../controllers/auth/refreshController'));
router.get('/auth/me', auth, require('../controllers/auth/meController'));
router.put('/auth/profile', auth, V.profile, validate, require('../controllers/auth/profileController'));
router.post('/auth/avatar', auth, avatarUpload.single('avatar'), require('../controllers/auth/avatarController'));
router.put('/auth/change-password', auth, require('../controllers/auth/changePasswordController'));
router.get('/auth/sessions', auth, require('../controllers/auth/sessionsListController'));
router.delete('/auth/sessions/all', auth, require('../controllers/auth/sessionRevokeAllController'));
router.delete('/auth/sessions/:id', auth, require('../controllers/auth/sessionRevokeController'));

module.exports = router;
