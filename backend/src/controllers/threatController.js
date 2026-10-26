const Threat = require('../models/Threat');
const ThreatIndicator = require('../models/ThreatIndicator');

const getThreats = async (req, res, next) => {
  try {
    const threats = await Threat.find().sort({ lastSeen: -1 });
    res.json({ success: true, data: threats });
  } catch (err) {
    next(err);
  }
};

const getThreatIndicators = async (req, res, next) => {
  try {
    const { type, reputation } = req.query;
    const query = {};
    if (type) query.type = type;
    if (reputation) query.reputation = reputation;
    const indicators = await ThreatIndicator.find(query).sort({ lastReported: -1 }).limit(100);
    res.json({ success: true, data: indicators });
  } catch (err) {
    next(err);
  }
};

const lookupIndicator = async (req, res, next) => {
  try {
    const { indicator } = req.params;
    let found = await ThreatIndicator.findOne({ indicator });

    if (!found) {
      // Return synthetic reputation for lookup demo
      const isSus = indicator.startsWith('185.') || indicator.startsWith('45.') || indicator.startsWith('194.');
      found = {
        indicator,
        type: indicator.includes('.') && !isNaN(indicator.split('.')[0]) ? 'IP' : 'DOMAIN',
        reputation: isSus ? 'MALICIOUS' : 'UNKNOWN',
        confidence: isSus ? 92 : 40,
        threatGroup: isSus ? 'APT-Simulation Group' : 'None',
        associatedThreats: isSus ? ['Credential Harvesting', 'Port Sweep'] : [],
        lastReported: new Date()
      };
    }

    res.json({ success: true, data: found });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getThreats,
  getThreatIndicators,
  lookupIndicator
};
