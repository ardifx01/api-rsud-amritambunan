const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);

// Mendapatkan semua pengguna
router.get('/', authorize('view_user'), UserController.getAllUsers);

// Mendapatkan pengguna berdasarkan ID
router.get('/:id', authorize('view_user'), UserController.getUserById);

//delete user by id
router.delete('/:id', authorize('delete_user'), UserController.deleteUser);

// Menambahkan role ke pengguna
router.post('/assign-role', authorize('assign_role'), UserController.assignRole);

// update role ke penggun
router.put('/update-assign-role', authorize('assign_role'), UserController.updateAssignRole);

router.put("/detail_user/:id", UserController.updateUserDetail);

module.exports = router;
