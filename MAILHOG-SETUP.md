# Mailhog Email Testing Setup

## Overview

Mailhog is an email testing tool that captures all outgoing emails sent from the GrowManager backend during development. This allows you to test email functionality without sending real emails to users.

## What is Mailhog?

Mailhog is a simple SMTP server that:
- Captures all emails sent by the application
- Provides a web UI to view captured emails
- Does NOT send emails to real email addresses
- Perfect for development and testing

## Configuration

### Docker Compose

The `docker-compose.yml` file includes a Mailhog service:

```yaml
mailhog:
  image: mailhog/mailhog:latest
  container_name: growmanager-mailhog
  ports:
    - "${MAILHOG_SMTP_PORT:-1025}:1025"  # SMTP port
    - "${MAILHOG_WEB_PORT:-8025}:8025"    # Web UI port
  networks:
    - growmanager-network
```

### Environment Variables

The `.env` file contains Mailhog configuration:

```bash
# Mailhog Configuration
MAILHOG_SMTP_PORT=1025
MAILHOG_WEB_PORT=8025
MAIL_HOST=localhost
MAIL_PORT=1025
```

### Backend Configuration

The backend `application.yml` is configured to use Mailhog in the `dev` profile:

```yaml
spring:
  mail:
    host: ${MAIL_HOST:localhost}
    port: ${MAIL_PORT:1025}
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: false
          starttls:
            enable: false
```

## Usage

### Starting Mailhog

1. **Start Mailhog with docker-compose:**
   ```bash
   docker compose up -d mailhog
   ```

2. **Start all services including Mailhog:**
   ```bash
   docker compose up -d
   ```

### Accessing the Web UI

Once Mailhog is running, you can access the web interface at:

**http://localhost:8025**

The web UI shows:
- All captured emails
- Email subject, sender, and recipients
- Full email content (HTML and plain text)
- Email headers and metadata

### Testing Email Functionality

1. **Start the GrowManager backend** (it will connect to Mailhog on port 1025)
2. **Trigger email actions** in the application:
   - Register a new user account
   - Request password reset
   - Resend verification email
3. **View emails in Mailhog UI** at http://localhost:8025

### Example Email Flows to Test

#### Registration & Email Verification
1. Register a new user via the frontend at http://localhost:5173/register
2. Check Mailhog UI at http://localhost:8025
3. You should see a "Verify Your GrowManager Account" email
4. Click the verification link in the email (it will open the frontend)
5. User should be verified and able to log in

#### Password Reset
1. Click "Forgot password?" on the login page
2. Enter your email address
3. Check Mailhog UI for "Reset Your GrowManager Password" email
4. Click the reset link in the email
5. Set a new password

#### Resend Verification Email
1. Try to log in with an unverified account
2. Click "Resend verification email"
3. Check Mailhog UI for the new verification email

## Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| Mailhog SMTP | 1025 | SMTP server that receives emails from the backend |
| Mailhog Web UI | 8025 | Web interface to view captured emails |

## Troubleshooting

### Backend cannot connect to Mailhog

**Problem:** Backend logs show "Connection refused" when trying to send emails.

**Solution:**
1. Verify Mailhog is running: `docker compose ps mailhog`
2. Check Mailhog is healthy: `docker compose ps` (status should be "healthy")
3. Verify environment variables in `.env` file
4. Restart backend with updated environment variables

### Emails not appearing in Mailhog UI

**Problem:** Triggered email actions but emails don't show up in Mailhog.

**Solution:**
1. Check backend logs for email sending errors
2. Verify backend is using the correct SMTP host and port
3. Check that `MAIL_HOST=localhost` and `MAIL_PORT=1025` in `.env`
4. Restart the backend after changing environment variables

### Mailhog Web UI not accessible

**Problem:** Cannot access http://localhost:8025

**Solution:**
1. Verify Mailhog container is running: `docker compose ps mailhog`
2. Check port 8025 is not used by another service: `lsof -i :8025`
3. Try accessing via container IP: `docker inspect growmanager-mailhog`

## Checking Container Status

```bash
# Check if Mailhog is running
docker compose ps mailhog

# View Mailhog logs
docker compose logs mailhog

# Check Mailhog health
docker inspect growmanager-mailhog | grep Health -A 10

# Restart Mailhog
docker compose restart mailhog
```

## Mailhog API

Mailhog also provides a JSON API for programmatic access:

- **List all messages:** http://localhost:8025/api/v1/messages
- **Get specific message:** http://localhost:8025/api/v2/messages/{id}
- **Delete all messages:** `DELETE http://localhost:8025/api/v1/messages`

## Production Considerations

**Important:** Mailhog is for development/testing ONLY.

For production:
- Use a real SMTP service (e.g., SendGrid, AWS SES, Mailgun)
- Update `application.yml` prod profile with real SMTP credentials
- Set proper `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` environment variables
- Enable SMTP authentication and TLS

## Cleanup

### Remove orphaned containers

After removing the `minio-setup` container from docker-compose.yml:

```bash
docker rm growmanager-minio-setup
```

Or use the `--remove-orphans` flag:

```bash
docker compose up -d --remove-orphans
```

## Additional Resources

- [Mailhog GitHub Repository](https://github.com/mailhog/MailHog)
- [Mailhog Docker Hub](https://hub.docker.com/r/mailhog/mailhog)
- [Spring Boot Mail Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#application-properties.mail)

---

**Last Updated:** 2025-10-10