const express = require('express');
const ConnectionStatusController = require('../controllers/connectionStatusControllers');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');
const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
 router.use(authenticateToken);

// Routes dengan middleware otorisasi
router.post('/', authorize('create_connection_status'), ConnectionStatusController.createConnectionStatus);
router.get('/device-status/:deviceId', authorize('view_connection_status'),ConnectionStatusController.getDeviceStatusByID);
router.get('/all-devices-status', authorize('view_connection_status'), ConnectionStatusController.getAllDeviceStatusConnection);
router.delete('/cleanup', authorize('delete_connection_status'), ConnectionStatusController.cleanupOldLogsConnection);

module.exports = router;