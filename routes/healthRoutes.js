// routes/healthRoutes.js

const express = require('express');
const router = express.Router();

// Minimal healthcheck untuk Docker
router.get('/z', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = router;
