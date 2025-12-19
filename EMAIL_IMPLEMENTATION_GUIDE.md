# Email Automation - Implementation Guide

Przewodnik wdrożenia systemu automatycznych emaili dla Pixelift.

## Status Implementacji

✅ **Gotowe:**
- Email templates (5 szablonów w `lib/email.ts`)
- Resend integration
- Support ticket emails (działa)
- Strategia i dokumentacja

⏳ **Do zrobienia:**
- Dodanie triggerów w kodzie
- Tracking wysłanych emaili (zapobieganie duplikatom)
- System płatności (wymagany dla purchase emails)
- Cron jobs dla re-engagement emails

## Szybki Start - Priorytetowe Emaile

### 1. Welcome Email (NAJWYŻSZY PRIORYTET)

**Kiedy:** Po pierwszym zalogowaniu przez Google OAuth

**Gdzie dodać:** `/lib/auth.ts`

**Kod do dodania:**

```typescript
// lib/auth.ts
import { sendWelcomeEmail } from './email';
import { getUserByEmail } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ... existing config
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if this is a new user (first time sign in)
      const existingUser = getUserByEmail(user.email || '');

      if (!existingUser && user.email && user.name) {
        // This is a new user - send welcome email (non-blocking)
        sendWelcomeEmail({
          userName: user.name,
          userEmail: user.email,
          freeCredits: 3, // Default free credits
        }).catch(err => console.error('Welcome email failed:', err));
      }

      return true;
    },
    async session({ session, token }) {
      // ... existing code
    },
    async jwt({ token, user }) {
      // ... existing code
    },
  },
});
```

**Test:**
1. Wyloguj się z Pixelift
2. Zaloguj ponownie przez Google OAuth
3. Sprawdź email - powinieneś dostać welcome email

---

### 2. Credits Low Warning

**Kiedy:** Credits spadną poniżej 3

**Gdzie dodać:** `/app/api/upscale/route.ts`

**Kod do dodania:**

```typescript
// app/api/upscale/route.ts
import { sendCreditsLowEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  // ... existing code

  // After deducting credits (around line 60):
  const updatedUser = updateUser(user.id, {
    credits: user.credits - creditsNeeded,
    totalUsage: user.totalUsage + creditsNeeded,
  });

  // NEW: Check if credits are running low
  const newCredits = updatedUser.credits;
  const oldCredits = user.credits;

  // Only send email once when crossing the threshold
  if (oldCredits >= 3 && newCredits < 3 && newCredits > 0) {
    sendCreditsLowEmail({
      userName: user.name || 'User',
      userEmail: user.email,
      creditsRemaining: newCredits,
      totalUsed: updatedUser.totalUsage,
    }).catch(err => console.error('Credits low email failed:', err));
  }

  // ... rest of the code
}
```

**Test:**
1. Ustaw swoje credits na 4 w `data/users.json`
2. Przetwórz 2 obrazy (zostanie Ci 2 credits)
3. Sprawdź email - powinieneś dostać warning

---

### 3. Credits Depleted

**Kiedy:** Credits = 0 (podczas próby przetworzenia)

**Gdzie dodać:** `/app/api/upscale/route.ts`

**Kod do dodania:**

```typescript
// app/api/upscale/route.ts
import { sendCreditsDepletedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  // ... existing code

  // Check if user has enough credits (around line 42)
  if (user.credits < creditsNeeded) {
    // NEW: Send depleted email when user tries to process with 0 credits
    if (user.credits === 0) {
      sendCreditsDepletedEmail({
        userName: user.name || 'User',
        userEmail: user.email,
        totalImagesProcessed: user.totalUsage,
      }).catch(err => console.error('Credits depleted email failed:', err));
    }

    return NextResponse.json(
      {
        error: "Insufficient credits",
        required: creditsNeeded,
        available: user.credits
      },
      { status: 402 }
    );
  }

  // ... rest of code
}
```

**Test:**
1. Ustaw swoje credits na 0 w `data/users.json`
2. Spróbuj przetworzyć obraz
3. Sprawdź email - powinieneś dostać "out of credits" email

---

### 4. First Upload Success

**Kiedy:** Po pierwszym przetworzeniu obrazu

**Gdzie dodać:** `/app/api/upscale/route.ts`

**Potrzebne:** Dodaj pole `firstUploadAt` do User interface

**Krok 1 - Update User interface:**

```typescript
// lib/db.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'user' | 'premium' | 'admin';
  status: 'active' | 'banned' | 'suspended';
  credits: number;
  totalUsage: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  firstUploadAt?: string; // NEW: Track first upload
}
```

