const db = require('../config/db');

// Middleware RBAC untuk memeriksa izin berdasarkan permission
const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            console.log('=== RBAC DEBUG ===');
            console.log('User object:', JSON.stringify(user, null, 2));
            console.log('Required permission:', requiredPermission);

            if (!user) {
                return res.status(401).send({
                    status: 'error',
                    message: 'Authentication required',
                    data: null,
                });
            }

            // Handle static bridging user (has permissions array)
            if (user.permissions && Array.isArray(user.permissions)) {
                console.log('🔍 Checking static user permissions:', user.permissions);
                
                if (user.permissions.includes(requiredPermission)) {
                    console.log('✅ Static user has required permission');
                    return next();
                } else {
                    console.log('❌ Static user missing permission:', requiredPermission);
                    return res.status(403).send({
                        status: 'error',
                        message: 'Access denied: Insufficient permissions',
                        data: null,
                    });
                }
            }

            // Handle regular JWT user (has roleId)
            const { roleId } = user;

            if (!roleId) {
                return res.status(401).send({
                    status: 'error',
                    message: 'Role ID is missing',
                    data: null,
                });
            }

            console.log('🔍 Checking database permissions for roleId:', roleId);

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
                console.log('❌ No database permissions found for roleId:', roleId);
                return res.status(403).send({
                    status: 'error',
                    message: 'No permissions found for this role',
                    data: null,
                });
            }

            const permissionNames = permissions.map((p) => p.slug);
            console.log('Database permissions found:', permissionNames);

            // Periksa apakah permission yang diminta ada
            if (!permissionNames.includes(requiredPermission)) {
                console.log('❌ Required permission not found in database permissions');
                return res.status(403).send({
                    status: 'error',
                    message: 'Access denied: Insufficient permissions',
                    data: null,
                });
            }

            console.log('✅ JWT user has required permission');
            next(); // Lanjutkan ke middleware/controller berikutnya
        } catch (error) {
            console.error('RBAC Error:', error);
            res.status(500).send({
                status: 'error',
                message: 'Failed to authorize',
                data: { error: error.message },
            });
        }
    };
};

module.exports = authorize;