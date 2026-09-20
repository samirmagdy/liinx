# Media storage

RALOA accesses creator media through the `ObjectStorage` interface. The upload
routes do not write paths directly: they validate bytes, generate a safe object
key, persist through the adapter, and record the returned URL in
`uploaded_files`.

## Providers

- `MEDIA_STORAGE=local` uses `LocalFileObjectStorage` and `UPLOADS_DIR`. This is
  the default for development and tests.
- `MEDIA_STORAGE=s3` uses `S3CompatibleObjectStorage`. Set the server-only
  `MEDIA_S3_BUCKET`, `MEDIA_S3_ACCESS_KEY_ID`, and `MEDIA_S3_SECRET_ACCESS_KEY`.
  `MEDIA_S3_ENDPOINT` and `MEDIA_S3_FORCE_PATH_STYLE` support R2, MinIO,
  Backblaze B2, and other S3-compatible services in addition to AWS S3.
- `MEDIA_S3_PREFIX` isolates RALOA objects in a bucket. `MEDIA_PUBLIC_URL` may
  point to a public bucket/CDN origin. Without it, the application proxies
  `/uploads/:key` through the adapter, so credentials remain server-side.

Production should use `MEDIA_STORAGE=s3` (or an explicitly configured
S3-compatible endpoint), because local disk is not durable across ephemeral or
multi-instance deployments. The readiness endpoint reports the selected
provider and fails when local storage cannot be written; S3 readiness validates
configuration without exposing credentials.

## Validation and lifecycle

Image and downloadable-file uploads are held in bounded memory, classified from
content signatures, and assigned generated keys. Extensions and multipart MIME
types are not trusted. HTML, SVG, script-like content, and mismatched payloads
are rejected. Images are served inline; other supported downloads use
`Content-Disposition: attachment`, `nosniff`, and immutable cache headers.

Replacing or deleting a block removes an object only when no other block or
profile field references its URL. Account deletion removes owned objects before
deleting ownership rows; a provider failure leaves the account available for a
retry. A failed database insert after an object upload removes the newly created
object.

The adapter contract is covered by the in-memory test double and a mocked
S3-compatible request test. Live bucket permissions, CDN behavior, and provider
durability still require a sanctioned provider sandbox or deployment check.
