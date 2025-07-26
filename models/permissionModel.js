const db = require('../config/db');

const Permission = {

    // Menambahkan permission baru
    create: async (name, slug, description) => {
        const [result] = await db.query('INSERT INTO permissions (name, slug, description) VALUES (?, ?, ?)', [name, slug, description]);
        return { id: result.insertId, name, slug, description };
    },

    // Mendapatkan permission berdasarkan ID
    getById: async (id) => {
        const [rows] = await db.query('SELECT * FROM permissions WHERE id = ?', [id]);
        return rows[0];
    },

    // Mendapatkan semua permissions
    getAll: async () => {
        const [rows] = await db.query('SELECT * FROM permissions');
        return rows;
    },

    // Memperbarui permission berdasarkan ID
    update: async (id, name, description) => {
        const [result] = await db.query('UPDATE permissions SET name = ?, description = ? WHERE id = ?', [name, description, id]);
        if (result.affectedRows > 0) {
            return { id, name, description };
        }
        return null;  // Jika tidak ada baris yang terpengaruh (misalnya ID tidak ditemukan)
    },

    // Menghapus permission berdasarkan ID
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM permissions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },
};

module.exports = Permission;
