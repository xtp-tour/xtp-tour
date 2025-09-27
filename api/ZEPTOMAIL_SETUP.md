# ZeptoMail Email Notifications Setup Guide

This guide will help you set up email notifications using ZeptoMail for your XTP Tour API.

## 🚀 Quick Start

### 1. ZeptoMail Account Setup

Follow the steps from [ZeptoMail Getting Started Guide](https://www.zoho.com/zeptomail/help/getting-started.html):

1. **Sign up for ZeptoMail**
   - Visit [ZeptoMail](https://www.zoho.com/zeptomail/)
   - Click "Get started" and create your account
   - Verify your mobile number for 2FA

2. **Add and verify your domain**
   - Add your organization's domain (e.g., `yourdomain.com`)
   - Add the required DNS records (DKIM and CNAME) to your domain provider
   - Wait for domain verification (can take up to 48 hours)

3. **Get SMTP credentials**
   - Go to your Mail Agent → SMTP/API section
   - Note down your SMTP credentials:
     - Host: `smtp.zeptomail.com`
     - Port: `587`
     - Username: Your ZeptoMail username
     - Password: Your ZeptoMail password

4. **Complete Customer Validation**
   - Fill out the customer validation form
   - Wait 2 business days for approval
   - Until approved: 10,000 emails total, 100/day limit
   - After approval: 10,000 free emails valid for 6 months

### 2. Application Configuration

1. **Copy the example configuration**:
   ```bash
   cp config.example.env .env
   ```

2. **Update your environment variables**:
   ```bash
   # Enable email notifications
   EMAIL_ENABLED=true

   # ZeptoMail SMTP settings
   EMAIL_HOST=smtp.zeptomail.com
   EMAIL_PORT=587
   EMAIL_USERNAME=your-zeptomail-username
   EMAIL_PASSWORD=your-zeptomail-password
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Restart your application** to pick up the new configuration.

## 🧪 Testing Email Notifications

### Manual Testing

1. **Enable email for a user**:
   ```sql
   UPDATE users
   SET notification_settings = JSON_SET(
     notification_settings,
     '$.email', 'test@example.com',
     '$.channels', 1  -- Enable email channel (bit flag)
   )
   WHERE id = 'your-user-id';
   ```

2. **Send a test notification**:
   ```bash
   # Using your API endpoint
   curl -X POST http://localhost:8080/api/notifications \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "your-user-id",
       "topic": "Test Email",
       "message": "This is a test email from ZeptoMail!"
     }'
   ```

3. **Check the logs**:
   ```bash
   # Look for successful email sending
   tail -f your-app.log | grep "Email sent successfully via ZeptoMail"
   ```

### Monitoring

- **Check notification queue**: Monitor the `notification_queue` table for failed sends
- **Review logs**: Look for ZeptoMail-related errors
- **ZeptoMail dashboard**: Monitor your email sending stats

## 🔧 Configuration Options

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `EMAIL_ENABLED` | `false` | Enable/disable email notifications |
| `EMAIL_HOST` | `smtp.zeptomail.com` | ZeptoMail SMTP host |
| `EMAIL_PORT` | `587` | SMTP port (587 for TLS) |
| `EMAIL_USERNAME` | - | Your ZeptoMail username |
| `EMAIL_PASSWORD` | - | Your ZeptoMail password |
| `EMAIL_FROM` | - | From email address (must be from verified domain) |

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **Secrets Management**: Use proper secrets management in production
3. **Domain Verification**: Only use verified domains for sending
4. **Rate Limiting**: Monitor your sending limits

## 🐛 Troubleshooting

### Common Issues

1. **"Email configuration incomplete"**
   - Ensure all required environment variables are set
   - Check that `EMAIL_ENABLED=true`

2. **"Failed to send email via ZeptoMail"**
   - Verify SMTP credentials are correct
   - Check domain verification status
   - Ensure you haven't exceeded sending limits

3. **"No email address provided"**
   - User doesn't have email configured in notification settings
   - Check the `users.notification_settings` JSON field

### Debug Mode

Enable debug logging to see detailed email sending information:

```bash
LOG_LEVEL=debug
```

### ZeptoMail Limits

- **Free tier**: 10,000 emails total, 100/day until account approval
- **After approval**: 10,000 free emails valid for 6 months
- **Additional credits**: Purchase as needed (10,000 emails per credit)

## 📊 Production Deployment

### Docker Environment

```dockerfile
ENV EMAIL_ENABLED=true
ENV EMAIL_HOST=smtp.zeptomail.com
ENV EMAIL_PORT=587
ENV EMAIL_USERNAME=${ZEPTOMAIL_USERNAME}
ENV EMAIL_PASSWORD=${ZEPTOMAIL_PASSWORD}
ENV EMAIL_FROM=noreply@yourdomain.com
```

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: zeptomail-credentials
type: Opaque
stringData:
  username: your-zeptomail-username
  password: your-zeptomail-password
```

## 💡 Next Steps

1. **Email Templates**: Consider adding HTML email templates
2. **Monitoring**: Set up alerts for failed email deliveries
3. **Analytics**: Track email open/click rates if needed
4. **Scaling**: Monitor usage and purchase additional credits as needed

## 📚 Resources

- [ZeptoMail Documentation](https://www.zoho.com/zeptomail/help/)
- [nikoksr/notify Library](https://github.com/nikoksr/notify)
- [Domain Verification Guide](https://www.zoho.com/zeptomail/help/domain-verification.html)
