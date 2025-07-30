const express = require('express');
const MappingPatientsController = require('../controllers/mappingPatientController');
const conditionalAuthenticate = require('../middleware/conditionalAuth'); // Import middleware baru
const authorize = require('../middleware/rbac');

const router = express.Router();

// Gunakan conditional authentication middleware
router.use(conditionalAuthenticate);

// Routes dengan middleware otorisasi
router.post('/', authorize('create_mapping_patient'), MappingPatientsController.createMappingPatient);
router.get('/', authorize('view_mapping_patient'), MappingPatientsController.getAllPatients);

module.exports = router;