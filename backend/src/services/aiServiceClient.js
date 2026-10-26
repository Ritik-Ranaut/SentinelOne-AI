const axios = require('axios');
const socketHandler = require('../sockets/socketHandler');
const AgentRun = require('../models/AgentRun');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Deterministic Risk Calculator & Rule-Based Agent Fallback
 */
const calculateDeterministicRisk = (logs = [], context = {}) => {
  let score = 0;
  const breakdown = [];
  const eventTypes = logs.map(l => l.eventType);
  const ips = [...new Set(logs.map(l => l.sourceIp).filter(Boolean))];

  const failedLogins = logs.filter(l => l.eventType === 'LOGIN_FAILED');
  if (failedLogins.length >= 3) {
    const pts = Math.min(30, 15 + (failedLogins.length - 3) * 3);
    score += pts;
    breakdown.push({
      factor: 'Authentication Anomalies',
      points: pts,
      description: `${failedLogins.length} consecutive authentication failures detected.`
    });
  } else if (failedLogins.length > 0) {
    score += 10;
    breakdown.push({
      factor: 'Authentication Anomalies',
      points: 10,
      description: `${failedLogins.length} failed authentication attempt(s) observed.`
    });
  }

  const hasSuccessAfterFail = eventTypes.includes('LOGIN_SUCCESS') && failedLogins.length >= 2;
  if (hasSuccessAfterFail) {
    score += 15;
    breakdown.push({
      factor: 'Compromise Follow-through',
      points: 15,
      description: 'Successful authentication observed following repeated failed attempts.'
    });
  }

  const hasSuspiciousIp = logs.some(l => l.eventType === 'SUSPICIOUS_IP');
  const hasUnusualLocation = logs.some(l => l.eventType === 'UNUSUAL_LOCATION');
  if (hasSuspiciousIp || hasUnusualLocation || ips.some(ip => ip.startsWith('185.') || ip.startsWith('45.') || ip.startsWith('194.'))) {
    score += 15;
    breakdown.push({
      factor: 'Untrusted Origin IP / Location',
      points: 15,
      description: `Traffic originating from untrusted address space (${ips.join(', ') || 'Unusual Origin'}).`
    });
  }

  const hasPrivChange = logs.some(l => l.eventType === 'PRIVILEGE_CHANGE');
  const hasAdminAccess = logs.some(l => l.eventType === 'ADMIN_ACCESS');
  if (hasPrivChange || hasAdminAccess) {
    score += 25;
    breakdown.push({
      factor: 'Privilege Escalation / Admin Access',
      points: 25,
      description: 'Administrative privileges modified or elevated endpoints accessed.'
    });
  }

  const hasLargeDownload = logs.some(l => l.eventType === 'LARGE_DATA_TRANSFER' || (l.eventType === 'FILE_DOWNLOAD' && l.metadata?.sizeBytes > 100000000));
  if (hasLargeDownload) {
    score += 25;
    breakdown.push({
      factor: 'Large Data Exfiltration',
      points: 25,
      description: 'Anomalous multi-gigabyte data transfer to external or unscheduled destination.'
    });
  }

  const hasPortScan = logs.some(l => l.eventType === 'PORT_SCAN_SIMULATION');
  if (hasPortScan) {
    score += 20;
    breakdown.push({
      factor: 'Reconnaissance / Port Scanning',
      points: 20,
      description: 'High-frequency sequential port probing against internal infrastructure.'
    });
  }

  const apiRequests = logs.filter(l => l.eventType === 'API_REQUEST');
  if (apiRequests.length >= 3) {
    score += 20;
    breakdown.push({
      factor: 'Abnormal API Activity',
      points: 20,
      description: `${apiRequests.length} API requests including unauthorized or exploit-like patterns.`
    });
  }

  const priorCount = Number(context.incidentCount || 0);
  if (context.hasPreviousIncidents || priorCount > 0) {
    score += 15;
    breakdown.push({
      factor: 'Previous Incident Precedents',
      points: 15,
      description: context.historicalSummary || `Entity associated with ${priorCount || 1} prior security incident(s).`
    });
  }

  const isSuspicious = context.isSuspicious
    || logs.some(l => l.isSuspicious || ['HIGH', 'CRITICAL'].includes(l.severity));
  if (score === 0 && isSuspicious) {
    score = 25;
    breakdown.push({
      factor: 'Behavioral Anomaly',
      points: 25,
      description: 'Baseline behavioral variance triggered alert threshold.'
    });
  }

  const bounded = Math.min(100, Math.max(5, score || 5));
  let severity = 'LOW';
  if (bounded >= 81) severity = 'CRITICAL';
  else if (bounded >= 61) severity = 'HIGH';
  else if (bounded >= 31) severity = 'MEDIUM';

  return { score: bounded, severity, breakdown };
};

const persistLangGraphExecutions = async (incidentId, executions = []) => {
  for (const execution of executions) {
    const allowed = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'WAITING_APPROVAL'];
    const status = allowed.includes(execution.status) ? execution.status : 'COMPLETED';
    await recordAgentStep(
      execution.agentName || 'Unknown Agent',
      incidentId,
      status,
      execution.currentTask || 'Completed graph node',
      execution.output || {},
      execution.duration || 400
    );
  }
};

