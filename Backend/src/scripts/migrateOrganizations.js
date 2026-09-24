const mongoose = require('mongoose');
const env = require('../config/env');

const Organization = require('../models/Organization');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Attendance = require('../models/Attendance');
const Issue = require('../models/Issue');
const Maintenance = require('../models/Maintenance');
const Expense = require('../models/Expense');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const ProofOfDelivery = require('../models/ProofOfDelivery');
const Emergency = require('../models/Emergency');
const Location = require('../models/Location');

const DEFAULT_ORG = {
  name: 'TransitSync Demo Organization',
  code: 'TS-DEMO',
  email: 'admin@transitsync.com',
  phone: '+91 98765 00000',
  address: 'Central Logistics Terminal',
  city: 'Ahmedabad',
  country: 'India',
  timezone: 'Asia/Kolkata',
  currency: 'INR (Rs)',
  geofence: {
    latitude: 23.0225,
    longitude: 72.5714,
    radiusMeters: 200,
    name: 'Ahmedabad Central Depot',
  },
};

async function runMigration({ dryRun = false } = {}) {
  console.log(`\n======================================================`);
  console.log(`🔄 TransitSync Organization Migration Script`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN (No changes applied)' : 'LIVE MIGRATION'}`);
  console.log(`======================================================\n`);

  await mongoose.connect(env.MONGO_URI);
  console.log(` Connected to MongoDB: ${env.MONGO_URI}`);

  // 1. Find or create default organization
  let demoOrg = await Organization.findOne({ code: DEFAULT_ORG.code });
  if (!demoOrg) {
    if (!dryRun) {
      demoOrg = await Organization.create(DEFAULT_ORG);
      console.log(` Created default Organization: "${demoOrg.name}" (${demoOrg.code}) - ID: ${demoOrg._id}`);
    } else {
      console.log(` [Dry-Run] Would create default Organization: "${DEFAULT_ORG.name}" (${DEFAULT_ORG.code})`);
      demoOrg = { _id: new mongoose.Types.ObjectId(), name: DEFAULT_ORG.name, code: DEFAULT_ORG.code };
    }
  } else {
    console.log(` Found existing default Organization: "${demoOrg.name}" (${demoOrg.code}) - ID: ${demoOrg._id}`);
  }

  const collectionsToMigrate = [
    { name: 'Users', model: User },
    { name: 'Drivers', model: Driver },
    { name: 'Vehicles', model: Vehicle },
    { name: 'Trips', model: Trip },
    { name: 'Attendance', model: Attendance },
    { name: 'Issues', model: Issue },
    { name: 'Maintenance', model: Maintenance },
    { name: 'Expenses', model: Expense },
    { name: 'Conversations', model: Conversation },
    { name: 'Messages', model: Message },
    { name: 'Notifications', model: Notification },
    { name: 'ProofOfDelivery', model: ProofOfDelivery },
    { name: 'Emergency', model: Emergency },
    { name: 'Location', model: Location },
  ];

  const migrationSummary = [];

  for (const item of collectionsToMigrate) {
    const unassignedCount = await item.model.countDocuments({
      $or: [{ organizationId: { $exists: false } }, { organizationId: null }],
    });

    if (unassignedCount > 0) {
      if (!dryRun) {
        const updateResult = await item.model.updateMany(
          { $or: [{ organizationId: { $exists: false } }, { organizationId: null }] },
          { $set: { organizationId: demoOrg._id } }
        );
        migrationSummary.push({
          collection: item.name,
          unassigned: unassignedCount,
          migrated: updateResult.modifiedCount,
          status: 'SUCCESS',
        });
      } else {
        migrationSummary.push({
          collection: item.name,
          unassigned: unassignedCount,
          migrated: 0,
          status: 'PENDING_MIGRATION',
        });
      }
    } else {
      migrationSummary.push({
        collection: item.name,
        unassigned: 0,
        migrated: 0,
        status: 'ALREADY_SCOPED',
      });
    }
  }

  console.log('\nMigration Summary Report:');
  console.table(migrationSummary);

  console.log('\n======================================================');
  console.log('✅ Migration Process Completed');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  runMigration({ dryRun: isDryRun })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed with error:', err);
      process.exit(1);
    });
}

module.exports = runMigration;
