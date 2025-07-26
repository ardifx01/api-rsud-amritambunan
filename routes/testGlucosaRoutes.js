const express = require('express');
const testGlucosaController = require('../controllers/testGlucosaControllers');

const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);

// Tambah tes gula darah baru
router.post('/', authorize('create_test_glucosa'), testGlucosaController.createTest);

//all glucose tests
router.get('/', authorize('view_test_glucosa'), testGlucosaController.getAllTestPatients);


// Dapatkan tes gula darah berdasarkan ID pasien
router.get('/patient/:patient_id', authorize('view_test_glucosa'), testGlucosaController.getPatientTests);
//test result by id patient no pagination
router.get('/patient/:patient_id/glucose-tests', authorize('view_test_glucosa'), testGlucosaController.getPatientTestNoPagination);
//test reasult by id patient with pagination
router.get('/patient/:patient_id/glucose-tests/pagination', authorize('view_test_glucosa'), testGlucosaController.getPatientTestWithPagination);

// Update tes gula darah
router.put('/:id', authorize('update_test_glucosa'), testGlucosaController.updateTest);
router.put('/:id/validation', authorize('update_is_validation'), testGlucosaController.updateValidation);
router.put('/:id/status', authorize('update_is_status'), testGlucosaController.updateIsStatus);

// Hapus tes gula darah
router.delete('/:id', authorize('delete_test_glucosa'), testGlucosaController.deleteTest);

//Syncronize glucose tests
router.post('/sync-glucosa-tests', authorize('update_test_glucosa'), testGlucosaController.syncGlucosaTests);

//Dashboard
router.get('/counts_is_validation_done', authorize('view_dashboard'), testGlucosaController.totalResultIsValidationDone);
router.get('/counts_is_validation_not_done', authorize('view_dashboard'), testGlucosaController.totalResultIsValidationNotDone);
router.get('/counts_total_results', authorize('view_dashboard'), testGlucosaController.totalResult);
router.get('/counts_total_results_month', authorize('view_dashboard'), testGlucosaController.totalTestResultsPerMonth);
router.get('/counts_total_new_results', authorize('view_dashboard'), testGlucosaController.totalTestResults);

//test result by id
router.get('/:id', authorize('view_test_glucosa'), testGlucosaController.getGlucosaTestById);

module.exports = router;