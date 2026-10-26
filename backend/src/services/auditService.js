const AuditLog = require('../models/AuditLog');
const socketHandler = require('../sockets/socketHandler');

const recordAudit = async ({ user, action, resource, result = 'SUCCESS', ipAddress = '127.0.0.1', metadata = {} }) => {
  try {
    const log = await AuditLog.create({
      user: typeof user === 'string' ? user : (user?.username || 'SYSTEM'),
      action,
      resource,
      result,
      ipAddress,
      metadata,
      timestamp: new Date()
    });

    // Emit live to analysts in real time
    socketHandler.emitEvent('audit:log', log);
    return log;
  } catch (error) {
    console.error('[Audit Service Error]:', error.message);
    return null;
  }
};

module.exports = { recordAudit };
