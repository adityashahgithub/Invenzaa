/**
 * Invenzaa Database Seeder
 * Run: node scripts/seed.js
 * Requires: MONGODB_URI, SEEDER_ADMIN_EMAIL, SEEDER_ADMIN_PASSWORD, SEEDER_ORG_NAME
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Role } from '../src/models/Role.js';

dotenv.config();

const DEFAULT_ROLES = [
  { name: 'Owner', permissions: ['*'], description: 'Full system access' },
  { name: 'Admin', permissions: ['*'], description: 'Administrative access' },
  { name: 'Pharmacist', permissions: ['medicines', 'inventory', 'sales', 'purchases', 'reports'], description: 'Pharmacy operations' },
  { name: 'Staff', permissions: ['medicines', 'inventory', 'sales'], description: 'Basic staff access' },
  { name: 'Viewer', permissions: ['medicines', 'inventory', 'reports'], description: 'Read-only access' },
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/invenzaa';
  const adminEmail = process.env.SEEDER_ADMIN_EMAIL || 'admin@invenzaa.com';
  const adminPassword = process.env.SEEDER_ADMIN_PASSWORD || 'Admin123!';
  const orgName = process.env.SEEDER_ORG_NAME || 'Demo Pharmacy';

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  const count = await Role.countDocuments();
  if (count === 0) {
    await Role.insertMany(DEFAULT_ROLES);
    console.log('Created default roles:', DEFAULT_ROLES.map((r) => r.name).join(', '));
  } else {
    console.log('Roles already exist, skipping.');
  }

  const existingUser = await User.findOne({ email: adminEmail });
  if (existingUser) {
    console.log(`Admin user ${adminEmail} already exists.`);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const org = await Organization.create({ name: orgName });
  await User.create({
    email: adminEmail,
    password: adminPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
    organization: org._id,
    status: 'active',
  });

  console.log('Sample admin account created:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`  Organization: ${orgName}`);
  console.log('  Role: Admin');
  console.log('\nUse these credentials to login. Change password after first login.');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
