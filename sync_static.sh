#!/bin/bash
# Sync Next.js static files and data from build location to nginx location
# This script should be run after npm run build

echo "Syncing .next directory to nginx location..."
rsync -av --delete /root/pixelift/.next/ /var/www/pixelift/.next/

echo "Syncing data directory..."
rsync -av /root/pixelift/data/ /var/www/pixelift/data/

echo "Sync completed successfully!"
