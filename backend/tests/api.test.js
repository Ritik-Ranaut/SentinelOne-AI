const test = require('node:test');
const assert = require('node:assert');
const { calculateDeterministicRisk } = require('../src/services/aiServiceClient');
const { validateRegistration, buildPublicRegistrationData, login } = require('../src/controllers/authController');
const { startSimulation, getStatus } = require('../src/simulators/scenarioEngine');
const { validateAnalystDecision } = require('../src/controllers/incidentController');
const { clientOrigins, corsOrigin } = require('../src/config/security');
const { protect } = require('../src/middleware/auth');
const jwt = require('jsonwebtoken');

test('Public registration ignores requested privileged roles', () => {
  const user = buildPublicRegistrationData({
    username: 'security.viewer',
    email: 'VIEWER@example.test',
    password: 'a-secure-test-password',
    role: 'ADMIN'
  });

  assert.strictEqual(user.role, 'VIEWER');
  assert.strictEqual(user.email, 'viewer@example.test');
});

test('Public registration rejects malformed identity and weak passwords', () => {
  assert.match(validateRegistration({ username: 'x', email: 'invalid', password: 'short' }), /Username/);
  assert.match(validateRegistration({ username: 'valid.name', email: 'invalid', password: 'a-secure-test-password' }), /email/);
  assert.match(validateRegistration({ username: 'valid.name', email: 'valid@example.test', password: 'short' }), /Password/);
  assert.strictEqual(validateRegistration({ username: 'valid.name', email: 'valid@example.test', password: 'a-secure-test-password' }), null);
});

test('Login rejects malformed input without crashing', async () => {
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  await login({ body: { username: 123, password: 'ok' } }, res, () => {});
  assert.strictEqual(res.code, 400);
  assert.match(res.payload.message, /valid username and password/i);

  await login({ body: { username: ' valid-user ', password: 'real-password' } }, res, () => {});
  assert.notStrictEqual(res.code, 500);
});

test('Bearer tokens are accepted regardless of case', async () => {
  const jwtVerify = jwt.verify;
  const mockUser = { _id: 'abc123', role: 'VIEWER', username: 'viewer' };
  jwt.verify = (token, secret) => {
    assert.strictEqual(token, 'abc123');
    assert.ok(secret);
    return { id: 'abc123' };
  };

  const User = require('../src/models/User');
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => mockUser
  });

  const req = { headers: { authorization: 'bearer abc123' } };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  await protect(req, res, () => {
    assert.strictEqual(req.user.username, 'viewer');
  });

  jwt.verify = jwtVerify;
  User.findById = originalFindById;
  assert.strictEqual(res.code, undefined);
});

test('Unknown simulation scenarios are rejected without starting a run', async () => {
  await assert.rejects(startSimulation('NOT_A_SCENARIO'), /Unknown simulation scenario/);
  assert.strictEqual(getStatus().isActive, false);
});

test('Analyst decisions require a valid pending approval action', () => {
  const pending = [{ requiresApproval: true, status: 'PENDING' }];
  const notPending = [{ requiresApproval: true, status: 'REJECTED' }];
  const noApprovalRequired = [{ requiresApproval: false, status: 'APPROVED' }];

  assert.strictEqual(validateAnalystDecision({ actionIndex: 0, decision: 'REJECTED' }, pending), null);
  assert.match(validateAnalystDecision({ actionIndex: 0, decision: 'EXECUTE' }, pending), /APPROVED or REJECTED/);
  assert.match(validateAnalystDecision({ actionIndex: 0, decision: 'APPROVED' }, notPending), /already been decided/);
  assert.match(validateAnalystDecision({ actionIndex: 0, decision: 'APPROVED' }, noApprovalRequired), /does not require/);
  assert.match(validateAnalystDecision({ actionIndex: '0', decision: 'REJECTED' }, pending), /action index/);
});

test('CORS allows configured application origins and rejects unknown origins', () => {
  assert.ok(clientOrigins.includes('http://127.0.0.1:5173'));
  let unknownOriginAllowed;
  let sameOriginAllowed;
  corsOrigin('https://untrusted.example', (error, allowed) => { unknownOriginAllowed = allowed; });
  corsOrigin('http://127.0.0.1:5173', (error, allowed) => { sameOriginAllowed = allowed; });
  assert.strictEqual(unknownOriginAllowed, false);
  assert.strictEqual(sameOriginAllowed, true);
});

test('Risk Engine - Brute Force Scenario', (t) => {
  const logs = [
    { eventType: 'LOGIN_FAILED', severity: 'MEDIUM' },
    { eventType: 'LOGIN_FAILED', severity: 'HIGH' },
    { eventType: 'LOGIN_FAILED', severity: 'HIGH' },
    { eventType: 'LOGIN_SUCCESS', severity: 'CRITICAL', sourceIp: '185.220.101.42' },
    { eventType: 'ADMIN_ACCESS', severity: 'CRITICAL', sourceIp: '185.220.101.42' }
  ];

  const result = calculateDeterministicRisk(logs, { type: 'BRUTE_FORCE' });
  assert.ok(['HIGH', 'CRITICAL'].includes(result.severity));
  assert.ok(result.score >= 70, `Score should be >= 70, got ${result.score}`);
  assert.ok(result.breakdown.length >= 3);
});

