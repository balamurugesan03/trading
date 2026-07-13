const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const kycRoutes = require('./routes/kycRoutes');
const walletRoutes = require('./routes/walletRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingRoutes = require('./routes/settingRoutes');
const packageRoutes = require('./routes/packageRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const incentiveRoutes = require('./routes/incentiveRoutes');
const supportRoutes = require('./routes/supportRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = [process.env.CLIENT_URL, process.env.WEBSITE_URL].filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/incentives', incentiveRoutes);
app.use('/api/support', supportRoutes);

app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

// Serve the marketing site (website/) at "/" and the built React app (frontend/dist)
// under "/login", so `node server.js` alone can serve everything in production without
// a separate nginx/static-hosting setup.
const websiteDir = path.join(__dirname, '../../website');
const frontendDistDir = path.join(__dirname, '../../frontend/dist');

// Vite fingerprints every built JS/CSS file with a content hash, so those files are safe to
// cache forever - but index.html itself is not fingerprinted and must always be revalidated.
// Without this, a browser/CDN that already cached an old index.html keeps requesting JS
// bundles from a previous build that a later "npm run build" deleted, 404s, falls through to
// the SPA-fallback route below, and gets index.html back - which fails to parse as JS
// ("Unexpected token '<'") even though the server itself is serving the current build.
function setStaticCacheHeaders(res, filePath) {
  if (filePath.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}

app.use(express.static(websiteDir, { index: false, setHeaders: setStaticCacheHeaders }));
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(websiteDir, 'index.html'));
});

// The frontend is built with Vite base "/login/" (see frontend/vite.config.js), so its
// index.html references assets as "/login/assets/...". It must be served under that same
// "/login" prefix, or those asset requests 404 through to the catch-all below and come back
// as index.html - which the browser then fails to parse as JS ("Unexpected token '<'").
app.use('/login', express.static(frontendDistDir, { index: false, setHeaders: setStaticCacheHeaders }));
app.get('/login*', (req, res) => {
  const indexPath = path.join(frontendDistDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res
      .status(503)
      .send('Frontend build not found. Run "npm run build" in the frontend folder first.');
  }
  res.set('Cache-Control', 'no-cache');
  res.sendFile(indexPath);
});

module.exports = app;
