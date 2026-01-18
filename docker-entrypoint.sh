#!/bin/sh
set -e

echo "Running database migrations..."
node ./node_modules/prisma/build/index.js db push --skip-generate

echo "Seeding database..."
node ./node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' prisma/seed.ts || echo "Seeding skipped or already done"

echo "Starting application..."
exec node server.js
