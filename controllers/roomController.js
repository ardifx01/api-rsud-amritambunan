const Room = require("../models/roomModel");

//buatkan saya Controller untuk room
const RoomController = {
  createRoom: async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || !description) {
        return res.status(400).send({
          status: "error",
          message: "Name and description are required",
          data: null,
        });
      }

      const room = await Room.createRoom(name, description);

      return res.status(201).send({
        status: "success",
        message: "Room created successfully",
        data: room,
      });
    } catch (error) {
      // Handle duplicate entry (unique constraint)
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(400).send({
          status: "error",
          message: "Room with this name already exists",
          data: null,
        });
      }

      // Generic error handling
      return res.status(500).send({
        status: "error",
        message: "Failed to create room",
        data: { error: error.message },
      });
    }
  },

  getRoomById: async (req, res) => {
    try {
      const room = await Room.getRoomById(req.params.id);
      if (!room) {
        return res.status(404).send({
          status: "error",
          message: "Room not found",
          data: null,
        });
      }
      res.status(200).send({
        status: "success",
        message: "Room retrieved successfully",
        data: room,
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: "Failed to retrieve room",
        data: { error: error.message },
      });
    }
  },

  getAllRooms: async (req, res) => {
    try {
      // ambil query param untuk pagination & search
      let { page = 1, limit = 10, search = "" } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const offset = (pageNumber - 1) * limitNumber;

      // ambil total data sesuai filter search
      const totalRooms = await Room.count(search);
      const totalPages = Math.ceil(totalRooms / limitNumber);

      // ambil data rooms
      const rooms = await Room.getAllRooms(limitNumber, offset, search);

      res.status(200).send({
        status: "success",
        message: "Rooms retrieved successfully",
        data: {
          rooms,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalRooms,
            perPage: limitNumber,
          },
        },
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: "Failed to fetch rooms",
        data: { error: error.message },
      });
    }
  },

  updateRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name || !description) {
        return res.status(400).send({
          status: "error",
          message: "Name and description are required",
          data: null,
        });
      }

      const room = await Room.updateRoom(id, name, description);

      if (!room) {
        return res.status(404).send({
          status: "error",
          message: "Room not found",
          data: null,
        });
      }

      return res.status(200).send({
        status: "success",
        message: "Room updated successfully",
        data: room,
      });
    } catch (error) {
      // Handle duplicate entry
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(400).send({
          status: "error",
          message: "Room with this name already exists",
          data: null,
        });
      }

      return res.status(500).send({
        status: "error",
        message: "Failed to update room",
        data: { error: error.message },
      });
    }
  },

  deleteRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const success = await Room.deleteRoom(id);
      if (!success) {
        return res.status(404).json({ error: "Room not found" });
      }
      res.status(200).json({ message: "Room deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete room" });
    }
  },
};

module.exports = RoomController;
