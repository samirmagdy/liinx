# Analytics event architecture

Public page views and link clicks are recorded through the
`AnalyticsEventStore` interface. Request handlers validate ownership,
visibility, scheduling, and rate limits, then enqueue a normalized event and
continue serving the page or redirect. They do not perform an analytics
transaction inline.

## Current implementation

`SQLiteAnalyticsEventStore` is the default sink. It keeps bounded in-process
buffers and flushes batched inserts to the existing SQLite tables on the
background timer. The existing unique dedupe indexes and `INSERT OR IGNORE`
preserve the current minute-bucket deduplication behavior. The stats endpoint
flushes pending events before querying so creator reports remain current when
requested.

The delivery contract is **best effort**: accepted events are queued locally,
but a process crash, database outage, or bounded-buffer overflow can lose
events. A retry or duplicate delivery is safe because event dedupe is
idempotent. Analytics failure does not turn a public redirect or page-serving
request into an error; it is logged and the event may be dropped.

## Future sinks

The request-facing code depends only on `AnalyticsEventStore`. A PostgreSQL
store can replace the SQLite implementation, while a Redis-backed queue or a
dedicated processor can implement the same enqueue/flush contract. ClickHouse
is a later aggregation/event-history target, not a requirement for the current
SQLite deployment.

## Query indexes

SQLite maintains profile/time, profile/page/time, block/time, and referrer/time
indexes for both view and click data. Retention cleanup remains responsible for
bounding table size; analytics aggregation should remain off the public page
rendering path.
