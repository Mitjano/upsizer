# Quick Start: Email Notifications

Email notifications są już zakodowane i wdrożone! Musisz tylko skonfigurować klucz API.

## ⚡ Szybki Start (5 minut)

### 1. Utwórz konto Resend
```bash
# Wejdź na: https://resend.com/signup
# Użyj email: michalchmielarz00@gmail.com
# Hasło: wybierz dowolne
```

### 2. Zweryfikuj email
- Sprawdź skrzynkę pocztową
- Kliknij link weryfikacyjny

### 3. Pobierz klucz API
```bash
# Po zalogowaniu:
# 1. Idź do: API Keys (lewe menu)
# 2. Kliknij: Create API Key
# 3. Name: "Pixelift Production"
# 4. Permission: "Sending access"
# 5. SKOPIUJ klucz (zaczyna się od "re_")
```

### 4. Dodaj klucz na serwer
```bash
# SSH do serwera
ssh root@138.68.79.23

# Dodaj klucz do .env
cd /root/upsizer
echo "RESEND_API_KEY=re_TWOJ_KLUCZ_TUTAJ" >> .env.local

# Restart aplikacji
pm2 restart pixelift-web

# Sprawdź czy działa
pm2 logs pixelift-web --lines 20
```

### 5. Testuj!
```bash
# 1. Idź na: https://pixelift.pl/support
# 2. Wypełnij formularz swoim mailem (michalchmielarz00@gmail.com)
# 3. Wyślij ticket
# 4. Sprawdź skrzynkę - powinieneś dostać email z powiadomieniem

# 5. Idź do: https://pixelift.pl/admin/tickets
# 6. Odpowiedz na ticket
# 7. Sprawdź skrzynkę znowu - powinieneś dostać email z odpowiedzią
```

## 📧 Co działa TERAZ (bez konfiguracji)

✅ Kod napisany i wdrożony
✅ System działa (gracefully degraduje bez klucza)
✅ Tickety są tworzone poprawnie
✅ Odpowiedzi zapisują się do bazy

❌ Emaile NIE wysyłają się (brak RESEND_API_KEY)

## 📧 Co zacznie działać PO dodaniu klucza

✅ Email do Ciebie gdy ktoś utworzy ticket
✅ Email do użytkownika gdy odpowiesz na ticket
✅ Profesjonalne HTML templates
✅ Link do panelu admin w emailu

## 🎯 Darmowy Plan Resend

- **10,000 emaili/miesiąc** (za darmo!)
- **100 emaili/dzień** (wystarczy dla Pixelift)
- Bez karty kredytowej
- Wystarczy na długo

**Szacunki:**
- 10 ticketów/dzień = ~300 emaili/miesiąc
- 50 ticketów/dzień = ~1,500 emaili/miesiąc
- Limit: 10,000/miesiąc

Masz mnóstwo miejsca!

## 🚀 Opcjonalnie: Własna Domena (później)

Domyślnie emaile wysyłają się z sandbox Resend.
Możesz później dodać domenę pixelift.pl:

```bash
# 1. W Resend Dashboard: Domains → Add Domain
# 2. Dodaj: pixelift.pl
# 3. Dodaj DNS records (Resend pokaże jakie)
# 4. Poczekaj ~10 minut na weryfikację
# 5. Gotowe - emaile będą z support@pixelift.pl
```

Ale to NIE jest wymagane do testowania!

## ❓ Troubleshooting

**Nie widzisz emaili?**
```bash
# Sprawdź logi
ssh root@138.68.79.23
pm2 logs pixelift-web --lines 50 | grep -i email

# Powinno być:
# "RESEND_API_KEY not configured - skipping email" (jeśli brak klucza)
# "Ticket created email sent for ticket XXX" (jeśli klucz działa)
```

**Emaile w spam?**
- Normalnie w free tier Resend
- Po dodaniu domeny pixelift.pl - trafi do inbox

**Potrzebujesz pomocy?**
Zobacz pełną dokumentację: `EMAIL_SETUP.md`

## 📝 Podsumowanie

1. Zarejestruj się: resend.com/signup (2 min)
2. Pobierz klucz API (1 min)
3. Dodaj na serwer: `echo "RESEND_API_KEY=re_xxx" >> /root/upsizer/.env.local` (1 min)
4. Restart: `pm2 restart pixelift-web` (10 sek)
5. Testuj: wyślij ticket na pixelift.pl/support

**Gotowe! 🎉**
