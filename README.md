# HFQ Dash

Player dashboard and admin back office for **HFQ Network** — `dash.hfqmc.xyz`.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Prisma, MySQL 8, Resend, and Discord webhooks.

The visual language (fonts, pixel panels, rank cards, boot splash, route wipe, canvas background) is ported from `hfqmc.xyz` so the dashboard feels like the same server.

---

## What is implemented

- **Storefront** at `/store`, backed by MySQL products with a static catalog fallback. Ranks, upgrades, crate keys, shards, categories, images, badges, perks, and USD/LKR prices.
- **Auth**: email + password registration, 6-digit email OTP (Resend), login, logout, password reset by email, and database-backed sessions.
- **Two-factor authentication** for all accounts, enforced for staff/admin accounts before any `/admin` page or admin API can be used. TOTP secrets are encrypted at rest and one-time recovery codes are supported.
- **15-character random user IDs** (no prefix) with user-scoped dashboard URLs: `/u/[publicId]/...`.
- **Legacy URL alias**: `/u?=<publicId>` and `/u?=<publicId>/store` permanently redirect to the canonical path form.
- **Setup wizard**: Minecraft username, display name, birthday, country, bio, and Minecraft-head avatar.
- **Dashboard**: overview, user-scoped store, orders list, order detail, receipt upload, notifications, and settings.
- **Manual checkout**: choose an active bank account or Dialog eZ Cash account, see payment instructions, create an order, then upload a PNG/JPG/WEBP/PDF receipt.
- **Admin review**: queue, filters, order detail, receipt preview, internal notes, approve, reject, deliver, customer notifications, order events, audit log entries, and Discord alerts.
- **Admin product management**: create/edit/archive products, slugs, categories, prices, currency, images, perks, badges, colours, delivery type, delivery command, and server assignment.
- **Admin user management**: search accounts, promote players to support/staff/admin, protect the founder account, and revoke sessions when a staff member is demoted.
- **Admin payment account management**: bank and eZ Cash destinations, account details, instructions, active state, and sort order.
- **Receipt and product image storage** outside `public/` with owner/staff access control and MIME/size/magic-byte validation.
- **Full MySQL schema**: users, profiles, sessions, recovery codes, verification codes, products, payment accounts, orders, order items, order events, payment proofs, deliveries, coupons, notifications, audit logs, settings, and servers.

## What is next

1. Connect MySQL, run `npm run db:setup`, seed the super admin, and remove `DEMO_MODE=1`.
2. Add real bank/eZ Cash accounts in `/admin/payment-accounts`.
3. Run the full end-to-end flow: signup, login, checkout, receipt upload, admin approve/reject, delivery, notifications, audit log, Discord alert.
4. Add the Minecraft delivery worker (RCON or Pterodactyl) with retries.
5. Decide whether product categories stay as the fixed enum or become admin-created rows.
6. Add upload cleanup, automated tests/CI, monitoring, backups, and legal pages.
7. Deploy the standalone build behind Nginx + MySQL 8 + SSL.

---

## Quick start

```powershell
npm install
Copy-Item .env.example .env
# fill DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY, RESEND_API_KEY, SUPER_ADMIN_PASSWORD
npm run db:setup
npm run admin:seed
npm run dev
```

Open <http://localhost:3000>.

`npm run db:setup` pushes the Prisma schema and seeds the store catalog. Use `npm run db:migrate` once you are ready to keep migration files. Production deploys use the checked-in migration with `npm run db:deploy`.

### Preview without MySQL

Set `DEMO_MODE=1` in `.env` and visit:

```
http://localhost:3000/u/b7k2m9q4v1t8z3x
```

Demo mode renders the dashboard with sample orders and never touches the database. **Never enable it in production.** Admin mutations are disabled in demo mode.

### Super admin

The super admin is seeded manually, not through the public signup flow:

```powershell
$env:SUPER_ADMIN_EMAIL="navidhuadeesha25@gmail.com"
$env:SUPER_ADMIN_PASSWORD="a-long-password-at-least-12-chars"
npm run admin:seed
```

Running it again promotes the existing account and keeps its user ID. The super admin must enable two-factor authentication in **Settings → Account security** before `/admin` unlocks.

