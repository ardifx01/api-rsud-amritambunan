const db = require("../config/db");

const ActivityLogs = {
    getAllWithPagination: async (limit, offset, search = '', filters = {}) => {
        let query = `
        SELECT 
            al.id, 
            al.user_id, 
            al.name, 
            al.method, 
            al.endpoint, 
            al.request_body, 
            al.status_code, 
            al.ip_address, 
            al.created_at
        FROM activity_logs al
        WHERE 1=1
    `;

        const queryParams = [];

        // Filter pencarian berdasarkan name atau method
        if (search && search.trim() !== '') {
            query += ` AND (LOWER(al.name) LIKE ? OR LOWER(al.method) LIKE ?)`;
            const searchTerm = `%${search.toLowerCase()}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        // Filter berdasarkan tanggal spesifik
        if (filters.created_at && filters.created_at.trim() !== '') {
            query += ` AND DATE(al.created_at) = ?`;
            queryParams.push(filters.created_at);
        }

        // Filter berdasarkan rentang tanggal
        if (filters.start_date && filters.end_date) {
            query += ` AND DATE(al.created_at) BETWEEN ? AND ?`;
            queryParams.push(filters.start_date, filters.end_date);
        }

        // Tambahkan pagination
        query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        // Debugging query
        // console.log(query, queryParams);

        const [rows] = await db.query(query, queryParams);
        return rows;
    },


    getTotalCount: async (search = '', filters = {}) => {
        let query = `
        SELECT COUNT(*) AS total
        FROM activity_logs al
        WHERE 1=1
    `;

        const queryParams = [];

        if (search && search.trim() !== '') {
            query += ` AND (LOWER(al.name) LIKE ? OR LOWER(al.method) LIKE ?)`;
            const searchTerm = `%${search.toLowerCase()}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        if (filters.created_at && filters.created_at.trim() !== '') {
            query += ` AND DATE(al.created_at) = ?`;
            queryParams.push(filters.created_at);
        }

        if (filters.start_date && filters.end_date) {
            query += ` AND DATE(al.created_at) BETWEEN ? AND ?`;
            queryParams.push(filters.start_date, filters.end_date);
        }

        const [result] = await db.query(query, queryParams);
        return result[0].total;
    },

};

module.exports = ActivityLogs;