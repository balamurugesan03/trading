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
// for every other route, so `node server.js` alone can serve everything in production
// without a separate nginx/static-hosting setup.
const websiteDir = path.join(__dirname, '../../website');
const frontendDistDir = path.join(__dirname, '../../frontend/dist');

app.use(express.static(websiteDir, { index: false }));
app.get('/', (req, res) => res.sendFile(path.join(websiteDir, 'index.html')));

app.use(express.static(frontendDistDir, { index: false }));
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res
      .status(503)
      .send('Frontend build not found. Run "npm run build" in the frontend folder first.');
  }
  res.sendFile(indexPath);
});

module.exports = app;