### Discord alerts

Create a channel webhook in Discord and set `DISCORD_WEBHOOK_URL` in `.env`. New receipt uploads and admin decisions post order alerts to that channel. The dashboard remains the source of truth.

---

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/store` |
| `/store` | Public storefront |
| `/store/[slug]` | Product detail + sign-in prompt |
| `/login` | Sign in (supports TOTP / recovery code) |
| `/register` | Create account |
| `/verify?email=...` | Signup email OTP |
| `/forgot-password` | Request a password reset code |
| `/reset-password?email=...` | Set a new password |
| `/u/[publicId]` | Dashboard overview |
| `/u/[publicId]/store` | User-scoped store |
| `/u/[publicId]/store/[slug]` | User-scoped checkout |
| `/u/[publicId]/orders` | Order history |
| `/u/[publicId]/orders/[orderNumber]` | Order detail, payment details, receipt upload |
| `/u/[publicId]/notifications` | Notifications |
| `/u/[publicId]/settings` | Profile, password, and two-factor settings |
| `/u/[publicId]/setup` | Profile setup wizard |
| `/admin` | Admin overview and review queue |
| `/admin/orders` | Order queue |
| `/admin/orders/[orderNumber]` | Order review and delivery |
| `/admin/products` | Product list |
| `/admin/products/new` | Create product |
| `/admin/products/[id]` | Edit product |
| `/admin/payment-accounts` | Bank / eZ Cash destinations |
| `/admin/users` | Users and staff roles |

Canonical user URLs are path-based. The legacy `/u?=<publicId>` form is redirected with a `308` by `src/proxy.ts`.

## API

| Route | Method | Notes |
| --- | --- | --- |
| `/api/auth/register` | POST | Validate, hash password, send OTP |
| `/api/auth/verify` | POST | Verify OTP, create user, start session |
| `/api/auth/resend` | POST | Resend signup OTP |
| `/api/auth/login` | POST | Password login, lockout, TOTP challenge |
| `/api/auth/logout` | POST | Revoke session |
| `/api/auth/forgot-password` | POST | Send reset code (generic response) |
| `/api/auth/reset-password` | POST | Verify reset code, set password, revoke sessions |
| `/api/auth/totp/setup` | POST | Generate encrypted TOTP secret |
| `/api/auth/totp/enable` | POST | Verify code, enable TOTP, return recovery codes |
| `/api/auth/totp/disable` | POST | Verify code, disable TOTP |
| `/api/orders` | POST | Create a checkout order |
| `/api/orders/[orderNumber]/proof` | POST | Upload receipt (PNG/JPG/WEBP/PDF, 10MB) |
| `/api/proofs/[id]` | GET | View a receipt (owner or staff only) |
| `/api/product-images/[file]` | GET | Serve validated product artwork |
| `/api/profile` | PATCH | Update profile / complete setup |
| `/api/admin/orders/[orderNumber]/approve` | POST | Approve payment |
| `/api/admin/orders/[orderNumber]/reject` | POST | Reject payment |
| `/api/admin/orders/[orderNumber]/deliver` | POST | Mark delivered / run delivery |
| `/api/admin/orders/[orderNumber]/note` | POST | Internal note |
| `/api/admin/products` | POST | Create product |
| `/api/admin/products/[id]` | PATCH/DELETE | Update / archive product |
| `/api/admin/payment-accounts` | POST | Create payment account |
| `/api/admin/payment-accounts/[id]` | PATCH/DELETE | Update / disable payment account |
| `/api/admin/users/[publicId]` | PATCH | Change a user's role |

All mutating routes check the request origin. Admin routes also check role and 2FA state. Uploads are validated by MIME type, size, and magic bytes, written with a random filename, and hashed with SHA-256.

### Roles

| Role | Access |
| --- | --- |
| `SUPPORT` | View admin queue, order details, add internal notes |
| `STAFF` | Approve, reject, deliver |
| `ADMIN` | Manage products, payment accounts, customers, staff |
| `SUPER_ADMIN` | Everything |

Staff and admin accounts must have TOTP enabled. Enabling or disabling TOTP revokes every other session.

---

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_URL` | Yes in production | Public origin, e.g. `https://dash.hfqmc.xyz` |
| `AUTH_SECRET` | Yes | Session/OTP signing secret |
| `ENCRYPTION_KEY` | Recommended | Encrypts TOTP secrets; falls back to `AUTH_SECRET` if blank |
| `DATABASE_URL` | Yes | MySQL 8 connection string |
| `RESEND_API_KEY` | Yes in production | Without it OTPs print to the server log in development |
| `EMAIL_FROM` | Yes | Verified Resend sender |
| `EMAIL_REPLY_TO` | Recommended | Support address |
| `SUPER_ADMIN_EMAIL` | Seed only | Super admin account |
| `SUPER_ADMIN_PASSWORD` | Seed only | At least 12 characters |
| `UPLOAD_DIR` | Yes | Persisted writable directory, e.g. `/var/lib/hfq-dash/uploads` |
| `MAX_UPLOAD_MB` | Recommended | Defaults to 10 |
| `DISCORD_WEBHOOK_URL` | Optional | Order alerts |
| `CRON_SECRET` | Later | Delivery worker/cron |
| `DEMO_MODE` | Local only | Never set in production |

