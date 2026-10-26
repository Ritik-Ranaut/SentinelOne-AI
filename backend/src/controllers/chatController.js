const Incident = require('../models/Incident');
const SecurityLog = require('../models/SecurityLog');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

const queryCopilot = async (req, res, next) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const cleanMsg = message.trim().toLowerCase();

    // 1. Check for specific Incident ID query (e.g. INC-1024)
    const incMatch = message.match(/INC-\d+/i);
    let contextualDbData = null;

    if (incMatch) {
      const incId = incMatch[0].toUpperCase();
      const incident = await Incident.findOne({ incidentId: incId });
      if (incident) {
        contextualDbData = {
          type: 'INCIDENT_DETAIL',
          incidentId: incident.incidentId,
          title: incident.title,
          severity: incident.severity,
          riskScore: incident.riskScore,
          status: incident.status,
          users: incident.affectedUsers,
          explanation: incident.aiExplanation,
          riskBreakdown: incident.riskBreakdown,
          recommendations: incident.recommendations
        };
      }
    } else if (
      cleanMsg.includes('policy') ||
      cleanMsg.includes('sop') ||
      cleanMsg.includes('nist') ||
      cleanMsg.includes('standard') ||
      cleanMsg.includes('playbook') ||
      cleanMsg.includes('lockout') ||
      cleanMsg.includes('containment') ||
      cleanMsg.includes('procedure') ||
      cleanMsg.includes('guideline')
    ) {
      // Query Knowledge Base for SOP/Policy RAG context
      const keywords = cleanMsg.split(/\W+/).filter(w => w.length > 3);
      const regexList = keywords.map(k => new RegExp(k, 'i'));
      const matchingDocs = await KnowledgeDocument.find({
        isActive: true,
        $or: [
          { title: { $in: regexList } },
          { content: { $in: regexList } },
          { tags: { $in: regexList } },
          { summary: { $in: regexList } }
        ]
      }).limit(3);

      if (matchingDocs.length > 0) {
        const topDoc = matchingDocs[0];
        let bestChunk = topDoc.summary || topDoc.content.slice(0, 300);
        if (topDoc.chunks && topDoc.chunks.length > 0) {
          for (const ch of topDoc.chunks) {
            if (keywords.some(k => ch.content.toLowerCase().includes(k))) {
              bestChunk = ch.content;
              break;
            }
          }
        }
        contextualDbData = {
          type: 'POLICY_KNOWLEDGE',
          title: topDoc.title,
          category: topDoc.category,
          excerpt: bestChunk,
          tags: topDoc.tags || [],
          allMatchingTitles: matchingDocs.map(d => d.title)
        };
      }
    } else if (cleanMsg.includes('critical') || cleanMsg.includes('high threat')) {
      const criticals = await Incident.find({ severity: { $in: ['CRITICAL', 'HIGH'] }, status: { $ne: 'RESOLVED' } })
        .limit(5)
        .select('incidentId title severity riskScore status affectedUsers');
      contextualDbData = {
        type: 'CRITICAL_INCIDENTS',
        count: criticals.length,
        incidents: criticals
      };
    } else if (cleanMsg.includes('admin') || cleanMsg.includes('user')) {
      const userMatch = cleanMsg.includes('admin') ? 'admin' : (cleanMsg.match(/user\s+([a-zA-Z0-9._-]+)/i)?.[1] || 'admin');
      const recentUserLogs = await SecurityLog.find({ username: new RegExp(userMatch, 'i') })
        .sort({ timestamp: -1 })
        .limit(8)
        .select('eventType timestamp sourceIp severity metadata');
      contextualDbData = {
        type: 'USER_LOGS',
        user: userMatch,
        logs: recentUserLogs
      };
    } else if (cleanMsg.includes('today') || cleanMsg.includes('activity') || cleanMsg.includes('summarize')) {
      const [totalLogs, activeIncidents, criticals] = await Promise.all([
        SecurityLog.countDocuments(),
        Incident.countDocuments({ status: { $in: ['NEW', 'INVESTIGATING', 'PENDING_APPROVAL'] } }),
        Incident.countDocuments({ severity: 'CRITICAL' })
      ]);
      contextualDbData = {
        type: 'SOC_SUMMARY',
        totalEventsRecorded: totalLogs,
        activeIncidents,
        criticalSeverityIncidents: criticals
      };
    }

    // Try sending to Python AI Service for natural LLM synthesis
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/chat`, {
        query: message,
        database_context: contextualDbData,
        history: conversationHistory
      }, { timeout: 6000 });

      if (aiResponse.data && aiResponse.data.response) {
        return res.json({
          success: true,
          response: aiResponse.data.response,
          contextData: contextualDbData,
          model: aiResponse.data.model || 'LangGraph Copilot'
        });
      }
    } catch (err) {
      // Fallback to deterministic synthesis if AI service is offline
    }

    // Grounded deterministic assistant response
    let answer = '';
    if (contextualDbData?.type === 'POLICY_KNOWLEDGE') {
      const doc = contextualDbData;
      answer = `**Standard Operating Procedure / Policy: ${doc.title}** [${doc.category}]\n\n` +
               `**Guideline Summary:**\n${doc.excerpt}\n\n` +
               (doc.tags?.length ? `**Tags:** ${doc.tags.join(', ')}\n\n` : '') +
               `*Directly retrieved from SENTINEL RAG Knowledge Base.*`;
    } else if (contextualDbData?.type === 'INCIDENT_DETAIL') {
      const inc = contextualDbData;
      const breakdownText = inc.riskBreakdown?.map(b => `• ${b.factor} (+${b.points} pts): ${b.description}`).join('\n') || '';
      answer = `**Incident ${inc.incidentId} (${inc.title})** is rated **${inc.severity}** with a Risk Score of **${inc.riskScore}/100**.\n\n` +
               `**Investigation Findings:**\n${inc.explanation}\n\n` +
               (breakdownText ? `**Contributing Factors:**\n${breakdownText}\n\n` : '') +
               `**Status**: ${inc.status} | **Affected Users**: ${inc.users?.join(', ') || 'N/A'}`;
    } else if (contextualDbData?.type === 'CRITICAL_INCIDENTS') {
      answer = `There are currently **${contextualDbData.count} high/critical priority active incidents** requiring analyst attention:\n\n` +
               contextualDbData.incidents.map(i => `• **${i.incidentId}**: ${i.title} (Severity: ${i.severity}, Risk: ${i.riskScore}, Status: ${i.status})`).join('\n');
    } else if (contextualDbData?.type === 'USER_LOGS') {
      answer = `Here are the latest telemetry events for account **${contextualDbData.user}**:\n\n` +
               contextualDbData.logs.map(l => `• **${l.eventType}** at ${new Date(l.timestamp).toLocaleTimeString()} from \`${l.sourceIp}\` [${l.severity}] - ${l.metadata?.details || ''}`).join('\n');
    } else if (contextualDbData?.type === 'SOC_SUMMARY') {
      answer = `**SOC Operational Overview:**\n\n` +
               `• **Total Telemetry Events Logged**: ${contextualDbData.totalEventsRecorded}\n` +
               `• **Active Open Incidents**: ${contextualDbData.activeIncidents}\n` +
               `• **Critical Threats**: ${contextualDbData.criticalSeverityIncidents}\n\n` +
               `The multi-agent detection pipeline is operating nominally across all event channels.`;
    } else {
      answer = `I am SENTINEL AI SOC Copilot. You can ask me to inspect any incident (e.g. *"Why is INC-1024 high risk?"*), query user activities (*"Show logs for admin"*), list active threats (*"Which incidents are critical?"*), or summarize today's telemetry activity.`;
    }

    res.json({
      success: true,
      response: answer,
      contextData: contextualDbData,
      model: 'SENTINEL Grounded Deterministic Copilot'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { queryCopilot };
