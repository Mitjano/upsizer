/**
 * Seed SEO Locales
 * Run: npx tsx prisma/seed-seo-locales.ts
 */

import { PrismaClient } from '../lib/generated/prisma';
import { SEO_LOCALES } from '../lib/seo/locales';

const prisma = new PrismaClient();

async function main() {
  console.log('🌍 Seeding SEO Locales...');

  for (const locale of SEO_LOCALES) {
    await prisma.sEOLocale.upsert({
      where: { code: locale.code },
      update: {
        name: locale.name,
        nativeName: locale.nativeName,
        googleDomain: locale.googleDomain,
        googleHL: locale.googleHL,
        googleGL: locale.googleGL,
        flag: locale.flag,
        isActive: locale.isActive,
        priority: locale.priority,
      },
      create: {
        code: locale.code,
        name: locale.name,
        nativeName: locale.nativeName,
        googleDomain: locale.googleDomain,
        googleHL: locale.googleHL,
        googleGL: locale.googleGL,
        flag: locale.flag,
        isActive: locale.isActive,
        priority: locale.priority,
      },
    });

    console.log(`  ${locale.flag} ${locale.code} - ${locale.name} (${locale.isActive ? 'active' : 'inactive'})`);
  }

  console.log(`\n✅ Seeded ${SEO_LOCALES.length} locales (${SEO_LOCALES.filter(l => l.isActive).length} active)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding locales:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
