#!/bin/bash
# Sync Next.js static files and data from build location to nginx location
# This script should be run after npm run build

echo "Syncing .next directory to nginx location..."
rsync -av --delete /root/upsizer/.next/ /var/www/upsizer/.next/

echo "Syncing data directory..."
rsync -av /root/upsizer/data/ /var/www/upsizer/data/

echo "Sync completed successfully!"
