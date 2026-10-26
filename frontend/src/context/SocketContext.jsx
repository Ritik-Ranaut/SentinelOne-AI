import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [liveLogs, setLiveLogs] = useState([]);
  const [latestIncident, setLatestIncident] = useState(null);
  const [simulationStatus, setSimulationStatus] = useState({
    status: 'IDLE',
    scenarioName: null,
    currentStep: 0,
    totalSteps: 0
  });
  const [agentStatuses, setAgentStatuses] = useState({});

  useEffect(() => {
    if (loading) return undefined;
    if (!user) {
      socket.disconnect();
      setIsConnected(false);
      return undefined;
    }

    const onConnect = () => {
      setIsConnected(true);
      console.log('[Socket] Connected to Sentinel backend');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected from Sentinel backend');
    };

    const onSecurityLog = (log) => {
      setLiveLogs((prev) => [log, ...prev.slice(0, 199)]);
    };

    const onIncident = (incident) => {
      setLatestIncident(incident);
    };

    const onAgentStatus = (agentUpdate) => {
      setAgentStatuses((prev) => ({
        ...prev,
        [agentUpdate.agentName]: agentUpdate
      }));
    };

    const onSimulationStatus = (simStatus) => {
      setSimulationStatus(simStatus);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('security:log', onSecurityLog);
    socket.on('incident:created', onIncident);
    socket.on('incident:updated', onIncident);
    socket.on('agent:status', onAgentStatus);
    socket.on('simulation:status', onSimulationStatus);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('security:log', onSecurityLog);
      socket.off('incident:created', onIncident);
      socket.off('incident:updated', onIncident);
      socket.off('agent:status', onAgentStatus);
      socket.off('simulation:status', onSimulationStatus);
      socket.disconnect();
    };
  }, [loading, user]);

  const clearLiveLogs = () => {
    setLiveLogs([]);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveLogs,
        clearLiveLogs,
        latestIncident,
        simulationStatus,
        agentStatuses
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
