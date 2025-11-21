# 🔐 Zmienne Środowiskowe - Quick Reference

Skopiuj do DigitalOcean App Platform → Settings → Environment Variables

---

## ✅ Checklist zmiennych

### Firebase Client SDK (6 zmiennych)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin SDK (3 zmienne - SECRET!)
- [ ] `FIREBASE_ADMIN_PROJECT_ID`
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` ⚠️ Dodaj jako SECRET!

### NextAuth (2 zmienne)
- [ ] `NEXTAUTH_SECRET` (wygeneruj: `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` (URL aplikacji po deployu)

### Replicate API (1 zmienna)
- [ ] `REPLICATE_API_TOKEN`

### Redis (1 zmienna)
- [ ] `REDIS_URL` (z Upstash)

### Opcjonalne
- [ ] `WEBHOOK_SECRET`

---

## 📋 Template do wypełnienia

Skopiuj poniższy template i wypełnij wartościami:

```bash
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (SECRET!)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Replicate
REPLICATE_API_TOKEN=

# Redis
REDIS_URL=

# Optional
WEBHOOK_SECRET=
```

---

## 🔍 Gdzie znaleźć wartości?

### Firebase Client SDK
**Lokalizacja:** Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

Kliknij ikonę **"<>"** (Web) i skopiuj wartości z `firebaseConfig`.

### Firebase Admin SDK
**Lokalizacja:** Firebase Console → Project Settings → Service Accounts

1. Kliknij **"Generate New Private Key"**
2. Pobierz JSON file
3. Skopiuj wartości:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

### NextAuth Secret
**Wygeneruj:**
```bash
openssl rand -base64 32
```

### Replicate API Token
**Lokalizacja:** https://replicate.com/account/api-tokens

### Redis URL
**Lokalizacja:** Upstash Console → Your database → Details tab

Skopiuj wartość z pola **"REDIS_URL"**

---

## ⚠️ WAŻNE: Security

1. **NIE commituj** zmiennych środowiskowych do repo!
2. Dodaj `.env.local` do `.gitignore`
3. W DigitalOcean, wszystkie sekrety (PRIVATE_KEY, API_TOKEN) dodaj jako **SECRET** (nie PLAIN TEXT)
4. Użyj silnego `NEXTAUTH_SECRET` (min. 32 znaki)

---

## 🧪 Testowanie lokalne

Stwórz plik `.env.local` (NIE commituj!):

```bash
cp .env.example .env.local
```

Wypełnij wszystkimi wartościami z powyższej listy, następnie:

```bash
npm run dev
```

---

## 📌 Przykładowe wartości (DO NOT USE!)

```bash
# PRZYKŁAD - NIE UŻYWAJ TYCH WARTOŚCI!
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbc123def456ghi789jkl012mno345pqr678
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0...\n-----END PRIVATE KEY-----\n"
NEXTAUTH_SECRET=zK7x9pLm3nQ2wR5tY8uI1oP4aS6dF0gH
REPLICATE_API_TOKEN=r8_abc123def456ghi789jkl012mno345pqr678stu901
REDIS_URL=redis://default:abc123xyz456@steady-koala-12345.upstash.io:6379
```

---

## ✅ Po dodaniu zmiennych

1. Sprawdź czy wszystkie 14 zmiennych są dodane
2. Kliknij **"Save"** w DigitalOcean
3. Kliknij **"Deploy"** → **"Force Rebuild and Deploy"**
4. Poczekaj 5-10 minut
5. Testuj aplikację! 🎉
