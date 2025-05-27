const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.SECRET_KEY); 
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorizeRoles = (...roles) => { 
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.userType)) {
            return res.status(403).json({ message: `Role (${req.user ? req.user.userType : 'none'}) is not allowed to access this resource` });
        }
        next(); 
    };
};

module.exports = {
    protect,
    authorizeRoles,
};