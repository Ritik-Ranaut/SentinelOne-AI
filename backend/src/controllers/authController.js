const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { recordAudit } = require('../services/auditService');
const { jwtSecret } = require('../config/security');

const validateRegistration = ({ username, email, password }) => {
  if (![username, email, password].every(value => typeof value === 'string')) {
    return 'Username, email, and password are required.';
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(normalizedUsername)) {
    return 'Username must be 3-32 characters using letters, numbers, dots, underscores, or hyphens.';
  }
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return 'Please provide a valid email address.';
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    return 'Password must be at least 12 characters and no more than 72 UTF-8 bytes.';
  }

  return null;
};

const buildPublicRegistrationData = ({ username, email, password, fullName, department }) => ({
  username: username.trim(),
  email: email.trim().toLowerCase(),
  password,
  role: 'VIEWER',
  fullName: typeof fullName === 'string' && fullName.trim() ? fullName.trim() : username.trim(),
  department: typeof department === 'string' && department.trim() ? department.trim() : 'Security Operations'
});

const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '30d'
  });
};

const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, department } = req.body || {};
    const validationError = validateRegistration({ username, email, password });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const registrationData = buildPublicRegistrationData({ username, email, password, fullName, department });

    const userExists = await User.findOne({
      $or: [{ email: registrationData.email }, { username: registrationData.username }]
    });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this username or email' });
    }

    const user = await User.create(registrationData);

    await recordAudit({
      user: registrationData.username,
      action: 'USER_REGISTERED',
      resource: `User: ${registrationData.username} (VIEWER)`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department
      }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedPassword = typeof password === 'string' ? password : '';

    if (!normalizedUsername || !normalizedPassword) {
      return res.status(400).json({ success: false, message: 'Please provide a valid username and password' });
    }

    const user = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedUsername.toLowerCase() }]
    });

    if (!user || !(await user.matchPassword(password))) {
      await recordAudit({
        user: username || 'ANONYMOUS',
        action: 'LOGIN_FAILURE',
        resource: 'Authentication Service',
        result: 'FAILURE',
        ipAddress: req.ip
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'LOCKED' || user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}. Contact SOC Administrator.` });
    }

    user.lastLogin = new Date();
    await user.save();

    await recordAudit({
      user: user.username,
      action: 'LOGIN_SUCCESS',
      resource: 'Web Console',
      result: 'SUCCESS',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department,
        riskScore: user.riskScore
      }
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, validateRegistration, buildPublicRegistrationData };
