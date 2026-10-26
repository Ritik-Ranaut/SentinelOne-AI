const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'ANALYST', 'VIEWER'],
    default: 'ANALYST'
  },
  fullName: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'Security Operations'
  },
  failedLogins: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  riskScore: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'FLAGGED', 'LOCKED'],
    default: 'ACTIVE'
  },
  knownDevices: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
