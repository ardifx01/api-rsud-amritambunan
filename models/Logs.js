const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const logActivity = async (req, res, next) => {
    const logPath = path.join(__dirname, 'Logs', 'activity.log');

    // Capture request data
    let requestData = null;

    if (req.method === 'GET') {
        if (Object.keys(req.query || {}).length > 0) {
            requestData = JSON.stringify(req.query);
        }
    } else {
        if (req.body && Object.keys(req.body).length > 0) {
            requestData = JSON.stringify(req.body);
        }
    }

    console.log("📝 Request method:", req.method);
    console.log("📝 Request query:", req.query);
    console.log("📝 Request body:", req.body);
    console.log("📝 Request data captured:", requestData);

    res.on('finish', async () => {
        let userId = null;
        let userName = null;

        const authHeader = req.headers.authorization;
        let token = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        console.log("🔐 Token:", token ? "✅ Ada" : "❌ Tidak ditemukan");

        if (req.user) {
            userId = req.user.i || req.user.id || req.user.userId || req.user.user_id || null;
            userName = req.user.name || req.user.n || req.user.username || req.user.e || null;
        } else if (token) {
            try {
                const decoded = jwt.verify(token, process.env.SECRET_KEY);
                userId = decoded.i || decoded.id || decoded.userId || decoded.user_id || null;
                userName = decoded.name || decoded.n || decoded.username || decoded.e || null;
                console.log("✅ User info dari token:", { id: userId, name: userName });
            } catch (err) {
                console.error("❌ Error decoding token:", err.message);
            }
        }

        if (userId && !userName) {
            try {
                const [user] = await db.query("SELECT name FROM users WHERE id = ?", [userId]);
                if (user && user[0] && user[0].name) {
                    userName = user[0].name;
                    console.log("✅ User name diperoleh dari database:", userName);
                }
            } catch (err) {
                console.error("❌ Error getting user name from database:", err.message);
            }
        }

        console.log("🛠️ User terdeteksi:", { id: userId, name: userName });

        // Ambil IP address yang valid dari header atau fallback ke req.ip
        const ipAddress =
            req.headers['x-forwarded-for']?.split(',').shift()?.trim() || // Jika di belakang proxy
            req.socket?.remoteAddress || // Raw socket IP
            req.ip || // Default Express IP
            'UNKNOWN';

        const logEntry = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | User ID: ${userId || 'NULL'} | Name: ${userName || 'NULL'} | IP: ${ipAddress} | Status: ${res.statusCode} | User-Agent: ${req.headers['user-agent']} | Request: ${requestData}\n`;

        const logsDir = path.join(__dirname, 'Logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }

        fs.appendFile(logPath, logEntry, (err) => {
            if (err) console.error('❌ Error writing log file:', err);
        });

        console.log("🔍 Nilai name yang akan disimpan:", userName);
        console.log("🔍 Nilai request_body yang akan disimpan:", requestData);

        try {
            await db.query(
                "INSERT INTO activity_logs (user_id, name, method, endpoint, request_body, ip_address, status_code) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [userId || null, userName || null, req.method, req.originalUrl, requestData, ipAddress, res.statusCode]
            );
            console.log(`✅ Log aktivitas tersimpan di database: ${req.method} ${req.originalUrl}`);
        } catch (err) {
            console.error("❌ Error saving log to database:", err.message);
        }
    });

    next();
};

module.exports = logActivity;
