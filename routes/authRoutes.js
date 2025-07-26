const express = require('express');
const AuthController = require('../controllers/authController');
const router = express.Router();

// Register user
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

// Verify token
router.get('/verify-token', AuthController.verifyToken);

// Logout user
router.post('/logout', AuthController.logout);

// Debugging endpoint untuk mengambil token (Hanya tersedia di mode development)
if (process.env.NODE_ENV === 'development') {
    router.get('/debug/token', AuthController.debugToken);
}

module.exports = router;