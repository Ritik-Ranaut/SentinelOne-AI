const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const { clientOrigins, corsOrigin } = require('./config/security');
const { initSocket } = require('./sockets/socketHandler');
const apiRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: clientOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});
initSocket(io);

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow inline dev scripts and Monaco editor workers
}));

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Mount API Routes
app.use('/api', apiRoutes);

// Root fallback
app.get('/', (req, res) => {
  res.json({
    app: 'SENTINEL AI - Security Operations Center (SOC)',
    version: '1.0.0',
    status: 'OPERATIONAL',
    documentation: '/api/health'
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.SERVER_PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  🛡️  SENTINEL AI - Security Operations Center (SOC)`);
    console.log(`  🚀 Backend API & WebSockets running on port ${PORT}`);
    console.log(`  📡 WebSocket Stream: ws://localhost:${PORT}`);
    console.log(`====================================================`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error(`[Startup Error] Backend startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { app, server, startServer };
