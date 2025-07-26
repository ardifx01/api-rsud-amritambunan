const express = require('express');
const RolePermissionController = require('../controllers/rolePermissionControllers');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);


// Menambahkan permission ke role
router.post('/', authorize('create_role_permission'), RolePermissionController.assignPermissionsToRole);

// Menghapus permission dari role
router.delete('/detele-role-permission', authorize('delete_role_permission'), RolePermissionController.removePermissionFromRole);

// Route untuk memperbarui permission untuk role berdasarkan roleId
router.put('/update-role-permission', authorize('update_role_permission'), RolePermissionController.updateAssignPermissionsToRole);


module.exports = router;
