const db = require('../config/db');

const RolePermission = {

    getPermissionById: async (permissionId) => {
        const [rows] = await db.query('SELECT id, name FROM permissions WHERE id = ?', [permissionId]);
        return rows[0];
    },

    // Menambahkan izin (permission) ke role
    // assignPermission: async (roleId, permissionId) => {
    //     return db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, permissionId]);
    // },

    assignPermission: async (roleId, permissionId) => {
        try {
            // Validasi input dasar
            if (!Number.isInteger(roleId) || !Number.isInteger(permissionId) || roleId <= 0 || permissionId <= 0) {
                throw new Error('Invalid roleId or permissionId');
            }
    
            // Cek apakah izin sudah ada untuk role ini
            const [exists] = await db.query(
                'SELECT COUNT(*) AS count FROM role_permissions WHERE role_id = ? AND permission_id = ?',
                [roleId, permissionId]
            );
    
            if (exists.count > 0) {
                // Jika izin sudah ada, kembalikan respons sukses tanpa menyimpan data
                console.log(`Permission ID ${permissionId} already exists for Role ID ${roleId}`);
                return { success: true, message: 'Permission already assigned to role' };
            }
    
            // Simpan izin baru ke database jika belum ada
            await db.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                [roleId, permissionId]
            );
    
            return { success: true, message: 'Permission assigned successfully' };
        } catch (error) {
            console.error('Error in assignPermission:', error);
            throw new Error('Failed to assign permission: ' + error.message);
        }
    },

    // Menghapus izin (permission) dari role
    removePermission: async (roleId, permissionId) => {
        return db.query('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', [roleId, permissionId]);
    },

    // Mendapatkan semua permission yang dimiliki oleh role tertentu
    // getPermissionsByRoleId: async (roleId) => {
    //     const [rows] = await db.query(
    //         `SELECT permission_id 
    //          FROM role_permissions 
    //          WHERE role_id = ?`,
    //         [roleId]
    //     );
    //     return rows.map(row => row.permission_id); // Mengembalikan array ID permission
    // },

    getPermissionsByRoleId: async (roleId) => {
        try {
            // Ambil semua izin untuk role_id tertentu
            const permissions = await db.query(
                'SELECT DISTINCT permission_id, name FROM role_permissions JOIN permissions ON role_permissions.permission_id = permissions.id WHERE role_id = ?',
                [roleId]
            );
    
            // Kembalikan hasil sebagai array objek
            return permissions.map(p => ({ id: p.permission_id, name: p.name }));
        } catch (error) {
            console.error('Error in getPermissionsByRoleId:', error);
            throw new Error('Failed to fetch permissions for role');
        }
    },

    getRoleById: async (id) => {
        const [rows] = await db.query('SELECT id, name FROM roles WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null; // Pastikan hanya mengembalikan data jika ada hasil
    },
};

module.exports = RolePermission;
