module.exports = (io, socket) => {
  const orgId = socket.organizationId;

  socket.on('driver:location:update', (data) => {
    if (!orgId) return;

    // Broadcast live driver location ONLY to dispatchers and admins within the same organization
    socket.to(`organization:${orgId}`).emit('fleet:location:update', {
      ...data,
      organizationId: orgId,
    });

    if (data.tripID) {
      socket.to(`organization:${orgId}:trip:${data.tripID}`).emit('trip:location:update', {
        ...data,
        organizationId: orgId,
      });
    }
  });
};
