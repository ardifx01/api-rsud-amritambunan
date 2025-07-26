const express = require('express');
const PermissionController = require('../controllers/permissionControllers');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);

// Routes untuk permission
router.get('/', authorize('view_permission'), PermissionController.getAllPermissions);
router.get('/:id', authorize('view_permission'), PermissionController.getPermissionById);
router.post('/', authorize('create_permission'), PermissionController.createPermission);
router.put('/:id', authorize('update_permission'), PermissionController.updatePermission);
router.delete('/:id', authorize('delete_permission'), PermissionController.deletePermission);

module.exports = router;
