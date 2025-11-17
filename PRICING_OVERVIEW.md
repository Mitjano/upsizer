# Pricing Page - Overview

## ✅ Zaimplementowane Funkcje

### 1. **Plany Subskrypcyjne**

#### Free Plan - PLN 0/miesiąc
- 3 kredyty/miesiąc
- 3 downloady/miesiąc
- Basic upscaling (2x)
- Standard processing speed
- 10MB file size limit
- Email support

#### Starter - PLN 9.99/miesiąc (PLN 99.99/rok)
- 100 kredytów/miesiąc
- Unlimited downloads
- All upscaling options (2x, 4x, 8x)
- Face enhancement (GFPGAN)
- Priority processing
- 50MB file size limit
- Higher resolution (15000x15000)
- Email & chat support

#### Pro - PLN 29.99/miesiąc (PLN 299.99/rok) ⭐ Most Popular
- 500 kredytów/miesiąc
- Unlimited downloads
- All upscaling options
- Face enhancement
- Fastest processing
- 100MB file size limit
- Maximum resolution (20000x20000)
- Bulk processing
- API access
- Priority support
- Custom watermark removal

#### Enterprise - Custom Pricing
- Unlimited credits
- Unlimited downloads
- All features
- Dedicated account manager
- Custom integrations
- SLA guarantee
- On-premise deployment
- Training & onboarding
- 24/7 phone support

### 2. **One-Time Payment**

| Credits | Price | Price per Credit |
|---------|-------|------------------|
| 50      | PLN 29.12 | PLN 0.58 |
| 200     | PLN 91.07 | PLN 0.46 |
| 500     | PLN 200.39 | PLN 0.40 |
| 1000    | PLN 309.72 | PLN 0.31 |

**Uwaga:** Kredyty jednorazowe ważne przez 1 rok od zakupu

### 3. **Billing Toggle**
- Monthly vs Yearly
- **Save 70%** badge na yearly
- Automatyczne przeliczanie cen

### 4. **FAQ Section**
- What is a credit?
- Can I cancel anytime?
- Do unused credits roll over?
- What payment methods?
- Refund policy
- Upgrade/downgrade plans

### 5. **CTA Section**
- Contact Support
- Start Free Trial
- Email: support@upsizer.com

---

## 🎨 Design Features

✅ **Responsive Grid Layout**
- 4 columns na desktop
- Mobile-friendly

✅ **Visual Hierarchy**
- "Most Popular" badge na Pro plan
- Green glow effect
- Hover animations

✅ **Icons & Emojis**
- 💎 Credits
- 📥 Downloads
- ⚡ Lightning Fast
- 💳 One-time payment

✅ **Interactive Elements**
- Billing cycle toggle
- Expandable FAQ
- Hover effects na cards

---

## 🔗 Links

**Strona Pricing:** [http://localhost:3001/pricing](http://localhost:3001/pricing)

**CTA Buttons:**
- Free Plan → `/auth/signin`
- Starter → `/auth/signin`
- Pro → `/auth/signin`
- Enterprise → `mailto:sales@upsizer.com`

---

## 📝 Następne Kroki

### Integracja Stripe (TODO):

1. **Zainstaluj Stripe SDK:**
```bash
npm install stripe @stripe/stripe-js
```

2. **Utwórz produkty w Stripe Dashboard:**
   - Starter Plan (PLN 9.99/miesiąc)
   - Pro Plan (PLN 29.99/miesiąc)
   - One-time credits

3. **Dodaj Stripe API keys do `.env.local`:**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. **Utwórz Checkout Session:**
   - `/app/api/stripe/checkout/route.ts`
   - Redirect do Stripe Checkout
   - Success/cancel URLs

5. **Webhook Handler:**
   - `/app/api/stripe/webhook/route.ts`
   - Handle payment success
   - Update user credits w Firestore

### Credit System (TODO):

1. **Firestore Schema:**
```typescript
// users/{userId}
{
  email: string,
  name: string,
  credits: number,
  plan: "free" | "starter" | "pro" | "enterprise",
  subscriptionId: string,
  customerId: string,
  subscriptionStatus: string,
  createdAt: timestamp,
  updatedAt: timestamp
}

// transactions/{transactionId}
{
  userId: string,
  type: "purchase" | "usage" | "refund",
  credits: number,
  amount: number,
  description: string,
  createdAt: timestamp
}
```

2. **Middleware dla Credits:**
   - Check credits przed upscaling
   - Deduct credits po success
   - Alert gdy credits < 5

3. **Dashboard Integration:**
   - Display current plan
   - Show remaining credits
   - Upgrade button

---

## 🎯 Konwersja

**Strategie:**
1. **Free Trial** - 3 kredyty za darmo
2. **70% OFF** - na yearly plans
3. **Most Popular** - badge na Pro
4. **14-day money-back** - gwarancja
5. **No credit card** - na free plan

**Pricing Psychology:**
- Anchor: Enterprise (Custom) → Pro wygląda przystępnie
- Decoy: Starter → Pro ma lepszą wartość
- Scarcity: "Limited time - 70% off yearly"

---

## 📊 Metrics do Trackowania

1. **Conversion Rate:**
   - Free → Starter
   - Starter → Pro
   - Monthly → Yearly

2. **Revenue Metrics:**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - ARPU (Average Revenue Per User)

3. **User Behavior:**
   - Most viewed plan
   - CTA click-through rate
   - FAQ expansion rate

---

## 🚀 A/B Testing Ideas

1. **Pricing:**
   - PLN 9.99 vs PLN 12.99 dla Starter
   - Yearly discount: 70% vs 50%

2. **Copy:**
   - "Get Started" vs "Start Free Trial"
   - "Most Popular" vs "Best Value"

3. **Design:**
   - 3 plans vs 4 plans
   - Cards vs Table layout

---

**Strona Pricing jest gotowa!**
Możesz ją zobaczyć na: **http://localhost:3001/pricing**
