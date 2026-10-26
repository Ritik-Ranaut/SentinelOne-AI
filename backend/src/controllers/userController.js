const User = require('../models/User');
const Incident = require('../models/Incident');

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ riskScore: -1 });

    // Aggregate incident count per user
    const userStats = await Promise.all(
      users.map(async (u) => {
        const incidentCount = await Incident.countDocuments({ affectedUsers: u.username });
        return {
          ...u.toObject(),
          incidentCount
        };
      })
    );

    res.json({ success: true, data: userStats });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, riskScore } = req.body;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (status) user.status = status;
    if (riskScore !== undefined) user.riskScore = riskScore;
    await user.save();

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, updateUserStatus };
