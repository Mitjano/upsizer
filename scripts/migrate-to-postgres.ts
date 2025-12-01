/**
 * Migration script: JSON files -> PostgreSQL
 *
 * Run with:
 * DATABASE_URL='postgresql://...' npx tsx scripts/migrate-to-postgres.ts
 */

import { PrismaClient } from '../lib/generated/prisma';
import fs from 'fs';
import path from 'path';

// Ensure we have DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
const DATA_DIR = path.join(process.cwd(), 'data');

function readJSON<T>(filename: string): T | null {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filename}`);
    return null;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (e) {
    console.log(`  ⚠️  Error reading ${filename}:`, e);
    return null;
  }
}

async function migrateUsers() {
  console.log('\n📦 Migrating users...');
  const users = readJSON<any[]>('users.json');
  if (!users || users.length === 0) {
    console.log('  No users to migrate');
    return;
  }

  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          image: user.image,
          role: user.role || 'user',
          status: user.status || 'active',
          credits: user.credits || 0,
          totalUsage: user.totalUsage || 0,
          updatedAt: new Date(user.updatedAt || Date.now()),
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
          firstUploadAt: user.firstUploadAt ? new Date(user.firstUploadAt) : null,
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || 'user',
          status: user.status || 'active',
          credits: user.credits || 0,
          totalUsage: user.totalUsage || 0,
          createdAt: new Date(user.createdAt || Date.now()),
          updatedAt: new Date(user.updatedAt || Date.now()),
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
          firstUploadAt: user.firstUploadAt ? new Date(user.firstUploadAt) : null,
        },
      });
      console.log(`  ✅ User: ${user.email}`);
    } catch (e) {
      console.log(`  ❌ Failed to migrate user ${user.email}:`, e);
    }
  }
}

async function migrateUsage() {
  console.log('\n📦 Migrating usage records...');
  const usages = readJSON<any[]>('usage.json');
  if (!usages || usages.length === 0) {
    console.log('  No usage records to migrate');
    return;
  }

  let migrated = 0;
  for (const usage of usages) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: usage.userEmail },
      });

      if (!user) {
        console.log(`  ⚠️  User not found for usage: ${usage.userEmail}`);
        continue;
      }

      await prisma.usage.create({
        data: {
          id: usage.id,
          userId: user.id,
          type: usage.type || 'unknown',
          creditsUsed: usage.creditsUsed || 1,
          imageSize: usage.imageSize,
          model: usage.model,
          createdAt: new Date(usage.createdAt || Date.now()),
        },
      });
      migrated++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Duplicate, skip
        continue;
      }
      console.log(`  ❌ Failed to migrate usage:`, e.message);
    }
  }
  console.log(`  ✅ Migrated ${migrated} usage records`);
}

async function migrateCampaigns() {
  console.log('\n📦 Migrating campaigns...');
  const campaigns = readJSON<any[]>('campaigns.json');
  if (!campaigns || campaigns.length === 0) {
    console.log('  No campaigns to migrate');
    return;
  }

  for (const campaign of campaigns) {
    try {
      await prisma.campaign.upsert({
        where: { id: campaign.id },
        update: {
          name: campaign.name,
          type: campaign.type,
          status: campaign.status || 'active',
          budget: campaign.budget || 0,
          spent: campaign.spent || 0,
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
          conversions: campaign.conversions || 0,
          startDate: new Date(campaign.startDate),
          endDate: campaign.endDate ? new Date(campaign.endDate) : null,
          updatedAt: new Date(),
        },
        create: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status || 'active',
          budget: campaign.budget || 0,
          spent: campaign.spent || 0,
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
          conversions: campaign.conversions || 0,
          startDate: new Date(campaign.startDate),
          endDate: campaign.endDate ? new Date(campaign.endDate) : null,
          createdAt: new Date(campaign.createdAt || Date.now()),
        },
      });
      console.log(`  ✅ Campaign: ${campaign.name}`);
    } catch (e) {
      console.log(`  ❌ Failed to migrate campaign ${campaign.name}:`, e);
    }
  }
}

async function migrateApiKeys() {
  console.log('\n📦 Migrating API keys...');
  const apiKeys = readJSON<any[]>('api_keys.json');
  if (!apiKeys || apiKeys.length === 0) {
    console.log('  No API keys to migrate');
    return;
  }

  for (const key of apiKeys) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: key.userEmail },
      });

      if (!user) {
        console.log(`  ⚠️  User not found for API key: ${key.userEmail}`);
        continue;
      }

      await prisma.apiKey.upsert({
        where: { id: key.id },
        update: {
          name: key.name,
          isActive: key.isActive ?? true,
          rateLimit: key.rateLimit || 100,
          usageCount: key.usageCount || 0,
          lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
        },
        create: {
          id: key.id,
          userId: user.id,
          name: key.name,
          keyHash: key.keyHash,
          keyPrefix: key.keyPrefix,
          environment: key.environment || 'live',
          isActive: key.isActive ?? true,
          rateLimit: key.rateLimit || 100,
          usageCount: key.usageCount || 0,
          lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
          createdAt: new Date(key.createdAt || Date.now()),
          expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
        },
      });
      console.log(`  ✅ API Key: ${key.name}`);
    } catch (e) {
      console.log(`  ❌ Failed to migrate API key ${key.name}:`, e);
    }
  }
}

async function main() {
  console.log('🚀 Starting migration from JSON to PostgreSQL...');
  console.log(`📁 Data directory: ${DATA_DIR}`);

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    // Run migrations
    await migrateUsers();
    await migrateUsage();
    await migrateCampaigns();
    await migrateApiKeys();

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
