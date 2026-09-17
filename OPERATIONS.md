# LIINX production operations

## Monitoring

- Fly's health check polls `GET /api/health` every 15 seconds. Use `GET /api/ready` for rollout gating: it also verifies that the uploads volume is writable.
- A second external monitor should poll `https://YOUR_PUBLIC_DOMAIN.example/api/health` every 1 minute and alert after 3 failures. Set `HEALTHCHECK_URL` and run `npm run health:check` from a scheduler when using a separate monitoring host.
- Set `SENTRY_DSN` for server errors and `VITE_SENTRY_DSN` for browser errors. Both integrations disable default PII collection. Start with a 5% trace sample rate and increase only when needed.
- Logs are newline-delimited JSON with request ID, method, path, status, and duration. Do not log request bodies, authorization headers, emails, IP addresses, or subscriber data.

## Backups and retention

Run these from the host that owns the persistent volumes:

```bash
npm run db:backup
npm run uploads:backup
```

Schedule both commands daily using the host scheduler (example: 02:00 UTC), then copy `data/backups/` to encrypted object storage. Local backups alone do not protect against host loss. The database backup runs SQLite integrity validation; the upload archive is a gzip tar archive.

Telemetry is retained for `ANALYTICS_RETENTION_DAYS` days (default 90), and processed Stripe event IDs for `WEBHOOK_EVENT_RETENTION_DAYS` days (default 30). Hashed IPs are still treated as personal data and must be included in the privacy policy.

Contact messages are always persisted. If `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`, and `CONTACT_FROM_EMAIL` are configured, each new message also sends a real notification through Resend. `SUPPORT_INBOX_ADMIN_USER_ID` enables the authenticated `/api/support/inbox` endpoint for one explicitly provisioned operator account; an email address alone is never used for authorization.

## Stripe alerts

Configure Stripe Dashboard notifications for failed payments, webhook delivery failures, and disabled endpoints. The webhook returns non-2xx on signature or processing failure so Stripe retries. Monitor logs by `requestId` and alert on repeated `/api/billing/webhook` 5xx responses.

## Restore drill

1. Stop writes or put the service in maintenance mode.
2. Copy the selected database snapshot to a new `DATABASE_PATH` and run `PRAGMA integrity_check`.
3. Extract the matching upload archive into a separate `UPLOADS_DIR` (for example, `tar -xzf liinx-uploads-<matching-timestamp>.tar.gz -C <UPLOADS_DIR>`).
4. Start a staging instance against those paths and verify `/api/health`, `/api/ready`, login, a public profile, an uploaded avatar, and a tracked link.
5. Promote only after the checks pass; preserve the original volumes until verification is complete.

## Rollback procedure

1. Stop the rollout and record the deployment version, time, and failing health/error signal.
2. Redeploy the last known-good immutable image or release, never by editing the live container.
3. Run `npm run health:check` against the public URL and verify `/studio`, `/@elenarostova`, and `/api/health`.
4. If a migration or data write caused the incident, restore into a separate volume first and validate before changing production data.
5. Keep the failed release available for investigation and document the rollback before retrying.
