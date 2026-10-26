const { v4: uuidv4 } = require('uuid');
const SecurityLog = require('../models/SecurityLog');
const Incident = require('../models/Incident');
const socketHandler = require('../sockets/socketHandler');
const { runInvestigation } = require('../services/aiServiceClient');
const { recordAudit } = require('../services/auditService');

let activeSimulation = null;
let simulationTimeout = null;
let isPaused = false;
let currentStepIndex = 0;
let scenarioQueue = [];
let accumulatedLogs = [];
let currentSimulationId = null;
let currentIncidentId = null;
let investigationTriggered = false;

// Definition of 7 realistic scenarios
const SCENARIOS = {
  BRUTE_FORCE: {
    id: 'BRUTE_FORCE',
    name: 'Brute-Force Authentication',
    category: 'CREDENTIAL_ATTACK',
    description: 'Repeated authentication failures against administrator account from foreign IP, followed by successful compromise.',
    user: 'admin',
    ip: '185.220.101.42',
    location: { country: 'DE', city: 'Frankfurt', latitude: 50.1109, longitude: 8.6821 },
    device: 'DEV-UNKNOWN-EXT',
    events: [
      { eventType: 'LOGIN_FAILED', severity: 'LOW', details: 'Password authentication failed (attempt 1/5)' },
      { eventType: 'LOGIN_FAILED', severity: 'LOW', details: 'Password authentication failed (attempt 2/5)' },
      { eventType: 'LOGIN_FAILED', severity: 'MEDIUM', details: 'Password authentication failed (attempt 3/5)' },
      { eventType: 'LOGIN_FAILED', severity: 'MEDIUM', details: 'Password authentication failed (attempt 4/5) - rate limit warning' },
      { eventType: 'LOGIN_FAILED', severity: 'HIGH', details: 'Password authentication failed (attempt 5/5) - lock threshold reached' },
      { eventType: 'LOGIN_SUCCESS', severity: 'CRITICAL', details: 'Successful credential match from previously unseen foreign IP' },
      { eventType: 'MFA_FAILURE', severity: 'CRITICAL', details: 'MFA prompt bypassed or reset token requested' },
      { eventType: 'ADMIN_ACCESS', severity: 'CRITICAL', details: 'Session accessed /admin/security-policies' }
    ]
  },
  SUSPICIOUS_LOGIN: {
    id: 'SUSPICIOUS_LOGIN',
    name: 'Suspicious Login Anomaly',
    category: 'ANOMALOUS_ACCESS',
    description: 'Access from an untrusted residential proxy subnet at 03:22 AM local time without enrolled device certificate.',
    user: 'sarah.connor',
    ip: '45.154.255.89',
    location: { country: 'RO', city: 'Bucharest', latitude: 44.4268, longitude: 26.1025 },
    device: 'DEV-UNMANAGED-LINUX',
    events: [
      { eventType: 'UNUSUAL_LOCATION', severity: 'MEDIUM', details: 'Origin GeoIP outside expected employee residency profile' },
      { eventType: 'LOGIN_SUCCESS', severity: 'HIGH', details: 'Authentication with valid credentials but unknown browser user-agent' },
      { eventType: 'FILE_ACCESS', severity: 'HIGH', details: 'Accessed financial_q3_forecast.xlsx from unapproved endpoint' }
    ]
  },
  PRIVILEGE_ESCALATION: {
    id: 'PRIVILEGE_ESCALATION',
    name: 'Privilege Escalation',
    category: 'INTERNAL_ATTACK',
    description: 'Junior analyst account modifies RBAC role mapping to grant itself Global Domain Admin privileges.',
    user: 'jason.dev',
    ip: '10.10.4.155',
    location: { country: 'US', city: 'Austin', latitude: 30.2672, longitude: -97.7431 },
    device: 'DEV-ENG-042',
    events: [
      { eventType: 'LOGIN_SUCCESS', severity: 'NORMAL', details: 'Standard developer workstation login' },
      { eventType: 'API_REQUEST', severity: 'MEDIUM', details: 'GET /api/v1/iam/roles/internal-auditor (Unauthorized probe)' },
      { eventType: 'PRIVILEGE_CHANGE', severity: 'CRITICAL', details: 'Direct DB update executed modifying role from VIEWER to DOMAIN_ADMIN' },
      { eventType: 'ADMIN_ACCESS', severity: 'CRITICAL', details: 'Accessed /admin/secrets/production_keys and dumped API secrets' }
    ]
  },
  DATA_EXFILTRATION: {
    id: 'DATA_EXFILTRATION',
    name: 'Data Exfiltration / Large Transfer',
    category: 'DATA_LEAK',
    description: 'Bulk query on customer PII database followed by 4.8 GB outbound encrypted archive transfer to untrusted cloud bucket.',
    user: 'michael.scott',
    ip: '192.168.1.77',
    location: { country: 'US', city: 'Scranton', latitude: 41.4090, longitude: -75.6624 },
    device: 'DEV-FIN-019',
    events: [
      { eventType: 'FILE_ACCESS', severity: 'LOW', details: 'Queried customer_database_export.sql' },
      { eventType: 'FILE_DOWNLOAD', severity: 'MEDIUM', details: 'Created compressed tar.gz archive size 4.8 GB', metadata: { sizeBytes: 5153960755 } },
      { eventType: 'LARGE_DATA_TRANSFER', severity: 'CRITICAL', details: 'Outbound TCP stream: 4.8 GB transferred to external IP 194.26.29.112' }
    ]
  },
  PORT_SCAN: {
    id: 'PORT_SCAN',
    name: 'Port Scanning & Reconnaissance',
    category: 'RECONNAISSANCE',
    description: 'Rapid sequential TCP SYN probing across internal server segment targeting management ports 22, 3389, 445, 8080.',
    user: 'unknown_scanner',
    ip: '172.16.50.200',
    location: { country: 'RU', city: 'Saint Petersburg', latitude: 59.9311, longitude: 30.3609 },
    device: 'DEV-ROGUE-PI',
    events: [
      { eventType: 'PORT_SCAN_SIMULATION', severity: 'MEDIUM', details: 'SYN probe: target 10.0.0.1:21 (FTP), 10.0.0.1:22 (SSH)' },
      { eventType: 'PORT_SCAN_SIMULATION', severity: 'MEDIUM', details: 'SYN probe: target 10.0.0.1:80 (HTTP), 10.0.0.1:443 (HTTPS)' },
      { eventType: 'PORT_SCAN_SIMULATION', severity: 'HIGH', details: 'SYN probe: target 10.0.0.1:445 (SMB), 10.0.0.1:3389 (RDP)' },
      { eventType: 'PORT_SCAN_SIMULATION', severity: 'CRITICAL', details: 'Aggressive sweep detected: 1,024 ports probed in 1.4 seconds' }
    ]
  },
  IMPOSSIBLE_TRAVEL: {
    id: 'IMPOSSIBLE_TRAVEL',
    name: 'Impossible Travel Anomaly',
    category: 'IDENTITY_THEFT',
    description: 'Legitimate login in San Francisco followed 8 minutes later by interactive login from Tokyo, Japan.',
    user: 'elena.rostova',
    ip: '133.242.18.99',
    location: { country: 'JP', city: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
    device: 'DEV-MAC-TOKYO',
    events: [
      { eventType: 'LOGIN_SUCCESS', severity: 'NORMAL', details: 'Login authenticated from headquarters in San Francisco, CA' },
      { eventType: 'UNUSUAL_LOCATION', severity: 'HIGH', details: 'Authentication 8 mins later from Tokyo, Japan (Distance 5,140 miles - physically impossible)' },
      { eventType: 'SUSPICIOUS_IP', severity: 'CRITICAL', details: 'Tor Exit node detected on Tokyo session endpoint' }
    ]
  },
  ABNORMAL_API: {
    id: 'ABNORMAL_API',
    name: 'Abnormal API Activity',
    category: 'API_ABUSE',
    description: 'Spike in automated API calls testing parameter tampering and token fuzzing triggering 401 and 403 bursts.',
    user: 'service_api_key_88',
    ip: '198.51.100.188',
    location: { country: 'NL', city: 'Amsterdam', latitude: 52.3676, longitude: 4.9041 },
    device: 'DEV-AUTOMATED-BOT',
    events: [
      { eventType: 'API_REQUEST', severity: 'LOW', details: 'POST /api/v2/payment/charge HTTP 200' },
      { eventType: 'API_REQUEST', severity: 'MEDIUM', details: 'POST /api/v2/payment/charge HTTP 401 (Invalid signature token)' },
      { eventType: 'API_REQUEST', severity: 'HIGH', details: 'Rate spike: 240 requests/sec with rotating bearer credentials' },
      { eventType: 'API_REQUEST', severity: 'CRITICAL', details: 'Exploit attempt: SQL syntax detected in URI parameter query' }
    ]
  }
};

const startSimulation = async (scenarioKey, triggeredByUser = 'admin') => {
  const scenario = SCENARIOS[scenarioKey];
  if (!scenario) {
    throw new Error('Unknown simulation scenario');
  }
  stopSimulation();
  currentSimulationId = `SIM-${Date.now().toString().slice(-6)}`;
  currentIncidentId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;

  activeSimulation = scenario;
  scenarioQueue = [...scenario.events];
  currentStepIndex = 0;
  accumulatedLogs = [];
  investigationTriggered = false;
  isPaused = false;

  console.log(`[Simulator] Starting scenario "${scenario.name}" (ID: ${currentSimulationId})`);

  socketHandler.emitEvent('simulation:status', {
    status: 'RUNNING',
    simulationId: currentSimulationId,
    scenarioName: scenario.name,
    scenarioKey: scenario.id,
    totalSteps: scenarioQueue.length,
    currentStep: 0,
    incidentId: currentIncidentId
  });

  await recordAudit({
    user: triggeredByUser,
    action: 'SIMULATION_STARTED',
    resource: scenario.name,
    metadata: { simulationId: currentSimulationId, scenarioKey: scenario.id }
  });

  // Begin event tick
  scheduleNextStep();
  return { success: true, simulationId: currentSimulationId, scenarioName: scenario.name, incidentId: currentIncidentId };
};

const scheduleNextStep = () => {
  if (isPaused || currentStepIndex >= scenarioQueue.length) {
    if (currentStepIndex >= scenarioQueue.length) {
      finishSimulation();
    }
    return;
  }

  // Realistic delivery delay between 600ms and 1100ms
  const stepDelay = Math.floor(Math.random() * 500) + 650;

  simulationTimeout = setTimeout(async () => {
    try {
      const stepDef = scenarioQueue[currentStepIndex];
      const logDoc = await SecurityLog.create({
        eventType: stepDef.eventType,
        timestamp: new Date(),
        username: activeSimulation.user,
        sourceIp: activeSimulation.ip,
        deviceId: activeSimulation.device,
        location: activeSimulation.location,
        severity: stepDef.severity,
        metadata: {
          details: stepDef.details,
          simulationId: currentSimulationId,
          ...(stepDef.metadata || {})
        },
        simulationId: currentSimulationId,
        isSuspicious: stepDef.severity !== 'NORMAL'
      });

      accumulatedLogs.push(logDoc);

      // Emit live log to terminal
      socketHandler.emitEvent('security:log', logDoc);

      currentStepIndex++;

      socketHandler.emitEvent('simulation:status', {
        status: 'RUNNING',
        simulationId: currentSimulationId,
        scenarioName: activeSimulation.name,
        scenarioKey: activeSimulation.id,
        totalSteps: scenarioQueue.length,
        currentStep: currentStepIndex,
        latestEvent: stepDef.eventType,
        incidentId: currentIncidentId
      });

      // Trigger incident investigation once per scenario run
      if (!investigationTriggered && (currentStepIndex >= 3 || stepDef.severity === 'CRITICAL')) {
        investigationTriggered = true;
        await triggerIncidentCreation();
      }

      scheduleNextStep();
    } catch (err) {
      console.error('[Simulator Error during step]:', err.message);
    }
  }, stepDelay);
};

const triggerIncidentCreation = async () => {
  try {
    const incId = currentIncidentId;
    const simId = currentSimulationId;
    const simName = activeSimulation.name;
    const simCat = activeSimulation.category;
    const simUser = activeSimulation.user;
    const simIp = activeSimulation.ip;
    const simDev = activeSimulation.device;
    const logIds = accumulatedLogs.map(l => l._id);

    let existingIncident = await Incident.findOne({ incidentId: incId });
    if (!existingIncident) {
      existingIncident = await Incident.create({
        incidentId: incId,
        title: `${simName} Incident`,
        type: simCat,
        severity: 'HIGH',
        riskScore: 65,
        status: 'INVESTIGATING',
        description: `Automated detection triggered by simulation ${simName}. Evaluating incoming security telemetry.`,
        affectedUsers: [simUser],
        sourceIps: [simIp],
        targetDevices: [simDev],
        relatedEvents: logIds,
        simulationId: simId
      });

      socketHandler.emitEvent('incident:created', existingIncident);
    }

    // Launch multi-agent investigation pipeline asynchronously
    runInvestigation(incId, accumulatedLogs, {
      user: simUser,
      ip: simIp,
      type: simCat,
      simulationId: simId
    }).then(async (investigationResults) => {
      const updated = await Incident.findOneAndUpdate(
        { incidentId: incId },
        {
          $set: {
            riskScore: investigationResults.riskScore,
            severity: investigationResults.severity,
            aiExplanation: investigationResults.aiExplanation,
            explanationSource: investigationResults.explanationSource || 'UNKNOWN',
            timeline: investigationResults.timeline,
            riskBreakdown: investigationResults.riskBreakdown,
            agentFindings: investigationResults.findings,
            recommendations: investigationResults.recommendations,
            status: 'PENDING_APPROVAL',
            relatedEvents: logIds
          }
        },
        { new: true }
      );

      if (updated) {
        socketHandler.emitEvent('incident:updated', updated);
      }
    });
  } catch (err) {
    console.error('[Simulator trigger incident error]:', err.message);
  }
};

const pauseSimulation = () => {
  isPaused = true;
  if (simulationTimeout) clearTimeout(simulationTimeout);
  socketHandler.emitEvent('simulation:status', {
    status: 'PAUSED',
    simulationId: currentSimulationId,
    scenarioName: activeSimulation?.name,
    totalSteps: scenarioQueue.length,
    currentStep: currentStepIndex
  });
  return { success: true, message: 'Simulation paused' };
};

const resumeSimulation = () => {
  if (!activeSimulation || currentStepIndex >= scenarioQueue.length) return { success: false, message: 'No paused simulation to resume' };
  isPaused = false;
  scheduleNextStep();
  socketHandler.emitEvent('simulation:status', {
    status: 'RUNNING',
    simulationId: currentSimulationId,
    scenarioName: activeSimulation.name,
    totalSteps: scenarioQueue.length,
    currentStep: currentStepIndex
  });
  return { success: true, message: 'Simulation resumed' };
};

const stopSimulation = () => {
  if (simulationTimeout) clearTimeout(simulationTimeout);
  const wasRunning = activeSimulation !== null;
  activeSimulation = null;
  scenarioQueue = [];
  currentStepIndex = 0;
  isPaused = false;

  socketHandler.emitEvent('simulation:status', {
    status: 'STOPPED',
    simulationId: currentSimulationId
  });

  return { success: true, message: wasRunning ? 'Simulation stopped' : 'No simulation active' };
};

const clearSimulation = async () => {
  stopSimulation();
  // Clear simulated logs if needed
  try {
    await SecurityLog.deleteMany({ simulationId: { $ne: null } });
    await Incident.deleteMany({ simulationId: { $ne: null } });
    socketHandler.emitEvent('simulation:status', { status: 'IDLE' });
    return { success: true, message: 'Simulation data cleared' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const finishSimulation = () => {
  console.log(`[Simulator] Scenario finished: ${activeSimulation?.name}`);
  socketHandler.emitEvent('simulation:status', {
    status: 'COMPLETED',
    simulationId: currentSimulationId,
    scenarioName: activeSimulation?.name,
    totalSteps: scenarioQueue.length,
    currentStep: scenarioQueue.length,
    incidentId: currentIncidentId
  });
  activeSimulation = null;
  isPaused = false;
};

const getStatus = () => {
  return {
    isActive: activeSimulation !== null,
    isPaused,
    scenario: activeSimulation?.name || null,
    scenarioKey: activeSimulation?.id || null,
    simulationId: currentSimulationId,
    incidentId: currentIncidentId,
    progress: scenarioQueue.length ? Math.round((currentStepIndex / scenarioQueue.length) * 100) : 0,
    currentStep: currentStepIndex,
    totalSteps: scenarioQueue.length,
    availableScenarios: Object.values(SCENARIOS).map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      stepsCount: s.events.length
    }))
  };
};

module.exports = {
  SCENARIOS,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  clearSimulation,
  getStatus
};
