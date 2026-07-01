const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  if (!process.env.SMTP_HOST) {
    console.log(`[mail:dev] to=${to} subject="${subject}" text="${text}"`);
    return;
  }
  await getTransporter().sendMail({ from: process.env.SMTP_FROM, to, subject, text, html });
}

module.exports = { sendMail };
