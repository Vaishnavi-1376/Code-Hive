const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const mongoose = require('mongoose');

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, userType: user.userType },
        process.env.SECRET_KEY,
        { expiresIn: '1d' }
    );
};

const registerUser = async (req, res) => {
    const { fullName, username, email, password } = req.body;
    try {
        if (!fullName || !username || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all required fields: Full Name, Username, Email, and Password.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username is already taken. Please choose a different one.' });
        }
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

        const newUser = await User.create({
            fullName,
            username,
            email,
            password: password,
            verifyToken,
            verifyTokenExpiry,
            isVerified: false,
        });

        const frontendBaseUrl = process.env.FRONTEND_VERCEL_URL;

        if (!frontendBaseUrl) {
            console.error("CRITICAL ERROR: FRONTEND_VERCEL_URL environment variable is not set on the backend!");
            throw new Error('Frontend URL not configured on the server.');
        }

        const verifyUrl = `${frontendBaseUrl}/verify/${verifyToken}`;

        await sendEmail(email, 'Verify Your Email for Online Judge', `Please click this link to verify your email: ${verifyUrl}`);
        res.status(201).json({ message: 'User registered successfully! Check your email to verify your account.' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
    
        if (error.message === 'Frontend URL not configured on the server.') {
            return res.status(500).json({ message: 'Server configuration error: Frontend URL is missing.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;
    try {
        console.log('🔍 Verifying token received:', token);
        const user = await User.findOne({ verifyToken: token });
        if (!user) {
            console.log(' Invalid token: User not found with this verification token.');
            return res.status(400).json({ message: 'Invalid verification link.' });
        }
        console.log('User found for token:', user.email);
        if (user.isVerified) {
            console.log(' Email already verified for:', user.email);
            return res.status(400).json({ message: 'Your email is already verified. You can now log in.' });
        }
        if (user.verifyTokenExpiry && user.verifyTokenExpiry < Date.now()) {
            console.log('Token expired for user:', user.email);
            return res.status(400).json({ message: 'Your verification link has expired. Please request a new verification email.' });
        }
        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;
        await user.save();
        console.log('Email verified successfully for:', user.email);
        res.status(200).json({ message: 'Email verified successfully!' });
    } catch (error) {
        console.error(' Server error during email verification:', error);
        res.status(500).json({ message: 'Server error during email verification.' });
    }
};

const loginUser = async (req, res) => {
    console.log('--- LOGIN REQUEST HIT CONTROLLER ---');
    console.log('Incoming Request Body:', req.body);
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            console.log(' Login failed: Missing email or password.');
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log(' Login failed: User not found with this email.');
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (!user.isVerified) {
            console.log('Login failed: Email not verified for user:', user.email);
            return res.status(403).json({ message: 'Please verify your email to log in' });
        }
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log(' Login failed: Password mismatch for user:', user.email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        console.log(`User type from DB for ${user.email}: ${user.userType}`);
        const token = generateToken(user);
        console.log(' Login successful for:', user.email);
        res.status(200).json({
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic,
                userType: user.userType,
            },
            token,
        });
    } catch (error) {
        console.error('Login error in catch block:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getProfile = async (req, res) => {
    if (req.user) {
        res.json({
            _id: req.user._id,
            fullName: req.user.fullName,
            username: req.user.username,
            email: req.user.email,
            profilePic: req.user.profilePic,
            userType: req.user.userType,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const updateProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        user.fullName = req.body.fullName || user.fullName;
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        if (req.file) {
            if (user.profilePic && user.profilePic !== '/uploads/default-profile.png') {
                const oldProfilePicPath = path.join(__dirname, '../', user.profilePic);
                fs.unlink(oldProfilePicPath, (err) => {
                    if (err) {
                        console.error("Failed to delete old profile pic:", err);
                    }
                });
            }
            user.profilePic = `/uploads/${req.file.filename}`;
        }
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            username: updated.username,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            userType: updatedUser.userType,
            message: 'Profile updated successfully!',
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const getUserStats = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid or missing userId in getUserStats:', userId);
            return res.status(400).json({ message: 'Invalid user ID provided.' });
        }

        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // 1. Problems Solved

        const problemsSolvedResult = await Submission.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), verdict: 'Accepted' } },
            { $group: { _id: '$problem' } },
            { $count: 'problemsSolvedCount' }
        ]);

        const problemsSolvedCount = problemsSolvedResult.length > 0 ? problemsSolvedResult[0].problemsSolvedCount : 0;
        // 2. User Rank (calculated from all users' stats)

        const allUsersStats = await User.aggregate([
            {
                $lookup: {
                    from: 'submissions',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'submissions'
                }
            },
            {
                $unwind: {
                    path: '$submissions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    'submissions.verdict': 'Accepted'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    fullName: { $first: '$fullName' },
                    username: { $first: '$username' },
                    problemsSolved: { $addToSet: '$submissions.problem' }
                }
            },
            {
                $addFields: {
                    problemsSolvedCount: { $size: '$problemsSolved' }
                }
            },
            {
                $sort: { problemsSolvedCount: -1 }
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    problemsSolvedCount: 1
                }
            }
        ]);
        let rank = 'N/A';
        const userIndex = allUsersStats.findIndex(u => u._id.toString() === userId);
        if (userIndex !== -1) {
            rank = userIndex + 1;
        }
        // 3. Last Submission

        const lastSubmission = await Submission.findOne({ user: userId })
            .sort({ submittedAt: -1 })
            .populate('problem', 'title')
            .select('verdict submittedAt problem')
            .lean();
        let formattedLastSubmission = null;
        if (lastSubmission) {
            formattedLastSubmission = {
                problemTitle: lastSubmission.problem ? lastSubmission.problem.title : 'Unknown Problem',
                verdict: lastSubmission.verdict,
                submittedAt: lastSubmission.submittedAt,
            };
        }
        res.json({
            problemsSolved: problemsSolvedCount,
            rank: rank,
            lastSubmission: formattedLastSubmission
        });
    } catch (error) {
        console.error('Error in getUserStats:', error);
        res.status(500).json({ message: 'Server error fetching user statistics.' });
    }
};
const getUserSubmissions = async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid or missing userId for submissions fetch:', userId);
            return res.status(400).json({ message: 'Invalid user ID provided.' });
        }
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const submissions = await Submission.find({ user: userId })
            .populate('problem', 'title')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const totalSubmissions = await Submission.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalSubmissions / limit);
        res.json({
            submissions,
            totalPages,
            currentPage: page,
            totalSubmissions
        });
    } catch (error) {
        console.error('Error in getUserSubmissions:', error);
        res.status(500).json({ message: 'Server error fetching user submissions.' });
    }
};

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await User.aggregate([
            {
                $lookup: {
                    from: 'submissions',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'userSubmissions'
                }
            },
            {
                $unwind: {
                    path: '$userSubmissions',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $match: {
                    'userSubmissions.verdict': 'Accepted'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    fullName: { $first: '$fullName' },
                    username: { $first: '$username' },
                    profilePic: { $first: '$profilePic' },
                    problemsSolved: { $addToSet: '$userSubmissions.problem' }
                }
            },
            {
                $addFields: {
                    problemsSolvedCount: { $size: '$problemsSolved' }
                }
            },
            {
                $sort: { problemsSolvedCount: -1, username: 1 }
            },
            {
                $project: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    profilePic: 1,
                    problemsSolvedCount: 1
                }
            }
        ]);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Server error fetching leaderboard.' });
    }
};

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    getProfile,
    updateProfile,
    getUserStats,
    getUserSubmissions,
    getLeaderboard,
};