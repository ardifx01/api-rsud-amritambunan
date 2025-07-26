//butakan saya model crud setting dengan kolom name, email, address, phone, maps, database saya mysql2 express js

const db = require("../config/db");

const Setting = {
    //buatkan saya get data setting hanya satu data
    get: async () => {
        const [rows] = await db.query("SELECT * FROM settings");
        return rows.length > 0 ? rows[0] : {};
    },

    //buatkan saya hanya bisa lakukan update data setting karena data seetiapnya sudah ada
    update: async (id, data) => {
        try {
            const [result] = await db.query(
                "UPDATE settings SET name = ?, email = ?, address = ?, phone = ?, maps = ?, lat = ? , lng = ? WHERE id = ?",
                [data.name, data.email, data.address, data.phone, data.maps, data.lat, data.lng, id]
            );

            if (result.affectedRows > 0) {
                // Get the updated settings
                const [rows] = await db.query("SELECT * FROM settings WHERE id = ?", [id]);
                return rows.length > 0 ? rows[0] : {};
            } else {
                // No rows were updated, return empty object
                return {};
            }
        } catch (error) {
            throw error;
        }
    },
};

module.exports = Setting;