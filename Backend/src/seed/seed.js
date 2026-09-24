const mongoose = require('mongoose');
const env = require('../config/env');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Issue = require('../models/Issue');
const Maintenance = require('../models/Maintenance');
const Expense = require('../models/Expense');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const ProofOfDelivery = require('../models/ProofOfDelivery');
const Emergency = require('../models/Emergency');

const seedData = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[Seed] Connected to MongoDB for multi-tenant seeding...');

    // Clear existing collections
    await Promise.all([
      Organization.deleteMany({}),
      User.deleteMany({}),
      Driver.deleteMany({}),
      Vehicle.deleteMany({}),
      Trip.deleteMany({}),
      Issue.deleteMany({}),
      Maintenance.deleteMany({}),
      Expense.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      ProofOfDelivery.deleteMany({}),
      Emergency.deleteMany({}),
    ]);

    console.log('[Seed] Cleared old collections');

    // ==========================================
    // 1. CREATE ORGANIZATIONS
    // ==========================================
    const orgA = await Organization.create({
      name: 'Metro Freight Logistics',
      code: 'MTR001',
      email: 'admin@metrofreight.com',
      phone: '+91 98765 11111',
      address: 'Plot 42, GIDC Industrial Estate',
      city: 'Ahmedabad',
      country: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR (Rs)',
      geofence: {
        latitude: 23.0225,
        longitude: 72.5714,
        radiusMeters: 250,
        name: 'Metro Ahmedabad Depot',
      },
    });

    const orgB = await Organization.create({
      name: 'Apex Global Transit',
      code: 'APX001',
      email: 'admin@apextransit.com',
      phone: '+91 98765 22222',
      address: 'Infocity SEZ Tower B',
      city: 'Gandhinagar',
      country: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR (Rs)',
      geofence: {
        latitude: 23.2156,
        longitude: 72.6369,
        radiusMeters: 300,
        name: 'Apex Gandhinagar Hub',
      },
    });

    // Default Demo Org for test logins
    const orgDemo = await Organization.create({
      name: 'TransitSync Demo Organization',
      code: 'TS-DEMO',
      email: 'admin@transitsync.com',
      phone: '+91 98765 00000',
      address: 'Central Logistics Park',
      city: 'Ahmedabad',
      country: 'India',
      timezone: 'Asia/Kolkata',
      currency: 'INR (Rs)',
    });

    console.log('[Seed] Created Organizations: MTR001, APX001, TS-DEMO');

    // ==========================================
    // 2. CREATE USERS FOR ORG A (Metro Freight)
    // ==========================================
    const adminA = await User.create({
      organizationId: orgA._id,
      name: 'Aisha Khan (Admin)',
      email: 'admin@transitsync.com',
      password: 'password',
      role: 'ROLE_ADMIN',
    });

    const dispatcherA = await User.create({
      organizationId: orgA._id,
      name: 'Sara Torres (Dispatcher)',
      email: 'dispatcher@transitsync.com',
      password: 'password',
      role: 'ROLE_DISPATCHER',
    });

    const driverA1 = await User.create({
      organizationId: orgA._id,
      name: 'Alex Driver',
      email: 'driver@transitsync.com',
      password: 'password',
      role: 'ROLE_DRIVER',
      licenseNo: 'GJ-01-2024-99881',
      driverID: 'DRV-101',
    });

    const driverA2 = await User.create({
      organizationId: orgA._id,
      name: 'Rohit Sharma',
      email: 'rohit@transitsync.com',
      password: 'password',
      role: 'ROLE_DRIVER',
      driverID: 'DRV-102',
    });

    // ==========================================
    // 3. CREATE USERS FOR ORG B (Apex Transit)
    // ==========================================
    const adminB = await User.create({
      organizationId: orgB._id,
      name: 'Vikram Mehta (Apex Admin)',
      email: 'admin@apextransit.com',
      password: 'password',
      role: 'ROLE_ADMIN',
    });

    const dispatcherB = await User.create({
      organizationId: orgB._id,
      name: 'Priya Patel (Apex Dispatcher)',
      email: 'dispatcher@apextransit.com',
      password: 'password',
      role: 'ROLE_DISPATCHER',
    });

    const driverB1 = await User.create({
      organizationId: orgB._id,
      name: 'Rahul Verma (Apex Driver)',
      email: 'rahul@apextransit.com',
      password: 'password',
      role: 'ROLE_DRIVER',
      licenseNo: 'GJ-02-2024-55443',
      driverID: 'DRV-201',
    });

    // ==========================================
    // 4. CREATE DRIVERS
    // ==========================================
    await Driver.create([
      {
        organizationId: orgA._id,
        driverId: 'DRV-101',
        user: driverA1._id,
        name: 'Alex Driver',
        phone: '+91 98765 43210',
        licenseNumber: 'GJ-01-2024-99881',
        status: 'ON_TRIP',
        safetyScore: 98,
      },
      {
        organizationId: orgA._id,
        driverId: 'DRV-102',
        user: driverA2._id,
        name: 'Rohit Sharma',
        phone: '+91 98765 43211',
        licenseNumber: 'GJ-01-2024-99882',
        status: 'AVAILABLE',
        safetyScore: 94,
      },
      {
        organizationId: orgB._id,
        driverId: 'DRV-201',
        user: driverB1._id,
        name: 'Rahul Verma (Apex)',
        phone: '+91 98765 77771',
        licenseNumber: 'GJ-02-2024-55443',
        status: 'AVAILABLE',
        safetyScore: 96,
      },
    ]);

    // ==========================================
    // 5. CREATE VEHICLES
    // ==========================================
    const vehA1 = await Vehicle.create({
      organizationId: orgA._id,
      vehicleID: 'GJ01AB1234',
      registrationNumber: 'GJ-01-AB-1234',
      name: 'Tata Ultra 1918 Heavy Truck',
      type: 'Truck',
      maxLoadCapacity: 10000,
      odometer: 45200,
      status: 'ON_TRIP',
    });

    const vehA2 = await Vehicle.create({
      organizationId: orgA._id,
      vehicleID: 'GJ01CD5678',
      registrationNumber: 'GJ-01-CD-5678',
      name: 'Mahindra Bolero Maxi Truck Plus',
      type: 'Light Commercial',
      maxLoadCapacity: 2500,
      odometer: 18400,
      status: 'AVAILABLE',
    });

    const vehB1 = await Vehicle.create({
      organizationId: orgB._id,
      vehicleID: 'GJ02XY9999',
      registrationNumber: 'GJ-02-XY-9999',
      name: 'Ashok Leyland Ecomet 1615',
      type: 'Truck',
      maxLoadCapacity: 8000,
      odometer: 12100,
      status: 'AVAILABLE',
    });

    // ==========================================
    // 6. CREATE TRIPS
    // ==========================================
    await Trip.create([
      {
        organizationId: orgA._id,
        tripID: 'TRP-1045',
        source: 'Gandhinagar Depot',
        destination: 'Ahmedabad Logistics Hub',
        vehicleID: vehA1.vehicleID,
        driverID: 'DRV-101',
        driver: driverA1._id,
        vehicle: vehA1._id,
        dispatcher: dispatcherA._id,
        cargoWeight: 1450,
        plannedDistance: 42,
        startingOdometer: 45200,
        status: 'DISPATCHED',
        actualStartTime: new Date(),
      },
      {
        organizationId: orgA._id,
        tripID: 'TRP-1044',
        source: 'Sanand Industrial Park',
        destination: 'Mundra Port Gate 3',
        vehicleID: vehA2.vehicleID,
        driverID: 'DRV-102',
        driver: driverA2._id,
        vehicle: vehA2._id,
        dispatcher: dispatcherA._id,
        cargoWeight: 2100,
        plannedDistance: 360,
        status: 'COMPLETED',
        actualEndTime: new Date(),
      },
      {
        organizationId: orgB._id,
        tripID: 'TRP-2001',
        source: 'Apex Gandhinagar Hub',
        destination: 'Vadodara Central Terminal',
        vehicleID: vehB1.vehicleID,
        driverID: 'DRV-201',
        driver: driverB1._id,
        vehicle: vehB1._id,
        dispatcher: dispatcherB._id,
        cargoWeight: 3200,
        plannedDistance: 110,
        status: 'CREATED',
      },
    ]);

    // ==========================================
    // 7. CREATE EXPENSES & ISSUES
    // ==========================================
    await Expense.create([
      {
        organizationId: orgA._id,
        vehicleID: 'GJ01AB1234',
        tripID: 'TRP-1045',
        category: 'FUEL',
        amount: 4500,
        description: 'Diesel refuel at SG Highway IOCL Pump',
        createdBy: driverA1._id,
      },
      {
        organizationId: orgB._id,
        vehicleID: 'GJ02XY9999',
        tripID: 'TRP-2001',
        category: 'TOLL',
        amount: 350,
        description: 'Expressway Fastag Toll',
        createdBy: driverB1._id,
      },
    ]);

    await Issue.create([
      {
        organizationId: orgA._id,
        issueId: '#ISS-1033',
        reportedBy: driverA1._id,
        driverName: 'Alex Driver',
        vehicleID: 'GJ01AB1234',
        category: 'VEHICLE_ISSUE',
        issueType: 'Engine Problem',
        severity: 'High',
        description: 'Engine temperature indicator warning high on highway climb',
        status: 'SUBMITTED',
      },
      {
        organizationId: orgB._id,
        issueId: '#ISS-2001',
        reportedBy: driverB1._id,
        driverName: 'Rahul Verma (Apex)',
        vehicleID: 'GJ02XY9999',
        category: 'MAINTENANCE',
        issueType: 'Scheduled Service',
        severity: 'Medium',
        description: 'Brake pad inspection needed',
        status: 'SUBMITTED',
      },
    ]);

    // ==========================================
    // 8. CREATE CHAT DIRECT CONVERSATION IN ORG A
    // ==========================================
    const convKeyA = [String(dispatcherA._id), String(driverA1._id)].sort().join('_');
    const convA = await Conversation.create({
      organizationId: orgA._id,
      conversationId: 'conv_metro_1',
      participantKey: convKeyA,
      type: 'DIRECT',
      participants: [dispatcherA._id, driverA1._id],
      lastMessage: 'All clear on route 42, proceeding to client warehouse.',
      lastMessageAt: new Date(),
    });

    await Message.create({
      organizationId: orgA._id,
      messageId: 'msg_metro_1',
      conversationId: convA.conversationId,
      senderId: String(driverA1._id),
      senderName: driverA1.name,
      receiverId: String(dispatcherA._id),
      messageType: 'TEXT',
      content: 'All clear on route 42, proceeding to client warehouse.',
      read: false,
    });

    console.log('[Seed] Multi-tenant database seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('Org A (Metro Freight): admin@transitsync.com / password');
    console.log('Org B (Apex Transit):  admin@apextransit.com / password');
    console.log('--------------------------------------------------');

    await mongoose.disconnect();
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
