const TestGlucosaBridgingModel = require("../models/testGlucoseBridgingModels");


module.exports = {
    getAllTestBridgingPatients: async (req, res) => {
        const {
            page = 1,
            limit = 10,
            search = '',
            date_time = '',
            patient_code = '',
            lab_number = '',
            start_date = '',
            end_date = '',
            is_validation,
        } = req.query;

        try {
            // Validasi parameter input
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);

            // Validasi page dan limit
            if (isNaN(pageNumber) || pageNumber < 1) {
                return res.status(400).json({
                    status: 'error',
                    statusCode: 400,
                    message: 'Invalid page parameter. Page must be a positive integer.',
                    data: null
                });
            }

            if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
                return res.status(400).json({
                    status: 'error',
                    statusCode: 400,
                    message: 'Invalid limit parameter. Limit must be between 1 and 100.',
                    data: null
                });
            }

            // Hitung offset
            const offset = (pageNumber - 1) * limitNumber;

            // Buat objek filters untuk parameter pencarian
            const filters = {};

            // Validasi dan tambahkan filter tanggal
            if (date_time) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(date_time)) {
                    return res.status(400).json({
                        status: 'error',
                        statusCode: 400,
                        message: 'Invalid date_time format. Use YYYY-MM-DD format.',
                        data: null
                    });
                }
                filters.date_time = date_time;
            }

            // Validasi dan tambahkan filter rentang tanggal
            if (start_date || end_date) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

                if (start_date && !dateRegex.test(start_date)) {
                    return res.status(400).json({
                        status: 'error',
                        statusCode: 400,
                        message: 'Invalid start_date format. Use YYYY-MM-DD format.',
                        data: null
                    });
                }

                if (end_date && !dateRegex.test(end_date)) {
                    return res.status(400).json({
                        status: 'error',
                        statusCode: 400,
                        message: 'Invalid end_date format. Use YYYY-MM-DD format.',
                        data: null
                    });
                }

                if (start_date && end_date) {
                    if (new Date(start_date) > new Date(end_date)) {
                        return res.status(400).json({
                            status: 'error',
                            statusCode: 400,
                            message: 'start_date cannot be later than end_date.',
                            data: null
                        });
                    }
                    filters.start_date = start_date;
                    filters.end_date = end_date;
                }
            }

            // Tambahkan filter patient_code jika ada
            if (patient_code) {
                filters.patient_code = patient_code;
            }

            if (lab_number) {
                filters.lab_number = lab_number;
            }

            // Tambahkan filter is_validation jika ada dan valid
            if (is_validation !== undefined && is_validation !== '') {
                const validationValue = parseInt(is_validation, 10);
                if (isNaN(validationValue) || ![0, 1].includes(validationValue)) {
                    return res.status(400).json({
                        status: 'error',
                        statusCode: 400,
                        message: 'Invalid is_validation. Must be 0 or 1.',
                        data: null
                    });
                }
                filters.is_validation = validationValue;
            }

            // Dapatkan data dengan pencarian dan filter
            const glucosaTest = await TestGlucosaBridgingModel.getAllWithPagination(
                limitNumber,
                offset,
                search,
                filters
            );

            // Hitung total data dengan pencarian dan filter yang sama
            const totalTestPatients = await TestGlucosaBridgingModel.getTotalCount(search, filters);

            // Hitung total halaman
            const totalPages = Math.ceil(totalTestPatients / limitNumber);

            // Check if no data found
            if (glucosaTest.length === 0 || totalTestPatients === 0) {
                return res.status(404).json({
                    status: 'error',
                    statusCode: 404,
                    message: 'No glucose tests found matching the criteria',
                    data: {
                        glucosaTest: [],
                        pagination: {
                            currentPage: pageNumber,
                            totalPages: 0,
                            totalTestPatients: 0,
                            perPage: limitNumber,
                            hasNextPage: false,
                            hasPrevPage: false
                        },
                    }
                });
            }

            // Check if requested page is beyond available pages
            if (pageNumber > totalPages) {
                return res.status(404).json({
                    status: 'error',
                    statusCode: 404,
                    message: `Page ${pageNumber} not found. Total available pages: ${totalPages}`,
                    data: {
                        glucosaTest: [],
                        pagination: {
                            currentPage: pageNumber,
                            totalPages,
                            totalTestPatients,
                            perPage: limitNumber,
                            hasNextPage: false,
                            hasPrevPage: pageNumber > 1
                        },
                    }
                });
            }

            // Success response
            return res.status(200).json({
                status: 'success',
                statusCode: 200,
                message: 'Glucose tests retrieved successfully',
                data: {
                    glucosaTest,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalTestPatients,
                        perPage: limitNumber,
                        hasNextPage: pageNumber < totalPages,
                        hasPrevPage: pageNumber > 1
                    },
                },
            });

        } catch (error) {
            console.error("Error in getAllTestBridgingPatients:", error);

            // Database connection error
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return res.status(503).json({
                    status: 'error',
                    statusCode: 503,
                    message: 'Database connection failed. Please try again later.',
                    data: null
                });
            }

            // SQL syntax error
            if (error.code === 'ER_PARSE_ERROR' || error.sqlState) {
                return res.status(500).json({
                    status: 'error',
                    statusCode: 500,
                    message: 'Database query error occurred.',
                    data: null
                });
            }

            // Generic server error
            return res.status(500).json({
                status: 'error',
                statusCode: 500,
                message: 'Internal server error occurred while retrieving glucose tests.',
                data: {
                    error: process.env.NODE_ENV === 'development' ? error.message : null
                }
            });
        }
    },

    getTestBridgingPatientById: async (req, res) => {
        const { id } = req.params;

        try {
            // Validasi ID
            const testId = parseInt(id, 10);
            if (isNaN(testId) || testId < 1) {
                return res.status(400).json({
                    status: 'error',
                    statusCode: 400,
                    message: 'Invalid ID parameter. ID must be a positive integer.',
                    data: null
                });
            }

            // Ambil data berdasarkan ID
            const glucosaTest = await TestGlucosaBridgingModel.getById(testId);

            // Check if data exists
            if (!glucosaTest) {
                return res.status(404).json({
                    status: 'error',
                    statusCode: 404,
                    message: `Glucose test with ID ${testId} not found.`,
                    data: null
                });
            }

            // Success response
            return res.status(200).json({
                status: 'success',
                statusCode: 200,
                message: 'Glucose test retrieved successfully',
                data: {
                    glucosaTest
                }
            });

        } catch (error) {
            console.error("Error in getTestBridgingPatientById:", error);

            // Database connection error
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return res.status(503).json({
                    status: 'error',
                    statusCode: 503,
                    message: 'Database connection failed. Please try again later.',
                    data: null
                });
            }

            // SQL syntax error
            if (error.code === 'ER_PARSE_ERROR' || error.sqlState) {
                return res.status(500).json({
                    status: 'error',
                    statusCode: 500,
                    message: 'Database query error occurred.',
                    data: null
                });
            }

            // Generic server error
            return res.status(500).json({
                status: 'error',
                statusCode: 500,
                message: 'Internal server error occurred while retrieving glucose test.',
                data: {
                    error: process.env.NODE_ENV === 'development' ? error.message : null
                }
            });
        }
    },
    
};