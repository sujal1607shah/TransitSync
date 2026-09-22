const jwt = require('jsonwebtoken');
const env = require('../config/env');
const registerChatSockets = require('./chat.socket');
const registerTripSockets = require('./trip.socket');
const registerLocationSockets = require('./location.socket');
const registerEmergencySockets = require('./emergency.socket');

const initSockets = (io) => {
  // Socket Middleware Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

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
