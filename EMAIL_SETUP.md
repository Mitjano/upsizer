# Email Notifications Setup

Email notifications are now configured for support tickets using Resend.

## Features

✅ **Admin notifications**: Get email when new ticket is created
✅ **User notifications**: Users receive email when you reply to their ticket
✅ **Non-blocking**: Emails sent asynchronously, won't slow down API
✅ **Graceful degradation**: System works even if email fails

## Setup Steps

### 1. Create Resend Account (Free)

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier = 10,000 emails/month, 100 emails/day)
3. Verify your email address

### 2. Add Your Domain (Recommended)

**Option A: Use pixelift.pl domain**
1. In Resend dashboard → Domains → Add Domain
2. Add `pixelift.pl`
3. Add these DNS records to your domain:

```
Type: TXT
Name: @
Value: [Resend will provide]

Type: MX
Name: @
Value: feedback-smtp.eu-west-1.amazonses.com
Priority: 10
```

4. Wait for verification (5-10 minutes)

**Option B: Use Resend sandbox (testing only)**
- Can only send to your verified email
- Good for testing
- Limited to 100 emails/day

### 3. Get API Key

1. In Resend dashboard → API Keys
2. Click "Create API Key"
3. Name: `Pixelift Production`
4. Permission: `Sending access`
5. Copy the key (starts with `re_`)

### 4. Configure Environment

**Local (.env.local):**
```bash
RESEND_API_KEY=re_your_actual_key_here
```

**Production (server):**
```bash
ssh root@138.68.79.23
cd /root/upsizer
echo "RESEND_API_KEY=re_your_actual_key_here" >> .env.local
pm2 restart pixelift-web
```

### 5. Test It!

1. Go to pixelift.pl/support
2. Fill out the form with **your email**
3. Submit ticket
4. Check your inbox - you should receive notification
5. Go to admin panel, reply to ticket
6. Check inbox again - user should receive reply

## Email Templates

### New Ticket (to admin)
- **From**: Pixelift Support <support@pixelift.pl>
- **To**: support@pixelift.pl
- **Subject**: New Support Ticket: [subject]
- **Contains**: Ticket details + link to admin panel

### Reply (to user)
- **From**: Pixelift Support <support@pixelift.pl>
- **To**: [user email from ticket]
- **Reply-To**: support@pixelift.pl
- **Subject**: Re: [subject] [Ticket #ID]
- **Contains**: Your reply message

## Customization

Edit templates in `lib/email.ts`:

```typescript
// Change "from" address (must match your verified domain)
from: 'Pixelift Support <support@pixelift.pl>',

// Change admin notification email
to: ['your-admin@pixelift.pl'],

// Customize HTML template
html: `... your HTML here ...`
```

## Troubleshooting

### Emails not sending

1. **Check API key is set**:
```bash
echo $RESEND_API_KEY  # Should show re_xxx
```

2. **Check logs**:
```bash
pm2 logs pixelift-web --lines 50 | grep -i email
```

3. **Verify domain** (if using custom domain):
   - Go to Resend dashboard
   - Check domain status is "Verified"

4. **Check spam folder**

### Rate limits

Free tier limits:
- 10,000 emails/month
- 100 emails/day
- 1 email/second

If exceeded, emails will queue or fail gracefully.

## Cost

**Free tier**: 10,000 emails/month
**Pay as you go**: $1 per 1,000 emails after free tier

For reference:
- 10 support tickets/day = 300 emails/month (well within free tier)
- 100 support tickets/day = 3,000 emails/month (still free)

## Monitoring

Check email delivery status in Resend dashboard:
- Logs → see all sent emails
- Click email → see delivery status, opens, clicks
- Webhooks available for advanced tracking

## Next Steps

After setting up basic emails, you can:
- Add email templates for ticket status changes (resolved, closed)
- Send digest emails to admins (daily summary)
- Add email notifications for other admin actions
- Customize email styling/branding
