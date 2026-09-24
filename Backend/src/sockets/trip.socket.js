const Trip = require('../models/Trip');

module.exports = (io, socket) => {
  const orgId = socket.organizationId;

  socket.on('trip:status:update', async (data) => {
    if (!orgId || !data.tripID) return;

    try {
      const trip = await Trip.findOne({
        $or: [{ tripID: data.tripID }, { _id: data.tripID.match(/^[0-9a-fA-F]{24}$/) ? data.tripID : null }],
        organizationId: orgId,
      });

      if (!trip) {
        console.warn(`[Socket Security] Trip ${data.tripID} does not belong to organization ${orgId}`);
        return;
      }

      console.log(`[Socket] Trip status updated: #${data.tripID} -> ${data.status} (Org: ${orgId})`);

      // Emit strictly to organization room
      io.to(`organization:${orgId}`).emit('trip:status:changed', {
        tripID: data.tripID,
        status: data.status,
      });
    } catch (err) {
      console.error('Error handling trip:status:update:', err);
    }
  });

  socket.on('trip:join', async (data) => {
    if (!orgId || !data.tripID) return;
    try {
      const trip = await Trip.findOne({
        $or: [{ tripID: data.tripID }, { _id: data.tripID.match(/^[0-9a-fA-F]{24}$/) ? data.tripID : null }],
        organizationId: orgId,
      });

      if (trip) {
        socket.join(`organization:${orgId}:trip:${data.tripID}`);
      }
    } catch (err) {
      console.error('Error joining trip room:', err);
    }
  });
};
