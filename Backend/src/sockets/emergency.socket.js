module.exports = (io, socket) => {
  const orgId = socket.organizationId;

  socket.on('emergency:sos', (data) => {
    if (!orgId) return;
    console.log(`[Socket] EMERGENCY SOS TRIGGERED by ${data.driverName} in Org: ${orgId}`);

    // Broadcast ONLY to the specific organization
    io.to(`organization:${orgId}`).emit('emergency:new', {
      ...data,
      organizationId: orgId,
    });
  });
};
