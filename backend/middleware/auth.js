const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticationToken = async (req, res, next) => {
    try {
        console.log('Auth Middleware - Headers:', req.headers);
        console.log('Auth Middleware - Cookies:', req.cookies);
        
        const token = req.cookies.token;

        if (!token) {
            console.log('No token found in cookies');
            return res.status(401).json({ 
                message: 'Access Denied. No token Provided.',
                cookies: req.cookies
            });
        }

        let decoded;
        try {
            console.log('Attempting to verify token...');
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verified successfully:', decoded);
        } catch (tokenError) {
            console.error('Token verification failed:', tokenError);
            return res.status(401).json({ 
                message: 'Invalid token',
                error: tokenError.message 
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            console.log('User not found for token. User ID:', decoded.userId);
            return res.status(401).json({ 
                message: 'Invalid token. User not Found',
                userId: decoded.userId 
            });
        }

        console.log('User authenticated:', user._id);
        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }

        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Internal server error during authentication.' });
    }
};

module.exports = { authenticationToken };