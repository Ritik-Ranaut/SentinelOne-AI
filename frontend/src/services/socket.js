import { io } from 'socket.io-client';

const socket = io(window.location.origin, {
  autoConnect: false,
  auth: (callback) => callback({ token: localStorage.getItem('sentinel_token') }),
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

export default socket;
