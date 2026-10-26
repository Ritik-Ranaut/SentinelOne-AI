const SecurityReport = require('../models/SecurityReport');
const Incident = require('../models/Incident');
const { recordAudit } = require('../services/auditService');
const { buildPdf } = require('../utils/pdf');

const buildReportMarkdown = (incident) => {
  const title = `Security Incident Post-Mortem: ${incident.title} [${incident.incidentId}]`;
  const execSummary = `On ${new Date(incident.createdAt).toUTCString()}, SENTINEL AI automated detection flagged ${incident.type} activity affecting asset accounts (${incident.affectedUsers.join(', ') || 'N/A'}). Multi-agent correlation determined an aggregate risk score of ${incident.riskScore}/100 (${incident.severity}). Containment status: ${incident.status}.`;

  const timelineMD = (incident.timeline || []).map(t => `- **${t.timeFormatted || new Date(t.timestamp).toLocaleTimeString()}**: ${t.event} - ${t.details}`).join('\n');
  const findingsMD = (incident.agentFindings || []).map(f => `### ${f.agentName}\n${f.summary}\n`).join('\n');
  const recsMD = (incident.recommendations || []).map(r => `- **${r.action}** (Priority: ${r.priority}, Status: ${r.status})\n  *Rationale*: ${r.reason}`).join('\n');

  const markdown = `# ${title}

## Executive Summary
${execSummary}

## Incident Classification
- **Incident ID**: ${incident.incidentId}
- **Timestamp**: ${incident.createdAt}
- **Severity**: ${incident.severity}
- **Risk Score**: ${incident.riskScore} / 100
- **Status**: ${incident.status}
- **Assigned Analyst**: ${incident.assignedAnalyst || 'Unassigned'}
- **Analyst Decision**: ${incident.analystDecision?.decision || 'PENDING'} (${incident.analystDecision?.analystName || 'N/A'})

## AI Explanation & Risk Factor Breakdown
${incident.aiExplanation || 'Deterministic security heuristics triggered based on multi-vector threshold breach.'}

### Risk Factors
${(incident.riskBreakdown || []).map(b => `- **${b.factor}**: +${b.points} pts (${b.description})`).join('\n')}

## Chronological Incident Timeline
${timelineMD || '- No events recorded.'}

## Multi-Agent Forensic Findings
${findingsMD || '- Automated investigation findings nominal.'}

## Defensive Recommendations & Action Taken
${recsMD || '- No actions recommended.'}

---
*Report generated automatically by SENTINEL AI Report Agent for SOC Compliance & Audit.*
`;

  return { title, execSummary, markdown };
};

const generateReport = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const incident = await Incident.findOne({
      $or: [{ incidentId }, { _id: incidentId.match(/^[0-9a-fA-F]{24}$/) ? incidentId : null }]
    });

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const { title, execSummary, markdown } = buildReportMarkdown(incident);

    let report = await SecurityReport.findOne({ incidentId: incident.incidentId });
    if (!report) {
      report = await SecurityReport.create({
        incidentId: incident.incidentId,
        title,
        executiveSummary: execSummary,
        severity: incident.severity,
        riskScore: incident.riskScore,
        markdownContent: markdown,
        findings: incident.agentFindings,
        timelineSummary: (incident.timeline || []).map(t => ({ time: t.timeFormatted, event: t.event, detail: t.details })),
        remediationSteps: (incident.recommendations || []).map(r => ({ step: r.action, status: r.status })),
        generatedBy: 'SENTINEL Report Agent',
        exportedAt: new Date()
      });
    } else {
      report.markdownContent = markdown;
      report.severity = incident.severity;
      report.riskScore = incident.riskScore;
      report.executiveSummary = execSummary;
      await report.save();
    }

    await recordAudit({
      user: req.user?.username || 'Analyst',
      action: 'INCIDENT_REPORT_GENERATED',
      resource: `Report for ${incident.incidentId}`
    });

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const reports = await SecurityReport.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
};

const getReportByIncidentId = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    let report = await SecurityReport.findOne({ incidentId });
    if (!report) {
      return generateReport(req, res, next);
    }
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const downloadReportPdf = async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    let report = await SecurityReport.findOne({ incidentId });

    if (!report) {
      const incident = await Incident.findOne({
        $or: [{ incidentId }, { _id: incidentId.match(/^[0-9a-fA-F]{24}$/) ? incidentId : null }]
      });
      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }
      const { title, execSummary, markdown } = buildReportMarkdown(incident);
      report = await SecurityReport.create({
        incidentId: incident.incidentId,
        title,
        executiveSummary: execSummary,
        severity: incident.severity,
        riskScore: incident.riskScore,
        markdownContent: markdown,
        findings: incident.agentFindings,
        timelineSummary: (incident.timeline || []).map(t => ({ time: t.timeFormatted, event: t.event, detail: t.details })),
        remediationSteps: (incident.recommendations || []).map(r => ({ step: r.action, status: r.status })),
        generatedBy: 'SENTINEL Report Agent',
        exportedAt: new Date()
      });
    }

    const pdfBuffer = buildPdf(report.title, report.markdownContent);

    await recordAudit({
      user: req.user?.username || 'Analyst',
      action: 'INCIDENT_REPORT_EXPORTED_PDF',
      resource: `PDF Report for ${report.incidentId}`
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SENTINEL-${report.incidentId}-REPORT.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { generateReport, getReports, getReportByIncidentId, downloadReportPdf };

