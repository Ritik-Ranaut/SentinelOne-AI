module.exports = {
  EVENT_TYPES: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    MFA_FAILURE: 'MFA_FAILURE',
    ADMIN_ACCESS: 'ADMIN_ACCESS',
    FILE_ACCESS: 'FILE_ACCESS',
    FILE_DOWNLOAD: 'FILE_DOWNLOAD',
    API_REQUEST: 'API_REQUEST',
    PORT_SCAN_SIMULATION: 'PORT_SCAN_SIMULATION',
    SUSPICIOUS_IP: 'SUSPICIOUS_IP',
    UNUSUAL_LOCATION: 'UNUSUAL_LOCATION',
    PRIVILEGE_CHANGE: 'PRIVILEGE_CHANGE',
    LARGE_DATA_TRANSFER: 'LARGE_DATA_TRANSFER'
  },
  SEVERITIES: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
    NORMAL: 'NORMAL'
  },
  INCIDENT_STATUS: {
    NEW: 'NEW',
    INVESTIGATING: 'INVESTIGATING',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    ACTION_TAKEN: 'ACTION_TAKEN',
    RESOLVED: 'RESOLVED',
    FALSE_POSITIVE: 'FALSE_POSITIVE'
  },
  ROLES: {
    ADMIN: 'ADMIN',
    ANALYST: 'ANALYST',
    VIEWER: 'VIEWER'
  },
  RISK_CATEGORIES: {
    LOW: { min: 0, max: 30, label: 'LOW', color: '#10b981' },
    MEDIUM: { min: 31, max: 60, label: 'MEDIUM', color: '#f59e0b' },
    HIGH: { min: 61, max: 80, label: 'HIGH', color: '#f97316' },
    CRITICAL: { min: 81, max: 100, label: 'CRITICAL', color: '#ef4444' }
  },
  AGENTS: {
    PLANNER: 'Planner Agent',
    LOG_ANALYSIS: 'Log Analysis Agent',
    THREAT_DETECTION: 'Threat Detection Agent',
    INVESTIGATION: 'Investigation Agent',
    THREAT_INTEL: 'Threat Intelligence Agent',
    RISK_ANALYSIS: 'Risk Analysis Agent',
    RESPONSE: 'Response Agent',
    REPORT: 'Report Agent'
  }
};
