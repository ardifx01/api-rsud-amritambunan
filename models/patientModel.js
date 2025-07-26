const db = require('../config/db');

const Patient = {
    // Membuat data pasien baru
    create: async (data) => {
        const {
            nik,
            name,
            gender,
            place_of_birth,
            date_of_birth,
            address,
            number_phone,
            email
        } = data;

        const errors = {};
        const requiredFields = [
            "nik", "name", "gender", "place_of_birth", "date_of_birth",
            "address", "number_phone", "email"
        ];

        requiredFields.forEach(field => {
            if (!data[field]) {
                errors[field] = `${field.replace('_', ' ')} is required`;
            }
        });

        // Validasi NIK (16 digit dan hanya angka)
        if (nik && (nik.length !== 16 || !/^\d+$/.test(nik))) {
            errors.nik = "NIK must be exactly 16 digits and contain only numbers";
        }

        // Validasi nomor telepon
        if (number_phone) {
            if (!/^\d+$/.test(number_phone)) {
                errors.number_phone = "Phone number must contain only numbers";
            } else if (number_phone.length < 11 || number_phone.length > 13) {
                errors.number_phone = "Phone number must be between 11 and 13 digits";
            } else if (!number_phone.startsWith("08")) {
                errors.number_phone = "Invalid Phone Number, must start with '08'";
            }
        }

        // Validasi email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            errors.email = "Invalid email format";
        }

        if (Object.keys(errors).length > 0) {
            throw new Error(JSON.stringify(errors));
        }

        // Set status default ke 'active'
        const status = 'active';

        // Masukkan data awal tanpa barcode dan patient_code
        const [result] = await db.query(
            'INSERT INTO patients (nik, name, gender, place_of_birth, date_of_birth, address, number_phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nik, name, gender, place_of_birth, date_of_birth, address, number_phone, email, status]
        );

        // Generate barcode dan patient_code berdasarkan ID pasien yang baru dibuat
        const id = result.insertId;
        const patient_code = `PAT${id.toString().padStart(6, '0')}`; // Format: PAT000001
        const barcode = `BC${id.toString().padStart(8, '0')}`;      // Format: BC00000001

        // Update pasien dengan barcode dan patient_code
        await db.query('UPDATE patients SET patient_code = ?, barcode = ? WHERE id = ?', [patient_code, barcode, id]);

        // Kembalikan data pasien
        return { id, patient_code, barcode, nik, name, gender, place_of_birth, date_of_birth, address, number_phone, email, status };
    },

    getAllWithPagination: async (limit, offset, search = '') => {
        const query = `
        SELECT 
            p.*,
            GROUP_CONCAT(mp.lab_number ORDER BY mp.created_at ASC) as lab_number_string
        FROM patients p
        LEFT JOIN mapping_patients mp 
            ON p.patient_code = mp.patient_code 
            AND mp.is_order = 0
        WHERE 
            (p.name LIKE ? OR p.patient_code LIKE ? OR p.barcode LIKE ? OR p.nik LIKE ?)
            AND p.id != 0
            AND p.created_at IS NOT NULL
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `;

        const [rows] = await db.query(query, [
            `%${search}%`,
            `%${search}%`,
            `%${search}%`,
            `%${search}%`,
            limit,
            offset
        ]);

        // Convert lab_numbers_string menjadi array
        const result = rows.map(row => {
            const { lab_number_string, ...patient } = row;
            patient.lab_number = lab_number_string ? lab_number_string.split(',') : [];
            return patient;
        });

        return result;
    },

    totalPatientsPerMonth: async () => {
        const [rows] = await db.query(`
            SELECT 
                MONTH(created_at) AS month, 
                COUNT(*) AS total_patients 
            FROM patients
            WHERE id != 0 AND created_at IS NOT NULL
            GROUP BY MONTH(created_at)
            ORDER BY MONTH(created_at) ASC
        `);
        return rows;
    },

    getAllNoPagination: async () => {
        try {
            // Pastikan koneksi database berjalan dengan baik
            const [rows] = await db.query(`SELECT * FROM patients WHERE id != 0`);
            return rows;
        } catch (error) {
            console.error('Database Query Error:', error);
            throw new Error('Failed to fetch patients');
        }
    },

    // Mendapatkan total jumlah pasien, tanpa menghitung pasien dengan id = 0
    getTotalCount: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) AS count FROM patients WHERE id != 0`);
        return rows[0].count;
    },

    // Mendapatkan pasien berdasarkan ID detail patient
    getById: async (id) => {
        const [rows] = await db.query(`SELECT * FROM patients WHERE id = ?`, [id]);
        return rows[0] || null;
    },

    // Memperbarui data pasien
    update: async (id, data) => {
        const {
            nik,
            name,
            gender,
            place_of_birth,
            date_of_birth,
            address,
            number_phone,
            email,
            status
        } = data;

        // Validasi NIK (16 digit)
        if (nik && (nik.length !== 16 || !/^\d+$/.test(nik))) {
            throw new Error('NIK must be exactly 16 numeric characters');
        }

        // Validasi nomor telepon (11-12 digit)
        if (number_phone && (number_phone.length < 11 || number_phone.length > 12 || !/^\d+$/.test(number_phone))) {
            throw new Error('Phone number must be 11-12 numeric characters');
        }

        // Validasi email
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }
        }

        // Validasi status jika diubah
        if (status && !['active', 'inactive'].includes(status)) {
            throw new Error('Status must be either "active" or "inactive"');
        }

        // Siapkan fields yang akan diupdate
        const updateFields = {};
        const updateValues = [];

        // Tambahkan field yang akan diupdate
        if (nik) {
            updateFields.nik = nik;
            updateValues.push(nik);
        }
        if (name) {
            updateFields.name = name;
            updateValues.push(name);
        }
        if (gender) {
            updateFields.gender = gender;
            updateValues.push(gender);
        }
        if (place_of_birth) {
            updateFields.place_of_birth = place_of_birth;
            updateValues.push(place_of_birth);
        }
        if (date_of_birth) {
            updateFields.date_of_birth = date_of_birth;
            updateValues.push(date_of_birth);
        }
        if (address) {
            updateFields.address = address;
            updateValues.push(address);
        }
        if (number_phone) {
            updateFields.number_phone = number_phone;
            updateValues.push(number_phone);
        }
        if (email) {
            updateFields.email = email;
            updateValues.push(email);
        }
        if (status) {
            updateFields.status = status;
            updateValues.push(status);
        }

        // Jika tidak ada field yang diupdate, kembalikan null
        if (Object.keys(updateFields).length === 0) {
            throw new Error('No update fields provided');
        }

        // Buat query dinamis
        const setClause = Object.keys(updateFields)
            .map(field => `${field} = ?`)
            .join(', ');

        // Tambahkan id ke akhir values
        updateValues.push(id);

        // Jalankan query update
        const [result] = await db.query(
            `UPDATE patients SET ${setClause} WHERE id = ?`,
            updateValues
        );

        // Kembalikan data yang diupdate jika berhasil
        return result.affectedRows > 0
            ? { id, ...updateFields }
            : null;
    },

    // Menghapus data pasien
    delete: async (id) => {
        const [result] = await db.query(`DELETE FROM patients WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    //menampilkan data pasient yang terdaftar berdasarkan bulan
    getByMonth: async (month) => {
        const [rows] = await db.query(`SELECT * FROM patients WHERE MONTH(created_at) = ?`, [month]);
        return rows;
    },

    getLabNumberByPatientCode: async (patientCode) => {
        try {
            const query = `
                SELECT lab_number 
                FROM mapping_patients 
                WHERE patient_code = ? AND is_order = 0
            `;
            const [rows] = await db.query(query, [patientCode]);
            return rows; // Mengembalikan array hasil
        } catch (error) {
            throw new Error(`Error getting lab numbers: ${error.message}`);
        }
    },

};

module.exports = Patient;