**Krok 2 - Dodaj kod w upscale route:**

```typescript
// app/api/upscale/route.ts
import { sendFirstUploadEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  // ... existing code

  // After successful upscale (before return statement around line 100):

  // NEW: Check if this is first upload
  const isFirstUpload = !user.firstUploadAt;

  if (isFirstUpload) {
    // Update user with firstUploadAt timestamp
    updateUser(user.id, {
      firstUploadAt: new Date().toISOString(),
    });

    // Send first upload email (non-blocking)
    sendFirstUploadEmail({
      userName: user.name || 'User',
      userEmail: user.email,
      creditsRemaining: updatedUser.credits,
    }).catch(err => console.error('First upload email failed:', err));
  }

  return NextResponse.json({
    // ... existing response
  });
}
```

**Test:**
1. Usuń pole `firstUploadAt` ze swojego usera w `data/users.json`
2. Przetwórz obraz
3. Sprawdź email - powinieneś dostać congratulations email

---

### 5. Purchase Confirmation

**Status:** ⏸️ WYMAGA PAYMENT INTEGRATION

Ten email będzie działał dopiero po dodaniu systemu płatności (Stripe/PayPal).

**Gdzie dodać (w przyszłości):** `/app/api/payment/webhook/route.ts`

**Przykładowy kod:**

```typescript
// app/api/payment/webhook/route.ts (TO BE CREATED)
import { sendPurchaseConfirmationEmail } from '@/lib/email';
import { getUserByEmail, updateUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  // Verify webhook signature (Stripe/PayPal specific)
  const event = await verifyWebhook(request);

  if (event.type === 'payment.succeeded') {
    const { userEmail, planName, creditsAdded, amountPaid, transactionId } = event.data;

    // Add credits to user
    const user = getUserByEmail(userEmail);
    updateUser(user.id, {
      credits: user.credits + creditsAdded,
    });

    // Send confirmation email
    sendPurchaseConfirmationEmail({
      userName: user.name || 'User',
      userEmail: user.email,
      planName,
      creditsAdded,
      amountPaid,
      currency: 'USD',
      transactionId,
      nextBillingDate: event.data.nextBillingDate, // Only for subscriptions
    }).catch(err => console.error('Purchase email failed:', err));

    return NextResponse.json({ success: true });
  }
}
```

---

## Email Tracking System (Zapobieganie Duplikatom)

### Problem:
Bez tracking systemu, emails mogą być wysyłane wielokrotnie.

### Rozwiązanie:
Stwórz prosty system logowania emaili.

**Krok 1 - Dodaj tracking file:**

```bash
# W terminalu na serwerze
echo "[]" > /root/pixelift/data/email_logs.json
```

**Krok 2 - Dodaj interface w `lib/db.ts`:**

```typescript
// lib/db.ts
export interface EmailLog {
  id: string;
  userId: string;
  userEmail: string;
  emailType: 'welcome' | 'credits_low' | 'credits_depleted' | 'first_upload' | 'purchase_confirmation';
  sentAt: string;
  status: 'sent' | 'failed';
}

const EMAIL_LOGS_FILE = path.join(DATA_DIR, 'email_logs.json');

export function logEmail(log: Omit<EmailLog, 'id'>): EmailLog {
  const logs = readJSON<EmailLog[]>(EMAIL_LOGS_FILE, []);
  const newLog: EmailLog = {
    id: nanoid(),
    ...log,
  };
  logs.push(newLog);
  writeJSON(EMAIL_LOGS_FILE, logs);
  return newLog;
}

export function getEmailLogs(userId: string): EmailLog[] {
  const logs = readJSON<EmailLog[]>(EMAIL_LOGS_FILE, []);
  return logs.filter(log => log.userId === userId);
}

export function shouldSendEmail(userId: string, emailType: EmailLog['emailType']): boolean {
  const logs = getEmailLogs(userId);
  const now = new Date();

  // Rules for each email type
  switch (emailType) {
    case 'welcome':
    case 'first_upload':
      // Only once ever
      return !logs.some(log => log.emailType === emailType && log.status === 'sent');

    case 'credits_low':
      // Max once per day
      const lastLowEmail = logs
        .filter(log => log.emailType === 'credits_low' && log.status === 'sent')
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

      if (!lastLowEmail) return true;

      const daysSince = (now.getTime() - new Date(lastLowEmail.sentAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= 1;

    case 'credits_depleted':
      // Max once per week
      const lastDepletedEmail = logs
        .filter(log => log.emailType === 'credits_depleted' && log.status === 'sent')
        .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

      if (!lastDepletedEmail) return true;

      const weeksSince = (now.getTime() - new Date(lastDepletedEmail.sentAt).getTime()) / (1000 * 60 * 60 * 24 * 7);
      return weeksSince >= 1;

    case 'purchase_confirmation':
      // Always send (receipts should always be sent)
      return true;

    default:
      return true;
  }
}
```

