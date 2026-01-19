#!/bin/sh
set -e

echo "Running database migrations..."
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "Seeding database..."
node prisma/seed.js || echo "Seeding skipped or already done"

echo "Starting application..."
exec node server.js
