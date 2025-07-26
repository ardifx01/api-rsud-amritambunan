const express = require('express');
const router = express.Router();
const staticTokenController = require('../controllers/staticTokenController');
const { authenticateToken } = require('../config/auth');
const authorize = require('../middleware/rbac');

// Test route tanpa middleware
router.get('/test', (req, res) => {
    res.json({ message: 'Route berhasil diakses' });
});



router.use(authenticateToken);

router.get('/', authorize('view_static_token'), staticTokenController.get);
router.put('/:id', authorize('update_static_token'), staticTokenController.updateToken);

module.exports = router;

