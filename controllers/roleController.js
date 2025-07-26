const Role = require('../models/roleModel');

const RoleController = {
    // Membuat role baru
    createRole: async (req, res) => {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).send({
                status: 'error',
                message: 'Role name is required',
                data: null,
            });
        }

        try {
            const role = await Role.create(name, description);
            res.status(201).send({
                status: 'success',
                message: 'Role created successfully',
                data: role,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to create role',
                data: { error: error.message },
            });
        }
    },

    // Mendapatkan semua roles
    getAllRoles: async (req, res) => {
        try {
            const roles = await Role.getAll();
            res.status(200).send({
                status: 'success',
                message: 'Roles retrieved successfully',
                data: roles,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve roles',
                data: { error: error.message },
            });
        }
    },

    // Mendapatkan role berdasarkan ID
    getRoleById: async (req, res) => {
        const { id } = req.params;
        try {
            const role = await Role.getById(id);
            if (!role) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Role not found',
                    data: null,
                });
            }

            res.status(200).send({
                status: 'success',
                message: 'Role retrieved successfully',
                data: role,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve role',
                data: { error: error.message },
            });
        }
    },

    // Memperbarui role berdasarkan ID
    updateRole: async (req, res) => {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).send({
                status: 'error',
                message: 'Role name is required',
                data: null,
            });
        }

        try {
            const updatedRole = await Role.update(id, name, description);
            if (!updatedRole) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Role not found',
                    data: null,
                });
            }

            res.status(200).send({
                status: 'success',
                message: 'Role updated successfully',
                data: updatedRole,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to update role',
                data: { error: error.message },
            });
        }
    },

    // Menghapus role berdasarkan ID
    deleteRole: async (req, res) => {
        const { id } = req.params;

        try {
            const result = await Role.delete(id);
            if (result.affectedRows === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Role not found',
                    data: null,
                });
            }

            res.status(200).send({
                status: 'success',
                message: 'Role deleted successfully',
                data: null,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to delete role',
                data: { error: error.message },
            });
        }
    },
};

module.exports = RoleController;
