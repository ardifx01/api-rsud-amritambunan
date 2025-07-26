const db = require('../config/db');

const User = {
    // Membuat user baru
    create: async (name, email, password) => {
        // Menyimpan user ke database
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, password]
        );

        // Mengambil data user yang baru dibuat berdasarkan ID yang dihasilkan
        const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [result.insertId]);
        return rows[0];
    },

    // Mencari user berdasarkan email
    findByEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    // Mendapatkan semua pengguna
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM users');
        return rows;
    },

    getUsersWithRolesAndPermissions: async () => {
        const [rows] = await db.query(`
            SELECT u.*, r.name as role_name, p.name as permission_name
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
        `);
        return rows;
    },

    getAllWithPagination: async (limit, offset, search = '') => {
        const query = `
        SELECT id, name, email FROM users
        WHERE name LIKE ? OR email LIKE ?
        LIMIT ? OFFSET ?
    `;
        const [users] = await db.query(query, [`%${search}%`, `%${search}%`, limit, offset]);

        // Prepare result array
        const result = [];

        // For each user, get their roles and permissions
        for (const user of users) {
            // Get user roles
            const [roles] = await db.query(`
            SELECT r.id, r.name, r.description
            FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ?
        `, [user.id]);

            // Get user permissions based on roles
            const [permissions] = await db.query(`
            SELECT DISTINCT p.id, p.name, p.description
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ?
            ORDER BY p.id
        `, [user.id]);

            // Add formatted user data to result
            result.push({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
                roles,
                permissions
            });
        }

        return result;
    },

    getTotalCount: async (search = '') => {
        const query = `
        SELECT COUNT(*) AS count 
        FROM users u
        WHERE u.name LIKE ? OR u.email LIKE ?
    `;
        const [rows] = await db.query(query, [`%${search}%`, `%${search}%`]);
        return rows[0].count;
    },

    // Mendapatkan user berdasarkan ID
    findById: async (id) => {
        const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    getPermissionsByUserId: async (userId) => {
        const query = `
            SELECT p.id AS permission_id, p.name AS permission_name, p.description AS permission_description
            FROM permissions p
            INNER JOIN role_permissions rp ON rp.permission_id = p.id
            INNER JOIN roles r ON r.id = rp.role_id
            INNER JOIN user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id = ?
        `;
        const [rows] = await db.query(query, [userId]);
        return rows;
    },

    getRolePermissionsByUserId: async (userId) => {
        const query = `
            SELECT 
                r.id AS role_id, 
                r.name AS role_name, 
                r.description AS role_description,
                p.id AS permission_id, 
                p.name AS permission_name, 
                p.description AS permission_description
            FROM permissions p
            INNER JOIN role_permissions rp ON rp.permission_id = p.id
            INNER JOIN roles r ON r.id = rp.role_id
            INNER JOIN user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id = ?
        `;
        const [rows] = await db.query(query, [userId]);
        return rows;
    },

    // Menambahkan role ke user
    assignRole: async (userId, roleId) => {
        return db.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
    },

    updateAssignRole: async (userId, roleId) => {
        const [result] = await db.query(
            'UPDATE user_roles SET role_id = ? WHERE user_id = ?',
            [roleId, userId]
        );
        return result.affectedRows > 0; // Return true jika berhasil diperbarui
    },

    updateUser: async (id, name, email) => {
        // Validate input
        if (!name || !email) {
            throw new Error('Name and email are required');
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Execute update query
        const [result] = await db.query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, id]
        );

        // Return boolean indicating if update was successful
        return result.affectedRows > 0;
    },

    // Update user roles
    updateRoles: async (userId, roles) => {
        // Validate input roles
        if (!Array.isArray(roles)) {
            throw new Error('Roles must be an array');
        }

        // Delete existing roles for the user
        await db.query("DELETE FROM user_roles WHERE user_id = ?", [userId]);

        // If roles array is empty, return true (no roles to add)
        if (roles.length === 0) {
            return true;
        }

        // Prepare values for bulk insert
        const values = roles.map((roleId) => [userId, roleId]);

        // Insert new roles
        const [result] = await db.query(
            "INSERT INTO user_roles (user_id, role_id) VALUES ?",
            [values]
        );

        // Return true if roles were successfully updated
        return result.affectedRows > 0;
    },

    // Update role permissions
    updatePermissions: async (roleIds, permissions) => {
        // Validate input
        if (!Array.isArray(roleIds) || !Array.isArray(permissions)) {
            throw new Error('RoleIds and Permissions must be arrays');
        }

        // Update permissions for each role
        const updateResults = await Promise.all(roleIds.map(async (roleId) => {
            // Delete existing permissions for the role
            await db.query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);

            // If no new permissions, return true
            if (permissions.length === 0) {
                return true;
            }

            // Prepare values for bulk insert
            const values = permissions.map((permissionId) => [roleId, permissionId]);

            // Insert new permissions
            const [result] = await db.query(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
                [values]
            );

            // Return true if permissions were successfully updated
            return result.affectedRows > 0;
        }));

        // Return an array of results for each role
        return updateResults;
    },

    delete: async (id) => {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },
};

module.exports = User;
