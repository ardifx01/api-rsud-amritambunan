const db = require('../config/db');

// Middleware RBAC untuk memeriksa izin berdasarkan permission
const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const { roleId } = req.user; // Ambil roleId dari user yang telah diautentikasi

            if (!roleId) {
                return res.status(401).send({
                    status: 'error',
                    message: 'Role ID is missing',
                    data: null,
                });
            }

            // Ambil izin dari database berdasarkan roleId
            const [permissions] = await db.query(
                `SELECT permissions.slug 
                 FROM role_permissions 
                 JOIN permissions ON role_permissions.permission_id = permissions.id 
                 WHERE role_permissions.role_id = ?`,
                [roleId]
            );

            // Periksa apakah permissions mengandung data
            if (!permissions || permissions.length === 0) {
                return res.status(403).send({
                    status: 'error',
                    message: 'No permissions found for this role',
                    data: null,
                });
            }

            const permissionNames = permissions.map((p) => p.slug);

            // Periksa apakah permission yang diminta ada
            if (!permissionNames.includes(requiredPermission)) {
                return res.status(403).send({
                    status: 'error',
                    message: 'Access denied: Insufficient permissions',
                    data: null,
                });
            }

            next(); // Lanjutkan ke middleware/controller berikutnya
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to authorize',
                data: { error: error.message },
            });
        }
    };
};


module.exports = authorize;
