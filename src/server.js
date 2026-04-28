require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const Stripe = require('stripe');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {
  getProducts,
  getProductById,
  getUserByEmail,
  getUserByGoogleId,
  createUser
} = require('./db');

const app = express();
const port = process.env.PORT || 3000;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 4 }
  })
);

app.use((req, _res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

passport.serializeUser((user, done) => done(null, user.email));
passport.deserializeUser((email, done) => {
  const user = getUserByEmail(email);
  done(null, user || false);
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
      },
      (_accessToken, _refreshToken, profile, done) => {
        let user = getUserByGoogleId(profile.id);
        if (!user) {
          const existing = getUserByEmail(profile.emails[0].value);
          if (existing) {
            user = existing;
          } else {
            user = createUser({
              id: `user_${Date.now()}`,
              email: profile.emails[0].value,
              passwordHash: null,
              googleId: profile.id,
              name: profile.displayName
            });
          }
        }
        return done(null, user);
      }
    )
  );
}

app.use(passport.initialize());
app.use(passport.session());

function toMoney(cents) {
  return (cents / 100).toFixed(2);
}

function withCartDetails(cart) {
  return cart
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      return {
        ...item,
        product,
        lineTotalCents: product.priceCents * item.quantity
      };
    })
    .filter(Boolean);
}

function cartTotalCents(items) {
  return items.reduce((sum, i) => sum + i.lineTotalCents, 0);
}

app.get('/', (req, res) => res.redirect('/products'));

app.get('/products', (req, res) => {
  res.render('products', {
    user: req.user,
    products: getProducts(),
    toMoney,
    cartCount: req.session.cart.reduce((sum, i) => sum + i.quantity, 0)
  });
});

app.post('/cart/add', (req, res) => {
  const product = getProductById(req.body.productId);
  if (!product) return res.status(404).send('Product not found');

  const quantity = Number(req.body.quantity || 1);
  const existing = req.session.cart.find((i) => i.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    req.session.cart.push({ productId: product.id, quantity });
  }
  res.redirect('/checkout');
});

app.get('/checkout', (req, res) => {
  const items = withCartDetails(req.session.cart);
  res.render('checkout', {
    user: req.user,
    items,
    totalCents: cartTotalCents(items),
    toMoney,
    stripeEnabled: Boolean(stripe)
  });
});

app.post('/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).send('Stripe is not configured. Add STRIPE_SECRET_KEY to .env');
  }

  const items = withCartDetails(req.session.cart);
  if (!items.length) {
    return res.status(400).send('Cart is empty');
  }

  const sessionObj = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          description: item.product.description
        },
        unit_amount: item.product.priceCents
      }
    })),
    success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
    cancel_url: `${req.protocol}://${req.get('host')}/checkout`
  });

  return res.redirect(sessionObj.url);
});

app.get('/checkout/success', (req, res) => {
  req.session.cart = [];
  res.render('success', { user: req.user });
});

app.get('/register', (_req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.render('register', { error: 'Email and password are required.' });
  if (getUserByEmail(email)) return res.render('register', { error: 'User already exists.' });

  const passwordHash = await bcrypt.hash(password, 10);
  createUser({
    id: `user_${Date.now()}`,
    email,
    passwordHash,
    googleId: null,
    name: email.split('@')[0]
  });

  res.redirect('/login');
});

app.get('/login', (_req, res) => {
  res.render('login', {
    error: null,
    googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email || '');
  if (!user || !user.passwordHash) {
    return res.render('login', {
      error: 'Invalid credentials.',
      googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.render('login', {
      error: 'Invalid credentials.',
      googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    });
  }

  req.login(user, (err) => {
    if (err) return res.status(500).send('Login failed');
    return res.redirect('/products');
  });
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (_req, res) => {
    res.redirect('/products');
  });
}

app.post('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/products');
  });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Ecommerce starter listening on http://localhost:${port}`);
});
