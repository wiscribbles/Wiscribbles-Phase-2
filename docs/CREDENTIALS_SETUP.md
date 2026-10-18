# Credentials setup — WiScribbles Phase 2

Everything you need to get every API key into the codebase, in order.

**On "for my eyes only":** this document contains no secrets, so it is safe to
keep in the repository — it tells you where to *put* keys, never what they are.
What is *not* private is the repository itself. `Wiscribbles-Phase-2` is
currently **public**. Nothing here or in the code is dangerous to publish, but
your architecture, security rules and the Phase 1 vulnerability notes are all
visible to anyone. **Make the repository private** in Settings → General →
Danger Zone → Change visibility.

**The one rule, which everything below follows from:** secrets go in `.env`
files, `.env` files are never committed, and anything prefixed `NEXT_PUBLIC_`
is shipped to every visitor's browser. A secret with that prefix is a published
secret. This is not hypothetical here — Phase 1 shipped the ZegoCloud server
secret to every browser exactly that way.

---

## Part 1 — Creating the `.env` file

### What the file is

A plain text file of `KEY=value` lines at the **root of the project**, next to
`package.json`. Next.js reads it automatically at startup. There is nothing to
import and nothing to register.

There is no `.env` in the repository and there never will be: `.gitignore`
blocks it. What the repository has is **`.env.example`** — the same list of
keys with the values blank. You copy it and fill it in.

### Which filename

| File | Used | Commit it? |
|---|---|---|
| `.env.example` | Template only, no values | Yes — already committed |
| `.env.local` | Your own machine, development | **Never** |
| `.env.production` | The Hostinger VPS | **Never** |

### Create it

From the project root:

```bash
cp .env.example .env.local
```

Then open `.env.local` in a text editor and fill in the values.

> **Can't see the file?** Names beginning with a dot are hidden by default.
> macOS Finder: **Cmd + Shift + .** Windows Explorer: View → Hidden items.
> VS Code shows them normally.

### Rules for editing it

- No spaces around `=`. `KEY=value`, never `KEY = value`.
- No quotes needed unless the value contains spaces. If it does, use double
  quotes: `EMAIL_FROM="WiScribbles <no-reply@wiscribbles.com>"`.
- **One line per value.** A value that wraps in your editor is fine — a value
  with a real line break in it is broken. This is the single most common cause
  of "my key doesn't work".
- `#` at the start of a line is a comment.
- After any change, **restart the dev server.** Next.js reads these once at
  startup.

### Check it

```bash
npm run check-setup
```

This does not just look for the variables. It connects with your credentials,
lists users, touches Firestore and checks the Storage bucket — and it catches a
mangled private key, client and admin credentials pointing at different
projects, and any secret wrongly given a `NEXT_PUBLIC_` prefix. Run it after
every change until it says **Ready**.

---

## Part 2 — Firebase

Firebase needs **two separate sets** of credentials, and the difference matters.

**The client SDK** (`NEXT_PUBLIC_FIREBASE_*`) runs in the browser. These values
are *supposed* to be public — they identify your project, they do not authorise
anything. What stops a stranger reading your database is `firestore.rules`, not
the secrecy of these values.

**The Admin SDK** (`FIREBASE_SERVICE_ACCOUNT`) runs only on the server. It
**bypasses every security rule**. Treat it exactly like a root password.

### 2a. Client config

Firebase console → ⚙ Project settings → General → scroll to **Your apps**.

If no Web app is listed, click the **`</>`** icon to add one. Nickname it
`wiscribbles-web` and do **not** tick "Also set up Firebase Hosting" — the app
runs on your VPS.

You will see a `firebaseConfig` block. Map it across:

| `firebaseConfig` | `.env.local` |
|---|---|
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |
| `measurementId` | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` |

Copy the values **without** the surrounding quotes from the JavaScript.

### 2b. Admin SDK key

Project settings → **Service accounts** → **Generate new private key**. A JSON
file downloads.

Open it, select the **entire contents**, and put it on one line:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n", ...}
```

