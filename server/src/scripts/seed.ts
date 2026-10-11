import mongoose from 'mongoose';
import { config } from '../config/env';
import { User } from '../models/User';

const seedUsers = [
  {
    email: 'admin@creditsea.com',
    password: 'Admin@123',
    role: 'admin',
    fullName: 'Admin User',
  },
  {
    email: 'sales@creditsea.com',
    password: 'Sales@123',
    role: 'sales',
    fullName: 'Sales Executive',
  },
  {
    email: 'sanction@creditsea.com',
    password: 'Sanction@123',
    role: 'sanction',
    fullName: 'Sanction Executive',
  },
  {
    email: 'disbursement@creditsea.com',
    password: 'Disbursement@123',
    role: 'disbursement',
    fullName: 'Disbursement Executive',
  },
  {
    email: 'collection@creditsea.com',
    password: 'Collection@123',
    role: 'collection',
    fullName: 'Collection Executive',
  },
  {
    email: 'borrower@creditsea.com',
    password: 'Borrower@123',
    role: 'borrower',
    fullName: 'Test Borrower',
  },
];

async function seed() {
  console.log('🌱 Starting seed script...\n');

  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });

      if (existing) {
        console.log(`⚠️  User already exists: ${userData.email} (${userData.role}) — skipping`);
        continue;
      }

      await User.create(userData);
      console.log(`✅ Created ${userData.role}: ${userData.email} / ${userData.password}`);
    }

    console.log('\n🎉 Seed complete!\n');
    console.log('Login credentials:');
    console.log('─────────────────────────────────────────────');
    seedUsers.forEach(u => {
      console.log(`${u.role.padEnd(14)} | ${u.email.padEnd(32)} | ${u.password}`);
    });
    console.log('─────────────────────────────────────────────\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
