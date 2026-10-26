const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getDashboardStats } = require('../src/controllers/dashboardController');
const Incident = require('../src/models/Incident');
const SecurityLog = require('../src/models/SecurityLog');
const Threat = require('../src/models/Threat');
const AgentRun = require('../src/models/AgentRun');

test('dashboard recent incidents filters to active statuses', async (t) => {
  const originals = {
    incidentFind: Incident.find,
    incidentCount: Incident.countDocuments,
    incidentAggregate: Incident.aggregate,
    logCount: SecurityLog.countDocuments,
    logAggregate: SecurityLog.aggregate,
    logFind: SecurityLog.find,
    threatAggregate: Threat.aggregate,
    agentDistinct: AgentRun.distinct
  };
  t.after(() => {
    Incident.find = originals.incidentFind;
    Incident.countDocuments = originals.incidentCount;
    Incident.aggregate = originals.incidentAggregate;
    SecurityLog.countDocuments = originals.logCount;
    SecurityLog.aggregate = originals.logAggregate;
    SecurityLog.find = originals.logFind;
    Threat.aggregate = originals.threatAggregate;
    AgentRun.distinct = originals.agentDistinct;
  });

  const findQueries = [];
  const query = (rows = []) => ({
    sort() {
      return this;
    },
    limit() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(rows).then(resolve, reject);
    }
  });

  Incident.find = (filter) => {
    findQueries.push(filter);
    return query([]);
  };
  Incident.countDocuments = async () => 0;
  Incident.aggregate = async () => [];
  SecurityLog.countDocuments = async () => 0;
  SecurityLog.aggregate = async () => [];
  SecurityLog.find = () => query([]);
  Threat.aggregate = async () => [];
  AgentRun.distinct = async () => [];

  let payload;
  await getDashboardStats({}, { json(value) { payload = value; } }, (error) => {
    throw error;
  });

  assert.deepEqual(findQueries[1], {
    status: { $in: ['NEW', 'INVESTIGATING', 'PENDING_APPROVAL'] }
  });
  assert.ok(Array.isArray(payload.recentIncidents));
});
