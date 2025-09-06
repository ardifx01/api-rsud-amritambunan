const express = require('express');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');
const MappingPatientsController = require('../controllers/mappingPatientController');
const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);

// Routes untuk activity logs
router.get('/', authorize('view_mapping_patient'), MappingPatientsController.getAvailableRooms);

module.exports = router;