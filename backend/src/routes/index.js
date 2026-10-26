const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const logRoutes = require('./logRoutes');
const incidentRoutes = require('./incidentRoutes');
const simulationRoutes = require('./simulationRoutes');
const agentRoutes = require('./agentRoutes');
const threatRoutes = require('./threatRoutes');
const userRoutes = require('./userRoutes');
const deviceRoutes = require('./deviceRoutes');
const reportRoutes = require('./reportRoutes');
const auditRoutes = require('./auditRoutes');
const chatRoutes = require('./chatRoutes');
const ragRoutes = require('./ragRoutes');

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/logs', logRoutes);
router.use('/incidents', incidentRoutes);
router.use('/simulations', simulationRoutes);
router.use('/agents', agentRoutes);
router.use('/threats', threatRoutes);
router.use('/users', userRoutes);
router.use('/devices', deviceRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/chat', chatRoutes);
router.use('/rag', ragRoutes);

router.get('/health', (req, res) => {
  const isDatabaseReady = mongoose.connection.readyState === 1;
  res.status(isDatabaseReady ? 200 : 503).json({
    status: isDatabaseReady ? 'HEALTHY' : 'UNHEALTHY',
    database: isDatabaseReady ? 'CONNECTED' : 'DISCONNECTED',
    service: 'SENTINEL AI SOC Backend',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
