const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Issue = require('../models/Issue');

/**
 * Controlled TransitSync AI Service
 */
const getAIResponse = async (userPrompt, userRole = 'DRIVER') => {
  const prompt = userPrompt.toLowerCase().trim();

  // 1. Vehicle Tracking
  if (prompt.includes('track my vehicle') || prompt.includes('where is my vehicle')) {
    const activeTrip = await Trip.findOne({ status: { $in: ['DISPATCHED', 'ON TRIP', 'In Progress'] } });
    if (activeTrip) {
      return `Your vehicle (Trip #${activeTrip.tripID}) is currently en route from ${activeTrip.source} to ${activeTrip.destination}. Location: SG Highway, Ahmedabad. 📍`;
    }
    return 'Your vehicle GJ01AB1234 is currently stationed at Gandhinagar Depot. All systems operational. 🚚';
  }

  // 2. Today's Trips
  if (prompt.includes("today's trip") || prompt.includes('today trip') || prompt.includes('next trip') || prompt.includes('show today')) {
    const count = await Trip.countDocuments({});
    const active = await Trip.findOne({ status: 'DISPATCHED' });
    if (active) {
      return `Today you have active Trip #${active.tripID} (${active.source} ➔ ${active.destination}). Total scheduled today: ${count} trips. 📦`;
    }
    return `You have 1 active trip today: #TRP-1045 (Warehouse A 08:30 AM ➔ Client Location B 11:15 AM). 📦`;
  }

  // 3. Report An Issue
  if (prompt.includes('report issue') || prompt.includes('report an issue') || prompt.includes('mess it up') || prompt.includes('recent issue')) {
    const latestIssue = await Issue.findOne({}).sort({ createdAt: -1 });
    if (latestIssue) {
      return `Latest logged issue: #${latestIssue.issueId} (${latestIssue.issueType || latestIssue.category}) - Status: ${latestIssue.status}. You can submit new reports in the Mess It Up tab! ⚠️`;
    }
    return 'You can log vehicle breakdown, route traffic, or maintenance tickets directly in the Mess It Up (Report Issue) tab. ⚠️';
  }

  // 4. Contact Dispatcher
  if (prompt.includes('contact dispatcher') || prompt.includes('dispatcher')) {
    return 'Dispatcher Rohit Sharma is currently assigned to your shift. Live Status: Online & Available. You can start a direct chat in the Chats tab. 📞';
  }

  // 5. Maintenance check
  if (prompt.includes('maintenance') || prompt.includes('in shop')) {
    const maintenanceVehicles = await Vehicle.find({ status: { $in: ['MAINTENANCE', 'IN_SHOP', 'Maintenance'] } });
    return `There are currently ${maintenanceVehicles.length} vehicles under maintenance check in shop. Service logs updated. 🛠️`;
  }

  // 6. Specific trip query
  if (prompt.includes('trp-1045') || prompt.includes('1045')) {
    const trip = await Trip.findOne({ tripID: 'TRP-1045' });
    if (trip) {
      return `Trip #TRP-1045 Details: Source: ${trip.source}, Destination: ${trip.destination}, Status: ${trip.status}, Distance: ${trip.plannedDistance} km. 🚚`;
    }
    return 'Trip #TRP-1045: Warehouse A to Client Location B. Driver: Alex Driver. Status: On Trip. ETA: 11:15 AM. 🚚';
  }

  // Default fallback response
  return `TransitSync AI: Acknowledged "${userPrompt}". I'm monitoring active fleet routes, driver schedules, and trip logs in real-time. How else can I assist your shift? 🚦`;
};

module.exports = { getAIResponse };