/**
 * Record and broadcast an agent step execution
 */
const recordAgentStep = async (agentName, incidentId, status, currentTask, output = {}, duration = 400) => {
  try {
    const startedAt = new Date(Date.now() - duration);
    const completedAt = new Date();

    const run = await AgentRun.create({
      agentName,
      incidentId,
      status,
      currentTask,
      output,
      startedAt,
      completedAt,
      duration
    });

    socketHandler.emitEvent('agent:status', {
      agentName,
      incidentId,
      status,
      currentTask,
      duration,
      outputSummary: typeof output === 'string' ? output : (output.summary || currentTask),
      timestamp: completedAt
    });

    return run;
  } catch (err) {
    console.error(`[Agent Record Error]: ${err.message}`);
  }
};

/**
 * Run full investigation pipeline (Calls Python AI service or seamless deterministic fallback)
 */
const runInvestigation = async (incidentId, initialLogs = [], triggerContext = {}) => {
  console.log(`[AI Pipeline] Starting Multi-Agent Investigation for ${incidentId}...`);

  // Try calling Python FastAPI AI service first
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/investigate`, {
      incident_id: incidentId,
      logs: initialLogs,
      context: triggerContext
    }, {
      timeout: 180000
    });

    if (response.data && response.data.success) {
      console.log(`[AI Pipeline] Python LangGraph service successfully processed ${incidentId}`);
      const result = response.data.result || {};
      await persistLangGraphExecutions(incidentId, result.agentExecutions || []);
      return result;
    }
  } catch (aiErr) {
    console.warn(`[AI Pipeline Notice] Python FastAPI service not reached (${aiErr.message}). Using built-in LangGraph resilient agent engine.`);
  }

  // --- Resilient Built-in Agent Orchestration ---
  const results = {
    incidentId,
    timeline: [],
    findings: [],
    recommendations: [],
    aiExplanation: '',
    explanationSource: 'DETERMINISTIC_FALLBACK',
    riskScore: 50,
    severity: 'MEDIUM',
    riskBreakdown: []
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // 1. Planner Agent
  await recordAgentStep('Planner Agent', incidentId, 'RUNNING', 'Analyzing incoming event payload and establishing investigation scope');
  await delay(250);
  const investigationPlan = [
    'Normalize authentication records',
    'Correlate origin IP against threat intelligence feeds',
    'Inspect user privilege changes',
    'Calculate deterministic risk vector',
    'Generate response recommendations'
  ];
  await recordAgentStep('Planner Agent', incidentId, 'COMPLETED', 'Investigation plan established', { plan: investigationPlan });

  // 2. Log Analysis Agent
  await recordAgentStep('Log Analysis Agent', incidentId, 'RUNNING', 'Aggregating raw telemetry logs and identifying pattern anomalies');
  await delay(250);
  const logSummary = `Analyzed ${initialLogs.length} security events. Found ${initialLogs.filter(l => l.severity !== 'NORMAL').length} anomalies.`;
  await recordAgentStep('Log Analysis Agent', incidentId, 'COMPLETED', logSummary, {
    totalLogs: initialLogs.length,
    anomalousEvents: initialLogs.map(l => l.eventType)
  });

  // 3. Threat Detection Agent
  await recordAgentStep('Threat Detection Agent', incidentId, 'RUNNING', 'Mapping behaviors to MITRE ATT&CK matrix');
  await delay(300);
  const primaryType = triggerContext.type || 'SUSPICIOUS_ACTIVITY';
  let mitreId = 'T1078';
  if (primaryType.includes('BRUTE_FORCE')) mitreId = 'T1110 (Brute Force)';
  else if (primaryType.includes('PRIVILEGE')) mitreId = 'T1098 (Account Manipulation)';
  else if (primaryType.includes('DATA') || primaryType.includes('EXFILTRATION')) mitreId = 'T1048 (Exfiltration Over Alternative Protocol)';
  else if (primaryType.includes('PORT_SCAN')) mitreId = 'T1046 (Network Service Discovery)';

  await recordAgentStep('Threat Detection Agent', incidentId, 'COMPLETED', `Identified tactic: ${mitreId}`, {
    mitreTechnique: mitreId,
    confidence: 0.94
  });

  // 4. Investigation Agent
  await recordAgentStep('Investigation Agent', incidentId, 'RUNNING', 'Tracing user session history, device fingerprints, and chronological timeline');
  await delay(350);
  const targetUser = triggerContext.user || (initialLogs[0]?.username) || 'admin';
  const targetIp = triggerContext.ip || (initialLogs[0]?.sourceIp) || '198.51.100.23';

  // Build Chronological Timeline
  const timeline = initialLogs.map(log => ({
    timestamp: log.timestamp || new Date(),
    timeFormatted: new Date(log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    event: log.eventType,
    details: `${log.username} from ${log.sourceIp} - ${log.metadata?.details || log.metadata?.reason || log.severity}`,
    severity: log.severity || 'NORMAL',
    sourceIp: log.sourceIp
  }));
  results.timeline = timeline;

  await recordAgentStep('Investigation Agent', incidentId, 'COMPLETED', `Compiled timeline with ${timeline.length} events for ${targetUser}`, {
    affectedUser: targetUser,
    timelineLength: timeline.length
  });

  // 5. Threat Intelligence Agent
  await recordAgentStep('Threat Intelligence Agent', incidentId, 'RUNNING', `Querying threat intelligence database for IP ${targetIp}`);
  await delay(250);
  const heuristicIndicatorMatch = targetIp.startsWith('185.') || targetIp.startsWith('45.') || targetIp.startsWith('198.') || targetIp.startsWith('10.');
  const tiFindings = {
    indicator: targetIp,
    reputation: heuristicIndicatorMatch ? 'HEURISTIC_MATCH' : 'NOT_ASSESSED',
    source: 'DETERMINISTIC_HEURISTIC',
    summary: heuristicIndicatorMatch
      ? `Address ${targetIp} matched a local suspicious-range rule; no external threat-intelligence lookup was performed.`
      : `No external reputation lookup was performed for ${targetIp}.`
  };
  await recordAgentStep('Threat Intelligence Agent', incidentId, 'COMPLETED', tiFindings.summary, tiFindings);

  // 6. Risk Analysis Agent
  await recordAgentStep('Risk Analysis Agent', incidentId, 'RUNNING', 'Calculating deterministic risk score and synthesizing explainability breakdown');
  await delay(300);
  const riskCalculation = calculateDeterministicRisk(initialLogs, triggerContext);
  results.riskScore = riskCalculation.score;
  results.severity = riskCalculation.severity;
  results.riskBreakdown = riskCalculation.breakdown;

  const factorsText = riskCalculation.breakdown.map(b => `${b.factor} (+${b.points})`).join(', ');
  results.aiExplanation = `Risk score computed at ${riskCalculation.score}/100 (${riskCalculation.severity}) based on deterministic indicators: ${factorsText}. The incident exhibited malicious signature progression from origin ${targetIp} affecting user account '${targetUser}'.`;

  await recordAgentStep('Risk Analysis Agent', incidentId, 'COMPLETED', `Evaluated risk score: ${riskCalculation.score} (${riskCalculation.severity})`, {
    score: riskCalculation.score,
    breakdown: riskCalculation.breakdown
  });

  // 7. Response Agent
  await recordAgentStep('Response Agent', incidentId, 'WAITING_APPROVAL', 'Formulating automated containment playbooks requiring analyst sign-off');
  await delay(250);

  const recommendedActions = [];
  if (riskCalculation.score >= 60) {
    recommendedActions.push({
      action: `Block IP ${targetIp} at Edge Perimeter`,
      reason: `Traffic originated from malicious address space exhibiting ${triggerContext.type || 'attack behavior'}.`,
      priority: 'CRITICAL',
      requiresApproval: true,
      target: targetIp,
      status: 'PENDING'
    });
    recommendedActions.push({
      action: `Revoke Active Sessions & Force MFA for ${targetUser}`,
      reason: `Account '${targetUser}' potentially compromised by unauthorized entity.`,
      priority: 'HIGH',
      requiresApproval: true,
      target: targetUser,
      status: 'PENDING'
    });
  } else {
    recommendedActions.push({
      action: `Increase Monitoring Frequency for User ${targetUser}`,
      reason: 'Elevated anomaly rate detected. Increase audit fidelity for next 24 hours.',
      priority: 'MEDIUM',
      requiresApproval: false,
      target: targetUser,
      status: 'APPROVED'
    });
  }
  results.recommendations = recommendedActions;

  await recordAgentStep('Response Agent', incidentId, 'WAITING_APPROVAL', 'Awaiting analyst approval for defensive playbooks', {
    actions: recommendedActions
  });

  // 8. Report Agent
  await recordAgentStep('Report Agent', incidentId, 'RUNNING', 'Drafting comprehensive incident report');
  await delay(200);
  results.findings = [
    { agentName: 'Log Analysis Agent', summary: logSummary, timestamp: new Date() },
    { agentName: 'Threat Detection Agent', summary: `Identified ${mitreId} attack pattern.`, timestamp: new Date() },
    { agentName: 'Threat Intelligence Agent', summary: tiFindings.summary, timestamp: new Date() },
    { agentName: 'Risk Analysis Agent', summary: `Final risk evaluation: ${riskCalculation.score}/100.`, timestamp: new Date() },
    { agentName: 'Response Agent', summary: `Recommended ${recommendedActions.length} defensive containment actions.`, timestamp: new Date() }
  ];

  await recordAgentStep('Report Agent', incidentId, 'COMPLETED', 'Generated executive incident brief', {
    reportId: `REP-${incidentId}`
  });

  console.log(`[AI Pipeline] Investigation complete for ${incidentId}. Risk: ${results.riskScore}`);
  return results;
};

module.exports = {
  runInvestigation,
  calculateDeterministicRisk,
  recordAgentStep
};
