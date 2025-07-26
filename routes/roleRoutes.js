const express = require('express');
const RoleController = require('../controllers/roleController');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);


// Membuat role baru
router.post('/', authorize('create_role'), RoleController.createRole);

// Mendapatkan semua roles
router.get('/', authorize('view_role'), RoleController.getAllRoles);

// Mendapatkan role berdasarkan ID
router.get('/:id', authorize('view_role'), RoleController.getRoleById);

// Memperbarui role berdasarkan ID
router.put('/:id', authorize('update_role'), RoleController.updateRole);

// Menghapus role berdasarkan ID
router.delete('/:id', authorize('delete_role'), RoleController.deleteRole);

module.exports = router;
