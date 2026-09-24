const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const registerChatSockets = require('./chat.socket');
const registerTripSockets = require('./trip.socket');
const registerLocationSockets = require('./location.socket');
const registerEmergencySockets = require('./emergency.socket');

const initSockets = (io) => {
  // Socket Middleware Authentication with authoritative DB user resolution
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User inactive or invalid'));
      }

      socket.userId = user._id.toString();
      socket.organizationId = user.organizationId ? user.organizationId.toString() : '';
      socket.userRole = user.role;
      socket.userName = user.name;
      socket.user = {
        userId: user._id.toString(),
        organizationId: socket.organizationId,
        role: user.role,
        name: user.name,
      };

      return next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} | User: ${socket.userName} | Org: ${socket.organizationId}`);

    // Join private user room
    socket.join(`user:${socket.userId}`);

    // Join organization-wide room
    if (socket.organizationId) {
      socket.join(`organization:${socket.organizationId}`);
      console.log(`[Socket.IO] User joined room: organization:${socket.organizationId}`);
    }

    registerChatSockets(io, socket);
    registerTripSockets(io, socket);
    registerLocationSockets(io, socket);
    registerEmergencySockets(io, socket);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSockets;
