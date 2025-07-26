const ConnectionLog = require('../models/connectionStatusModel');
const ConnectionStatusController = {

    createConnectionStatus: async (req, res) => {
        try {
            const logData = req.body;

            // Validasi data
            if (!logData.deviceId || !logData.status) {
                return res.status(400).json({
                    status: 'Error',
                    message: 'Device ID and status are required'
                });
            }

            // Simpan log melalui model
            const newLog = await ConnectionLog.create(logData);

            return res.status(201).json({
                status: 'Success',
                message: 'Log saved successfully',
                data: newLog
            });
        } catch (error) {
            console.error('Controller Error - createLog:', error);
            return res.status(500).json({
                status: 'Error',
                message: 'Failed to save connection log',
                error: error.message
            });
        }
    },

    getDeviceStatusByID: async (req, res) => {
        try {
            const { deviceId } = req.params;

            if (!deviceId) {
                return res.status(400).json({
                    status: 'Error',
                    message: 'Device ID is required'
                });
            }

            // Ambil log terbaru melalui model
            const latestLog = await ConnectionLog.getDeviceByID(deviceId);

            if (!latestLog) {
                return res.status(404).json({
                    status: 'Error',
                    message: 'There are no logs for this device'
                });
            }

            return res.status(200).json({
                status: 'Success',
                data: {
                    deviceId: latestLog.deviceId,
                    status: latestLog.status,
                    lastUpdate: latestLog.timestamp,
                    details: latestLog.details,
                    deviceType: latestLog.deviceType
                }
            });
        } catch (error) {
            console.error('Controller Error - getDeviceStatus:', error);
            return res.status(500).json({
                status: 'Error',
                message: 'Failed to get device status',
                error: error.message
            });
        }
    },

    getAllDeviceStatusConnection: async (req, res) => {
        try {
            // Ambil semua log melalui model
            const allLogs = await ConnectionLog.getAllDeviceStatus();

            return res.status(200).json({
                status: 'Success',
                data: allLogs
            });
        } catch (error) {
            console.error('Controller Error - getAllDeviceStatus:', error);
            return res.status(500).json({
                status: 'Error',
                message: 'Failed to get all device status',
                error: error.message
            });
        }
    },

    cleanupOldLogsConnection: async (req, res) => {
        try {
            const { days } = req.query;
            const daysToKeep = parseInt(days) || 30;

            const result = await ConnectionLog.cleanupOldLogs(daysToKeep);

            return res.status(200).json({
                success: true,
                message: `Log yang lebih lama dari ${daysToKeep} hari telah dihapus`,
                deletedCount: result.deletedCount
            });
        } catch (error) {
            console.error('Controller Error - cleanupOldLogs:', error);
            return res.status(500).json({
                success: false,
                message: 'Gagal membersihkan log lama',
                error: error.message
            });
        }
    }



};
module.exports = ConnectionStatusController;