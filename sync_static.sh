#!/bin/bash
# Sync Next.js static files from build location to nginx location
# This script should be run after npm run build

echo "Syncing .next directory to nginx location..."
rsync -av --delete /root/upsizer/.next/ /var/www/upsizer/.next/
echo "Sync completed successfully!"
