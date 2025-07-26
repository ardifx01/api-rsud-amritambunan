const express = require('express');
const PatientsController = require('../controllers/patientControllers');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
 router.use(authenticateToken);

//dashboard
router.get('/total_month', authorize('view_patient'), PatientsController.getTotalPatientsPerMonth);

// Routes dengan middleware otorisasi
router.post('/', authorize('create_patient'), PatientsController.createPatient);
router.get('/', authorize('view_patient'), PatientsController.getAllPatients);
// router.get('/counts', authorize('view_patient'), PatientsController.getAllPatientCounts);
router.get('/counts', authorize('view_patient'), PatientsController.getCounts);
router.get('/:id', authorize('view_patient'), PatientsController.getPatientById);
router.put('/:id', authorize('update_patient'), PatientsController.updatePatient);
router.delete('/:id', authorize('delete_patient'), PatientsController.deletePatient);
router.get('/lab-number/:patient_code',  authorize('view_patient'), PatientsController.getLabNumberByPatientCode);


module.exports = router;
