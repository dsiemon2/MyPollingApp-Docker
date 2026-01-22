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
  echo "Database already seeded ($USER_COUNT users found), skipping..."
fi

echo "Starting application..."
exec node server.js
