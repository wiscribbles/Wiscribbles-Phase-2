# Fresh Firebase project — setup

Replaces the inaccessible `wiscribbles-2f919` project. Roughly five minutes.

**Decision already taken:** Firestore location **`us-east1` (South Carolina)**.
This is permanent — it cannot be changed after the database is created, and
getting it wrong means a new project and a full migration. If anything below
prompts you for a location and `us-east1` is not what's offered, stop and tell
me rather than accepting a default.

---

## 1. Create the project

In the Firebase console, add a project.

- **Name:** something like `wiscribbles-prod`. The console will derive a project
  ID from it — note that ID down, it is permanent and goes in `.env`.
- **Google Analytics:** not needed. Decline it; it adds a second linked property
  to manage for no benefit at this stage.
- **Owner account:** use an account you are certain you will retain access to.
  Consider adding a second Owner under Project settings → Users and permissions
  straight away. Losing sole access is exactly what put us here.

**Plan:** the free Spark plan is enough for everything in Phase 2 — Auth,
Firestore, Storage. Blaze is only needed for Cloud Functions, which we are not
using. Start on Spark. If you do attach billing later, set a budget alert.

## 2. Register a Web app

Inside the project, add an app and choose **Web** (the `</>` icon).

- Nickname: `wiscribbles-web`
- Do **not** tick "Also set up Firebase Hosting" — the app runs on your
  Hostinger VPS behind Nginx and PM2.

The console then shows a `firebaseConfig` object. **That is the first six values
I need.** Leave the tab open.

## 3. Enable Authentication

Authentication → Get started → Sign-in method.

- Enable **Email/Password**.
- Leave "Email link (passwordless sign-in)" **off**.
- Do not enable Google or Facebook — social sign-up was considered and dropped
  for the Phase 2 sign-up flow.
- Do not enable Phone for now. It is only needed if we keep the legacy SMS
  sign-in, which Phase 2 does not use.

Then under Authentication → Settings → Authorized domains, add your production
domain. `localhost` is there by default and must stay for development.

## 4. Create Firestore

Firestore Database → Create database.

- **Location: `us-east1`.** This is the irreversible one.
- Start in **production mode** (locked). Do not pick test mode — it leaves the
  database open to the world for 30 days, which is how the Phase 1 data ended up
  readable by any signed-in user.

The real rules are in `firestore.rules` in this repo and get deployed in step 7.

## 5. Create Storage

Storage → Get started. Production mode, same location.

All file storage runs through this bucket — certificates, identification, signatures and documents. Cloudinary was removed on 18 Oct 2026, so this is no longer optional.

## 6. Generate an Admin SDK key

Project settings → Service accounts → **Generate new private key**. A JSON file
downloads.

**Open it, copy the three values below into `.env`, then delete the file.**
Do not put it in the repo. Do not keep it in Downloads.

| JSON field | `.env` variable |
|---|---|
| `project_id` | `FIREBASE_ADMIN_PROJECT_ID` |
| `client_email` | `FIREBASE_ADMIN_CLIENT_EMAIL` |
| `private_key` | `FIREBASE_ADMIN_PRIVATE_KEY` |

For `FIREBASE_ADMIN_PRIVATE_KEY`, paste the value on a single line, in double
quotes, keeping the literal `\n` sequences exactly as the JSON has them.
`lib/firebase-admin.js` converts them back to real newlines.

## 7. Deploy the security rules

From the repo root, with the Firebase CLI installed and signed in:

```bash
firebase login
firebase use --add            # select the new project
firebase deploy --only firestore:rules
```

`firestore.rules` is default-deny. Nothing in the database is readable or
writable by a client until a rule explicitly permits it, and role and status
are read from auth custom claims — which only the server can set — rather than
from a document field a client could write.

## 8. Send me these eight values

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
```

**Do not send me `FIREBASE_ADMIN_PRIVATE_KEY`.** I do not need it — that key
belongs only in your server environment. Anything I build here is verified
against the project structure, not against live admin access. If a step ever
seems to require me to hold that key, it means the step is wrong.

See `.env.example` for the full list including Stripe, Resend, ZegoCloud and


---

## About the old project

`wiscribbles-2f919` still exists, you cannot reach it, and its Admin key is
public in the `WiScribble` repo's history. That key still works.

Two things follow:

1. The key has been rewritten out of this repository's history, so it is not
   spreading further. It remains in `wiscribbles/WiScribble` on `main`.
2. **If a billing account is attached to the old project, someone holding that
   key could run up charges against it.** Worth checking what payment method, if
   any, is on that Google account, and removing it if you can reach billing even
   though you cannot reach the project.

Once the new project is live, the old one's data is irrelevant — it was test
data only. The exposure is the key and any billing behind it, not the contents.
