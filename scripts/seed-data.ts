import { createUser, createTransaction, createCampaign, createUsage } from '../lib/db';

// Seed sample data for testing
async function seedData() {
  console.log('Starting data seeding...');

  // Create sample campaigns
  const campaigns = [
    {
      name: 'Google Ads - Image Upscaling',
      type: 'google_ads' as const,
      status: 'active' as const,
      budget: 5000,
      spent: 3245.50,
      impressions: 125400,
      clicks: 3210,
      conversions: 156,
      startDate: new Date('2025-01-01').toISOString(),
    },
    {
      name: 'Facebook Ads - AI Tools',
      type: 'facebook_ads' as const,
      status: 'active' as const,
      budget: 3000,
      spent: 2150.75,
      impressions: 89500,
      clicks: 2145,
      conversions: 98,
      startDate: new Date('2025-01-15').toISOString(),
    },
    {
      name: 'Email Campaign - Pro Features',
      type: 'email' as const,
      status: 'completed' as const,
      budget: 500,
      spent: 450,
      impressions: 45000,
      clicks: 1250,
      conversions: 67,
      startDate: new Date('2025-02-01').toISOString(),
      endDate: new Date('2025-02-28').toISOString(),
    },
  ];

  for (const campaign of campaigns) {
    createCampaign(campaign);
  }

  console.log(`Created ${campaigns.length} campaigns`);
  console.log('Data seeding completed!');
}

seedData().catch(console.error);
