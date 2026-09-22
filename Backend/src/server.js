const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const initSockets = require('./sockets');

// Connect to Local MongoDB Database
connectDB();

const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  },
});

// Attach Socket.IO instance to app for controller access
app.set('io', io);

// Initialize Socket Events
initSockets(io);

// Listen on 0.0.0.0 for Local Network & Mobile Device Access
const PORT = env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 TransitSync Backend Server Listening on PORT ${PORT}`);
  console.log(`🌐 Local Access:   http://localhost:${PORT}`);
  console.log(`📱 LAN Network:    http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health Check:   http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
