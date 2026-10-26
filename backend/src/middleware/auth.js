const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/security');

const getBearerToken = (authorizationHeader) => {
  if (typeof authorizationHeader !== 'string') return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const protect = async (req, res, next) => {
  let token = null;
  const authorizationHeader = req.headers.authorization;
  if (authorizationHeader) {
    token = getBearerToken(authorizationHeader);
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User no longer exists.' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired.' });
    }
  }

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user ? req.user.role : 'GUEST'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
