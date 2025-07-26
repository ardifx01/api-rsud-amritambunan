//butakan saya model crud setting dengan kolom name, email, address, phone, maps, database saya mysql2 express js

const db = require("../config/db");

const StaticToken = {
    //buatkan saya get data setting hanya satu data
    get: async () => {
        const [rows] = await db.query("SELECT * FROM static_tokens");
        return rows.length > 0 ? rows[0] : {};
    },

    //buatkan saya hanya bisa lakukan update data setting karena data seetiapnya sudah ada
    update: async (id, data) => {
        try {
            const [result] = await db.query(
                "UPDATE static_tokens SET user_id = ?, token = ? WHERE id = ?",
                [data.user_id, data.token, id]
            );

            if (result.affectedRows > 0) {
                // Get the updated static_tokens
                const [rows] = await db.query("SELECT * FROM static_tokens WHERE id = ?", [id]);
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

module.exports = StaticToken;