Keep the `\n` sequences inside the private key exactly as they appear — they
are two characters, backslash and n, not line breaks. Do not add quotes around
the whole thing.

**Then delete the downloaded file.** Do not leave it in Downloads, do not put
it in the project folder. A key file committed to a public repo is precisely
what happened in Phase 1 and why that key had to be revoked.

> If your host's secret manager dislikes a large JSON blob, use the three
> separate variables instead — `FIREBASE_ADMIN_PROJECT_ID`,
> `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`. The private key
> keeps its literal `\n` sequences and is wrapped in double quotes. Use one
> shape or the other, not both.

### 2c. Deploy the security rules

The rules file lives in the repository at `firestore.rules`, but it has no
effect until it is uploaded to Firebase.

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # pick the new project
firebase deploy --only firestore:rules
```

Until this runs, production mode denies everything and the app will look
broken. That is the safe failure, but it is still a failure.

Re-run that last command any time `firestore.rules` changes.

### 2d. Make yourself the Website Manager

Sign up through the app at `/en/auth/signup`, confirm your email (without
Resend configured the link prints in your terminal), then:

```bash
npm run grant-admin -- you@example.com
```

Sign out and back in afterwards — your role lives in the auth token.

---

## Part 3 — Stripe (subscriptions)

Collects the monthly subscription from Attorneys and Businesses:
**Solo USD 50 · Chambers USD 150 · Enterprise USD 350.**

Notaries and Commissioners of Oaths are never charged. The billing code refuses
to charge those roles outright.

1. Create an account at dashboard.stripe.com.
2. Leave **Test mode** on — the toggle is top-right. Test keys are prefixed
   `pk_test_` and `sk_test_`.
3. Developers → **API keys**:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key ("Reveal") → `STRIPE_SECRET_KEY`
4. **Webhook secret.** Stripe must tell your server when a payment succeeds —
   relying on the browser coming back is not reliable and not secure.

   For local development:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   It prints a secret starting `whsec_`. That is `STRIPE_WEBHOOK_SECRET`.

   For production: Developers → Webhooks → Add endpoint →
   `https://your-domain.com/api/webhooks/stripe`. Select `checkout.session.completed`,
   `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.
   Reveal its signing secret and use that on the VPS.

   The production and local secrets are different. Using one for the other is
   the usual reason webhooks work locally and fail live.

5. You do **not** need to create Products or Prices by hand. The plan
   definitions live in `lib/plans.js` and Checkout is given the price inline,
   so changing a price is a code change and a deploy, not dashboard surgery.

**Test cards:** `4242 4242 4242 4242`, any future expiry, any CVC.

---

## Part 4 — WiPay (Caribbean card collection)

Collects one-off fees from clients in Guyana, Jamaica, Trinidad, Barbados and
Grenada, where a local gateway works better than Stripe.

1. Register a **BUSINESS** account at wipaycaribbean.com and complete
   verification. The Payments API only works with a verified business account.
2. In the WiPay dashboard, find the **Developer** section for your
   **Account Number** and **API Key**.
3. Fill in:
   ```
   WIPAY_ENVIRONMENT=sandbox
   WIPAY_COUNTRY=GY
   WIPAY_ACCOUNT_NUMBER=your_account_number
   WIPAY_API_KEY=your_api_key
   ```
4. Switch `WIPAY_ENVIRONMENT` to `live` only when you are ready to take real
   money. The adapter picks a different hostname for each.

**`WIPAY_API_KEY` is critically sensitive, more so than it looks.** WiPay's
payment request endpoint has no authentication at all. The only thing proving
that a "payment succeeded" callback really came from WiPay is an MD5 hash
computed with this key. If it leaks, anyone can forge a successful payment on
your platform. It must never appear in client-side code.

You can test the whole flow before you have an account: leave the account
number and key blank with `WIPAY_ENVIRONMENT=sandbox` and the adapter uses
WiPay's published test merchant.

---

## Part 5 — Resend (email)

Sends email verification, approval and admin-feedback messages. Without it,
nobody can confirm their address, and nobody can reach a dashboard.

1. Create an account at resend.com.
2. **Add and verify your domain.** API keys → create a key gets you sending,
   but mail from an unverified domain lands in spam, and verification mail in
   spam means users who cannot sign up. Resend gives you DNS records (SPF,
   DKIM) to add wherever `wiscribbles.com` is managed.
3. API Keys → Create API Key → **Sending access** is enough.
4. ```
   RESEND_API_KEY=re_...
   EMAIL_FROM="WiScribbles <no-reply@wiscribbles.com>"
   ```
   The `EMAIL_FROM` domain must be the one you verified.

**Without `RESEND_API_KEY`:** in development the email is printed to your
terminal instead of sent, which is deliberate so you can test the flow. In
production nothing is sent and an error is logged. Do not go live without it.

---

## Part 6 — ZegoCloud (video)

Powers the notarisation video session.

1. Create a project at console.zegocloud.com.
2. Take the **AppID** and the **Server Secret**.
3. ```
   ZEGOCLOUD_APP_ID=123456789
   ZEGOCLOUD_SERVER_SECRET=your_32_character_secret
   ```

**Note what is missing: no `NEXT_PUBLIC_` prefix on either.** Phase 1 used
`NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET`, which shipped the secret to every
visitor's browser and let anyone generate a session token for any room —
including a notarisation in progress. Tokens are now minted server-side at
`/api/zego-token`. If you ever see that variable with a `NEXT_PUBLIC_` prefix,
rename it; `npm run check-setup` will flag it for you.

---

## Part 7 — Didit (identity verification)

Checks a partner's ID document against a live selfie.

1. Create an account at didit.me and get an API key and webhook secret.
2. ```
   KYC_PROVIDER=didit
   DIDIT_API_KEY=
   DIDIT_WEBHOOK_SECRET=
   ```

Didit was chosen over Persona on cost — about US$0.33 per check with 500 free a
month and no minimum, against Persona's US$250/month floor on a twelve-month
contract. The code goes through a provider-agnostic adapter, so switching to
Persona later means setting `KYC_PROVIDER=persona` and adding its keys, not a
rewrite.

---

## Part 8 — Cloudinary (file uploads)

Stores professional certificates and uploaded documents.

1. Sign in at cloudinary.com → Dashboard.
2. ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

The cloud name is public; the API secret is not. Phase 1 used an **unsigned**
upload preset with the cloud name hardcoded in the browser, which meant anyone
who viewed the page source could upload anything to your account at your
expense. Stage 2 signs uploads server-side.

---

## Part 9 — Putting it on the server

`.env.local` is your machine only. The VPS needs its own copy, and it is not
copied by git.

```bash
ssh root@YOUR_SERVER_IP
cd /var/www/wiscribble
nano .env.production
```

Paste the same keys with **production** values — live Stripe keys, the
production webhook secret, `WIPAY_ENVIRONMENT=live`, and:

```
NEXT_PUBLIC_BASE_URL=https://wiscribbles.com
NEXT_PUBLIC_SITE_URL=https://wiscribbles.com
```

Then:

```bash
chmod 600 .env.production    # owner-readable only
npm run check-setup
npm run build                # env vars are read at BUILD time, not just runtime
pm2 restart wiscribble
```

That last point catches people out: `NEXT_PUBLIC_*` values are baked into the
JavaScript bundle during `npm run build`. Changing one and only restarting PM2
leaves the old value in the browser. Always rebuild.

---

## If a key leaks

Rotation is cheap. Hoping is not.

| Key | What to do |
|---|---|
| Firebase Admin | Project settings → Service accounts → revoke that key, generate a new one |
| Stripe secret | Developers → API keys → Roll key |
| WiPay API key | Contact WiPay to reissue — and treat every recent payment as unverified |
| Resend | Delete the key, create another |
| ZegoCloud | Regenerate the Server Secret in the console |
| Cloudinary | Settings → Security → regenerate |

If a secret has been pasted into a chat, an email, a ticket or a commit,
**assume it is compromised** and rotate it. Deleting the message does not
unsend it.