test('Risk Engine - Low Risk Normal Activity', (t) => {
  const logs = [
    { eventType: 'LOGIN_SUCCESS', severity: 'NORMAL', sourceIp: '10.10.1.15' },
    { eventType: 'FILE_ACCESS', severity: 'NORMAL', sourceIp: '10.10.1.15' }
  ];

  const result = calculateDeterministicRisk(logs, {});
  assert.strictEqual(result.severity, 'LOW');
  assert.ok(result.score <= 30);
});

test('Risk Engine - Data Exfiltration Scenario', (t) => {
  const logs = [
    { eventType: 'FILE_ACCESS', severity: 'LOW', sourceIp: '10.10.1.50' },
    { eventType: 'LARGE_DATA_TRANSFER', severity: 'CRITICAL', sourceIp: '194.26.29.112' }
  ];

  const result = calculateDeterministicRisk(logs, { type: 'DATA_EXFILTRATION' });
  assert.ok(result.score >= 40);
  assert.ok(result.breakdown.some(b => b.factor.includes('Data Exfiltration')));
});

test('Risk Engine - Privilege Escalation Scenario', (t) => {
  const logs = [
    { eventType: 'LOGIN_SUCCESS', severity: 'NORMAL', sourceIp: '10.10.4.155' },
    { eventType: 'API_REQUEST', severity: 'MEDIUM', sourceIp: '10.10.4.155' },
    { eventType: 'PRIVILEGE_CHANGE', severity: 'CRITICAL', sourceIp: '10.10.4.155' },
    { eventType: 'ADMIN_ACCESS', severity: 'CRITICAL', sourceIp: '10.10.4.155' }
  ];

  const result = calculateDeterministicRisk(logs, { type: 'PRIVILEGE_ESCALATION' });
  assert.ok(result.score >= 25);
  assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(result.severity));
  assert.ok(result.breakdown.some(b => b.factor.includes('Privilege')));
});

test('Risk Engine - Port Scan Scenario', (t) => {
  const logs = [
    { eventType: 'PORT_SCAN_SIMULATION', severity: 'MEDIUM', sourceIp: '172.16.50.200' },
    { eventType: 'PORT_SCAN_SIMULATION', severity: 'HIGH', sourceIp: '172.16.50.200' },
    { eventType: 'PORT_SCAN_SIMULATION', severity: 'CRITICAL', sourceIp: '172.16.50.200' }
  ];

  const result = calculateDeterministicRisk(logs, { type: 'PORT_SCAN' });
  assert.ok(result.score >= 20);
  assert.ok(result.breakdown.some(b => b.factor.includes('Port Scanning')));
});

test('Risk Engine - Abnormal API Activity Scenario', (t) => {
  const logs = [
    { eventType: 'API_REQUEST', severity: 'LOW', sourceIp: '198.51.100.188' },
    { eventType: 'API_REQUEST', severity: 'MEDIUM', sourceIp: '198.51.100.188' },
    { eventType: 'API_REQUEST', severity: 'HIGH', sourceIp: '198.51.100.188' },
    { eventType: 'API_REQUEST', severity: 'CRITICAL', sourceIp: '198.51.100.188' }
  ];

  const result = calculateDeterministicRisk(logs, { type: 'ABNORMAL_API' });
  assert.ok(result.score >= 20);
  assert.ok(result.breakdown.some(b => b.factor.includes('API Activity')));
});

test('PDF Generator - Generates Valid PDF Buffer', (t) => {
  const { buildPdf } = require('../src/utils/pdf');
  const buffer = buildPdf('TEST-INC-1001 Report', 'This is a test post-mortem executive summary.\nLine 2.\nLine 3.');
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 200);
  const header = buffer.subarray(0, 5).toString('utf8');
  assert.strictEqual(header, '%PDF-');
});

test('Simulation Engine - Validates All 7 Attack Scenarios', (t) => {
  const { SCENARIOS } = require('../src/simulators/scenarioEngine');
  const expectedKeys = [
    'BRUTE_FORCE',
    'SUSPICIOUS_LOGIN',
    'PRIVILEGE_ESCALATION',
    'DATA_EXFILTRATION',
    'PORT_SCAN',
    'IMPOSSIBLE_TRAVEL',
    'ABNORMAL_API'
  ];

  expectedKeys.forEach((key) => {
    assert.ok(SCENARIOS[key], `Scenario ${key} should exist`);
    assert.ok(SCENARIOS[key].name, `Scenario ${key} has a name`);
    assert.ok(SCENARIOS[key].events.length > 0, `Scenario ${key} has defined events`);
  });
});