**Krok 3 - Użyj w email functions:**

```typescript
// Przykład użycia w sendCreditsLowEmail
export async function sendCreditsLowEmail(data: CreditsLowEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  // NEW: Check if email should be sent
  const user = getUserByEmail(data.userEmail);
  if (!user || !shouldSendEmail(user.id, 'credits_low')) {
    console.log(`Skipping credits_low email to ${data.userEmail} - already sent recently`);
    return false;
  }

  try {
    await resend.emails.send({
      // ... email config
    });

    // NEW: Log successful send
    logEmail({
      userId: user.id,
      userEmail: data.userEmail,
      emailType: 'credits_low',
      sentAt: new Date().toISOString(),
      status: 'sent',
    });

    console.log(`Credits low email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    // NEW: Log failed send
    logEmail({
      userId: user.id,
      userEmail: data.userEmail,
      emailType: 'credits_low',
      sentAt: new Date().toISOString(),
      status: 'failed',
    });

    console.error('Failed to send credits low email:', error);
    return false;
  }
}
```

---

## Deployment Checklist

### Przed wdrożeniem:

- [ ] Masz konto Resend (resend.com)
- [ ] Masz RESEND_API_KEY w `.env.local`
- [ ] Zweryfikuj domenę `pixelift.pl` w Resend (opcjonalne, ale zalecane)
- [ ] Przetestuj lokalnie każdy email

### Wdrożenie:

```bash
# 1. Dodaj zmiany do git
git add .
git commit -m "Add email automation system"

# 2. Push do repo
git push origin master

# 3. SSH do serwera
ssh root@138.68.79.23

# 4. Pull latest changes
cd /root/pixelift
git pull origin master

# 5. Install dependencies (if needed)
npm install

# 6. Stwórz email_logs.json
echo "[]" > data/email_logs.json

# 7. Rebuild app
npm run build

# 8. Restart PM2
pm2 restart pixelift-web

# 9. Sprawdź logi
pm2 logs pixelift-web --lines 30
```

### Po wdrożeniu - Testy:

**Test 1 - Welcome Email:**
```bash
# 1. Wyloguj się z aplikacji
# 2. Zaloguj ponownie przez Google OAuth
# 3. Sprawdź email (może trafić do spam przy pierwszym razie)
```

**Test 2 - Credits Low:**
```bash
# 1. SSH do serwera
ssh root@138.68.79.23

# 2. Edytuj swój user - ustaw credits na 4
cd /root/pixelift
nano data/users.json
# Znajdź swój email i zmień "credits": X na "credits": 4

# 3. Przetwórz 2 obrazy na pixelift.pl/dashboard
# 4. Sprawdź email
```

**Test 3 - Credits Depleted:**
```bash
# 1. Ustaw credits na 0 w data/users.json
# 2. Spróbuj przetworzyć obraz
# 3. Sprawdź email
```

**Test 4 - First Upload:**
```bash
# 1. W data/users.json usuń pole "firstUploadAt" ze swojego usera
# 2. Przetwórz obraz
# 3. Sprawdź email
```

---

## Monitoring i Analityka

### Sprawdzenie wysłanych emaili:

```bash
# SSH do serwera
ssh root@138.68.79.23

# Zobacz logi emaili
cat /root/pixelift/data/email_logs.json | jq '.'

# Policz wysłane emaile po typie
cat /root/pixelift/data/email_logs.json | jq '[.[] | .emailType] | group_by(.) | map({type: .[0], count: length})'

