const mongoose = require('mongoose');
const env = require('../config/env');
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

const seedData = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing collections
    await Promise.all([
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
    ]);

    console.log('[Seed] Cleared old collections');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Aisha Khan (Admin)',
      email: 'admin@transitsync.com',
      password: 'password',
      role: 'ROLE_ADMIN',
    });

    const dispatcherUser = await User.create({
      name: 'Sara Torres (Dispatcher)',
      email: 'dispatcher@transitsync.com',
      password: 'password',
      role: 'ROLE_DISPATCHER',
    });

    const driverUser = await User.create({
      name: 'Alex Driver',
      email: 'driver@transitsync.com',
      password: 'password',
      role: 'ROLE_DRIVER',
      licenseNo: 'GJ-01-2024-99881',
      driverID: 'DRV-101',
    });

    const driver2 = await User.create({
      name: 'Rohit Sharma',
      email: 'rohit@transitsync.com',
      password: 'password',
      role: 'ROLE_DRIVER',
      driverID: 'DRV-102',
    });

    const driver3 = await User.create({
      name: 'Amit Patel',
      email: 'amit@transitsync.com',
      password: 'password',
      role: 'ROLE_DRIVER',
      driverID: 'DRV-103',
    });

    // 2. Create Drivers
    await Driver.create([
      {
        driverId: 'DRV-101',
        user: driverUser._id,
        name: 'Alex Driver',
        phone: '+91 98765 43210',
        licenseNumber: 'GJ-01-2024-99881',
        status: 'ON_TRIP',
        safetyScore: 98,
      },
      {
        driverId: 'DRV-102',
        user: driver2._id,
        name: 'Rohit Sharma',
        phone: '+91 98765 43211',
        licenseNumber: 'GJ-01-2024-99882',
        status: 'AVAILABLE',
        safetyScore: 94,
      },
      {
        driverId: 'DRV-103',
        user: driver3._id,
        name: 'Amit Patel',
        phone: '+91 98765 43212',
        licenseNumber: 'GJ-01-2024-99883',
        status: 'AVAILABLE',
        safetyScore: 91,
      },
    ]);

    // 3. Create Vehicles
    await Vehicle.create([
      {
        vehicleID: 'VEH-101',
        registrationNumber: 'GJ01AB1234',
        name: 'Tata Signa Heavy Hauler',
        type: 'Truck',
        maxLoadCapacity: 12000,
        odometer: 24500,
        acquisitionCost: 3200000,
        status: 'ON_TRIP',
      },
      {
        vehicleID: 'VEH-102',
        registrationNumber: 'GJ01CD5678',
        name: 'Ashok Leyland Cargo Transporter',
        type: 'Truck',
        maxLoadCapacity: 8000,
        odometer: 18200,
        acquisitionCost: 2800000,
        status: 'AVAILABLE',
      },
      {
        vehicleID: 'VEH-103',
        registrationNumber: 'GJ01EF9012',
        name: 'Eicher Pro Fleet Van',
        type: 'Van',
        maxLoadCapacity: 4000,
        odometer: 9400,
        acquisitionCost: 1800000,
        status: 'IDLE',
      },
      {
        vehicleID: 'VEH-104',
        registrationNumber: 'GJ01GH3456',
        name: 'BharatBenz Multi-Axle',
        type: 'Trailer',
        maxLoadCapacity: 20000,
        odometer: 45000,
        acquisitionCost: 4500000,
        status: 'MAINTENANCE',
      },
    ]);

    // 4. Create Trips
    await Trip.create([
      {
        tripID: 'TRP-1045',
        source: 'Warehouse A (Gandhinagar)',
        destination: 'Client Location B (SG Highway)',
        vehicleID: 'GJ01AB1234',
        driverID: 'DRV-101',
        cargoWeight: 4500,
        plannedDistance: 28,
        startingOdometer: 24472,
        status: 'DISPATCHED',
        driver: driverUser._id,
        dispatcher: dispatcherUser._id,
      },
      {
        tripID: 'TRP-1046',
        source: 'Sanand Industrial Yard',
        destination: 'Surat Cargo Terminal',
        vehicleID: 'GJ01CD5678',
        driverID: 'DRV-102',
        cargoWeight: 7800,
        plannedDistance: 260,
        startingOdometer: 18200,
        status: 'CREATED',
        dispatcher: dispatcherUser._id,
      },
      {
        tripID: 'TRP-1047',
        source: 'Mundra Port Depot',
        destination: 'Ahmedabad Logistics Hub',
        vehicleID: 'GJ01EF9012',
        driverID: 'DRV-103',
        cargoWeight: 3200,
        plannedDistance: 340,
        status: 'COMPLETED',
        finalOdometer: 9740,
        fuelConsumed: 42,
      },
    ]);

    // 5. Create Issues
    await Issue.create([
      {
        issueId: '#ISS-1032',
        reportedBy: driverUser._id,
        driverName: 'Alex Driver',
        vehicleID: 'GJ01AB1234',
        category: 'VEHICLE_ISSUE',
        issueType: 'Brake Fault',
        severity: 'High',
        description: 'Brake pedal feels spongy during heavy braking on highway.',
        status: 'IN_PROGRESS',
        assignedTo: 'Maintenance Team',
      },
      {
        issueId: '#ISS-1028',
        reportedBy: driverUser._id,
        driverName: 'Alex Driver',
        vehicleID: 'GJ01CD5678',
        category: 'VEHICLE_ISSUE',
        issueType: 'Tyre Puncture',
        severity: 'Medium',
        description: 'Rear left tyre air pressure low.',
        status: 'RESOLVED',
        assignedTo: 'Maintenance Team',
      },
    ]);

    // 6. Create Expenses
    await Expense.create([
      {
        vehicleID: 'GJ01AB1234',
        tripID: 'TRP-1045',
        category: 'FUEL',
        amount: 8500,
        currency: 'INR (Rs)',
        description: 'Diesel refuel at Highway HP Pump',
      },
      {
        vehicleID: 'GJ01CD5678',
        category: 'TOLL',
        amount: 650,
        currency: 'INR (Rs)',
        description: 'Expressway Toll Booth Charge',
      },
    ]);

    // 7. Create Maintenance
    await Maintenance.create({
      vehicleID: 'GJ01GH3456',
      maintenanceType: 'Engine Overhaul',
      description: 'Scheduled 40,000 km major service check',
      cost: 18500,
      odometer: 45000,
      status: 'IN_PROGRESS',
    });

    console.log('[Seed] Demo database populated successfully!');
    console.log('----------------------------------------------------');
    console.log('Admin Demo:       admin@transitsync.com / password');
    console.log('Dispatcher Demo:  dispatcher@transitsync.com / password');
    console.log('Driver Demo:      driver@transitsync.com / password');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
