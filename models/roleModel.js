const db = require('../config/db');

const Role = {
    // Menambahkan role baru
    create: async (name, description) => {
        const [result] = await db.query('INSERT INTO roles (name, description) VALUES (?, ?)', [name, description]);
        return { id: result.insertId, name, description };
    },

    // Mendapatkan semua role
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM roles');
        return rows;
    },

    // Mendapatkan detail role beserta permissions-nya
    getById: async (roleId) => {
        const [roles] = await db.query('SELECT * FROM roles WHERE id = ?', [roleId]);
        if (roles.length === 0) {
            return null; // Role tidak ditemukan
        }

        // Gunakan getPermissionsByRoleId untuk mengambil permissions
        const permissions = await Role.getPermissionsByRoleId(roleId);
        return {
            ...roles[0],
            permissions,
        };
    },

     // Fungsi baru untuk mengambil permission berdasarkan roleId
     getPermissionsByRoleId: async (roleId) => {
        const [permissions] = await db.query(
            `SELECT p.id, p.name 
             FROM permissions p
             INNER JOIN role_permissions rp ON p.id = rp.permission_id
             WHERE rp.role_id = ?`,
            [roleId]
        );
        return permissions; // Mengembalikan daftar permission
    },


    // Memperbarui role berdasarkan ID
    update: async (id, name, description) => {
        const [result] = await db.query('UPDATE roles SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        if (result.affectedRows > 0) {
            return { id, name, description };
        }
        return null;  // Jika tidak ada baris yang terpengaruh (misalnya ID tidak ditemukan)
    },

    // Menghapus role berdasarkan ID
    delete: async (roleId) => {
        const [result] = await db.query('DELETE FROM roles WHERE id = ?', [roleId]);
        return result;
    },

};

module.exports = Role;
