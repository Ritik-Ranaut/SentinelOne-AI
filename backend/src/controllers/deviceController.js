const Device = require('../models/Device');
const { recordAudit } = require('../services/auditService');

const getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find().sort({ riskScore: -1 });
    res.json({ success: true, data: devices });
  } catch (err) {
    next(err);
  }
};

const isolateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'ISOLATE' | 'RESTORE'
    const device = await Device.findOne({
      $or: [{ deviceId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    device.status = action === 'ISOLATE' ? 'ISOLATED' : 'HEALTHY';
    await device.save();

    await recordAudit({
      user: req.user?.username || 'Analyst',
      action: action === 'ISOLATE' ? 'DEVICE_ISOLATED' : 'DEVICE_RESTORED',
      resource: `Device ${device.deviceId} (${device.hostname})`,
      metadata: { ip: device.ip, user: device.user }
    });

    res.json({ success: true, data: device, message: `Device ${device.deviceId} is now ${device.status}` });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDevices, isolateDevice };
