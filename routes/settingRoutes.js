//buatkan saya routes untuk menampilkan data setting hanya satu data
const express = require('express');
const SettingController = require('../controllers/settingController');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');
const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);

// Routes untuk setting
router.get('/', authorize('view_setting'), SettingController.get);
router.put('/:id', authorize('update_setting'), SettingController.update);


module.exports = router;