module.exports = (io, socket) => {
  socket.on('driver:location:update', (data) => {
    // Broadcast live driver location to dispatchers and admins
    socket.broadcast.emit('fleet:location:update', data);
    socket.broadcast.emit('trip:location:update', data);
  });
};
