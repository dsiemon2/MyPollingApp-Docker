#!/bin/sh
set -e

echo "Running database migrations..."
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

# Only seed if database is empty (check for users)
echo "Checking if seeding is needed..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then(count => {
  console.log(count);
  prisma.\$disconnect();
}).catch(() => {
  console.log(0);
  prisma.\$disconnect();
});
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "Seeding database (first run)..."
  node prisma/seed.js || echo "Seeding failed"
else
  echo "Database already seeded ($USER_COUNT users found), skipping full seed..."
  echo "Updating branding settings..."
  node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const settings = [
  { key: 'businessName', value: 'PoligoPro', category: 'branding' },
  { key: 'logoUrl', value: '/images/PoligoPro.png', category: 'branding' },
  { key: 'primaryColor', value: '#0d7a3e', category: 'branding' },
  { key: 'secondaryColor', value: '#1a3a5c', category: 'branding' },
  { key: 'tagline', value: 'Voice-Enabled Polling', category: 'branding' },
];
Promise.all(settings.map(s =>
  prisma.systemSetting.upsert({
    where: { key: s.key },
    update: { value: s.value },
    create: s,
  })
)).then(() => { console.log('Branding updated'); prisma.\$disconnect(); })
  .catch(e => { console.error('Branding update failed:', e.message); prisma.\$disconnect(); });
" 2>/dev/null || echo "Branding update skipped"
fi

echo "Starting application..."
exec node server.js
