# RALOA production operations

## Monitoring

- Fly's health check polls `GET /api/health` every 15 seconds. Use `GET /api/ready` for rollout gating: it verifies the database and configured media storage. Local storage checks the uploads directory; S3 mode checks configuration without exposing credentials.
- A second external monitor should poll `https://YOUR_PUBLIC_DOMAIN.example/api/health` every 1 minute and alert after 3 failures. Set `HEALTHCHECK_URL` and run `npm run health:check` from a scheduler when using a separate monitoring host.
- Set `SENTRY_DSN` for server errors and `VITE_SENTRY_DSN` for browser errors. Both integrations disable default PII collection. Start with a 5% trace sample rate and increase only when needed.
- Logs are newline-delimited JSON with request ID, method, path, status, and duration. Do not log request bodies, authorization headers, emails, IP addresses, or subscriber data.

## Backups and disaster recovery

RALOA uses an off-site disaster recovery design to guarantee that a full loss of the application disk or host infrastructure does not result in the loss of production data or backups.

### Architecture

```text
BackupService
├── LocalBackupStorage (data/backups/db/, data/backups/uploads/)
└── S3CompatibleBackupStorage (AWS S3, Cloudflare R2, Backblaze B2, MinIO)
```

1. **Snapshot Generation**:
   - **Database**: Atomic SQLite snapshot using `VACUUM INTO` ensuring point-in-time consistency without locking writes or stopping the server.
   - **Uploads**: Gzip tar archive of user media in `UPLOADS_DIR` when local media storage is selected. S3 media is already durable in the configured object store and should use that provider's versioning/retention policy.
2. **Integrity & Encryption**:
   - Computes SHA-256 payload checksums.
   - Client-side encryption using **AES-256-GCM** if `BACKUP_ENCRYPTION_KEY` (or `INTEGRATION_ENCRYPTION_KEY`) is configured.
   - Remote transport over TLS/HTTPS using SigV4 authentication.
3. **Remote Persistence & Fail-Closed Logging**:
   - Uploads snapshot and sidecar `.meta.json` to S3-compatible object storage.
   - Performs post-upload HEAD check and SHA-256 integrity verification.
   - **Fail-Closed Rule**: Backup success is never logged until remote persistence and integrity verification succeed when remote backup is enabled.
4. **Lifecycle Retention (GFS)**:
   - Evaluates the explicit Grandfather-Father-Son retention policy (`BACKUP_RETENTION_DAILY`, `BACKUP_RETENTION_WEEKLY`, `BACKUP_RETENTION_MONTHLY`) and always preserves `BACKUP_RETENTION_MINIMUM_KNOWN_GOOD` valid backups when available.
   - The legacy local upload archive helper uses `UPLOAD_BACKUP_RETENTION_COUNT`; its default is 30 and it no longer contains a source-code retention count.
   - Retention configuration is validated as a non-negative integer. Invalid values fall back to safe defaults and emit a warning. Corrupt local backups are never selected as known-good and are logged/skipped rather than silently deleted.
   - Automatically prunes obsolete backups from local and remote storage.

### Backup schedule

Run the backup commands via a reliable scheduler on the host (e.g., cron or systemd timer):

```bash
# Daily at 02:00 UTC - Database backup
npm run db:backup

# Daily at 02:30 UTC - Media uploads backup
npm run uploads:backup
```

Example crontab configuration:
```cron
0 2 * * * cd /app && npm run db:backup >> /var/log/raloa-backup.log 2>&1
30 2 * * * cd /app && npm run uploads:backup >> /var/log/raloa-backup.log 2>&1
0 4 * * 0 cd /app && npm run backup:verify >> /var/log/raloa-backup-verify.log 2>&1
```

### Encryption and key recovery considerations

> [!WARNING]
> If `BACKUP_ENCRYPTION_KEY` is configured, backups are encrypted using AES-256-GCM before remote upload.
> You **MUST** store this key in an external secret manager (e.g., AWS Secrets Manager, 1Password, Vault).
> **If the production disk is lost along with `.env`, backups CANNOT be recovered without this key.**

For remote S3-compatible storage, keep bucket versioning/object lock and lifecycle
rules managed by the provider as a second operational control. Set their expiry
longer than the RALOA application policy so a mistaken application prune cannot
be the only recoverability boundary. RALOA still verifies and prunes its own
current-version objects, and logs each deletion with its retention reason.

1. Store `BACKUP_ENCRYPTION_KEY` separately from the application host.
2. In disaster recovery scenarios where the original host is destroyed, provision the new environment with the saved `BACKUP_ENCRYPTION_KEY` before attempting a restore.

### Automated restore verification drill

RALOA includes a non-destructive, sandbox restore verification command:

```bash
# Verify the latest local backup
npm run backup:verify

# Or verify the latest remote S3 backup (simulating total disk loss)
npm run backup:verify -- --remote
```

