# Pixelift Deployment Guide

## ✅ Problem SOLVED: White Background After Deployment

**Root Cause:** PM2 was starting from `/root/upsizer` instead of `/root/upsizer/.next/standalone`, 
causing Next.js to not find static CSS files in standalone mode.

**Fix Applied:** PM2 now starts from the standalone directory. This is PERMANENT.

---

## 🚀 Quick Deployment

From your local machine:

```bash
./deploy-production.sh
```

This automated script:
1. ✅ Pulls latest code from GitHub
2. ✅ Installs npm dependencies  
3. ✅ Builds production bundle
4. ✅ Copies static files to standalone folder
5. ✅ Restarts PM2 from CORRECT directory (standalone)
6. ✅ Shows status and logs

---

## 🔧 Manual Deployment (if script fails)

```bash
# 1. SSH to server
ssh root@138.68.79.23

# 2. Navigate and pull
cd /root/upsizer
git pull origin master

# 3. Install and build
npm install
npm run build

# 4. Copy static files (CRITICAL!)
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 5. Restart PM2 from standalone directory (CRITICAL!)
pm2 delete pixelift-web
cd .next/standalone
pm2 start server.js --name pixelift-web
pm2 save
```

---

## 🐛 Troubleshooting

### White background / No CSS

```bash
ssh root@138.68.79.23
cd /root/upsizer

# Copy static files
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Restart from standalone directory
pm2 delete pixelift-web
cd .next/standalone
pm2 start server.js --name pixelift-web
pm2 save
```

### Verify PM2 is running from correct directory

```bash
pm2 show pixelift-web | grep "exec cwd"
# Should show: /root/upsizer/.next/standalone
```

---

## 📊 PM2 Commands

```bash
pm2 status                      # Check status
pm2 logs pixelift-web          # View logs
pm2 logs pixelift-web --lines 50
pm2 restart pixelift-web       # Restart
pm2 stop pixelift-web          # Stop
pm2 delete pixelift-web        # Delete process
pm2 save                       # Save configuration
pm2 show pixelift-web          # Detailed info
```

---

## ✅ Post-Deployment Checklist

- [ ] Site loads: https://pixelift.pl
- [ ] Dark background visible (CSS working)
- [ ] Dashboard shows real statistics after login
- [ ] Sitemap accessible: https://pixelift.pl/sitemap.xml
- [ ] Robots.txt accessible: https://pixelift.pl/robots.txt
- [ ] Structured data in page source (view source, search for "@type")

---

## 📁 Architecture

```
User → Nginx (443) → Next.js (3000 in standalone mode)
                   ↓
            .next/standalone/
                ├── server.js (entry point)
                ├── .next/static/ (CSS, JS)
                └── public/ (images, etc)
```

**Key Points:**
- PM2 MUST run from `.next/standalone` directory
- Static files MUST be in `.next/standalone/.next/static`
- Nginx proxies everything to localhost:3000

---

## 🔄 Environment Variables

Located at: `/root/upsizer/.env.local`

```bash
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://pixelift.pl
REPLICATE_API_TOKEN=...
```

---

## 📝 Recent Changes

- ✅ Real dashboard statistics
- ✅ SEO improvements (sitemap, robots, structured data)  
- ✅ Security enhancements (rate limiting, validation)
- ✅ Logger utility
- ✅ Stripe payment foundation
- ✅ **Fixed PM2 working directory for CSS**

---

**Last Updated:** November 24, 2025
**CSS Issue:** RESOLVED ✅
