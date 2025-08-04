const TestGlucosaModel = require('../models/testGlucosaModel');
const TestGlucosaBridgingModel = require('../models/testGlucoseBridgingModels');
const db = require('../config/db');

module.exports = {
    // Tambah tes gula darah baru
    createTest: async (req, res) => {
        try {
            let { date_time, patient_code, lab_number, glucos_value, unit, patient_id, device_name, metode, is_validation, note } = req.body;

            // Jika patient_id kosong atau null, set ke 0
            if (!patient_id) {
                patient_id = 0;
            }

            // Validasi input untuk field wajib selain patient_id
            if (!date_time || !glucos_value || !unit) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Date, glucose value, and unit are required',
                    data: null
                });
            }

            // Validasi nilai gula darah
            if (glucos_value <= 0) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Invalid glucose value',
                    data: null
                });
            }

            // Validasi unit
            const validUnits = ['mg/dL', 'mmol/L'];
            if (!validUnits.includes(unit)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Invalid unit. Must be mg/dL or mmol/L',
                    data: null
                });
            }

            // Jika patient_id bukan 0, periksa apakah pasien ada di database
            if (patient_id !== 0) {
                const [patientCheck] = await db.query('SELECT id FROM patients WHERE id = ?', [patient_id]);
                if (patientCheck.length === 0) {
                    patient_id = 0;
                }
            }

            // Tambahkan test ke database
            const testId = await TestGlucosaModel.create({
                date_time,
                patient_code,
                lab_number,
                glucos_value,
                unit,
                patient_id,
                device_name,
                note,
                metode: "Elektrokimia",
                is_validation: 0
            });

            if (!testId) {
                throw new Error('Failed to insert glucose test');
            }

            // Ambil data test yang baru saja dibuat
            const [newTest] = await db.query(
                'SELECT * FROM glucosa_tests WHERE id = ?',
                [testId]
            );

            res.status(201).send({
                status: 'success',
                message: 'Glucose test added successfully',
                data: newTest[0]
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).send({
                    status: 'error',
                    message: 'Duplicate entry',
                    data: null
                });
            }

            res.status(500).send({
                status: 'error',
                message: 'Failed to add glucose test',
                data: { error: error.message }
            });
        }
    },

    // Mendapatkan semua tes gula darah
    getAllTestPatients: async (req, res) => {
        const {
            page = 1,
            limit = 10,
            search = '',
            date_time = '',
            start_date = '',
            end_date = '',
            is_validation
        } = req.query;

        // Pastikan parameter `page` dan `limit` adalah angka
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;

        // Hitung offset
        const offset = (pageNumber - 1) * limitNumber;

        // Buat objek filters untuk parameter pencarian
        const filters = {};

        // Tambahkan filter tanggal jika ada
        if (date_time) {
            filters.date_time = date_time;
        }

        // Tambahkan filter rentang tanggal jika keduanya ada
        if (start_date && end_date) {
            filters.start_date = start_date;
            filters.end_date = end_date;
        }

        // Tambahkan filter is_validation jika ada dan valid
        if (is_validation !== undefined && is_validation !== '') {
            const validationValue = parseInt(is_validation, 10);
            // Cek apakah hasil konversi adalah angka valid (tidak NaN)
            if (!isNaN(validationValue)) {
                filters.is_validation = validationValue;
            }
        }

        try {
            // Dapatkan data dengan pencarian dan filter
            const glucosaTest = await TestGlucosaModel.getAllWithPagination(limitNumber, offset, search, filters);

            // Hitung total data dengan pencarian dan filter yang sama
            const totalTestPatients = await TestGlucosaModel.getTotalCount(search, filters);

            // Hitung total halaman
            const totalPages = Math.ceil(totalTestPatients / limitNumber);

            res.status(200).send({
                status: 'success',
                message: 'Glucose tests retrieved successfully',
                data: {
                    glucosaTest,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalTestPatients,
                        perPage: limitNumber,
                    },
                },
            });
        } catch (error) {
            console.error("Error in getAllTestPatients:", error);
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve glucose test',
                data: { error: error.message },
            });
        }
    },

    // Dapatkan tes gula darah berdasarkan ID pasien
    getPatientTests: async (req, res) => {
        try {
            const { patient_id } = req.params;
            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;
            const labNumber = req.query.lab_number || null; // Ambil lab_number dari query parameter
            const date = req.query.date || null; // Filter tanggal
            const startDate = req.query.start_date || null; // Filter tanggal mulai
            const endDate = req.query.end_date || null; // Filter tanggal akhir
            const offset = (page - 1) * limit;

            try {
                const result = await TestGlucosaModel.getByPatientId(patient_id, limit, offset, labNumber, date, startDate, endDate);
                res.status(200).send({
                    status: 'success',
                    message: 'Glucose tests retrieved successfully',
                    ...result // Spread pagination dan data
                });
            } catch (modelError) {
                // Tangani error spesifik dari model
                return res.status(404).send({
                    status: 'error',
                    message: modelError.message,
                    data: null
                });
            }
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve glucose tests',
                data: { error: error.message }
            });
        }
    },

    //Detail glucose test by patients
    getPatientTestNoPagination: async (req, res) => {
        try {
            const { patient_id } = req.params;
            const { lab_number } = req.query;

            try {
                const result = await TestGlucosaModel.getByPatientIdAll(
                    patient_id,
                    lab_number ? { lab_number } : {}
                );

                const message = lab_number
                    ? `${result.total_count} glucose tests with lab number ${lab_number} retrieved successfully`
                    : `${result.total_count} glucose tests retrieved successfully`;

                res.status(200).send({
                    status: 'success',
                    message,
                    data: result.tests, // Kirim array tes
                    meta: {
                        total_count: result.total_count,
                        patient_id: result.patient_id,
                        lab_number: result.lab_number
                    }
                });

            } catch (modelError) {
                return res.status(404).send({
                    status: 'error',
                    message: modelError.message,
                    data: null
                });
            }
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve glucose tests',
                data: { error: error.message }
            });
        }
    },
    
    // Update tes gula darah
    updateTest: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validasi input
            if (!updateData.date_time || !updateData.glucos_value || !updateData.unit) {
                return res.status(400).send({
                    status: 'error',
                    message: 'All fields are required',
                    data: null
                });
            }

            const updated = await TestGlucosaModel.update(id, updateData);

            if (!updated) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Glucose test not found',
                    data: null
                });
            }

            res.status(200).send({
                status: 'success',
                message: 'Glucose test updated successfully',
                data: updateData
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to update glucose test',
                data: { error: error.message }
            });
        }
    },

    // Hapus tes gula darah
    deleteTest: async (req, res) => {
        try {
            const { id } = req.params;

            const deleted = await TestGlucosaModel.delete(id);

            if (!deleted) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Glucose test not found',
                    data: null
                });
            }

            res.status(200).send({
                status: 'success',
                message: 'Glucose test deleted successfully',
                data: null
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to delete glucose test',
                data: { error: error.message }
            });
        }
    },

    // Synchronize glucose tests   
    syncGlucosaTests: async (req, res) => {
        try {
            const result = await TestGlucosaModel.syncGlucosaTests();
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: error.message,
                data: null
            });
        }
    },

    // Validasi tes gula darah
    updateValidation: async (req, res) => {
        // Dapatkan koneksi terpisah untuk transaksi
        let connection;
        try {
            connection = await db.getConnection(); // Dapatkan koneksi dari pool
            await connection.beginTransaction(); // Mulai transaksi

            const { id } = req.params;
            const userName = req.user.name;

            if (!id || isNaN(id)) {
                await connection.rollback(); // Batalkan transaksi sebelum keluar
                connection.release();
                return res.status(400).json({ message: 'ID tidak valid' });
            }

            // 1. Ambil data (gunakan koneksi transaksi)
            const testData = await TestGlucosaModel.getTestDataById(id, connection);
            if (!testData) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: 'Data not found' });
            }

            // 2. Update status validasi (gunakan koneksi transaksi)
            const isUpdated = await TestGlucosaModel.IsValidationTest(id, userName, connection);
            if (!isUpdated) {
                await connection.rollback();
                connection.release();
                return res.status(500).json({ message: 'Failed to update validation status' });
            }

            // 3. Siapkan dan Insert data ke tabel bridging (gunakan koneksi transaksi)
            const newData = {
                id: testData.id,
                date_time: testData.date_time,
                patient_code: testData.patient_code,
                lab_number: testData.lab_number,
                glucos_value: testData.glucos_value,
                unit: testData.unit,
                patient_id: testData.patient_id,
                device_name: testData.device_name,
                metode: testData.metode,
                is_validation: 1,
            };

            const insertResult = await TestGlucosaBridgingModel.insertGlucosaTest(newData, connection);
            if (!insertResult) {
                await connection.rollback();
                connection.release();
                return res.status(500).json({ message: 'Failed to insert data into bridging database' });
            }

            // Jika semua berhasil, commit transaksi
            await connection.commit();

            return res.status(200).json({
                message: 'Validation and data migration successful',
                user_validation: userName
            });

        } catch (error) {
            // Jika ada error apapun di tengah jalan, batalkan transaksi
            if (connection) {
                await connection.rollback();
            }
            console.error('Error during validation transaction:', error);
            return res.status(500).json({ message: 'An error occurred on the server' });
        } finally {
            // Pastikan koneksi selalu dilepaskan kembali ke pool
            if (connection) {
                connection.release();
            }
        }
    },

    // Data untuk tampilans dashboard
    totalResultIsValidationDone: async (req, res) => {
        try {
            const result = await TestGlucosaModel.getTotalResultIsValidationDone();
            res.status(200).send({
                status: 'success',
                message: 'Glucose tests done successfully',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: error.message,
                data: null
            });
        }
    },

    totalResultIsValidationNotDone: async (req, res) => {
        try {
            const result = await TestGlucosaModel.getTotalResultIsValidationNotDone();
            res.status(200).send({
                status: 'success',
                message: 'Glucose tests not done successfully',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: error.message,
                data: null
            });
        }
    },
    totalResult: async (req, res) => {
        try {
            const result = await TestGlucosaModel.getAllTotalResults();
            res.status(200).send({
                status: 'success',
                message: 'Glucose tests successfully',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: error.message,
                data: null
            });
        }
    },

    totalTestResultsPerMonth: async (req, res) => {
        try {
            // Get year from query parameters, defaulting to current year if not provided
            const year = req.query.year || new Date().getFullYear();

            // Pass the year parameter to the model function
            const result = await TestGlucosaModel.getMonthlyTestResults(year);

            res.status(200).send({
                status: 'success',
                message: 'Monthly glucose tests retrieved successfully',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: error.message,
                data: null
            });
        }
    },

    //buatkan controller untuk mendapatkan jumlah total glucosa test berdasarkan data terbaru dari created_at
    totalTestResults: async (req, res) => {
        try {
            // Panggil model untuk mendapatkan data terbaru
            const result = await TestGlucosaModel.getLatestResult();

            // Kirim respons dengan total dan list data
            res.status(200).send({
                status: 'success',
                message: 'Total glucose tests retrieved successfully',
                data: {
                    total: result.total,
                    dataList: result.dataList
                }
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: error.message,
                data: null
            });
        }
    },

    //buatkan controller untuk mendapatkan jumlah total glucosa test berdasarkan data terbaru dari created_at
    updateIsStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await TestGlucosaModel.IsStatusTest(id);
            res.status(200).send({
                status: 'success',
                message: 'Is status updated successfully',
                data: result
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: error.message,
                data: null
            });
        }
    },

    getPatientTestWithPagination: async (req, res) => {
        try {
            const { patient_id } = req.params;
            const {
                page = 1,
                limit = 10,
                date_time,
                start_date,
                end_date,
                is_validation
            } = req.query;

            // Siapkan objek filter berdasarkan query params yang ada
            const filters = {};

            if (date_time) filters.date_time = date_time;
            if (start_date && end_date) {
                filters.start_date = start_date;
                filters.end_date = end_date;
            }
            if (is_validation !== undefined) filters.is_validation = is_validation;

            try {
                const result = await TestGlucosaModel.getByPatientIdWithPagination(
                    patient_id,
                    parseInt(page),
                    parseInt(limit),
                    filters
                );

                res.status(200).send({
                    status: 'success',
                    message: 'Glucose tests retrieved successfully',
                    data: result.data,
                    pagination: result.pagination,
                    applied_filters: Object.keys(filters).length > 0 ? filters : null
                });
            } catch (modelError) {
                // Tangani error spesifik dari model
                return res.status(404).send({
                    status: 'error',
                    message: modelError.message,
                    data: null
                });
            }
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve glucose tests',
                data: { error: error.message }
            });
        }
    },

    showPatients: async (req, res) => {
        try {
            const { patient_id } = req.params;

            try {
                const data = await TestGlucosaModel.getByPatientIdAll(patient_id);

                res.status(200).send({
                    status: 'success',
                    message: 'Glucose tests retrieved successfully',
                    data // Langsung kirimkan semua data
                });
            } catch (modelError) {
                // Tangani error spesifik dari model
                return res.status(404).send({
                    status: 'error',
                    message: modelError.message,
                    data: null
                });
            }
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve glucose tests',
                data: { error: error.message }
            });
        }
    },

    getGlucosaTestById: async (req, res) => {
        try {
            const { id } = req.params;
            const testData = await TestGlucosaModel.getTestDataById(id);

            if (!testData) {
                return res.status(404).json({
                    success: false,
                    message: 'Test data not found',
                });
            }

            res.status(200).json({
                success: true,
                message: 'Test data retrieved successfully',
                data: testData,
            });
        } catch (error) {
            console.error('Error fetching test data:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
            });
        }
    },

};
