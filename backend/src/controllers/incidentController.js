const Incident = require('../models/Incident');
const SecurityLog = require('../models/SecurityLog');
const ResponseAction = require('../models/ResponseAction');
const AuditLog = require('../models/AuditLog');
const socketHandler = require('../sockets/socketHandler');
const { recordAudit } = require('../services/auditService');

const validateAnalystDecision = (payload, recommendations = []) => {
  if (!payload || !Number.isInteger(payload.actionIndex) || payload.actionIndex < 0) {
    return 'A valid action index is required.';
  }
  if (!['APPROVED', 'REJECTED'].includes(payload.decision)) {
    return 'Decision must be APPROVED or REJECTED.';
  }
  if (payload.notes !== undefined && (typeof payload.notes !== 'string' || payload.notes.length > 500)) {
    return 'Decision notes must be text no longer than 500 characters.';
  }

  const recommendation = recommendations[payload.actionIndex];
  if (!recommendation) return 'Invalid action index.';
  if (!recommendation.requiresApproval) return 'This action does not require analyst approval.';
  if (recommendation.status !== 'PENDING') return 'This action has already been decided.';

  return null;
};

const getIncidents = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      severity,
      status,
      type,
      user,
      minRisk,
      search
    } = req.query;

    const query = {};
    if (severity && severity !== 'ALL') query.severity = severity;
    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.type = type;
    if (user) query.affectedUsers = { $in: [new RegExp(user, 'i')] };
    if (minRisk) query.riskScore = { $gte: parseInt(minRisk, 10) };
    if (search) {
      query.$or = [
        { incidentId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { affectedUsers: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [incidents, total] = await Promise.all([
      Incident.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Incident.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: incidents,
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

const getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let incident = await Incident.findOne({
      $or: [{ incidentId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    }).populate('relatedEvents');

    if (!incident) {
      return res.status(404).json({ success: false, message: `Incident ${id} not found` });
    }

    // Fetch associated audit logs for this incident
    const auditLogs = await AuditLog.find({
      $or: [
        { resource: { $regex: incident.incidentId, $options: 'i' } },
        { 'metadata.incidentId': incident.incidentId }
      ]
    }).sort({ timestamp: -1 });

    res.json({
      success: true,
      data: incident,
      auditLogs
    });
  } catch (err) {
    next(err);
  }
};

const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedAnalyst, severity } = req.body;

    const incident = await Incident.findOne({
      $or: [{ incidentId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const previousStatus = incident.status;
    if (status) incident.status = status;
    if (assignedAnalyst) incident.assignedAnalyst = assignedAnalyst;
    if (severity) incident.severity = severity;
    if (status === 'RESOLVED') incident.resolvedAt = new Date();

    await incident.save();

    await recordAudit({
      user: req.user?.username || 'Analyst',
      action: 'INCIDENT_UPDATED',
      resource: `Incident ${incident.incidentId}`,
      metadata: { previousStatus, newStatus: status, assignedAnalyst }
    });

    socketHandler.emitEvent('incident:updated', incident);

    res.json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Human-In-The-Loop: Analyst Approves or Rejects Defensive Action
 */
const handleAnalystDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { actionIndex, decision, notes = '' } = req.body || {};

    const incident = await Incident.findOne({
      $or: [{ incidentId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    if (incident.status === 'RESOLVED' || incident.status === 'FALSE_POSITIVE') {
      return res.status(409).json({ success: false, message: 'Closed incidents cannot accept response decisions.' });
    }

    const validationError = validateAnalystDecision({ actionIndex, decision, notes }, incident.recommendations);
    if (validationError) {
      const status = validationError.includes('already been decided') ? 409 : 400;
      return res.status(status).json({ success: false, message: validationError });
    }

    const rec = incident.recommendations[actionIndex];
    rec.status = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    incident.analystDecision = {
      decision: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      analystName: req.user?.username || 'Security Analyst',
      decisionNotes: notes || (decision === 'APPROVED' ? 'Action approved by SOC analyst' : 'Action rejected by SOC analyst'),
      timestamp: new Date()
    };

    if (decision === 'APPROVED') {
      incident.status = 'ACTION_TAKEN';
    }

    await incident.save();

    // Record formal ResponseAction record
    await ResponseAction.create({
      incidentId: incident.incidentId,
      actionType: rec.action.includes('Block') ? 'BLOCK_IP' : 'REVOKE_ACTIVE_SESSIONS',
      title: rec.action,
      description: rec.reason,
      target: rec.target || 'TARGET-ENTITY',
      status: decision === 'APPROVED' ? 'EXECUTED' : 'REJECTED',
      analyst: req.user?.username || 'Security Analyst',
      notes,
      executedAt: new Date(),
      executionLog: decision === 'APPROVED' ? `Simulated execution: Successfully applied containment policy for ${rec.target}. Perimeter firewall rules updated.` : 'Remediation aborted by analyst.'
    });

    // Record immutable audit entry
    await recordAudit({
      user: req.user?.username || 'Security Analyst',
      action: decision === 'APPROVED' ? 'DEFENSIVE_ACTION_APPROVED' : 'DEFENSIVE_ACTION_REJECTED',
      resource: `Incident ${incident.incidentId}: ${rec.action}`,
      result: decision === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      metadata: { action: rec.action, target: rec.target, notes }
    });

    socketHandler.emitEvent('incident:updated', incident);

    res.json({
      success: true,
      message: `Action ${decision.toLowerCase()} successfully`,
      data: incident
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  updateIncident,
  handleAnalystDecision,
  validateAnalystDecision
};
