const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs');
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, userType: user.userType },
        process.env.SECRET_KEY,
        { expiresIn: '1d' }
    );
};

const registerUser = async (req, res) => {
    const { fullName, username, email, password, userType } = req.body;

    try {
        if (!fullName || !username || !email || !password) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: 'Email already in use' });

        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

        const user = await User.create({
            fullName,
            username,
            email,
            password,
            userType: userType || 'user',
            verifyToken,
            verifyTokenExpiry,
        });

        const verificationUrl = `http://localhost:5173/verify/${verifyToken}`;

        const message = `
            <h3>Email Verification</h3>
            <p>Please click the link below to verify your email:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
        `;

        await sendEmail(user.email, 'Verify your email', message);

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        console.log('Received token:', token);

        const user = await User.findOne({
            verifyToken: token,
            verifyTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            console.log('Verification failed. Token not found or expired.');
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verifyToken = undefined;
        user.verifyTokenExpiry = undefined;
        await user.save();

        console.log('User email verified successfully:', user.email);
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email to log in' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        const token = generateToken(user);
        res.status(200).json({
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
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
            username: updatedUser.username,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            userType: updatedUser.userType,
            message: 'Profile updated successfully!',
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    getProfile,
    updateProfile,
};