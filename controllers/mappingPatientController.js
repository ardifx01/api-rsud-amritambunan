const MappingPatient = require("../models/mappingPatientsModel");
const Patient = require("../models/patientModel");
const dayjs = require("dayjs");

const MappingPatientsController = {
  //controller
  createMappingPatient: async (req, res) => {
    try {
      const data = req.body;

      // Panggil langsung fungsi create dari model
      const patient = await MappingPatient.createMapping(data);

      return res.status(200).json({
        status: "success",
        message: "Order Lab Patient created successfully",
        statusCode: 200,
        data: patient,
      });
    } catch (error) {
      // Jika error berupa string JSON (validasi dari model)
      if (error.message && error.message.startsWith("{")) {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          statusCode: 400,
          errors: JSON.parse(error.message),
        });
      }

      // Handle Sequelize Unique Constraint Error
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          status: "error",
          message: "Patient with this NIK or email already exists",
          statusCode: 400,
          errors: null,
        });
      }

      // General error
      return res.status(500).json({
        status: "error",
        message: "Failed to create patient",
        statusCode: 500,
        error: error.message,
      });
    }
  },

  // Mendapatkan semua pasien dengan pagination
  // getAllPatients: async (req, res) => {
  //     const { page = 1, limit = 10, search = '' } = req.query;

  //     // Pastikan parameter `page` dan `limit` adalah angka
  //     const pageNumber = parseInt(page, 10) || 1;
  //     const limitNumber = parseInt(limit, 10) || 10;

  //     // Hitung offset
  //     const offset = (pageNumber - 1) * limitNumber;

  //     try {
  //         // Dapatkan data pasien dengan limit, offset, dan search
  //         const mappingPatients = await MappingPatient.getAllWithPagination(limitNumber, offset, search);

  //         // Hitung total data pasien yang cocok dengan search
  //         const totalPatients = await MappingPatient.getTotalCount(search);

  //         // Hitung total halaman
  //         const totalPages = Math.ceil(totalPatients / limitNumber);

  //         res.status(200).send({
  //             status: 'success',
  //             message: 'Patients retrieved successfully',
  //             data: {
  //                 mappingPatients,
  //                 pagination: {
  //                     currentPage: pageNumber,
  //                     totalPages,
  //                     totalPatients,
  //                     perPage: limitNumber,
  //                 },
  //             },
  //         });
  //     } catch (error) {
  //         res.status(500).send({
  //             status: 'error',
  //             message: 'Failed to retrieve patients',
  //             data: { error: error.message },
  //         });
  //     }
  // },

  getAllPatients: async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      start_date,
      end_date,
      date,
      is_order, // Parameter is_order
      room, // Tambahkan parameter room
    } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    try {
      let formattedStart = null;
      let formattedEnd = null;
      let formattedDate = null;

      if (start_date && end_date) {
        const [sd, sm, sy] = start_date.split("-");
        const [ed, em, ey] = end_date.split("-");
        formattedStart = `${sy}-${sm}-${sd}`;
        formattedEnd = `${ey}-${em}-${ed}`;
      }

      if (date) {
        const [d, m, y] = date.split("-");
        formattedDate = `${y}-${m}-${d}`;
      }

      const mappingPatients = await MappingPatient.getAllWithPagination(
        limitNumber,
        offset,
        search,
        formattedStart,
        formattedEnd,
        formattedDate,
        is_order, // Pass is_order parameter ke model
        room // Pass room parameter ke model
      );

      const totalPatients = await MappingPatient.getTotalCount(
        search,
        formattedStart,
        formattedEnd,
        formattedDate,
        is_order, // Pass is_order parameter ke getTotalCount
        room // Pass room parameter ke getTotalCount
      );

      const totalPages = Math.ceil(totalPatients / limitNumber);

      res.status(200).send({
        status: "success",
        message: "Patients retrieved successfully",
        data: {
          mappingPatients,
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
        status: "error",
        message: "Failed to retrieve patients",
        data: { error: error.message },
      });
    }
  },

  getAvailableRooms: async (req, res) => {
    try {
      const rooms = await MappingPatient.getAvailableRooms();
      
      res.status(200).send({
        status: "success",
        message: "Available rooms retrieved successfully",
        data: {
          rooms,
        },
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: "Failed to retrieve available rooms",
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
          status: "error",
          message: "Patient not found",
          data: null,
        });
      }
      res.status(200).send({
        status: "success",
        message: "Patient retrieved successfully",
        data: patient,
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: "Failed to retrieve patient",
        data: { error: error.message },
      });
    }
  },

  // Memperbarui data pasien
  updateMappingPatient: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate ID
      if (!id || isNaN(id)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid patient ID",
          data: null,
        });
      }

      // Prevent updating patient_code and barcode
      if (updateData.patient_code || updateData.barcode) {
        return res.status(400).send({
          status: "error",
          message: "Cannot update patient code or barcode",
          data: null,
        });
      }

      // Validasi NIK (jika diubah)
      if (
        updateData.nik &&
        (updateData.nik.length !== 16 || !/^\d+$/.test(updateData.nik))
      ) {
        return res.status(400).send({
          status: "error",
          message: "NIK must be exactly 16 digits and contain only numbers",
          data: null,
        });
      }

      // Validasi nomor telepon (jika diubah)
      if (updateData.number_phone) {
        // Validasi hanya angka
        if (!/^\d+$/.test(updateData.number_phone)) {
          return res.status(400).send({
            status: "error",
            message: "Phone number must contain only numbers",
            data: null,
          });
        }

        // Validasi panjang
        if (
          updateData.number_phone.length < 11 ||
          updateData.number_phone.length > 13
        ) {
          return res.status(400).send({
            status: "error",
            message: "Phone number must be between 11 and 13 digits",
            data: null,
          });
        }

        // Validasi awalan "08"
        if (!updateData.number_phone.startsWith("08")) {
          return res.status(400).send({
            status: "error",
            message: 'Invalid Phone Number, must start with "08"',
            data: null,
          });
        }
      }

      // Validasi email (jika diubah)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (updateData.email && !emailRegex.test(updateData.email)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid email format",
          data: null,
        });
      }

      // Validasi status (jika diubah)
      if (
        updateData.status &&
        !["active", "inactive"].includes(updateData.status)
      ) {
        return res.status(400).send({
          status: "error",
          message: 'Status must be either "active" or "inactive"',
          data: null,
        });
      }

      // Jalankan update
      const requiredFields = [
        "nik",
        "name",
        "gender",
        "place_of_birth",
        "date_of_birth",
        "address",
        "number_phone",
        "email",
      ];

      for (const field of requiredFields) {
        if (!updateData[field]) {
          return res.status(400).send({
            status: "error",
            message: `${field} is required`,
            data: null,
          });
        }
      }

      const patient = await Patient.update(id, updateData);

      // Cek apakah update berhasil
      if (!patient) {
        return res.status(404).send({
          status: "error",
          message: "Patient not found",
          data: null,
        });
      }

      // Berikan response sukses
      res.status(200).send({
        status: "success",
        message: "Patient updated successfully",
        data: patient,
      });
    } catch (error) {
      // Tangani error unique constraint (misalnya NIK atau email duplikat)
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).send({
          status: "error",
          message: "NIK or email already exists",
          data: null,
        });
      }

      // Error umum
      res.status(500).send({
        status: "error",
        message: "Failed to update patient",
        data: { error: error.message },
      });
    }
  },

  // Menghapus pasien
  deleteMappingPatient: async (req, res) => {
    try {
      const deleted = await Patient.delete(req.params.id);
      if (!deleted) {
        return res.status(404).send({
          status: "error",
          message: "Patient not found",
          data: null,
        });
      }
      res.status(200).send({
        status: "success",
        message: "Patient deleted successfully",
        data: null,
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: "Failed to delete patient",
        data: { error: error.message },
      });
    }
  },

  //get counts all patient
  getCounts: async (req, res) => {
    const totalPatients = await Patient.getTotalCount();
    res.status(200).send({
      status: "success",
      message: "Total patients retrieved successfully",
      data: totalPatients,
    });
  },

  //buatkan menampilkan total pasien yang terdaftar setiap bulan
  getTotalPatientsPerMonth: async (req, res) => {
    try {
      console.log("Calling getTotalPatientsPerMonth function...");
      const patientData = await Patient.totalPatientsPerMonth();
      console.log("Query result:", patientData);

      const formattedData = patientData.map((item) => ({
        month: item.month,
        totalPatients: parseInt(item.total_patients),
      }));

      res.status(200).send({
        status: "success",
        message: "Total patients per month retrieved successfully",
        data: formattedData,
      });
    } catch (error) {
      console.error("Error in getTotalPatientsPerMonth:", error);
      res.status(500).send({
        status: "error",
        message: "Failed to retrieve total patients per month",
        data: { error: error.message },
      });
    }
  },
};

module.exports = MappingPatientsController;
