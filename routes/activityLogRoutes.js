//buatkan saya routes untuk activity logs
const express = require('express');
const ActivityLogsController = require('../controllers/activityLogController');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');
const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);

// Routes untuk activity logs
router.get('/', authorize('view_activity_log'), ActivityLogsController.getAllActivityLogs);

module.exports = router;