const SecurityLog = require('../models/SecurityLog');
const socketHandler = require('../sockets/socketHandler');

const getLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      eventType,
      username,
      sourceIp,
      search,
      simulationOnly
    } = req.query;

    const query = {};

    if (severity && severity !== 'ALL') {
      query.severity = severity.toUpperCase();
    }
    if (eventType && eventType !== 'ALL') {
      query.eventType = eventType;
    }
    if (username) {
      query.username = { $regex: username, $options: 'i' };
    }
    if (sourceIp) {
      query.sourceIp = { $regex: sourceIp, $options: 'i' };
    }
    if (simulationOnly === 'true') {
      query.simulationId = { $ne: null };
    }
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { sourceIp: { $regex: search, $options: 'i' } },
        { eventType: { $regex: search, $options: 'i' } },
        { 'metadata.details': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      SecurityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      SecurityLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    next(err);
  }
};

const ingestLog = async (req, res, next) => {
  try {
    const {
      eventType,
      username,
      sourceIp,
      deviceId,
      location,
      severity = 'NORMAL',
      metadata = {},
      simulationId = null
    } = req.body;

    if (!eventType || !username || !sourceIp) {
      return res.status(400).json({ success: false, message: 'Missing required fields: eventType, username, sourceIp' });
    }

    const isSuspicious = severity !== 'NORMAL' || eventType.includes('FAIL') || eventType.includes('PORT');

    const log = await SecurityLog.create({
      eventType,
      username,
      sourceIp,
      deviceId: deviceId || 'DEV-GENERIC',
      location: location || { country: 'US', city: 'San Francisco', latitude: 37.7749, longitude: -122.4194 },
      severity,
      metadata,
      simulationId,
      isSuspicious,
      timestamp: new Date()
    });

    // Broadcast live event via Socket.IO
    socketHandler.emitEvent('security:log', log);

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (err) {
    next(err);
  }
};

const clearLogs = async (req, res, next) => {
  try {
    await SecurityLog.deleteMany({});
    res.json({ success: true, message: 'Security logs cleared successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs, ingestLog, clearLogs };
