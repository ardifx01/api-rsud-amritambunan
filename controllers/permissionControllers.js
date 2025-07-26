const Permission = require('../models/permissionModel');

const PermissionController = {
    // Mendapatkan semua permissions
    getAllPermissions: async (req, res) => {
        try {
            const permissions = await Permission.getAll();
            res.status(200).send({
                status: 'success',
                message: 'Permissions retrieved successfully',
                data: permissions,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve permissions',
                data: null,
            });
        }
    },

    // Mendapatkan permission berdasarkan ID
    getPermissionById: async (req, res) => {
        const { id } = req.params;
        try {
            const permission = await Permission.getById(id);
            if (!permission) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Permission not found',
                    data: null,
                });
            }
            res.status(200).send({
                status: 'success',
                message: 'Permission retrieved successfully',
                data: permission,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve permission',
                data: null,
            });
        }
    },

    // Menambahkan permission baru
    createPermission: async (req, res) => {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).send({
                status: 'error',
                message: 'Permission name is required',
                data: null,
            });
        }
        
        try {
            // Generate slug from name - convert to lowercase and replace spaces with underscores
            const slug = name.toLowerCase().replace(/\s+/g, '_');
            
            const permission = await Permission.create(name, slug, description);
            res.status(201).send({
                status: 'success',
                message: 'Permission created successfully',
                data: permission,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to create permission',
                data: { error: error.message },
            });
        }
    },

    // Memperbarui permission berdasarkan ID
    updatePermission: async (req, res) => {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).send({
                status: 'error',
                message: 'Permission name is required',
                data: null,
            });
        }
        try {
            const success = await Permission.update(id, name, description);
            if (!success) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Permission not found',
                    data: null,
                });
            }
            res.status(200).send({
                status: 'success',
                message: 'Permission updated successfully',
                data: { id, name, description },
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to update permission',
                data: null,
            });
        }
    },

    // Menghapus permission berdasarkan ID
    deletePermission: async (req, res) => {
        const { id } = req.params;
        try {
            const success = await Permission.delete(id);
            if (!success) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Permission not found',
                    data: null,
                });
            }
            res.status(200).send({
                status: 'success',
                message: 'Permission deleted successfully',
                data: null,
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to delete permission',
                data: null,
            });
        }
    },
};

module.exports = PermissionController;
