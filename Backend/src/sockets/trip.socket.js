module.exports = (io, socket) => {
  socket.on('trip:status:update', (data) => {
    console.log(`[Socket] Trip status updated: #${data.tripID} -> ${data.status}`);
    io.emit('trip:status:changed', data);
  });
};
