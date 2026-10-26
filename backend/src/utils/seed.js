const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const Incident = require('../models/Incident');
const Threat = require('../models/Threat');
const Device = require('../models/Device');
const AgentRun = require('../models/AgentRun');
const ThreatIndicator = require('../models/ThreatIndicator');
const ResponseAction = require('../models/ResponseAction');
const SecurityReport = require('../models/SecurityReport');
const AuditLog = require('../models/AuditLog');
const KnowledgeDocument = require('../models/KnowledgeDocument');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sentinel_soc';

const CITIES = [
  { city: 'San Francisco', country: 'US', lat: 37.7749, lon: -122.4194 },
  { city: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
  { city: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { city: 'Frankfurt', country: 'DE', lat: 50.1109, lon: 8.6821 },
  { city: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
  { city: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 },
  { city: 'Bucharest', country: 'RO', lat: 44.4268, lon: 26.1025 },
  { city: 'Amsterdam', country: 'NL', lat: 52.3676, lon: 4.9041 },
  { city: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 },
  { city: 'Sao Paulo', country: 'BR', lat: -23.5505, lon: -46.6333 }
];

const SEED_USERS = [
  { username: 'admin', email: 'admin@sentinel.soc', role: 'ADMIN', fullName: 'Alexander Vance', department: 'SOC Leadership' },
  { username: 'analyst', email: 'analyst@sentinel.soc', role: 'ANALYST', fullName: 'Elena Rostova', department: 'Tier 2 Incident Response' },
  { username: 'viewer', email: 'viewer@sentinel.soc', role: 'VIEWER', fullName: 'Marcus Chen', department: 'Compliance & Audit' },
  { username: 'sarah.connor', email: 'sarah.c@company.corp', role: 'ANALYST', fullName: 'Sarah Connor', department: 'Security Architecture' },
  { username: 'michael.scott', email: 'm.scott@company.corp', role: 'VIEWER', fullName: 'Michael Scott', department: 'Regional Operations' },
  { username: 'jason.dev', email: 'jason.b@company.corp', role: 'ANALYST', fullName: 'Jason Bourne', department: 'Infrastructure Engineering' },
  { username: 'rachel.green', email: 'rachel.g@company.corp', role: 'VIEWER', fullName: 'Rachel Green', department: 'Marketing' },
  { username: 'david.beck', email: 'david.b@company.corp', role: 'VIEWER', fullName: 'David Beck', department: 'Finance' },
  { username: 'lisa.su', email: 'lisa.su@company.corp', role: 'ADMIN', fullName: 'Lisa Su', department: 'Executive IT' },
  { username: 'john.doe', email: 'john.doe@company.corp', role: 'VIEWER', fullName: 'John Doe', department: 'Human Resources' },
  { username: 'alice.security', email: 'alice@sentinel.soc', role: 'ANALYST', fullName: 'Alice Henderson', department: 'Threat Hunting' },
  { username: 'bob.netops', email: 'bob@company.corp', role: 'ANALYST', fullName: 'Bob Martin', department: 'Network Ops' },
  { username: 'claire.cloud', email: 'claire@company.corp', role: 'ANALYST', fullName: 'Claire Sterling', department: 'Cloud Infrastructure' },
  { username: 'dennis.nedry', email: 'd.nedry@company.corp', role: 'VIEWER', fullName: 'Dennis Nedry', department: 'Systems Programming' },
  { username: 'eva.forensics', email: 'eva@sentinel.soc', role: 'ANALYST', fullName: 'Eva Thorne', department: 'Forensics' },
  { username: 'frank.audit', email: 'frank@company.corp', role: 'VIEWER', fullName: 'Frank Castle', department: 'Internal Audit' },
  { username: 'grace.devops', email: 'grace@company.corp', role: 'ANALYST', fullName: 'Grace Hopper', department: 'Platform Engineering' },
  { username: 'hugo.secops', email: 'hugo@sentinel.soc', role: 'ANALYST', fullName: 'Hugo Strange', department: 'SOC Tier 1' },
  { username: 'ian.iam', email: 'ian@company.corp', role: 'ANALYST', fullName: 'Ian Malcolm', department: 'IAM Team' },
  { username: 'julia.db', email: 'julia@company.corp', role: 'VIEWER', fullName: 'Julia Roberts', department: 'Data Management' }
];

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected! Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      SecurityLog.deleteMany({}),
      Incident.deleteMany({}),
      Threat.deleteMany({}),
      Device.deleteMany({}),
      AgentRun.deleteMany({}),
      ThreatIndicator.deleteMany({}),
      ResponseAction.deleteMany({}),
      SecurityReport.deleteMany({}),
      AuditLog.deleteMany({}),
      KnowledgeDocument.deleteMany({})
    ]);

    // 1. Seed 20 Users
    console.log('[Seed] Generating 20 users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('SentinelAdmin123!', salt);

    const createdUsers = await User.insertMany(
      SEED_USERS.map((u, i) => ({
        username: u.username,
        email: u.email,
        password: defaultPasswordHash,
        role: u.role,
        fullName: u.fullName,
        department: u.department,
        failedLogins: i % 4 === 0 ? Math.floor(Math.random() * 6) + 1 : 0,
        riskScore: i % 3 === 0 ? 65 + (i * 2) : 10 + (i * 2),
        status: i === 13 ? 'FLAGGED' : 'ACTIVE',
        knownDevices: [`DEV-CORP-${100 + i}`, `DEV-MOB-${200 + i}`],
        lastLogin: new Date(Date.now() - (i * 3600000))
      }))
    );

    // 2. Seed 20 Devices
    console.log('[Seed] Generating 20 devices...');
    const osList = ['Windows 11 Enterprise', 'macOS Sonoma', 'Ubuntu 22.04 LTS', 'Red Hat Enterprise Linux 9', 'Windows Server 2022'];
    const createdDevices = await Device.insertMany(
      Array.from({ length: 20 }, (_, i) => {
        const u = createdUsers[i];
        const isAnom = i % 5 === 0;
        return {
          deviceId: `DEV-CORP-${100 + i}`,
          hostname: `${u.username}-laptop`,
          user: u.username,
          os: osList[i % osList.length],
          ip: `10.10.${Math.floor(i / 5) + 1}.${(i % 5) * 20 + 15}`,
          macAddress: `00:1A:2B:3C:${(i + 10).toString(16).toUpperCase()}:5E`,
          lastSeen: new Date(Date.now() - i * 1800000),
          riskScore: isAnom ? 75 : 15,
          status: isAnom ? 'FLAGGED' : 'HEALTHY',
          anomalyIndicators: isAnom ? ['EDR Agent Heartbeat Missing', 'Unapproved USB Mass Storage Detected'] : [],
          incidentCount: isAnom ? 2 : 0
        };
      })
    );

    // 3. Seed 20 Threat Indicators (IOCs)
    console.log('[Seed] Generating 20 threat intelligence indicators...');
    const indicatorsData = [
      { indicator: '185.220.101.42', type: 'IP', reputation: 'MALICIOUS', confidence: 98, threatGroup: 'APT-TorNodes', associatedThreats: ['Brute-Force', 'Credential Stuffing'] },
      { indicator: '45.154.255.89', type: 'IP', reputation: 'MALICIOUS', confidence: 92, threatGroup: 'ProxyCannon', associatedThreats: ['Suspicious Login', 'Session Hijack'] },
      { indicator: '194.26.29.112', type: 'IP', reputation: 'MALICIOUS', confidence: 95, threatGroup: 'CobaltStrike-C2', associatedThreats: ['Data Exfiltration', 'C2 Beaconing'] },
      { indicator: '172.16.50.200', type: 'IP', reputation: 'SUSPICIOUS', confidence: 80, threatGroup: 'Internal-Rogue', associatedThreats: ['Port Scanning', 'Internal Recon'] },
      { indicator: '133.242.18.99', type: 'IP', reputation: 'MALICIOUS', confidence: 89, threatGroup: 'Tor-Exit-JP', associatedThreats: ['Impossible Travel', 'Anonymous Proxy'] },
      { indicator: '198.51.100.188', type: 'IP', reputation: 'MALICIOUS', confidence: 90, threatGroup: 'FuzzingBotNet', associatedThreats: ['API Abuse', 'Parameter Tampering'] },
      { indicator: 'login-secure-corp.auth-portal-bypass.com', type: 'DOMAIN', reputation: 'MALICIOUS', confidence: 99, threatGroup: 'EvilProxy Phish', associatedThreats: ['AiTM Phishing', 'MFA Intercept'] },
      { indicator: 'telemetry-cdn.aws-cloud-sync.net', type: 'DOMAIN', reputation: 'MALICIOUS', confidence: 94, threatGroup: 'UNC2452 Clone', associatedThreats: ['Data Exfiltration'] },
      { indicator: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', type: 'HASH', reputation: 'MALICIOUS', confidence: 100, threatGroup: 'Mimikatz Variant', associatedThreats: ['LSASS Dump'] },
      { indicator: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', type: 'HASH', reputation: 'MALICIOUS', confidence: 99, threatGroup: 'Cobalt Strike Beacon', associatedThreats: ['Process Injection'] },
      { indicator: '103.208.220.14', type: 'IP', reputation: 'SUSPICIOUS', confidence: 75, threatGroup: 'Bulletproof Host', associatedThreats: ['Port Sweep'] },
      { indicator: '91.240.118.172', type: 'IP', reputation: 'MALICIOUS', confidence: 91, threatGroup: 'DarkComet RAT', associatedThreats: ['Remote Access Trojan'] },
      { indicator: 'update.windows-patch-kb8849.com', type: 'DOMAIN', reputation: 'MALICIOUS', confidence: 96, threatGroup: 'APT29 Spearphish', associatedThreats: ['Malware Dropper'] },
      { indicator: 'c2.ghostnet-operations.org', type: 'DOMAIN', reputation: 'MALICIOUS', confidence: 97, threatGroup: 'GhostNet', associatedThreats: ['Command and Control'] },
      { indicator: '89.208.29.50', type: 'IP', reputation: 'SUSPICIOUS', confidence: 82, threatGroup: 'AnonVpn Pool', associatedThreats: ['Unusual Origin'] },
      { indicator: '193.106.191.16', type: 'IP', reputation: 'MALICIOUS', confidence: 94, threatGroup: 'Mirai Scanner', associatedThreats: ['Port Probing', 'IoT Exploit'] },
      { indicator: '51.15.43.205', type: 'IP', reputation: 'UNKNOWN', confidence: 50, threatGroup: 'Cloud VPS', associatedThreats: ['Unclassified Cloud Traffic'] },
      { indicator: 'api.exfil-vault-storage.io', type: 'DOMAIN', reputation: 'MALICIOUS', confidence: 93, threatGroup: 'DataBrokers', associatedThreats: ['Bulk Exfiltration'] },
      { indicator: '2a02:4780:bad::1', type: 'IP', reputation: 'SUSPICIOUS', confidence: 70, threatGroup: 'IPv6 Scanner', associatedThreats: ['Reconnaissance'] },
      { indicator: 'd41d8cd98f00b204e9800998ecf8427e', type: 'HASH', reputation: 'BENIGN', confidence: 95, threatGroup: 'Known Null Baseline', associatedThreats: ['False Positive Reference'] }
    ];
    await ThreatIndicator.insertMany(indicatorsData);

    // 4. Seed Threats
    const threatsData = [
      { name: 'Distributed Password Spray Campaign', category: 'BRUTE_FORCE', severity: 'CRITICAL', mitreTechnique: 'T1110.003', description: 'Coordinated credential spraying targeting Microsoft 365 and VPN endpoints.', detectionCount: 48, status: 'ACTIVE' },
      { name: 'Off-Hours Administrative Privilege Escalation', category: 'PRIVILEGE_ESCALATION', severity: 'HIGH', mitreTechnique: 'T1078.002', description: 'Internal account granting itself security admin privileges without change request authorization.', detectionCount: 14, status: 'CONTAINED' },
      { name: 'Multi-Gigabyte Outbound Cloud Exfiltration', category: 'DATA_EXFILTRATION', severity: 'CRITICAL', mitreTechnique: 'T1048', description: 'Bulk file downloads followed by immediate HTTPS transfer to unauthorized external IP.', detectionCount: 9, status: 'ACTIVE' },
      { name: 'Intranet Port Sweep & Service Probing', category: 'PORT_SCAN', severity: 'MEDIUM', mitreTechnique: 'T1046', description: 'Rapid TCP SYN packets spanning subnet 10.10.0.0/16 management ports.', detectionCount: 62, status: 'RESOLVED' },
      { name: 'Cross-Continental Impossible Travel Login', category: 'IMPOSSIBLE_TRAVEL', severity: 'HIGH', mitreTechnique: 'T1078', description: 'Valid session tokens authenticated from US West and Tokyo within 10 minutes.', detectionCount: 21, status: 'ACTIVE' },
      { name: 'Payment API Token Fuzzing Attack', category: 'API_ABUSE', severity: 'HIGH', mitreTechnique: 'T1190', description: 'Automated script injecting malformed JWT signatures and SQL injection vectors.', detectionCount: 35, status: 'ACTIVE' },
      { name: 'Departure-Risk Internal Database Scraping', category: 'INSIDER_THREAT', severity: 'HIGH', mitreTechnique: 'T1005', description: 'Employee on notice querying and archiving proprietary client contract repositories.', detectionCount: 6, status: 'RESOLVED' }
    ];
    await Threat.insertMany(threatsData);

    // 5. Seed 1,100+ Security Logs
    console.log('[Seed] Generating 1,150 realistic security logs over last 7 days...');
    const eventTypes = [
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE',
      'MFA_FAILURE', 'ADMIN_ACCESS', 'FILE_ACCESS', 'FILE_DOWNLOAD',
      'API_REQUEST', 'PORT_SCAN_SIMULATION', 'SUSPICIOUS_IP', 'UNUSUAL_LOCATION',
      'PRIVILEGE_CHANGE', 'LARGE_DATA_TRANSFER'
    ];
    const severities = ['NORMAL', 'NORMAL', 'NORMAL', 'NORMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    const logsToInsert = [];
    const now = Date.now();
    for (let i = 0; i < 1150; i++) {
      const hoursAgo = Math.random() * 168; // Spread across last 7 days
      const logTime = new Date(now - hoursAgo * 3600000);
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      const evType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      let sev = 'NORMAL';
      if (evType.includes('FAIL') || evType === 'SUSPICIOUS_IP') sev = Math.random() > 0.4 ? 'MEDIUM' : 'HIGH';
      if (evType === 'LARGE_DATA_TRANSFER' || evType === 'PRIVILEGE_CHANGE') sev = 'CRITICAL';
      if (evType === 'PORT_SCAN_SIMULATION') sev = 'HIGH';
      if (evType === 'ADMIN_ACCESS') sev = 'MEDIUM';

      const isSuspicious = sev !== 'NORMAL';

      logsToInsert.push({
        eventType: evType,
        timestamp: logTime,
        username: user.username,
        sourceIp: city.country === 'US' ? `10.10.${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 200) + 10}` : `185.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        deviceId: `DEV-CORP-${100 + (i % 20)}`,
        location: city,
        severity: sev,
        metadata: {
          details: `Simulated event telemetry for ${evType}`,
          statusCode: evType.includes('FAIL') ? 401 : 200,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SentinelAgent/2.4'
        },
        isSuspicious,
        processedByAI: true
      });
    }
    const insertedLogs = await SecurityLog.insertMany(logsToInsert);

    // 6. Seed 50 Incidents with rich timelines, risk breakdowns, and agent findings
    console.log('[Seed] Generating 50 comprehensive incidents...');
    const incidentTemplates = [
      { title: 'Brute-Force Attack against Domain Controller', type: 'BRUTE_FORCE', sev: 'CRITICAL', score: 88 },
      { title: 'Suspicious Geographic Session Hopping', type: 'IMPOSSIBLE_TRAVEL', sev: 'HIGH', score: 78 },
      { title: 'Unauthorized Privilege Escalation in Azure IAM', type: 'PRIVILEGE_ESCALATION', sev: 'CRITICAL', score: 92 },
      { title: 'Exfiltration of Customer PII to Unknown S3 Bucket', type: 'DATA_EXFILTRATION', sev: 'CRITICAL', score: 95 },
      { title: 'Reconnaissance Port Sweep on Core Database Segment', type: 'PORT_SCAN', sev: 'MEDIUM', score: 55 },
      { title: 'Automated Token Manipulation on Payment API', type: 'API_ABUSE', sev: 'HIGH', score: 72 },
      { title: 'Abnormal Mass File Download by Resigning Engineer', type: 'INSIDER_THREAT', sev: 'HIGH', score: 82 },
      { title: 'Repeated MFA Push Notification Fatigue Attack', type: 'BRUTE_FORCE', sev: 'HIGH', score: 76 },
      { title: 'Tor Exit Node Interactive Shell Connection', type: 'SUSPICIOUS_IP', sev: 'CRITICAL', score: 89 },
      { title: 'Anomalous 03:00 AM Active Directory Dump', type: 'PRIVILEGE_ESCALATION', sev: 'CRITICAL', score: 91 }
    ];

    const incidentsToInsert = [];
    for (let i = 0; i < 50; i++) {
      const template = incidentTemplates[i % incidentTemplates.length];
      const incId = `INC-${1000 + i}`;
      const user = createdUsers[i % createdUsers.length];
      const relatedLogs = insertedLogs.slice(i * 10, i * 10 + 6);
      const incDate = new Date(now - (i * 2.8) * 3600000);

      const isResolved = i > 32;
      const isPending = i < 10;
      const status = isResolved ? 'RESOLVED' : (isPending ? 'PENDING_APPROVAL' : 'INVESTIGATING');

      incidentsToInsert.push({
        incidentId: incId,
        title: `${template.title} #${1000 + i}`,
        type: template.type,
        severity: template.sev,
        riskScore: Math.max(25, Math.min(100, template.score + Math.floor((Math.random() * 10) - 5))),
        status,
        description: `Automated detection correlation flagged ${template.type} event sequence affecting identity '${user.username}'. Multi-agent pipeline executed evidence correlation and risk synthesis.`,
        aiExplanation: `Risk score elevated due to repeated telemetry threshold breaches. Identity '${user.username}' was observed interacting with elevated resources from untrusted origin space. The response agent recommended immediate containment.`,
        affectedUsers: [user.username],
        sourceIps: [relatedLogs[0]?.sourceIp || '185.220.101.42'],
        targetDevices: [`DEV-CORP-${100 + (i % 20)}`],
        relatedEvents: relatedLogs.map(l => l._id),
        timeline: [
          { timeFormatted: '10:01:14', event: 'Authentication Anomaly', details: 'Consecutive invalid credential inputs recorded', severity: 'MEDIUM', sourceIp: '185.220.101.42' },
          { timeFormatted: '10:02:45', event: 'Compromise Follow-through', details: 'Interactive session established with stolen token', severity: 'HIGH', sourceIp: '185.220.101.42' },
          { timeFormatted: '10:04:10', event: 'Privilege Access', details: 'Endpoint /admin/security-policies queried', severity: 'CRITICAL', sourceIp: '185.220.101.42' }
        ],
        riskBreakdown: [
          { factor: 'Authentication Anomalies', points: 20, description: 'Repeated failed login attempts prior to success' },
          { factor: 'Untrusted Origin IP', points: 15, description: 'Traffic originated from known foreign automated scan proxy' },
          { factor: 'Privilege Escalation Access', points: 25, description: 'Accessed restricted administrative security settings' },
          { factor: 'Behavioral Baseline Deviation', points: template.score > 80 ? 25 : 10, description: 'Significant deviation from 30-day user baseline' }
        ],
        agentFindings: [
          { agentName: 'Planner Agent', summary: 'Scope established: investigate user identity, session origin, and lateral movement.', timestamp: incDate },
          { agentName: 'Log Analysis Agent', summary: `Correlated ${relatedLogs.length} telemetry logs showing anomaly escalation.`, timestamp: incDate },
          { agentName: 'Threat Detection Agent', summary: `Signature matched MITRE ATT&CK tactic ${template.type}.`, timestamp: incDate },
          { agentName: 'Investigation Agent', summary: `Timeline constructed. User account '${user.username}' confirmed target.`, timestamp: incDate },
          { agentName: 'Threat Intelligence Agent', summary: 'Origin IP flagged with 94% malicious confidence in threat feeds.', timestamp: incDate },
          { agentName: 'Risk Analysis Agent', summary: `Deterministic risk score calculated at ${template.score}/100.`, timestamp: incDate },
          { agentName: 'Response Agent', summary: 'Recommended perimeter firewall IP block and active JWT revocation.', timestamp: incDate },
          { agentName: 'Report Agent', summary: 'Executive incident summary and compliance audit trail drafted.', timestamp: incDate }
        ],
        recommendations: [
          {
            action: `Block IP ${relatedLogs[0]?.sourceIp || '185.220.101.42'} at Edge Firewall`,
            reason: 'Prevent further ingress or C2 communication from attacker origin.',
            priority: 'CRITICAL',
            requiresApproval: true,
            target: relatedLogs[0]?.sourceIp || '185.220.101.42',
            status: isResolved ? 'EXECUTED' : 'PENDING'
          },
          {
            action: `Revoke Active Sessions for User ${user.username}`,
            reason: 'Invalidate hijacked bearer tokens and enforce re-authentication with hardware MFA.',
            priority: 'HIGH',
            requiresApproval: true,
            target: user.username,
            status: isResolved ? 'EXECUTED' : 'PENDING'
          }
        ],
        assignedAnalyst: i % 2 === 0 ? 'Elena Rostova' : 'Alexander Vance',
        analystDecision: isResolved ? {
          decision: 'APPROVED',
          analystName: 'Elena Rostova',
          decisionNotes: 'Playbook approved. Firewall rules updated and account session revoked.',
          timestamp: new Date(incDate.getTime() + 1800000)
        } : { decision: 'NONE' },
        createdAt: incDate,
        updatedAt: incDate,
        resolvedAt: isResolved ? new Date(incDate.getTime() + 3600000) : null
      });
    }
    await Incident.insertMany(incidentsToInsert);

    // 7. Seed Agent Runs
    console.log('[Seed] Generating agent execution runs...');
    const agentNames = [
      'Planner Agent', 'Log Analysis Agent', 'Threat Detection Agent',
      'Investigation Agent', 'Threat Intelligence Agent', 'Risk Analysis Agent',
      'Response Agent', 'Report Agent'
    ];
    const runsData = [];
    for (let i = 0; i < 40; i++) {
      const aName = agentNames[i % agentNames.length];
      const inc = incidentsToInsert[i % incidentsToInsert.length];
      runsData.push({
        agentName: aName,
        incidentId: inc.incidentId,
        status: 'COMPLETED',
        currentTask: `Telemetry processing for ${inc.incidentId}`,
        output: { summary: `Successfully analyzed parameters for ${inc.incidentId}` },
        startedAt: new Date(now - i * 1200000),
        completedAt: new Date(now - i * 1200000 + 420),
        duration: 350 + Math.floor(Math.random() * 200)
      });
    }
    await AgentRun.insertMany(runsData);

    // 8. Seed Audit Logs
    console.log('[Seed] Generating audit logs...');
    const auditEntries = [
      { user: 'admin', action: 'LOGIN_SUCCESS', resource: 'Web Console', result: 'SUCCESS' },
      { user: 'analyst', action: 'DEFENSIVE_ACTION_APPROVED', resource: 'Incident INC-1002: Block IP 185.220.101.42', result: 'SUCCESS' },
      { user: 'analyst', action: 'INCIDENT_UPDATED', resource: 'Incident INC-1004', result: 'SUCCESS' },
      { user: 'admin', action: 'SIMULATION_STARTED', resource: 'Brute-Force Authentication', result: 'SUCCESS' },
      { user: 'analyst', action: 'INCIDENT_REPORT_GENERATED', resource: 'Report for INC-1001', result: 'SUCCESS' },
      { user: 'admin', action: 'DEVICE_ISOLATED', resource: 'Device DEV-CORP-105', result: 'SUCCESS' }
    ];
    await AuditLog.insertMany(
      auditEntries.map((a, i) => ({
        ...a,
        ipAddress: '10.10.1.15',
        timestamp: new Date(now - i * 7200000)
      }))
    );

    // 9. Seed RAG Knowledge Documents
    console.log('[Seed] Generating Security SOPs & Policies for RAG...');
    const policyDocs = [
      {
        title: 'NIST SP 800-61 Rev 2: Computer Security Incident Handling Guide',
        category: 'POLICY',
        summary: 'Standard operating procedure for the Preparation, Detection & Analysis, Containment, and Post-Incident phases.',
        content: `The incident response lifecycle consists of four major phases:
1. Preparation: Establishing incident response capabilities, policies, and continuous monitoring tools.
2. Detection and Analysis: Identifying signs of compromise through automated SIEM alerts, determining the incident scope, and corroborating multi-source evidence.
3. Containment, Eradication, and Recovery: Isolating affected subnets, revoking credentials, removing malicious persistence, and restoring systems from validated golden images.
4. Post-Incident Activity: Compiling post-mortem reports, recording lessons learned, and updating defense signatures.`,
        tags: ['NIST', 'Incident Response', 'Containment', 'Forensics'],
        uploadedBy: 'Alexander Vance'
      },
      {
        title: 'Enterprise Access Control & Password Policy (SOP-SEC-014)',
        category: 'SOP',
        summary: 'Mandatory controls for multi-factor authentication, account lockouts, and privileged access management.',
        content: `All corporate user accounts must enforce phishing-resistant Multi-Factor Authentication (FIDO2/WebAuthn or hardware security keys).
Account lockout thresholds are strictly enforced: five consecutive failed login attempts trigger an automated 30-minute account suspension and generate a Tier 2 SOC alert.
Administrative privilege assignments require dual-authorization and must expire after a maximum duration of 8 hours under Just-In-Time (JIT) access rules.`,
        tags: ['MFA', 'Authentication', 'Lockout', 'Privilege Management'],
        uploadedBy: 'Elena Rostova'
      },
      {
        title: 'Data Loss Prevention & Bulk Exfiltration Containment Playbook',
        category: 'PLAYBOOK',
        summary: 'Immediate containment procedures when anomalous outbound data transfers exceed 1 GB.',
        content: `When data transfer volume exceeds 1.0 GB towards an unclassified external endpoint:
Step 1: Automated Response Agent issues an immediate edge firewall DROP rule on destination IP.
Step 2: Endpoint Detection and Response (EDR) agent isolates the source host from the local network.
Step 3: Identity provider invalidates all active OAuth session tokens for the affected user account.
Step 4: Tier 3 SOC analyst is summoned for memory extraction and cryptographic validation of exfiltrated payloads.`,
        tags: ['DLP', 'Data Exfiltration', 'Firewall Block', 'Playbook'],
        uploadedBy: 'Alexander Vance'
      }
    ];

    for (const doc of policyDocs) {
      const paragraphs = doc.content.split('\n\n').filter(p => p.trim().length > 0);
      const chunks = paragraphs.map((p, idx) => ({
        chunkId: `chunk-${idx + 1}`,
        content: p.trim(),
        section: `Section ${idx + 1}`,
        keywords: p.toLowerCase().split(/\W+/).filter(w => w.length > 4).slice(0, 8)
      }));

      await KnowledgeDocument.create({
        ...doc,
        chunks
      });
    }

    console.log('====================================================');
    console.log('  ✅ Database Seed Completed Successfully!');
    console.log(`  👥 Users: ${createdUsers.length}`);
    console.log(`  💻 Devices: ${createdDevices.length}`);
    console.log(`  📊 Telemetry Logs: ${insertedLogs.length}`);
    console.log(`  🚨 Incidents: 50`);
    console.log(`  🎯 Threats & IOCs: ${threatsData.length + indicatorsData.length}`);
    console.log(`  📚 RAG Documents: ${policyDocs.length}`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
