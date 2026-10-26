const scenarioEngine = require('../simulators/scenarioEngine');
const { SCENARIOS } = scenarioEngine;

const startSimulation = async (req, res, next) => {
  try {
    const { scenario } = req.body;
    if (typeof scenario !== 'string' || !Object.hasOwn(SCENARIOS, scenario)) {
      return res.status(400).json({ success: false, message: 'Unknown simulation scenario.' });
    }
    if (scenarioEngine.getStatus().isActive) {
      return res.status(409).json({ success: false, message: 'Stop the active simulation before starting another.' });
    }
    const result = await scenarioEngine.startSimulation(scenario, req.user?.username || 'admin');
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const pauseSimulation = (req, res) => {
  const result = scenarioEngine.pauseSimulation();
  res.json(result);
};

const resumeSimulation = (req, res) => {
  const result = scenarioEngine.resumeSimulation();
  res.json(result);
};

const stopSimulation = (req, res) => {
  const result = scenarioEngine.stopSimulation();
  res.json(result);
};

const clearSimulation = async (req, res, next) => {
  try {
    const result = await scenarioEngine.clearSimulation();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getSimulationStatus = (req, res) => {
  res.json({
    success: true,
    data: scenarioEngine.getStatus()
  });
};

module.exports = {
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  clearSimulation,
  getSimulationStatus
};
