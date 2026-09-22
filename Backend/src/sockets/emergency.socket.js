module.exports = (io, socket) => {
  socket.on('emergency:sos', (data) => {
    console.log(`[Socket] EMERGENCY SOS TRIGGERED by ${data.driverName}`);
    io.emit('emergency:new', data);
  });
};
