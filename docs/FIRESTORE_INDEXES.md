# Firestore indexes

`firestore.indexes.json` carries no comments, because the Firebase CLI validates
that file against a strict schema and rejects unknown keys — including `"//"`.
This file is where the explanation lives.

Deploy with:

```bash
npm run deploy-rules        # rules + indexes together
# or
firebase deploy --only firestore:indexes
```

## Why these exist at all

Firestore needs a composite index for any query that combines equality filters
with an ordering or a range on a different field. Without one the query does not
run slowly — it **fails outright**, with an error containing a link that creates
the index.

That failure mode is the reason to declare them here rather than let them be
created on demand. Created on demand means the first person to open a dashboard
sees an error, and someone is expected to read a stack trace and click a link in
it. Declared here, `npm run deploy-rules` sets them up before anyone looks.

An index takes a few minutes to build on a new project and the query fails until
it is ready, so deploy these **before** the first test of each account type, not
during it.

## What each one is for

### `serviceQueue`

| Fields | Query it serves |
|---|---|
| `status`, `serviceType`, `jurisdiction`, `createdAt ↑` | The waiting queue as a live professional sees it — `lib/queue.js` runs one of these per jurisdiction the professional holds |
| `assignedTo`, `status` | The entry a professional currently holds (`activeEntryFor`) |
| `assignedTo`, `assignedAt ↑` | Analytics: requests accepted in a window |
| `assignedTo`, `status`, `assignedAt ↑` | Analytics: completed, and open-right-now |

### `appointments`

| Fields | Query it serves |
|---|---|
| `createdBy`, `scheduledFor ↓` | The Appointments tab list |
| `createdBy`, `createdAt ↑` | Analytics: appointments booked in a window |
| `createdBy`, `status`, `createdAt ↑` | Analytics: appointments completed |

### `signingLinks`

| Fields | Query it serves |
|---|---|
| `createdBy`, `createdAt ↓` | The Social Media tab's link list |
| `createdBy`, `status` | The 50-live-link cap check |

### `documents`

Four indexes, because the File Manager's two filters can each be present or
absent and Firestore needs the exact combination:

| Fields | Query it serves |
|---|---|
| `ownerId`, `createdAt ↓` | Unfiltered list |
| `ownerId`, `status`, `createdAt ↓` | Filtered by status |
| `ownerId`, `jurisdiction`, `createdAt ↓` | Filtered by jurisdiction |
| `ownerId`, `status`, `jurisdiction`, `createdAt ↓` | Both filters |

Archived/active is filtered **in memory**, not in the query, precisely to avoid
doubling that table again. The page size is small enough that it costs nothing.

### `supportTickets`, `users`

| Fields | Query it serves |
|---|---|
| `supportTickets`: `openedBy`, `createdAt ↓` | A partner's own tickets on the Support tab |
| `users`: `status`, `submittedAt ↑` | The Website Manager's review queue, oldest application first |

## A note on the analytics indexes

The analytics route uses Firestore's `count()` aggregation, which bills per
query rather than per document read. Aggregations need their index in place like
any other query, so `countOf()` in `app/api/partner/analytics/route.js` falls
back to a bounded read if the aggregation fails. That fallback exists so a
missing index degrades one number rather than blanking the whole panel — it is
not a substitute for deploying these.
