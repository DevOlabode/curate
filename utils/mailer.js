const nodemailer = require('nodemailer');

function appUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${protocol}://${host}`;
}

function createTransport() {
  const user = process.env.BREVO_USER;
  const pass = process.env.BREVO_SMTP_KEY;
  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.BREVO_SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

async function sendPasswordResetEmail({ req, to, resetUrl, firstName }) {
  const transport = createTransport();
  if (!transport) {
    throw new Error('Email is not configured');
  }

  const from = process.env.BREVO_FROM || process.env.BREVO_USER;
  const greetingName = firstName
    ? String(firstName).replace(/[<>&"]/g, '')
    : '';
  const greeting = greetingName ? `Hi ${greetingName},` : 'Hi,';

  await transport.sendMail({
    from: `Curate <${from}>`,
    to,
    subject: 'Reset your Curate password',
    text: `${greeting}\n\nWe received a request to reset your Curate password.\n\nOpen this link to choose a new one (it expires in 1 hour):\n${resetUrl}\n\nIf you didn’t ask for this, you can ignore this email.\n`,
    html: `
      <div style="font-family: Figtree, Helvetica, sans-serif; background:#f4efe6; padding:32px 16px;">
        <div style="max-width:480px; margin:0 auto; background:#fffcf7; border:1px solid rgba(26,22,18,0.1); border-radius:20px; padding:32px;">
          <p style="margin:0 0 8px; letter-spacing:0.14em; text-transform:uppercase; font-size:12px; color:#c4491d; font-weight:700;">Curate</p>
          <h1 style="font-family: Georgia, serif; font-size:28px; color:#1a1612; margin:0 0 16px;">Reset your password</h1>
          <p style="color:#3d342c; line-height:1.6;">${greeting}</p>
          <p style="color:#3d342c; line-height:1.6;">We received a request to reset your password. This link expires in one hour.</p>
          <p style="margin:28px 0;">
            <a href="${resetUrl}" style="display:inline-block; background:#c4491d; color:#fffaf4; text-decoration:none; padding:12px 22px; border-radius:999px; font-weight:600;">Choose a new password</a>
          </p>
          <p style="color:#6f6459; font-size:14px; line-height:1.6;">If the button doesn’t work, paste this into your browser:<br>
            <a href="${resetUrl}" style="color:#c4491d;">${resetUrl}</a>
          </p>
          <p style="color:#9a8d82; font-size:13px;">If you didn’t ask for this, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
}

module.exports = { appUrl, sendPasswordResetEmail };
