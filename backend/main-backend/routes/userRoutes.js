const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    verifyEmail,
    getUserStats,
    getUserSubmissions,
    getLeaderboard 
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/signup', registerUser);
router.get('/verify/:token', verifyEmail);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profilePic'), updateProfile);
router.get('/:id/stats', protect, getUserStats);
router.get('/:id/submissions', protect, getUserSubmissions);
router.get('/leaderboard', getLeaderboard); 

module.exports = router;