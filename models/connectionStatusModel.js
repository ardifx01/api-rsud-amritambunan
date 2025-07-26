const db = require("../config/db");


const ConnectionStatus = {

    create: async (data) => {
        try {
            const { deviceId, timestamp, status, details, deviceType } = data;

            // Validasi data
            if (!deviceId || !status) {
                throw new Error('Device ID dan status diperlukan');
            }

            // Siapkan nilai timestamp
            const logTimestamp = timestamp ? new Date(timestamp) : new Date();

            // Simpan log ke database
            const [result] = await db.query(
                'INSERT INTO connection_logs (deviceId, timestamp, status, details, deviceType) VALUES (?, ?, ?, ?, ?)',
                [deviceId, logTimestamp, status, details, deviceType || 'CounterPlusElite']
            );

            return {
                id: result.insertId,
                deviceId,
                timestamp: logTimestamp,
                status,
                details,
                deviceType: deviceType || 'CounterPlusElite'
            };
        } catch (error) {
            console.error('Error menyimpan connection log:', error);
            throw error;
        }
    },

    getDeviceByID: async (deviceId) => {
        try {
            const [rows] = await db.query(
                'SELECT * FROM connection_logs WHERE deviceId = ? ORDER BY timestamp DESC LIMIT 1',
                [deviceId]
            );

            if (rows.length === 0) {
                return null;
            }

            return rows[0];
        } catch (error) {
            console.error('Error mendapatkan latest connection log:', error);
            throw error;
        }
    },

    getAllDeviceStatus: async () => {
        try {
            const [rows] = await db.query(`
              SELECT cl.* 
              FROM connection_logs cl
              INNER JOIN (
                SELECT deviceId, MAX(timestamp) as max_timestamp
                FROM connection_logs
                GROUP BY deviceId
              ) latest ON cl.deviceId = latest.deviceId AND cl.timestamp = latest.max_timestamp
              ORDER BY cl.deviceId
            `);

            return rows;
        } catch (error) {
            console.error('Error mendapatkan all devices status:', error);
            throw error;
        }
    },

    cleanupOldLogs: async () => {
        try {
            const [result] = await pool.query(
                'DELETE FROM connection_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)',
                [daysToKeep]
            );

            return { deletedCount: result.affectedRows };
        } catch (error) {
            console.error('Error membersihkan old logs:', error);
            throw error;
        }
    }

};

module.exports = ConnectionStatus;