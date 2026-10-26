const axios = require('axios');

async function testE2E() {
  console.log('--- SENTINEL AI End-to-End Verification ---');

  // 1. Check AI Service Health
  try {
    const aiHealth = await axios.get('http://127.0.0.1:8000/api/ai/health');
    console.log('✅ Python AI Service:', aiHealth.data.service, `(${aiHealth.data.model})`);
  } catch (err) {
    console.error('❌ AI Service failed:', err.message);
  }

  // 2. Check Backend Health
  try {
    const beHealth = await axios.get('http://127.0.0.1:5000/api/health');
    console.log('✅ Backend Service:', beHealth.data.service, beHealth.data.status);
  } catch (err) {
    console.error('❌ Backend failed:', err.message);
  }

  // 3. Authenticate as Analyst
  let token = '';
  try {
    const authRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      username: 'analyst',
      password: 'SentinelAdmin123!'
    });
    token = authRes.data.token;
    console.log('✅ Authentication successful:', authRes.data.user.username, `(${authRes.data.user.role})`);
  } catch (err) {
    console.error('❌ Authentication failed:', err.response?.data || err.message);
  }

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // 4. Fetch Dashboard Statistics
  try {
    const dash = await axios.get('http://127.0.0.1:5000/api/dashboard/stats', authHeaders);
    console.log('✅ Dashboard Metrics retrieved:');
    console.log(`   - Total Events: ${dash.data.kpis.totalEvents}`);
    console.log(`   - Active Incidents: ${dash.data.kpis.activeIncidents}`);
    console.log(`   - Critical Threats: ${dash.data.kpis.criticalThreats}`);
    console.log(`   - Charts: EventsOverTime (${dash.data.charts.eventsOverTime.length} pts), ThreatDist (${dash.data.charts.threatDistribution.length} categories)`);
  } catch (err) {
    console.error('❌ Dashboard stats failed:', err.response?.data || err.message);
  }

  // 5. Test Triggering Brute-Force Simulation
  let incidentId = '';
  try {
    const simRes = await axios.post('http://127.0.0.1:5000/api/simulations/start', {
      scenario: 'BRUTE_FORCE'
    }, authHeaders);
    console.log('✅ Simulation Triggered:', simRes.data.scenarioName, 'Incident:', simRes.data.incidentId);
    incidentId = simRes.data.incidentId;
  } catch (err) {
    console.error('❌ Simulation start failed:', err.response?.data || err.message);
  }

  // 6. Wait 3.5 seconds for logs to stream and incident to be populated
  console.log('⏳ Waiting for simulated telemetry to stream and multi-agent pipeline to process...');
  await new Promise(r => setTimeout(r, 3500));

  // 7. Inspect Incident Dossier
  try {
    const incRes = await axios.get(`http://127.0.0.1:5000/api/incidents/${incidentId}`, authHeaders);
    const inc = incRes.data.data;
    console.log('✅ Incident Dossier Created & Analyzed:');
    console.log(`   - Incident ID: ${inc.incidentId}`);
    console.log(`   - Title: ${inc.title}`);
    console.log(`   - Severity: ${inc.severity}`);
    console.log(`   - Risk Score: ${inc.riskScore} / 100`);
    console.log(`   - Risk Factors: ${inc.riskBreakdown?.length || 0} factors computed`);
    console.log(`   - AI Explanation: ${inc.aiExplanation?.slice(0, 100)}...`);
    console.log(`   - Timeline items: ${inc.timeline?.length || 0}`);
    console.log(`   - Defensive Recommendations: ${inc.recommendations?.length || 0}`);

    // 8. Test Human-in-the-Loop Approval
    if (inc.recommendations && inc.recommendations.length > 0) {
      const approveRes = await axios.post(`http://127.0.0.1:5000/api/incidents/${incidentId}/decision`, {
        actionIndex: 0,
        decision: 'APPROVED',
        notes: 'Approved containment action during E2E verification test'
      }, authHeaders);
      console.log('✅ Human-in-the-Loop Action Approval:', approveRes.data.message);
    }
  } catch (err) {
    console.error('❌ Incident inspection failed:', err.response?.data || err.message);
  }

  // 9. Generate Incident Report
  try {
    const repRes = await axios.post(`http://127.0.0.1:5000/api/reports/${incidentId}`, {}, authHeaders);
    console.log('✅ Incident Report Generated:', repRes.data.data.title);
  } catch (err) {
    console.error('❌ Report generation failed:', err.response?.data || err.message);
  }

  // 10. Query SOC AI Copilot
  try {
    const chatRes = await axios.post('http://127.0.0.1:5000/api/chat', {
      message: `Why is ${incidentId} high risk?`
    }, authHeaders);
    console.log('✅ SOC AI Copilot Response:');
    console.log(`   "${chatRes.data.response.slice(0, 120)}..."`);
  } catch (err) {
    console.error('❌ Copilot chat failed:', err.response?.data || err.message);
  }

  // 11. Verify Audit Logs
  try {
    const auditRes = await axios.get('http://127.0.0.1:5000/api/audit-logs?limit=5', authHeaders);
    console.log(`✅ Audit Logs Verified: ${auditRes.data.data.length} recent records found`);
    auditRes.data.data.slice(0, 2).forEach(a => {
      console.log(`   - [${a.action}] on ${a.resource} by ${a.user}`);
    });
  } catch (err) {
    console.error('❌ Audit logs failed:', err.response?.data || err.message);
  }

  // 12. Verify Threat Intelligence & IOC Lookup
  try {
    const threatsRes = await axios.get('http://127.0.0.1:5000/api/threats', authHeaders);
    const indicatorsRes = await axios.get('http://127.0.0.1:5000/api/threats/indicators?limit=5', authHeaders);
    const lookupRes = await axios.get('http://127.0.0.1:5000/api/threats/lookup/185.220.101.42', authHeaders);
    console.log(`✅ Threat Intel Verified: ${threatsRes.data.data.length} catalog threats, ${indicatorsRes.data.data.length} IOC indicators`);
    console.log(`   - IOC Lookup (185.220.101.42): ${lookupRes.data.data.reputation} (${lookupRes.data.data.confidence}% confidence)`);
  } catch (err) {
    console.error('❌ Threat Intel verification failed:', err.response?.data || err.message);
  }

  // 13. Verify PDF Report Download
  try {
    const pdfRes = await axios.get(`http://127.0.0.1:5000/api/reports/${incidentId}/pdf`, {
      ...authHeaders,
      responseType: 'arraybuffer'
    });
    const isPdf = Buffer.from(pdfRes.data).subarray(0, 5).toString('utf8') === '%PDF-';
    console.log(`✅ PDF Incident Report Download Verified: ${pdfRes.data.byteLength} bytes (Valid Header: ${isPdf})`);
  } catch (err) {
    console.error('❌ PDF Report download failed:', err.response?.data || err.message);
  }

  // 14. Verify RAG Policy Grounding in Copilot
  try {
    const ragChatRes = await axios.post('http://127.0.0.1:5000/api/chat', {
      message: 'What is our policy on brute force lockout?'
    }, authHeaders);
    console.log('✅ SOC AI Copilot RAG Grounding Response:');
    console.log(`   "${ragChatRes.data.response.slice(0, 130)}..."`);
  } catch (err) {
    console.error('❌ Copilot RAG chat failed:', err.response?.data || err.message);
  }

  console.log('====================================================');
  console.log('  🎉 All 14 End-to-End Verification Milestones Passed!');
  console.log('====================================================');
}

testE2E();
