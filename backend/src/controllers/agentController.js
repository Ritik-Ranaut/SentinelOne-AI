const AgentRun = require('../models/AgentRun');
const SecurityLog = require('../models/SecurityLog');
const { runInvestigation } = require('../services/aiServiceClient');

const AGENT_METADATA = [
  { name: 'Planner Agent', role: 'Workflow Orchestrator', type: 'COORDINATION', defaultTask: 'Decomposing incident context and establishing investigation paths' },
  { name: 'Log Analysis Agent', role: 'Telemetry Specialist', type: 'DETECTION', defaultTask: 'Normalizing and clustering high-volume security event sequences' },
  { name: 'Threat Detection Agent', role: 'MITRE ATT&CK Analyst', type: 'DETECTION', defaultTask: 'Correlating threat signatures and mapping TTPs' },
  { name: 'Investigation Agent', role: 'Evidence Correlator', type: 'INVESTIGATION', defaultTask: 'Tracing user, device, and network timelines across enterprise assets' },
  { name: 'Threat Intelligence Agent', role: 'IOC Investigator', type: 'INTEL', defaultTask: 'Enriching indicators against threat intelligence databases' },
  { name: 'Risk Analysis Agent', role: 'Risk Evaluator', type: 'ANALYSIS', defaultTask: 'Computing explainable risk score vectors (0-100)' },
  { name: 'Response Agent', role: 'Defense Strategist', type: 'RESPONSE', defaultTask: 'Formulating automated containment playbooks requiring analyst sign-off' },
  { name: 'Report Agent', role: 'Documentation Specialist', type: 'REPORTING', defaultTask: 'Compiling structured incident summaries and executive compliance briefs' }
];

const getAgents = async (req, res, next) => {
  try {
    const agentStats = await Promise.all(
      AGENT_METADATA.map(async (meta) => {
        const [runs, lastRun] = await Promise.all([
          AgentRun.find({ agentName: meta.name }).sort({ startedAt: -1 }).limit(30),
          AgentRun.findOne({ agentName: meta.name }).sort({ startedAt: -1 })
        ]);

        const totalRuns = runs.length || 1;
        const successfulRuns = runs.filter(r => r.status === 'COMPLETED' || r.status === 'WAITING_APPROVAL').length;
        const successRate = Math.round((successfulRuns / totalRuns) * 100);
        const avgDuration = runs.length
          ? Math.round(runs.reduce((acc, r) => acc + (r.duration || 350), 0) / runs.length)
          : 320;

        let status = 'IDLE';
        let currentTask = meta.defaultTask;
        if (lastRun && (Date.now() - new Date(lastRun.startedAt).getTime() < 30000)) {
          status = lastRun.status === 'WAITING_APPROVAL' ? 'WAITING_APPROVAL' : (lastRun.status === 'RUNNING' ? 'RUNNING' : 'ACTIVE');
          currentTask = lastRun.currentTask || currentTask;
        }

        return {
          name: meta.name,
          role: meta.role,
          type: meta.type,
          status,
          currentTask,
          lastExecution: lastRun?.startedAt || new Date(Date.now() - 3600000),
          avgExecutionTime: `${avgDuration}ms`,
          successRate: `${successRate}%`,
          lastResult: lastRun?.output ? (typeof lastRun.output === 'string' ? lastRun.output : (lastRun.output.summary || 'Executed cleanly')) : 'Nominal baseline'
        };
      })
    );

    res.json({
      success: true,
      data: agentStats
    });
  } catch (err) {
    next(err);
  }
};

const getAgentRuns = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, agentName, incidentId } = req.query;
    const query = {};
    if (agentName) query.agentName = agentName;
    if (incidentId) query.incidentId = incidentId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [runs, total] = await Promise.all([
      AgentRun.find(query)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      AgentRun.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: runs,
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

const triggerManualInvestigation = async (req, res, next) => {
  try {
    const { incidentId, logs = [], context = {} } = req.body;
    const incId = incidentId || `INC-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;

    let telemetryLogs = logs;
    if (!telemetryLogs.length) {
      telemetryLogs = await SecurityLog.find().sort({ timestamp: -1 }).limit(10);
    }

    const investigationResults = await runInvestigation(incId, telemetryLogs, context);
    res.json({
      success: true,
      incidentId: incId,
      data: investigationResults
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAgents,
  getAgentRuns,
  triggerManualInvestigation
};
