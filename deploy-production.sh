#!/bin/bash

# Production Deployment Script for Pixelift
# This script ensures CSS and static files are properly deployed

set -e  # Exit on error

echo "🚀 Starting Pixelift Production Deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
REMOTE_USER="root"
REMOTE_HOST="138.68.79.23"
REMOTE_PATH="/root/pixelift"

# Load password from environment variable or .env file
if [ -z "$DEPLOY_PASSWORD" ]; then
    if [ -f ".env.deploy" ]; then
        source .env.deploy
    else
        echo "❌ Error: DEPLOY_PASSWORD not set. Create .env.deploy with DEPLOY_PASSWORD=your_password"
        exit 1
    fi
fi
REMOTE_PASSWORD="$DEPLOY_PASSWORD"

echo -e "${BLUE}📥 Step 1: Pulling latest code from GitHub...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && git pull origin master"

echo -e "${BLUE}📦 Step 2: Installing dependencies...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && npm install"

echo -e "${BLUE}🔨 Step 3: Building production bundle...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && npm run build"

echo -e "${BLUE}📂 Step 4: Syncing static files (CRITICAL FOR CSS)...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
cd /root/pixelift

# Copy static files to standalone folder
echo "  → Copying .next/static to standalone..."
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

# Copy public folder to standalone
echo "  → Copying public folder to standalone..."
cp -r public .next/standalone/ 2>/dev/null || true

# Copy data folder to standalone (CRITICAL for JSON database)
echo "  → Copying data folder to standalone..."
cp -r data .next/standalone/ 2>/dev/null || true

# Copy .env.local to standalone (CRITICAL for OpenAI API key and other env vars)
echo "  → Copying .env.local to standalone..."
cp .env.local .next/standalone/ 2>/dev/null || true

# Verify the files exist
if [ -d ".next/standalone/.next/static" ]; then
    echo "  ✓ Static files copied successfully"
    ls -la .next/standalone/.next/static | head -5
else
    echo "  ✗ WARNING: Static files not found!"
fi

if [ -d ".next/standalone/data" ]; then
    echo "  ✓ Data folder copied successfully"
else
    echo "  ✗ WARNING: Data folder not found!"
fi

if [ -f ".next/standalone/.env.local" ]; then
    echo "  ✓ .env.local copied successfully"
else
    echo "  ✗ WARNING: .env.local not found!"
fi
ENDSSH

echo -e "${BLUE}🔄 Step 5: Restarting PM2 process from standalone directory...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
# Stop current PM2 process
pm2 delete pixelift-web 2>/dev/null || true

# Start from standalone directory (CRITICAL for serving static files)
cd /root/pixelift/.next/standalone

# Export environment variables from .env.local
set -a  # Mark variables for export
source .env.local
set +a  # Unmark

# Start PM2 with environment variables loaded
pm2 start server.js --name pixelift-web
pm2 save
ENDSSH

echo -e "${BLUE}⏳ Step 6: Waiting for app to start...${NC}"
sleep 3

echo -e "${BLUE}📊 Step 7: Checking status...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "pm2 status pixelift-web"

echo -e "${BLUE}📋 Step 8: Checking recent logs...${NC}"
sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "pm2 logs pixelift-web --lines 10 --nostream"

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🌐 Production URL: https://pixelift.pl"
echo "📊 Monitor logs: ssh root@138.68.79.23 'pm2 logs pixelift-web'"
echo ""
echo -e "${GREEN}🎉 CSS and static files should now be working!${NC}"
