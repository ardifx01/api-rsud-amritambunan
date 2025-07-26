const Patient = require('../models/patientModel');

const PatientsController = {
    // Membuat pasien baru
    createPatient: async (req, res) => {
        const {
            nik,
            name,
            gender,
            place_of_birth,
            date_of_birth,
            address,
            number_phone,
            email
        } = req.body;

        // Validasi NIK (16 digit)
        if (!nik || nik.length !== 16 || !/^\d+$/.test(nik)) {
            return res.status(400).send({
                status: 'error',
                message: 'NIK must be exactly 16 numeric characters',
                data: null
            });
        }

        // Validasi nomor telepon (11-12 digit)
        if (!number_phone || number_phone.length < 11 || number_phone.length > 12 || !/^\d+$/.test(number_phone)) {
            return res.status(400).send({
                status: 'error',
                message: 'Phone number must be 11-12 numeric characters',
                data: null
            });
        }

        // Validasi email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).send({
                status: 'error',
                message: 'Invalid email format',
                data: null
            });
        }

        // Validasi input wajib lainnya
        const requiredFields = [
            { field: 'name', message: 'Name is required' },
            { field: 'gender', message: 'Gender is required' },
            { field: 'place_of_birth', message: 'Place of birth is required' },
            { field: 'date_of_birth', message: 'Date of birth is required' },
            { field: 'address', message: 'Address is required' }
        ];

        for (const { field, message } of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).send({
                    status: 'error',
                    message: message,
                    data: null
                });
            }
        }

        try {
            const patient = await Patient.create({
                nik,
                name,
                gender,
                place_of_birth,
                date_of_birth,
                address,
                number_phone,
                email,
                status: 'active' // Default status
            });

            res.status(201).send({
                status: 'success',
                message: 'Patient created successfully',
                data: patient
            });
        } catch (error) {
            // Handle unique constraint violations
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).send({
                    status: 'error',
                    message: 'Patient with this NIK or email already exists',
                    data: null
                });
            }

            // Generic error handling
            res.status(500).send({
                status: 'error',
                message: 'Failed to create patient',
                data: { error: error.message }
            });
        }
    },

    // Mendapatkan semua pasien dengan pagination
    getAllPatients: async (req, res) => {
        const { page = 1, limit = 10, search = '' } = req.query;

        // Pastikan parameter `page` dan `limit` adalah angka
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;

        // Hitung offset
        const offset = (pageNumber - 1) * limitNumber;

        try {
            // Dapatkan data pasien dengan limit, offset, dan search
            const patients = await Patient.getAllWithPagination(limitNumber, offset, search);

            // Hitung total data pasien yang cocok dengan search
            const totalPatients = await Patient.getTotalCount(search);

            // Hitung total halaman
            const totalPages = Math.ceil(totalPatients / limitNumber);

            res.status(200).send({
                status: 'success',
                message: 'Patients retrieved successfully',
                data: {
                    patients,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages,
                        totalPatients,
                        perPage: limitNumber,
                    },
                },
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve patients',
                data: { error: error.message },
            });
        }
    },

    // Mendapatkan pasien berdasarkan ID
    getPatientById: async (req, res) => {
        try {
            const patient = await Patient.getById(req.params.id);
            if (!patient) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Patient not found',
                    data: null
                });
            }
            res.status(200).send({
                status: 'success',
                message: 'Patient retrieved successfully',
                data: patient
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve patient',
                data: { error: error.message }
            });
        }
    },

    // Memperbarui data pasien
    updatePatient: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Validate ID
            if (!id || isNaN(id)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Invalid patient ID',
                    data: null
                });
            }

            // Prevent updating patient_code and barcode
            if (updateData.patient_code || updateData.barcode) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Cannot update patient code or barcode',
                    data: null
                });
            }

            // Validasi NIK (jika diubah)
            if (updateData.nik && (updateData.nik.length !== 16 || !/^\d+$/.test(updateData.nik))) {
                return res.status(400).send({
                    status: 'error',
                    message: 'NIK must be exactly 16 digits and contain only numbers',
                    data: null
                });
            }

            // Validasi nomor telepon (jika diubah)
            if (updateData.number_phone) {
                // Validasi hanya angka
                if (!/^\d+$/.test(updateData.number_phone)) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Phone number must contain only numbers',
                        data: null
                    });
                }

                // Validasi panjang
                if (
                    updateData.number_phone.length < 11 ||
                    updateData.number_phone.length > 13
                ) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Phone number must be between 11 and 13 digits',
                        data: null
                    });
                }

                // Validasi awalan "08"
                if (!updateData.number_phone.startsWith("08")) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Invalid Phone Number, must start with "08"',
                        data: null
                    });
                }
            }

            // Validasi email (jika diubah)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (updateData.email && !emailRegex.test(updateData.email)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Invalid email format',
                    data: null
                });
            }

            // Validasi status (jika diubah)
            if (updateData.status && !['active', 'inactive'].includes(updateData.status)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Status must be either "active" or "inactive"',
                    data: null
                });
            }

            // Jalankan update
            const requiredFields = [
                "nik", "name", "gender", "place_of_birth", "date_of_birth", "address", "number_phone", "email"
            ];

            for (const field of requiredFields) {
                if (!updateData[field]) {
                    return res.status(400).send({
                        status: 'error',
                        message: `${field} is required`,
                        data: null
                    });
                }
            }

            const patient = await Patient.update(id, updateData);

            // Cek apakah update berhasil
            if (!patient) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Patient not found',
                    data: null
                });
            }

            // Berikan response sukses
            res.status(200).send({
                status: 'success',
                message: 'Patient updated successfully',
                data: patient
            });

        } catch (error) {
            // Tangani error unique constraint (misalnya NIK atau email duplikat)
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).send({
                    status: 'error',
                    message: 'NIK or email already exists',
                    data: null
                });
            }

            // Error umum
            res.status(500).send({
                status: 'error',
                message: 'Failed to update patient',
                data: { error: error.message }
            });
        }
    },

    // Menghapus pasien
    deletePatient: async (req, res) => {
        try {
            const deleted = await Patient.delete(req.params.id);
            if (!deleted) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Patient not found',
                    data: null
                });
            }
            res.status(200).send({
                status: 'success',
                message: 'Patient deleted successfully',
                data: null
            });
        } catch (error) {
            res.status(500).send({
                status: 'error',
                message: 'Failed to delete patient',
                data: { error: error.message }
            });
        }
    },


    //get counts all patient
    getCounts: async (req, res) => {
        const totalPatients = await Patient.getTotalCount();
        res.status(200).send({
            status: 'success',
            message: 'Total patients retrieved successfully',
            data: totalPatients
        });
    },

    //buatkan menampilkan total pasien yang terdaftar setiap bulan
    getTotalPatientsPerMonth: async (req, res) => {
        try {
            console.log("Calling getTotalPatientsPerMonth function...");
            const patientData = await Patient.totalPatientsPerMonth();
            console.log("Query result:", patientData);

            const formattedData = patientData.map(item => ({
                month: item.month,
                totalPatients: parseInt(item.total_patients)
            }));

            res.status(200).send({
                status: 'success',
                message: 'Total patients per month retrieved successfully',
                data: formattedData
            });
        } catch (error) {
            console.error("Error in getTotalPatientsPerMonth:", error);
            res.status(500).send({
                status: 'error',
                message: 'Failed to retrieve total patients per month',
                data: { error: error.message }
            });
        }
    },

    getLabNumberByPatientCode: async (req, res) => {
        try {
            const { patient_code } = req.params;

            if (!patient_code) {
                return res.status(400).json({
                    success: false,
                    message: 'Patient code is required'
                });
            }

            const labNumbers = await Patient.getLabNumberByPatientCode(patient_code);

            if (labNumbers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No lab numbers found for this patient code with is_order = 0'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Lab numbers retrieved successfully',
                data: labNumbers
            });

        } catch (error) {
            console.error('Error in getLabNumberByPatientCode:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },
};

module.exports = PatientsController;
