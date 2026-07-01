require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const startRoiCron = require('./jobs/roiCron');
const startIncentiveCron = require('./jobs/incentiveCron');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startRoiCron();
      startIncentiveCron();
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
