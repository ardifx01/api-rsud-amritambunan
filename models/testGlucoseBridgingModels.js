const db = require('../config/db');

const TestGlucosaBridgingModel = {
    getAllWithPagination: async (limit, offset, search = '', filters = {}) => {
        let query = `
        SELECT 
            gt.id, 
            gt.date_time, 
            gt.patient_code, 
            gt.lab_number, 
            gt.glucos_value, 
            gt.unit, 
            gt.patient_id,
            gt.device_name, 
            gt.metode, 
            gt.is_validation, 
            gt.created_at, 
            gt.updated_at, 
            p.name AS patient_name, 
            p.patient_code AS patient_code 
        FROM glucosa_test_bridgings gt
        JOIN patients p ON gt.patient_id = p.id
        WHERE 1=1
    `;

        const queryParams = [];

        // Filter berdasarkan search (nama atau patient_code)
        if (search) {
            query += ` AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.patient_code) LIKE LOWER(?) OR LOWER(gt.lab_number) LIKE LOWER(?))`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Filter berdasarkan patient_code spesifik
        if (filters.patient_code) {
            query += ` AND LOWER(p.patient_code) LIKE LOWER(?)`;
            queryParams.push(`%${filters.patient_code}%`);
        }

        if (filters.lab_number) {
            query += ` AND LOWER(gt.lab_number) LIKE LOWER(?)`;
            queryParams.push(`%${filters.lab_number}%`);
        }

        // Filter berdasarkan tanggal spesifik
        if (filters.date_time) {
            query += ` AND DATE(gt.date_time) = DATE(?)`;
            queryParams.push(filters.date_time);
        }

        // Filter berdasarkan rentang tanggal
        if (filters.start_date && filters.end_date) {
            query += ` AND DATE(gt.date_time) BETWEEN DATE(?) AND DATE(?)`;
            queryParams.push(filters.start_date, filters.end_date);
        }

        // Filter berdasarkan is_validation
        if (filters.is_validation !== undefined) {
            query += ` AND gt.is_validation = ?`;
            queryParams.push(filters.is_validation);
        }

        // Filter berdasarkan sync_status
        if (filters.sync_status !== undefined) {
            query += ` AND gt.sync_status = ?`;
            queryParams.push(filters.sync_status);
        }

        query += `
        ORDER BY gt.created_at DESC
        LIMIT ? OFFSET ?
    `;

        queryParams.push(limit, offset);

        const [rows] = await db.query(query, queryParams);

        return rows;
    },

    getTotalCount: async (search = '', filters = {}) => {
        let query = `
        SELECT COUNT(*) AS total
        FROM glucosa_test_bridgings gt
        JOIN patients p ON gt.patient_id = p.id
        WHERE 1=1
         `;

        const queryParams = [];

        // Filter berdasarkan search (nama atau patient_code)
        if (search) {
            query += ` AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.patient_code) LIKE LOWER(?) OR LOWER(gt.lab_number) LIKE LOWER(?))`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Filter berdasarkan patient_code spesifik
        if (filters.patient_code) {
            query += ` AND LOWER(p.patient_code) LIKE LOWER(?)`;
            queryParams.push(`%${filters.patient_code}%`);
        }

        if (filters.lab_number) {
            query += ` AND LOWER(gt.lab_number) LIKE LOWER(?)`;
            queryParams.push(`%${filters.lab_number}%`);
        }

        // Filter berdasarkan tanggal spesifik
        if (filters.date_time) {
            query += ` AND DATE(gt.date_time) = DATE(?)`;
            queryParams.push(filters.date_time);
        }

        // Filter berdasarkan rentang tanggal
        if (filters.start_date && filters.end_date) {
            query += ` AND DATE(gt.date_time) BETWEEN DATE(?) AND DATE(?)`;
            queryParams.push(filters.start_date, filters.end_date);
        }

        // Filter berdasarkan is_validation
        if (filters.is_validation !== undefined) {
            query += ` AND gt.is_validation = ?`;
            queryParams.push(filters.is_validation);
        }

        // Filter berdasarkan sync_status
        if (filters.sync_status !== undefined) {
            query += ` AND gt.sync_status = ?`;
            queryParams.push(filters.sync_status);
        }

        const [result] = await db.query(query, queryParams);
        return result[0].total;
    },

    getById: async (id) => {
        const query = `
        SELECT 
            gt.id, 
            gt.date_time, 
            gt.patient_code, 
            gt.lab_number, 
            gt.glucos_value, 
            gt.unit, 
            gt.patient_id,
            gt.device_name, 
            gt.metode, 
            gt.is_validation, 
            gt.created_at, 
            gt.updated_at, 
            p.name AS patient_name, 
            p.patient_code AS patient_code 
        FROM glucosa_test_bridgings gt
        JOIN patients p ON gt.patient_id = p.id
        WHERE gt.id = ?
    `;

        const [rows] = await db.query(query, [id]);
        return rows[0] || null;
    },


    insertGlucosaTest: async (data) => {
        try {
            const query = `
            INSERT INTO fans_cosa_api_db.glucosa_test_bridgings
            (id, patient_code, lab_number, date_time, glucos_value, unit, patient_id, device_name, metode, is_validation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

            // PERBAIKAN: Sesuaikan urutan values dengan urutan kolom pada query INSERT
            const values = [
                data.id,
                data.patient_code,   // <-- Urutan diperbaiki
                data.lab_number,     // <-- Urutan diperbaiki
                data.date_time,      // <-- Urutan diperbaiki
                data.glucos_value,
                data.unit,
                data.patient_id,
                data.device_name,
                data.metode,
                data.is_validation
            ];

            // Menggunakan db.execute untuk prepared statements lebih aman
            const [result] = await db.execute(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error inserting data into bridging database:', error);
            return false;
        }
    }

}

module.exports = TestGlucosaBridgingModel;
