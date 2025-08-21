const db = require("../config/db");

const Room = {
  createRoom: async (name, description) => {
    const [result] = await db.query(
      "INSERT INTO rooms (name, description) VALUES (?, ?)",
      [name, description]
    );
    return { id: result.insertId, name, description };
  },

  getRoomById: async (id) => {
    const [rows] = await db.query(`SELECT * FROM rooms WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  getAllRooms: async (limit, offset, search = null) => {
    let sql = "SELECT * FROM rooms";
    let params = [];

    if (search) {
      sql += " WHERE name LIKE ?";
      params.push(`%${search}%`);
    }

    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await db.query(sql, params);
    return rows;
  },

  count: async (search = null) => {
    let sql = "SELECT COUNT(*) AS total FROM rooms";
    let params = [];

    if (search) {
      sql += " WHERE name LIKE ?";
      params.push(`%${search}%`);
    }

    const [result] = await db.query(sql, params);
    return result[0].total;
  },

  updateRoom: async (id, name, description) => {
    const [result] = await db.query(
      "UPDATE rooms SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );
    return result.affectedRows > 0 ? { id, name, description } : null;
  },

  deleteRoom: async (id) => {
    const [result] = await db.query("DELETE FROM rooms WHERE id = ?", [id]);
    return result.affectedRows > 0; // Mengembalikan true jika berhasil menghapus
  },
};

module.exports = Room;
