const express = require('express');
const MappingPatientsController = require('../controllers/mappingPatientController');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
 router.use(authenticateToken);

// Routes dengan middleware otorisasi
router.post('/', authorize('create_mapping_patient'), MappingPatientsController.createMappingPatient);
router.get('/', authorize('view_mapping_patient'), MappingPatientsController.getAllPatients);

module.exports = router;
