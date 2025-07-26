const User = require('../models/userModel');
const db = require('../config/db');

const UserController = {
    // Menambahkan role ke user
    assignRole: async (req, res) => {
        const { userId, roleId } = req.body;

        // Validasi input
        if (!userId || !roleId) {
            return res.status(400).send({
                status: 'error',
                message: 'User ID and Role ID are required',
                data: null,
            });
        }

        try {
            await User.assignRole(userId, roleId);
            res.status(200).send({
                status: 'success',
                message: 'Role assigned to user successfully',
                data: { userId, roleId },
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to assign role',
                data: { error: error.message },
            });
        }
    },

    // Memperbarui role yang sudah di-assign
    updateAssignRole: async (req, res) => {
        const { userId, roleId } = req.body;

        // Validasi input
        if (!userId || !roleId) {
            return res.status(400).send({
                status: 'error',
                message: 'User ID and Role ID are required',
                data: null,
            });
        }

        try {
            // Periksa apakah roleId ada di tabel roles
            const [roleExists] = await db.query('SELECT id FROM roles WHERE id = ?', [roleId]);
            if (roleExists.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Role ID not found',
                    data: null,
                });
            }

            // Lanjutkan pembaruan jika roleId valid
            const updated = await User.updateAssignRole(userId, roleId);

            if (!updated) {
                return res.status(404).send({
                    status: 'error',
                    message: 'User or role assignment not found',
                    data: null,
                });
            }

            res.status(200).send({
                status: 'success',
                message: 'Role updated successfully',
                data: { userId, roleId },
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to update role',
                data: { error: error.message },
            });
        }
    },

    // Mendapatkan daftar semua pengguna
    getAllUsers: async (req, res) => {
        const { page = 1, limit = 10, search = '' } = req.query;

        // Pastikan parameter `page` dan `limit` adalah angka
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;

        // Hitung offset
        const offset = (pageNumber - 1) * limitNumber;

        try {
            // Dapatkan data pengguna dengan limit, offset, dan search
            const users = await User.getAllWithPagination(limitNumber, offset, search);

            // Hitung total data pengguna yang cocok dengan search
            const totalUsers = await User.getTotalCount(search);

            // Hitung total halaman
            const totalPages = Math.ceil(totalUsers / limitNumber);

            res.status(200).send({
                status: 'success',
                message: 'Users retrieved successfully',
                data: {
                    users,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalUsers,
                        perPage: limitNumber,
                    },
                },
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve users',
                data: { error: error.message },
            });
        }
    },

    // getAllUsers: async (req, res) => {
    //     try {
    //         const users = await User.getAll();
    //         res.status(200).send({
    //             status: 'success',
    //             message: 'Users retrieved successfully',
    //             data: users,
    //         });
    //     } catch (error) {
    //         res.status(500).send({
    //             status: 'error',
    //             message: 'Failed to retrieve users',
    //             data: { error: error.message },
    //         });
    //     }
    // },

    // Mendapatkan detail user berdasarkan ID
    getUserById: async (req, res) => {
        const { id } = req.params;

        // Validasi input
        if (!id) {
            return res.status(400).send({
                status: 'error',
                message: 'User ID is required',
                data: null,
            });
        }

        try {
            // Ambil detail pengguna berdasarkan ID
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).send({
                    status: 'error',
                    message: 'User not found',
                    data: null,
                });
            }

            // Ambil role permissions berdasarkan user ID
            const rolePermissions = await User.getRolePermissionsByUserId(id);

            // Proses dan strukturkan data roles dan permissions
            const processedData = {
                user,
                roles: [],
                permissions: [],
            };

            // Cek apakah rolePermissions adalah array
            if (Array.isArray(rolePermissions) && rolePermissions.length > 0) {
                // Ekstrak roles unik
                const uniqueRoles = rolePermissions.reduce((acc, item) => {
                    if (item.role_id && !acc.some(role => role.id === item.role_id)) {
                        acc.push({
                            id: item.role_id,
                            name: item.role_name,
                            description: item.role_description
                        });
                    }
                    return acc;
                }, []);

                // Ekstrak permissions unik
                const uniquePermissions = rolePermissions.reduce((acc, item) => {
                    if (item.permission_id && !acc.some(perm => perm.id === item.permission_id)) {
                        acc.push({
                            id: item.permission_id,
                            name: item.permission_name,
                            description: item.permission_description
                        });
                    }
                    return acc;
                }, []);

                processedData.roles = uniqueRoles;
                processedData.permissions = uniquePermissions;
            }

            res.status(200).send({
                status: 'success',
                message: 'User details retrieved successfully',
                data: processedData,
            });
        } catch (error) {
            console.error('Error retrieving user details:', error);
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve user details',
                data: {
                    error: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                },
            });
        }
    },

    updateUserDetail: async (req, res) => {
        const { id } = req.params;
        const { name, email, roles, permissions } = req.body;

        // Parse roles to ensure it's an array of numbers
        const parseRoles = (inputRoles) => {
            if (!inputRoles) return [];

            const parsedRoles = Array.isArray(inputRoles)
                ? inputRoles
                : (typeof inputRoles === 'string'
                    ? JSON.parse(inputRoles)
                    : [inputRoles]);

            return parsedRoles.map(role => Number(role)).filter(role => !isNaN(role));
        };

        // Parse permissions to ensure it's an array of numbers
        const parsePermissions = (inputPermissions) => {
            if (!inputPermissions) return [];

            const parsedPermissions = Array.isArray(inputPermissions)
                ? inputPermissions
                : (typeof inputPermissions === 'string'
                    ? JSON.parse(inputPermissions)
                    : [inputPermissions]);

            return parsedPermissions.map(perm => Number(perm)).filter(perm => !isNaN(perm));
        };

        // Validate input
        if (!id || !name || !email) {
            return res.status(400).send({
                status: 'error',
                message: 'User ID, name, and email are required',
                data: null,
            });
        }

        // Parse roles and permissions
        const roleIds = parseRoles(roles);
        const permissionIds = parsePermissions(permissions);

        try {
            // Update user info
            const userUpdated = await User.updateUser(id, name, email);
            if (!userUpdated) {
                return res.status(404).send({
                    status: 'error',
                    message: 'User not found',
                    data: null,
                });
            }
            // Update roles if provided
            let roleUpdateResult = null;
            if (roleIds.length > 0) {
                // Validate roles existence
                const [roleExists] = await db.query('SELECT id FROM roles WHERE id IN (?)', [roleIds]);

                if (roleExists.length !== roleIds.length) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'One or more roles not found',
                        data: {
                            rolesRequested: roleIds,
                            rolesFound: roleExists.map(r => r.id)
                        },
                    });
                }

                // Update user roles
                roleUpdateResult = await User.updateRoles(id, roleIds);
                if (!roleUpdateResult) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'Failed to update user roles',
                        data: null,
                    });
                }

                // Update permissions for the first role if permissions provided
                if (permissionIds.length > 0) {
                    // Validate permissions existence
                    const [permissionExists] = await db.query('SELECT id FROM permissions WHERE id IN (?)', [permissionIds]);

                    if (permissionExists.length !== permissionIds.length) {
                        return res.status(404).send({
                            status: 'error',
                            message: 'One or more permissions not found',
                            data: {
                                permissionsRequested: permissionIds,
                                permissionsFound: permissionExists.map(p => p.id)
                            },
                        });
                    }

                    // Update permissions for the first role
                    const permissionUpdateResult = await User.updatePermissions([roleIds[0]], permissionIds);

                    if (!permissionUpdateResult.some(result => result)) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Failed to update role permissions',
                            data: null,
                        });
                    }
                }
            }

            // Fetch updated user details with roles and permissions
            const [userData] = await db.query(`
                SELECT 
                    u.id, 
                    u.name, 
                    u.email,
                    r.id AS role_id,
                    r.name AS role_name,
                    r.description AS role_description,
                    p.id AS permission_id,
                    p.name AS permission_name,
                    p.description AS permission_description
                FROM 
                    users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                LEFT JOIN role_permissions rp ON r.id = rp.role_id
                LEFT JOIN permissions p ON rp.permission_id = p.id
                WHERE 
                    u.id = ?
            `, [id]);

            // Process user data
            if (!userData || userData.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'User not found',
                    data: null,
                });
            }

            const rolesMap = new Map();
            const permissionsArray = [];

            userData.forEach(row => {
                // Add unique roles
                if (row.role_id && !rolesMap.has(row.role_id)) {
                    rolesMap.set(row.role_id, {
                        id: row.role_id,
                        name: row.role_name,
                        description: row.role_description
                    });
                }

                // Add unique permissions
                if (row.permission_id) {
                    const existingPermission = permissionsArray.find(p => p.id === row.permission_id);
                    if (!existingPermission) {
                        permissionsArray.push({
                            id: row.permission_id,
                            name: row.permission_name,
                            description: row.permission_description
                        });
                    }
                }
            });
            const responseData = {
                status: 'success',
                message: 'User details retrieved successfully',
                data: {
                    user: {
                        id: userData[0].id,
                        name: userData[0].name,
                        email: userData[0].email
                    },
                    roles: Array.from(rolesMap.values()),
                    permissions: permissionsArray
                }
            };

            // Successful response
            res.status(200).send(responseData);

        } catch (error) {
            console.error('Full error details:', error);
            res.status(500).send({
                status: 'error',
                message: 'Failed to update user',
                data: { error: error.message },
            });
        }
    },

    // Delete user by ID
    deleteUser: async (req, res) => {
        const { id } = req.params;

        // Validasi input
        if (!id) {
            return res.status(400).send({
                status: 'error',
                message: 'User ID is required',
                data: null,
            });
        }

        try {
            // Cek apakah user ada
            const [user] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
            if (user.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'User not found',
                    data: null,
                });
            }

            // Hapus data dari tabel user_roles terlebih dahulu untuk menghindari constraint error
            await db.query('DELETE FROM user_roles WHERE user_id = ?', [id]);

            // Hapus user
            const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
            if (result.affectedRows === 0) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Failed to delete user',
                    data: null,
                });
            }

            res.status(200).send({
                status: 'success',
                message: 'User deleted successfully',
                data: null,
            });

        } catch (error) {
            console.error('Full error details:', error);
            res.status(500).send({
                status: 'error',
                message: 'Failed to delete user',
                data: { error: error.message },
            });
        }
    }

};

module.exports = UserController;
