const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const V = require('../middleware/validators');
const router = express.Router();
const twoFactorCtrl = require('../controllers/auth/twoFactorController');

router.post('/auth/login', V.login, validate, require('../controllers/auth/loginController'));
router.post('/auth/send-code', require('../controllers/auth/sendCodeController'));
router.post('/auth/login-by-code', require('../controllers/auth/loginByCodeController'));
router.post('/auth/2fa/login/verify', V.twoFactorLoginVerify, validate, twoFactorCtrl.verifyLogin);
router.post('/auth/verify-code', require('../controllers/auth/verifyCodeController'));
router.post('/auth/forgot-password', require('../controllers/auth/forgotPasswordController'));
router.post('/auth/reset-password', require('../controllers/auth/resetPasswordController'));
router.post('/auth/register', V.register, validate, require('../controllers/auth/registerController'));
router.get('/auth/register-config', require('../controllers/auth/registerConfigController'));
router.post('/auth/logout', require('../controllers/auth/logoutController'));
router.get('/auth/me', auth, require('../controllers/auth/meController'));
router.put('/auth/profile', auth, V.profile, validate, require('../controllers/auth/profileController'));
router.get('/auth/2fa/status', auth, twoFactorCtrl.status);
router.post('/auth/2fa/setup', auth, twoFactorCtrl.setup);
router.post('/auth/2fa/enable', auth, V.twoFactorCode, validate, twoFactorCtrl.enable);
router.post('/auth/2fa/disable', auth, V.twoFactorCode, validate, twoFactorCtrl.disable);

module.exports = router;