The verification drill performs the following automated checks in an isolated OS temporary directory:
1. Downloads the target backup and its metadata sidecar.
2. Validates the SHA-256 payload checksum against the recorded metadata.
3. Decrypts the backup payload using `BACKUP_ENCRYPTION_KEY`.
4. Opens the restored SQLite database in read-only mode and executes `PRAGMA integrity_check`.
5. Asserts the presence and schema validity of mandatory tables:
   - `profiles`
   - `users`
   - `blocks`
   - `pages`
   - `subscribers`
   - `processed_webhook_events`
6. If an upload archive is present, inspects tar header integrity and counts archive files.
7. Cleans up sandbox directories automatically upon completion.

### Manual disaster recovery restore procedure

In the event of total application disk loss:

1. Provision a new server instance and mount a persistent volume for `DATABASE_PATH`. If `MEDIA_STORAGE=local`, also mount `UPLOADS_DIR`; if `MEDIA_STORAGE=s3`, configure the same bucket, prefix, endpoint, and server-only credentials instead.
2. Configure `.env` with the disaster recovery keys (`BACKUP_STORAGE=s3`, `BACKUP_S3_*`, `BACKUP_ENCRYPTION_KEY`).
3. Run `npm run backup:verify -- --remote` to confirm connectivity and decryptability of the latest off-site snapshot.
4. Download the latest backup from object storage:
   ```bash
   # Using AWS CLI / S3 compatible tool:
   aws s3 cp s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/raloa-db-<TIMESTAMP>.sqlite.enc ./restored.sqlite.enc
   aws s3 cp s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/raloa-db-<TIMESTAMP>.sqlite.enc.meta.json ./restored.sqlite.enc.meta.json
   ```
5. Decrypt using the verification utility or Node.js crypto:
   ```bash
   node -e "
     const { decryptBackupData, derive32ByteKey } = require('./server/services/backup/crypto.js');
     const fs = require('fs');
     const meta = JSON.parse(fs.readFileSync('./restored.sqlite.enc.meta.json'));
     const key = derive32ByteKey(process.env.BACKUP_ENCRYPTION_KEY);
     const decrypted = decryptBackupData(fs.readFileSync('./restored.sqlite.enc'), key, meta.ivHex, meta.tagHex);
     fs.writeFileSync(process.env.DATABASE_PATH || './data/raloa.db', decrypted);
   "
   ```
6. Restore media uploads by extracting the archive:
   ```bash
   tar -xzf raloa-uploads-<TIMESTAMP>.tar.gz -C "$UPLOADS_DIR"
   ```
7. Verify integrity:
   ```bash
   sqlite3 "$DATABASE_PATH" "PRAGMA integrity_check;"
   ```
8. Start the application (`npm start`) and verify `/api/health`, `/api/ready`, login, and public profiles.

### Failure alerts

1. **Process Exit Codes**: Both `npm run db:backup` and `npm run uploads:backup` exit with code `1` on failure. Schedulers must alert if exit code != 0.
2. **Log Monitoring**: The backup service emits structured error logs:
   - `[Backup Error] Failed to create database backup: ...`
   - `[Backup Error] Failed to create upload backup: ...`
   - `[Backup] Remote persistence failed: ...`
   Alert on any log matching `[Backup Error]`.
3. **Weekly Verification Check**: Configure a weekly cron job running `npm run backup:verify -- --remote` and alert on non-zero exit code to catch bit rot, stale keys, or bucket access policy regressions before a real disaster strikes.

## Retention and telemetry

Telemetry is retained for `ANALYTICS_RETENTION_DAYS` days (default 90), and processed Stripe event IDs for `WEBHOOK_EVENT_RETENTION_DAYS` days (default 30). Hashed IPs are still treated as personal data and must be included in the privacy policy.

Contact messages are always persisted. If `RESEND_API_KEY`, `CONTACT_NOTIFICATION_EMAIL`, and `CONTACT_FROM_EMAIL` are configured, each new message also sends a real notification through Resend. `SUPPORT_INBOX_ADMIN_USER_ID` enables the authenticated `/api/support/inbox` endpoint for one explicitly provisioned operator account; an email address alone is never used for authorization.

## Stripe alerts

Configure Stripe Dashboard notifications for failed payments, webhook delivery failures, and disabled endpoints. The webhook returns non-2xx on signature or processing failure so Stripe retries. Monitor logs by `requestId` and alert on repeated `/api/billing/webhook` 5xx responses.

## Rollback procedure

1. Stop the rollout and record the deployment version, time, and failing health/error signal.
2. Redeploy the last known-good immutable image or release, never by editing the live container.
3. Run `npm run health:check` against the public URL and verify `/studio`, `/@elenarostova`, and `/api/health`.
4. If a migration or data write caused the incident, restore into a separate volume first and validate before changing production data.
5. Keep the failed release available for investigation and document the rollback before retrying.
