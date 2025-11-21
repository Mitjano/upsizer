# 🚀 Pixelift - Deploy na DigitalOcean App Platform

## Dlaczego DigitalOcean?

✅ **Background worker działa out-of-the-box** (w przeciwieństwie do Vercel)
✅ Prosty deploy z GitHuba
✅ Automatyczne CI/CD
✅ Przewidywalne koszty

---

## 📋 Wymagania Wstępne

1. Konto DigitalOcean (jeśli nie masz: https://cloud.digitalocean.com/registrations/new)
2. Konto Upstash Redis (darmowe: https://console.upstash.com/login)
3. Replicate API Token (https://replicate.com/account/api-tokens)
4. Firebase projekt z Storage

---

## 🚀 Deploy w 3 krokach

### Krok 1: Setup Redis (Upstash)

1. Idź na: https://console.upstash.com/login
2. Kliknij **"Create Database"**
3. Wybierz **Frankfurt (eu-central-1)** - najbliżej DigitalOcean Frankfurt
4. Kliknij **"Create"**
5. Skopiuj **"REDIS_URL"** z zakładki Details:
   ```
   redis://default:abc123...@steady-koala-12345.upstash.io:6379
   ```

### Krok 2: Deploy na DigitalOcean

#### Opcja A: Deploy przez przeglądarkę (Rekomendowane)

1. Idź na: https://cloud.digitalocean.com/apps/new
2. Wybierz **"GitHub"** jako źródło
3. Autoryzuj DigitalOcean do dostępu do repozytorium
4. Wybierz repository: **Mitjano/upsizer**
5. Wybierz branch: **main**
6. Kliknij **"Next"**

DigitalOcean automatycznie wykryje:
- 📦 Next.js app
- 🔧 `package.json` i build command

7. Edytuj **Build & Run Settings**:
   - Build Command: `npm install && npm run build`
   - Run Command: `npm start`
   - HTTP Port: `3000`

8. Kliknij **"Next"** → **"Environment Variables"**

#### Opcja B: Deploy przez CLI (Szybsze dla ekspertów)

```bash
# Zainstaluj DigitalOcean CLI
brew install doctl  # macOS
# lub
snap install doctl  # Linux

# Autoryzuj
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

### Krok 3: Skonfiguruj zmienne środowiskowe

W DigitalOcean App Platform Dashboard:

**Settings → App-Level Environment Variables**

Dodaj wszystkie zmienne z listy poniżej ⬇️

---

## 🔐 Zmienne Środowiskowe - Lista

### Firebase Client SDK (wszystkie NEXT_PUBLIC_*)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pixelift-ed3df.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pixelift-ed3df
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pixelift-ed3df.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Gdzie znaleźć:** Firebase Console → Project Settings → General

---

### Firebase Admin SDK (SECRET!)

```bash
FIREBASE_ADMIN_PROJECT_ID=pixelift-ed3df
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbavc@pixelift-ed3df.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

**Gdzie znaleźć:**
1. Firebase Console → Project Settings → Service Accounts
2. Kliknij **"Generate New Private Key"**
3. Pobierz JSON file
4. Skopiuj wartości:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

⚠️ **WAŻNE:** W DigitalOcean dodaj `FIREBASE_ADMIN_PRIVATE_KEY` jako **SECRET** (nie PLAIN TEXT)

---

### NextAuth

```bash
NEXTAUTH_SECRET=wygeneruj_komenda_ponizej
NEXTAUTH_URL=https://twoja-aplikacja.ondigitalocean.app
```

**Wygeneruj NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**NEXTAUTH_URL:** Skopiuj URL swojej aplikacji po deployu (np. `https://pixelift-abc123.ondigitalocean.app`)

---

### Replicate API

```bash
REPLICATE_API_TOKEN=r8_abc123...
```

**Gdzie znaleźć:** https://replicate.com/account/api-tokens

---

### Redis (Upstash)

```bash
REDIS_URL=redis://default:abc123...@steady-koala-12345.upstash.io:6379
```

Skopiuj z Upstash Console (Krok 1 powyżej).

---

### Webhook (Opcjonalne)

```bash
WEBHOOK_SECRET=dowolny_sekretny_string_123
```

---

## 🔄 Deploy Worker (Background Processing)

DigitalOcean App Platform pozwala dodać **drugi serwis** w tej samej aplikacji!

### Dodaj Worker do App:

1. W DigitalOcean Dashboard → Twoja App → **Settings**
2. Scroll do **"Components"**
3. Kliknij **"+ Add Component"** → **"Worker"**
4. Konfiguracja:
   - **Name:** `worker`
   - **Source:** Ten sam repo (Mitjano/upsizer)
   - **Branch:** main
   - **Build Command:** `npm install && npm run build`
   - **Run Command:** `npm run worker:prod`
   - **Instance Size:** Basic (512 MB RAM)

5. Dodaj zmienne środowiskowe dla workera:
   - `REDIS_URL`
   - `REPLICATE_API_TOKEN`
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`

6. Kliknij **"Save"** → **"Deploy"**

---

## ✅ Weryfikacja Deploy

### 1. Sprawdź czy aplikacja działa

```bash
curl https://twoja-aplikacja.ondigitalocean.app
```

Powinno zwrócić stronę główną.

### 2. Sprawdź API Health

```bash
curl https://twoja-aplikacja.ondigitalocean.app/api/health
```

Oczekiwany wynik:
```json
{"status":"ok"}
```

### 3. Sprawdź czy worker działa

W DigitalOcean Dashboard → Twoja App → **Runtime Logs** → Wybierz **"worker"**

Powinieneś zobaczyć:
```
🚀 Starting Pixelift Image Processing Worker...
✅ Worker started successfully!
💡 Processing jobs from queue...
```

### 4. Test Background Remover

1. Zaloguj się do aplikacji
2. Przejdź do `/dashboard/background-remover`
3. Prześlij zdjęcie
4. Poczekaj 10-30 sekund
5. Sprawdź czy zdjęcie pojawia się w wynikach

---

## 🐛 Troubleshooting

### Problem: "Application is not starting"

**Sprawdź logi:**
1. DigitalOcean Dashboard → Twoja App → **Runtime Logs**
2. Szukaj błędów (czerwone linie)

**Typowe przyczyny:**
- ❌ Brak zmiennych środowiskowych (sprawdź Settings → Env Variables)
- ❌ Błędny REDIS_URL (sprawdź w Upstash)
- ❌ Brak NEXTAUTH_SECRET

**Fix:**
- Dodaj brakujące zmienne
- Kliknij **"Deploy"** → **"Force Rebuild and Deploy"**

---

### Problem: "Redis connection timeout"

**Fix:**
1. Sprawdź czy Redis URL jest poprawny w Upstash Console
2. Skopiuj nowy URL (zakładka "Details")
3. Zaktualizuj w DigitalOcean App Settings
4. Redeploy

---

### Problem: "Firebase Admin permission denied"

**Fix:**
1. Sprawdź czy `FIREBASE_ADMIN_PRIVATE_KEY` jest dodany jako **SECRET** (nie PLAIN TEXT)
2. Sprawdź czy ma zachowane znaki nowej linii `\n`
3. Skopiuj całą zawartość z pobranego JSON (włącznie z `-----BEGIN PRIVATE KEY-----`)

---

### Problem: "Jobs stuck in pending"

**Przyczyna:** Worker nie działa.

**Fix:**
1. Sprawdź czy worker component jest dodany (Settings → Components)
2. Sprawdź logi workera (Runtime Logs → worker)
3. Sprawdź czy worker ma zmienne środowiskowe: `REDIS_URL`, `REPLICATE_API_TOKEN`

---

### Problem: "Storage upload fails"

**Fix:**
1. Sprawdź czy `storage.rules` są wdrożone w Firebase Console
2. Sprawdź czy użytkownik jest zalogowany (`useSession()`)
3. Sprawdź logs w przeglądarce (DevTools → Console)

---

## 📊 Monitorowanie

### Logi aplikacji

DigitalOcean Dashboard → Twoja App → **Runtime Logs**

Przełączaj między:
- **web** - Next.js app logs
- **worker** - Background job logs

### Metryki

DigitalOcean Dashboard → Twoja App → **Insights**

Monitoruj:
- CPU usage
- Memory usage
- Response times
- Error rates

### Redis Queue (Upstash)

Upstash Console → Twoja baza → **Data Browser**

Sprawdź:
- `bull:image-processing:*` - zadania w kolejce
- `ratelimit:*` - limity requestów

---

## 💰 Koszty

### DigitalOcean App Platform

| Komponent | Instance Size | Koszt |
|-----------|---------------|-------|
| Web (Next.js) | Basic ($5/mo) | $5/mo |
| Worker | Basic ($5/mo) | $5/mo |
| **Razem DigitalOcean** | | **$10/mo** |

### Inne serwisy

| Serwis | Koszt |
|--------|-------|
| Upstash Redis (Free Tier) | $0 |
| Replicate API (10k requests) | ~$50/mo |
| Firebase Storage (10GB) | ~$2/mo |
| **TOTAL** | **~$62/mo** |

---

## 🎯 Custom Domain

### Dodaj domenę (np. pixelift.pl)

1. DigitalOcean Dashboard → Twoja App → **Settings** → **Domains**
2. Kliknij **"Add Domain"**
3. Wpisz domenę: `pixelift.pl`
4. Dodaj DNS rekordy u swojego rejestratora:

```
Type: CNAME
Name: @
Value: twoja-aplikacja.ondigitalocean.app
TTL: 3600
```

5. Zaktualizuj `NEXTAUTH_URL`:
```bash
NEXTAUTH_URL=https://pixelift.pl
```

6. Redeploy aplikacji

---

## 🔒 Security Best Practices

✅ Wszystkie sekrety (API keys, private keys) dodaj jako **SECRET** w DigitalOcean
✅ Użyj silnego `NEXTAUTH_SECRET` (32+ znaków)
✅ Włącz HTTPS (automatyczne w DigitalOcean)
✅ Skonfiguruj Firebase Security Rules
✅ Włącz rate limiting (już jest w kodzie)
✅ Regularnie sprawdzaj logi pod kątem błędów

---

## 📞 Support

- **DigitalOcean Docs:** https://docs.digitalocean.com/products/app-platform/
- **Upstash Docs:** https://docs.upstash.com/redis
- **Firebase Docs:** https://firebase.google.com/docs/storage

---

## 🎉 Gotowy do deploymentu?

1. ✅ Setup Upstash Redis
2. ✅ Zgromadź wszystkie zmienne środowiskowe
3. ✅ Deploy przez DigitalOcean Console
4. ✅ Dodaj worker component
5. ✅ Przetestuj Background Remover

**Start:** https://cloud.digitalocean.com/apps/new

**Deploy trwa ~5-10 minut. Możesz iść po kawę! ☕️**
