const express = require('express');
const router = express.Router();
const { runCode } = require('../controllers/compilerController');
const { protect } = require('../main-backend/middleware/authMiddleware');

router.post('/', protect, runCode);

module.exports = router; 