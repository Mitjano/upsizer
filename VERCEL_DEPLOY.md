# 🚀 Pixelift - Deploy na Vercel

## Szybki Deploy (3 kroki)

### 1️⃣ Zainstaluj Vercel CLI

```bash
npm i -g vercel
```

### 2️⃣ Zaloguj się do Vercel

```bash
vercel login
```

Postępuj zgodnie z instrukcjami w przeglądarce.

### 3️⃣ Deploy!

```bash
vercel --prod
```

To wszystko! 🎉

---

## ⚙️ Konfiguracja Zmiennych Środowiskowych

Po pierwszym deployu, dodaj zmienne środowiskowe w Vercel Dashboard:

### Wymagane Zmienne

```bash
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pixelift-ed3df.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pixelift-ed3df
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pixelift-ed3df.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=pixelift-ed3df
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbavc@pixelift-ed3df.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ....\n-----END PRIVATE KEY-----\n"

# NextAuth
NEXTAUTH_SECRET=wygeneruj_komenda_openssl_rand_base64_32
NEXTAUTH_URL=https://twoja-domena.vercel.app

# Replicate API
REPLICATE_API_TOKEN=r8_...

# Redis (Upstash - darmowy tier)
REDIS_URL=redis://default:...@...upstash.io:6379

# Opcjonalne
WEBHOOK_SECRET=twoj_sekret_webhook
```

### Jak dodać zmienne w Vercel?

1. Idź do: https://vercel.com/dashboard
2. Wybierz swój projekt
3. Settings → Environment Variables
4. Dodaj każdą zmienną z powyższej listy
5. Kliknij "Save"
6. Redeploy projektu: `vercel --prod`

---

## 🔧 Setup Redis (Upstash - Darmowy)

Background Remover i inne features wymagają Redis do kolejkowania zadań.

### 1. Utwórz konto Upstash

Idź do: https://console.upstash.com/login

### 2. Utwórz bazę Redis

- Kliknij "Create Database"
- Wybierz region: **Europe (Frankfurt)** lub najbliższy
- Kliknij "Create"

### 3. Skopiuj REDIS_URL

W zakładce "Details" znajdziesz:
```
redis://default:Abc123...@cool-koala-12345.upstash.io:6379
```

Skopiuj cały URL i dodaj jako zmienną `REDIS_URL` w Vercel.

---

## 🔴 WAŻNE: Background Worker

⚠️ **Vercel NIE obsługuje background workers!**

Background Remover będzie działał w trybie "webhook" (Replicate zwróci URL do wyniku).

### Opcja 1: Deploy worker osobno na Railway/Render (zalecane)

**Railway (darmowy tier 500h/mies):**

```bash
# Zainstaluj Railway CLI
npm i -g @railway/cli

# Zaloguj się
railway login

# Deploy worker
railway up
```

Dodaj te same zmienne środowiskowe w Railway.

**Start command:** `npm run worker:prod`

### Opcja 2: Uruchom worker lokalnie (tylko do testów)

```bash
npm run worker
```

Worker musi działać równocześnie z aplikacją.

---

## ✅ Weryfikacja Deploymentu

Po deployu sprawdź:

### 1. Aplikacja działa
```bash
curl https://twoja-domena.vercel.app
```

### 2. API działa
```bash
curl https://twoja-domena.vercel.app/api/health
```

### 3. Redis jest połączony
- Zaloguj się do aplikacji
- Przejdź do Dashboard
- Sprawdź czy API Keys są zapisywane

### 4. Firebase Storage działa
- Zaloguj się
- Przejdź do Background Remover
- Prześlij testowy obraz
- Sprawdź czy pojawia się w Firebase Storage Console

---

## 🐛 Troubleshooting

### Problem: "NEXTAUTH_URL is not set"

**Fix:** Dodaj zmienną `NEXTAUTH_URL` z pełnym URL do Vercel:
```bash
vercel env add NEXTAUTH_URL
# Wpisz: https://twoja-domena.vercel.app
```

### Problem: "Redis connection failed"

**Fix:**
1. Sprawdź czy REDIS_URL jest poprawny w Upstash Console
2. Skopiuj ponownie URL i zaktualizuj w Vercel
3. Redeploy: `vercel --prod`

### Problem: "Firebase permission denied"

**Fix:**
1. Sprawdź czy storage.rules są wdrożone w Firebase Console
2. Sprawdź czy użytkownik jest zalogowany
3. Sprawdź czy FIREBASE_ADMIN_PRIVATE_KEY ma znaki nowej linii `\n`

### Problem: "Jobs stuck in pending"

**Fix:**
- Background worker NIE działa na Vercel
- Deploy worker na Railway/Render (patrz sekcja wyżej)
- LUB uruchom lokalnie: `npm run worker`

---

## 📊 Monitorowanie

### Logi Vercel

```bash
vercel logs
```

### Redis Queue (Upstash Console)

https://console.upstash.com → Twoja baza → "Data Browser"

Sprawdź klucze:
- `bull:image-processing:*` - zadania w kolejce
- `ratelimit:*` - limity API

---

## 💰 Koszty (10,000 requestów/mies)

| Serwis | Koszt |
|--------|-------|
| Vercel (Hobby) | $0 (darmowy) |
| Upstash Redis | $0 (darmowy tier) |
| Railway Worker | $0 (500h darmowych) |
| Replicate API | ~$50/mies |
| **TOTAL** | **~$50/mies** |

---

## 🎯 Custom Domain (opcjonalne)

1. Kup domenę (np. pixelift.pl)
2. W Vercel Dashboard → Settings → Domains
3. Dodaj domenę i skonfiguruj DNS
4. Zaktualizuj `NEXTAUTH_URL` na nową domenę

---

## 📞 Pomoc

- Vercel Docs: https://vercel.com/docs
- Upstash Docs: https://docs.upstash.com
- Railway Docs: https://docs.railway.app

**Gotowy do deploymentu? Uruchom `vercel --prod` i zobacz magię! ✨**
