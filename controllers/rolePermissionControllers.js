const Role = require('../models/rolePermissionModel');

const RolePermissionController = {
    // Menambahkan permission ke role
    assignPermissionsToRole: async (req, res) => {
        try {
            // Debug untuk melihat data yang diterima
            console.log('Original Request Body:', req.body);

            // Ambil role_id dan permission_id[] dari request body
            const roleId = Number(req.body.role_id);
            // Coba beberapa kemungkinan format
            let permissionIds;
            // Cek apakah dikirim sebagai array
            if (Array.isArray(req.body['permission_id[]'])) {
                permissionIds = req.body['permission_id[]'];
                console.log('Format 1: Array dari permission_id[]');
            }
            // Cek apakah dikirim sebagai JSON string
            else if (typeof req.body['permission_id[]'] === 'string' && req.body['permission_id[]'].startsWith('[')) {
                try {
                    permissionIds = JSON.parse(req.body['permission_id[]']);
                    console.log('Format 2: JSON string dari permission_id[]');
                } catch (e) {
                    // Bukan JSON valid
                    permissionIds = [req.body['permission_id[]']];
                }
            }
            // Cek apakah dikirim sebagai nilai tunggal permission_id[]
            else if (req.body['permission_id[]']) {
                permissionIds = [req.body['permission_id[]']];
                console.log('Format 3: Nilai tunggal permission_id[]');
            }
            // Cek apakah dikirim sebagai array permission_id
            else if (Array.isArray(req.body.permission_id)) {
                permissionIds = req.body.permission_id;
                console.log('Format 4: Array dari permission_id');
            }
            // Cek apakah dikirim sebagai nilai tunggal permission_id
            else if (req.body.permission_id) {
                permissionIds = [req.body.permission_id];
                console.log('Format 5: Nilai tunggal permission_id');
            }
            // Default empty array
            else {
                permissionIds = [];
                console.log('Format tidak dikenali, data yang diterima:', req.body);
            }
            // Konversi permissionIds ke angka, dan filter nilai yang tidak valid
            permissionIds = permissionIds
                .map(id => Number(id)) // Konversi setiap item menjadi angka
                .filter(id => !isNaN(id) && id > 0); // Hanya simpan angka yang valid

            // Debug values setelah konversi
            console.log('Processed:', { roleId, permissionIds });

            // Validasi: Pastikan roleId dan permissionIds valid
            if (isNaN(roleId) || roleId <= 0) {
                return res.status(400).json({
                    status: 'error',
                    message: `Role ID is invalid: ${req.body.role_id}`,
                    data: null,
                });
            }

            if (permissionIds.length === 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No valid permission IDs provided',
                    data: { received: req.body['permission_id[]'] },
                });
            }

            // Cek apakah role dengan roleId ada
            const role = await Role.getRoleById(roleId);
            if (!role) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Role not found',
                    data: null,
                });
            }

            // Cek apakah semua permission ada
            for (const permissionId of permissionIds) {
                const permission = await Role.getPermissionById(permissionId);
                if (!permission) {
                    return res.status(404).json({
                        status: 'error',
                        message: `Permission with ID ${permissionId} not found`,
                        data: null,
                    });
                }
            }

            // Assign permissions ke role
            const assignedPermissions = [];
            for (const permissionId of permissionIds) {
                await Role.assignPermission(roleId, permissionId);
                const permission = await Role.getPermissionById(permissionId);
                assignedPermissions.push(permission);
            }

            res.status(200).json({
                status: 'success',
                message: 'Permissions assigned to role successfully',
                data: {
                    roleId: role.id,
                    roleName: role.name,
                    permissions: assignedPermissions,
                },
            });
        } catch (error) {
            console.error('Error in assignPermissionsToRole:', error);
            res.status(500).json({
                status: 'error',
                message: 'Failed to assign permissions to role',
                data: { error: error.message },
            });
        }
    },

    // Menghapus permission dari role
    removePermissionFromRole: async (req, res) => {
        const { roleId, permissionId } = req.body;

        if (!roleId || !permissionId) {
            return res.status(400).send({
                status: 'error',
                message: 'Role ID and Permission ID are required',
                data: null,
            });
        }

        try {
            const result = await Role.removePermission(roleId, permissionId);
            if (result.affectedRows === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Permission not found for role',
                    data: null,
                });
            }

            res.status(200).send({
                status: 'success',
                message: 'Permission removed from role successfully',
                data: null,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to remove permission from role',
                data: { error: error.message },
            });
        }
    },

    updateAssignPermissionsToRole: async (req, res) => {
        try {
            // Debug untuk melihat data yang diterima
            console.log('Request Body:', req.body);

            // Ambil roleId dan permissionIds dari body
            const roleId = Number(req.body.roleId);

            let permission_id;
            if (!req.body.permission_id) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Permission IDs are required',
                    data: null,
                });
            }

            if (req.body.permission_id.startsWith('[')) {
                // Jika permission_id adalah JSON string
                try {
                    permission_id = JSON.parse(req.body.permission_id);
                } catch (e) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Invalid JSON format for permission id',
                        data: null,
                    });
                }
            } else {
                // Jika permission_id adalah string dipisahkan koma
                permission_id = req.body.permission_id.split(',').map(id => id.trim());
            }

            // Pastikan permission_id adalah array valid
            if (!Array.isArray(permission_id)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Permission IDs must be an array',
                    data: null,
                });
            }

            // Lanjutkan logika seperti biasa...
            console.log('Role ID:', roleId);
            console.log('Permission IDs:', permission_id);

            // Validasi role
            const role = await Role.getRoleById(roleId);
            if (!role) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Role not found',
                    data: null,
                });
            }

            // Ambil izin yang saat ini terkait dengan role
            const existingPermissions = await Role.getPermissionsByRoleId(roleId);

            console.log('Existing Permissions:', existingPermissions);

            // Cari izin untuk dihapus (ada di database tapi tidak ada di daftar baru)
            const permissionsToRemove = existingPermissions.filter(
                id => !permission_id.includes(id.toString()) // Pastikan perbandingan string
            );

            // Cari izin untuk ditambahkan (ada di daftar baru tapi tidak ada di database)
            const permissionsToAdd = permission_id.filter(
                id => !existingPermissions.includes(parseInt(id)) // Pastikan perbandingan integer
            );

            console.log('Permissions to Remove:', permissionsToRemove);
            console.log('Permissions to Add:', permissionsToAdd);

            // Hapus izin yang tidak dicentang
            for (const permissionId of permissionsToRemove) {
                await Role.removePermission(roleId, permissionId);
            }

            // Tambahkan izin yang baru dicentang
            for (const permissionId of permissionsToAdd) {
                await Role.assignPermission(roleId, permissionId);
            }

            // Ambil izin yang telah diperbarui
            const updatedPermissions = await Promise.all(
                permission_id.map(id => Role.getPermissionById(id))
            );
            res.status(200).send({
                status: 'success',
                message: 'Permissions updated successfully',
                data: {
                    roleId: role.id,
                    roleName: role.name,
                    permissions: updatedPermissions,
                },
            });
        } catch (error) {
            console.error('Error during update:', error.message);
            res.status(500).send({
                status: 'error',
                message: 'Failed to update permissions for role',
                data: { error: error.message },
            });
        }
    },
}


module.exports = RolePermissionController;
