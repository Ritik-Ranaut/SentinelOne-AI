const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/security');

let io = null;

const initSocket = (serverIo) => {
  io = serverIo;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select('username role status');
      if (!user || ['LOCKED', 'SUSPENDED'].includes(user.status)) {
        return next(new Error('Not authorized'));
      }

      socket.data.user = { id: user._id.toString(), username: user.username, role: user.role };
      next();
    } catch (error) {
      next(new Error('Not authorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Authenticated client connected: ${socket.data.user.username}`);

    socket.on('join:room', (room) => {
      socket.join(room);
      console.log(`[Socket] Client ${socket.id} joined channel: ${room}`);
    });

    socket.on('leave:room', (room) => {
      socket.leave(room);
      console.log(`[Socket] Client ${socket.id} left channel: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Analyst client disconnected: ${socket.id}`);
    });
  });
};

const emitEvent = (eventName, data) => {
  if (io) {
    io.emit(eventName, data);
  }
};

const emitToRoom = (room, eventName, data) => {
  if (io) {
    io.to(room).emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  emitEvent,
  emitToRoom,
  getIo: () => io
};
