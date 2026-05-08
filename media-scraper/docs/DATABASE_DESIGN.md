# Database Design

## Schema

- `ScrapeJob(id, url, status, error, createdAt, updatedAt)`
- `Media(id, jobId, type, mediaUrl, sourceUrl, createdAt)`

## ERD

```text
ScrapeJob (1) -------- (N) Media
   id  <---------------- jobId
```

## Indexing Strategy

`Media` indexes:
- `type`
- `sourceUrl`
- `mediaUrl`
- `createdAt`

`ScrapeJob` index:
- `createdAt`

## Deduplication

Unique constraint:
- `(sourceUrl, mediaUrl, type)`

This prevents duplicate media entries for the same source/type.

## Pagination and Query Optimization

- offset pagination by `skip/take` with `createdAt DESC`
- count + page query in transaction for consistent response metadata
- search on `mediaUrl` / `sourceUrl` with case-insensitive contains

## Future Enhancements

- partition `Media` by time range
- add trigram/full-text indexes for large search workloads
- read replicas for dashboard-heavy traffic