Generate secrets with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

---

## Architecture

```
src/app/                 routes, layouts, route handlers
  (auth)/                login, register, verify, password reset
  (store)/store/         public storefront
  (customer)/u/[id]/     user-scoped dashboard + store + checkout
  admin/                 staff area
  api/                   backend route handlers
src/components/          motion, layout, store, auth, orders, setup, admin, ui
src/lib/                 auth, admin, db, email, dashboard, orders, products, uploads, validation
src/data/                static catalog + demo data
src/proxy.ts             legacy `/u?=` URL alias
prisma/schema.prisma     MySQL data model
prisma/seed.ts           products
scripts/                 super-admin seed
public/images/           HFQ artwork
var/uploads/             local upload directory (never committed)
```

Backend flow:

```
route handler -> zod validation -> same-origin check -> auth/role/2FA -> service -> Prisma
```

Sessions are opaque random tokens in an `httpOnly` cookie. Only the SHA-256 hash is stored in `sessions.token_hash`. OTPs are hashed with the app secret, expire after 10 minutes, and allow 6 attempts. TOTP secrets use AES-256-GCM with `ENCRYPTION_KEY`; recovery codes are SHA-256 hashed and consumed on use.

## Security notes

- Passwords use bcrypt with 12 rounds.
- Login locks for 15 minutes after 10 failed attempts. Wrong TOTP codes count toward the lock.
- Staff/admin pages and APIs fail closed when TOTP is disabled.
- Password reset revokes every session on the account.
- Receipts and product images live in `UPLOAD_DIR`, never in `public/`.
- Response headers include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`.
- The in-process rate limiter is fine for one container. Use Redis/Upstash when scaling horizontally.
- Add virus scanning / image re-encoding before accepting production uploads from untrusted users.
- Add a Content-Security-Policy after the final font/analytics list is known.

## Production build

```powershell
npm run build
$env:PORT="3000"
node .next/standalone/server.js
```

`output: "standalone"` is enabled, so deploy the standalone server. Copy `.next/static` and `public/` next to the standalone output as required by your process manager, and point Nginx at it with SSL and a persistent `UPLOAD_DIR`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (webpack) |
| `npm run build` | Production build |
| `npm run start` | Start with `next start` (use standalone server in production) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Prisma client |
| `npm run db:push` | Push schema (development) |
| `npm run db:migrate` | Create a migration |
| `npm run db:deploy` | Apply checked-in migrations in production |
| `npm run db:seed` | Seed store products |
| `npm run db:setup` | Push schema + seed products |
| `npm run admin:seed` | Create/promote the super admin |

> On this Windows machine the SWC native package was reinstalled after a flaky download. If `next build` complains about `@next/swc-win32-x64-msvc` or `lightningcss`, run:
>
> ```powershell
> npm install @next/swc-win32-x64-msvc@16.3.4 lightningcss-win32-x64-msvc@1.33.0 --no-save
> ```

# By Aeth :>
