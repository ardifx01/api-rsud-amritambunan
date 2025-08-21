//buatkan routes untuk room
const express = require('express');
const RoomController = require('../controllers/roomController');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');
const router = express.Router();

// Gunakan middleware autentikasi sebelum RBAC
router.use(authenticateToken);
// Routes untuk room
router.get('/', authorize('view_room'), RoomController.getAllRooms);
router.get('/:id', authorize('view_room'), RoomController.getRoomById);
router.post('/', authorize('create_room'), RoomController.createRoom);
router.put('/:id', authorize('update_room'), RoomController.updateRoom);
router.delete('/:id', authorize('delete_room'), RoomController.deleteRoom);

module.exports = router;