# Zobacz ostatnie 10 emaili
cat /root/pixelift/data/email_logs.json | jq 'sort_by(.sentAt) | reverse | .[0:10]'
```

### Resend Dashboard:

1. Zaloguj się na [resend.com](https://resend.com)
2. Idź do **Logs** - zobacz wszystkie wysłane emaile
3. Kliknij na email aby zobaczyć:
   - Delivery status
   - Open rate (jeśli włączone)
   - Click rate (jeśli włączone)

### Metryki do śledzenia:

- **Delivery rate**: ~99% (powinno być bardzo wysokie)
- **Open rate**: 20-30% (typowe dla transactional emails)
- **Click-through rate**: 3-5% (clicks na CTA buttony)
- **Unsubscribe rate**: <0.5% (bardzo niski dla transactional)

---

## Troubleshooting

### Email nie przychodzi

**Sprawdź RESEND_API_KEY:**
```bash
ssh root@138.68.79.23
cat /root/pixelift/.env.local | grep RESEND
```

**Sprawdź logi PM2:**
```bash
pm2 logs pixelift-web --lines 50 | grep -i email
```

**Sprawdź email_logs.json:**
```bash
cat /root/pixelift/data/email_logs.json | jq '.[] | select(.status == "failed")'
```

### Email trafia do spam

To normalne przy sandbox Resend. Rozwiązania:

1. **Zweryfikuj domenę** pixelift.pl w Resend
2. Dodaj **SPF, DKIM, DMARC** records (Resend pokaże jakie)
3. Poczekaj 24-48h na propagację DNS

### Rate limiting (100 emails/day exceeded)

Free tier Resend = 100 emails/dzień.

Jeśli przekroczysz:
```bash
# Sprawdź ile emaili wysłano dzisiaj
cat /root/pixelift/data/email_logs.json | jq '[.[] | select(.sentAt | startswith("2025-11-23"))] | length'

# Rozwiązanie: Upgrade Resend plan lub poczekaj do następnego dnia
```

### Błąd "Invalid email address"

```typescript
// Dodaj walidację przed wysłaniem
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(userEmail)) {
  console.error('Invalid email:', userEmail);
  return false;
}
```

---

## Następne Kroki (Opcjonalne)

### 1. Re-engagement Emails (Inactive Users)

Wymaga cron job lub scheduled task.

**Opcja A - Vercel Cron (jeśli deploy na Vercel):**

```typescript
// app/api/cron/re-engagement/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = getAllUsers();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const user of users) {
    const lastLogin = new Date(user.lastLoginAt || user.createdAt);

    if (lastLogin < sevenDaysAgo && !shouldSendEmail(user.id, 're_engagement_7d')) {
      // Send 7-day inactive email
      // TODO: Create sendReEngagement7DayEmail() in lib/email.ts
    }
  }

  return NextResponse.json({ success: true });
}
```

**Opcja B - External Cron (EasyCron, cron-job.org):**

Ustaw cron job który wywołuje GET `/api/cron/re-engagement` raz dziennie.

### 2. Monthly Usage Reports

Podobnie jak re-engagement, wymaga cron job.

```typescript
// app/api/cron/monthly-reports/route.ts
// Run on 1st day of each month
// Send usage summary to all paid users
```

### 3. Email Preferences w Dashboard

Pozwól userom wyłączyć marketing emails:

```typescript
// app/dashboard/settings/page.tsx
// Add email preferences section
// Update User interface with emailPreferences field
```

---

## Szybkie Komendy

```bash
# Deploy całego email systemu
git add . && git commit -m "Add email automation" && git push && ssh root@138.68.79.23 "cd /root/pixelift && git pull && npm run build && pm2 restart pixelift-web"

# Sprawdź logi emaili
ssh root@138.68.79.23 "pm2 logs pixelift-web --lines 50 | grep -i email"

# Wyczyść email logs (fresh start)
ssh root@138.68.79.23 "echo '[]' > /root/pixelift/data/email_logs.json"

# Test welcome email lokalnie
npm run dev
# Zaloguj się przez Google OAuth

# Zobacz statystyki emaili
ssh root@138.68.79.23 "cat /root/pixelift/data/email_logs.json | jq 'group_by(.emailType) | map({type: .[0].emailType, count: length, sent: map(select(.status == \"sent\")) | length})'"
```

---

## FAQ

**Q: Czy muszę zweryfikować domenę pixelift.pl?**
A: Nie, ale zalecane. Bez weryfikacji emaile mogą trafiać do spam.

**Q: Ile kosztuje Resend?**
A: Free tier = 10,000 emails/miesiąc. Potem $1 za 1,000 emaili.

**Q: Czy mogę przetestować lokalnie?**
A: Tak! Ustaw RESEND_API_KEY w `.env.local` i uruchom `npm run dev`.

**Q: Co jeśli user nie chce dostawać emaili?**
A: Dodaj email preferences w dashboardzie (TODO in future).

**Q: Jak wysłać test email?**
A: Użyj tego kodu w konsoli Node:

```javascript
import { sendWelcomeEmail } from './lib/email';
await sendWelcomeEmail({
  userName: 'Test User',
  userEmail: 'your@email.com',
  freeCredits: 3,
});
```

---

**Dokument:** Email Implementation Guide v1.0
**Data:** 2025-11-23
**Autor:** Claude Code
**Status:** Ready for Implementation
