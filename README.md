## WiScribble Source Code – Architecture and Deployment Guide

### Overview
This is a Next.js 14 app (App Router) that powers WiScribble, a multi‑step document workflow with e‑signature, notarization (ZegoCloud video), and notifications. It supports i18n via `next-intl`, real‑time sync via Supabase, Firebase auth/data, and rich PDF tooling.

Key runtime: Node.js 18+ (recommended 20 LTS)

### Tech Stack
- Next.js 14 (App Router) with React 18
- next-intl for localization
- Tailwind/PostCSS/Sass and Bootstrap 5
- Firebase Auth/Firestore/Storage
- Supabase (realtime + storage)
- ZegoCloud UIKit (video calls)
- EmailJS for transactional emails
- PDF tooling: pdf-lib, pdfjs-dist, pdfkit
- State: Zustand stores + React hooks

### Project Layout (high level)
- `app/` (Next.js App Router)
  - `[locale]/` – localized routes and pages
    - `form-step1` → `form-step5` – multi‑step flow pages
    - `form-success` – confirmation page
  - `api/` – serverless API routes
  - `layout.jsx`, `globals.css`, `middleware.js` – app shell and global middlewares
- `components/` – UI, forms, dynamic form renderer, video call, dashboards
  - `documentForms/` – legacy/hand‑crafted form components
  - `DynamicFormRenderer/` – JSON‑driven renderer for configurable forms
  - `payment/` – credit card UI components
- `config/`
  - `documentTypes.js` – registry and helpers for dynamic form configs
  - `emailjs-config.js`, `zegoConfig.js`
- `contexts/` – `WorkflowContext.js` orchestrates document type, config and progress
- `hooks/` – custom hooks for multi‑step, auth, forms, viewport, collaboration
- `lib/` – `supabase.js`
- `utils/` – general utilities (storage, notary sessions, etc.)
- `public/` – static assets

### Important Files and Responsibilities
- `app/[locale]/form-step1/page.jsx`: document type selection; persists to storage
- `app/[locale]/form-step3/page.jsx`: loads `documentConfig` from `config/documentTypes.js` and renders forms via `DocumentFormFactory`/`DynamicFormRenderer`
- `app/[locale]/form-step5/page.jsx`: payment step and submission
- `app/[locale]/form-success/page.jsx`: post‑payment confirmation
- `components/documentForms/DocumentFormFactory.jsx`: selects legacy vs dynamic renderer
- `config/documentTypes.js`: document type registry, getters like `getDocumentConfig`
- `contexts/WorkflowContext.js`: holds `selectedDocumentType`, `documentConfig`, section progress
- `firebase.js`: Firebase client configured from env vars
- `lib/supabase.js`: singleton Supabase client from env vars

### Environment Variables
Create a `.env` (or environment‑specific `.env.production`) in the repository root (see `.env.example`).

Required (Firebase):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

Required (Supabase):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Required (ZegoCloud – video):
- `NEXT_PUBLIC_ZEGOCLOUD_APP_ID` (number)
- `NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET`

Optional/External Services:
- EmailJS keys are currently hardcoded in `config/emailjs-config.js`. You can move them to envs if desired.
- Stripe is a dependency but not necessarily active in all flows; add keys if you integrate it.

### Scripts
- `npm run dev` – local development
- `npm run build` – production build
- `npm run start` – start production server (defaults to `PORT=3000`)

### Local Development
1. Node 18+ installed (nvm recommended)
2. `cd SourceCode`
3. `npm install`
4. Add `.env` with the variables above
5. `npm run dev` and open http://localhost:3000

## Deployment: Hostinger VPS with PM2 + Nginx + Domain + SSL

These steps assume Ubuntu 22.04+ on your Hostinger VPS and a domain you control.

### 1) Connect and Prepare Server
```bash
ssh root@YOUR_SERVER_IP
apt update && apt upgrade -y
apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs build-essential
node -v
npm -v
npm i -g pm2
apt install -y nginx
apt install -y certbot python3-certbot-nginx
```

### 2) Deploy App Code
```bash
mkdir -p /var/www/wiscribble
cd /var/www/wiscribble
# git clone https://github.com/your/repo.git .
# rsync -avh --delete SourceCode/ root@YOUR_SERVER_IP:/var/www/wiscribble/
npm ci || npm install
npm run build
```

Create `/var/www/wiscribble/.env` with the variables listed above.

### 3) Run with PM2
```bash
cd /var/www/wiscribble
export PORT=3000
pm2 start "npm run start" --name wiscribble --time
pm2 save
pm2 startup systemd -u root --hp /root
# run the printed command, then:
pm2 save
```

View logs:
```bash
pm2 logs wiscribble --lines 200
```

### 4) Configure Nginx Reverse Proxy
```bash
cat >/etc/nginx/sites-available/wiscribble.conf <<'NGINX'
server {
    listen 80;
    server_name example.com www.example.com;

    proxy_buffers 16 16k;
    proxy_buffer_size 32k;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
    }
}
NGINX

ln -s /etc/nginx/sites-available/wiscribble.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Replace `example.com` with your domain.

### 5) Point Domain DNS
- Set `A` records for `example.com` and `www` to your VPS IP.

### 6) Issue SSL with Certbot
```bash
certbot --nginx -d example.com -d www.example.com --redirect --agree-tos -m you@example.com -n
```

Test renewal:
```bash
certbot renew --dry-run
```

### 7) Runtime Notes
- Ensure `.env` is present before `npm run build` when build‑time envs are required.
- Restart the app after env changes: `pm2 restart wiscribble`.
- Nginx terminates SSL and proxies to the Node app on 3000.

### 8) Troubleshooting
- 502/Bad Gateway: Check PM2 process and port; `pm2 logs`.
- 404 localized routes: Verify locale segments and `middleware.js`.
- Missing credentials: Verify Firebase/Supabase/Zego envs.
- Resource limits: `pm2 monit`, consider `--max-memory-restart`.

---

### Conventions and Contribution
- Prefer dynamic forms via `config/documentTypes.js`; add legacy forms only when necessary.
- Add API routes under `app/api/...` and localized pages under `app/[locale]/...`.
- Update translations in `locales/en.json` and `locales/es.json`.

### License
Proprietary – WiScribble. All rights reserved.
