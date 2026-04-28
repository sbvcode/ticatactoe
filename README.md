# Ecommerce Portal Starter

This repository now contains a working starter ecommerce portal that covers:

- Product listing page
- Cart + checkout review page
- Stripe Checkout payment flow
- User account creation with email/password
- Login with email/password
- Optional login/account reuse with Google OAuth

## Tech stack

- Node.js + Express
- EJS templates (server-rendered UI)
- Session-based auth (`express-session`, Passport)
- Stripe Checkout API
- JSON file storage for demo data

## 1) Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000/products`.

## 2) Configure environment

Create `.env`:

```env
PORT=3000
SESSION_SECRET=replace_me

# Stripe
STRIPE_SECRET_KEY=sk_test_...

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

If `STRIPE_SECRET_KEY` is missing, checkout still works up to order review but payment button is disabled.
If Google credentials are missing, login remains email/password only.

## 3) Feature flow map

### Product listing → checkout

1. Browse `/products`
2. Add products to cart
3. Open `/checkout` for order summary
4. Click **Pay with Stripe Checkout** to redirect to Stripe hosted checkout
5. Return to `/checkout/success`

### Account creation / authentication

- Email/password:
  - `/register` → create account
  - `/login` → authenticate
- Google OAuth:
  - `/login` → Continue with Google
  - If Google email matches existing user, account is reused.
  - Else a new account is created automatically.

## 4) Stripe production integration checklist

Before going live:

- Replace test key with live secret key
- Configure webhook endpoint for post-payment fulfillment
- Store orders in a real database (PostgreSQL/MySQL)
- Verify success/cancel URLs for your production domain
- Add tax/shipping and inventory validations

## 5) Suggested next build steps

- Add admin dashboard for products/order management
- Implement persistent cart by user account
- Add address capture + shipping rates
- Add webhook signature verification and order table
- Add automated tests (Playwright + API tests)

