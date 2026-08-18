const User = require('../../models/user');
const { signToken } = require('../../utils/jwt');
const ExpressError = require('../../utils/expressError');
const { registrationErrorMessage } = require('../../utils/duplicateKeyError');
const { sendPasswordResetEmail, appUrl } = require('../../utils/mailer');
const { createResetToken, hashResetToken, RESET_TTL_MS } = require('../../utils/passwordReset');

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

module.exports.register = async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;
  if (!username || !password || !email || !firstName || !lastName) {
    throw new ExpressError('Please fill in all registration fields.', 400);
  }

  const user = new User({ username, email, firstName, lastName });
  let registeredUser;
  try {
    registeredUser = await User.register(user, password);
  } catch (err) {
    throw new ExpressError(registrationErrorMessage(err), 400);
  }
  const token = signToken(registeredUser._id);

  res.status(201).json({ token, user: publicUser(registeredUser) });
};

module.exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    throw new ExpressError('Please enter a username and password.', 400);
  }

  const auth = User.authenticate();
  const { user, error } = await new Promise((resolve) => {
    auth(username, password, (err, authenticatedUser, info) => {
      if (err) {
        resolve({ error: err });
      } else if (!authenticatedUser) {
        resolve({ error: info || new Error('Invalid credentials') });
      } else {
        resolve({ user: authenticatedUser });
      }
    });
  });

  if (error || !user) {
    throw new ExpressError('That username or password doesn’t match.', 401);
  }

  const token = signToken(user._id);
  res.json({ token, user: publicUser(user) });
};

module.exports.me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

module.exports.logout = async (_req, res) => {
  res.json({ ok: true });
};

module.exports.forgotPassword = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
  if (!email) {
    throw new ExpressError('Please enter the email on your account.', 400);
  }

  const user = await User.findOne({
    email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });

  if (user) {
    const { token, hashed } = createResetToken();
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: `${appUrl(req)}/reset-password/${token}`,
        firstName: user.firstName,
      });
    } catch (err) {
      console.error('Password reset email failed:', err.message);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      throw new ExpressError('We couldn’t send that email right now. Please try again in a few minutes.', 500);
    }
  }

  res.json({
    ok: true,
    message: 'If that email is in Curate, we sent a reset link. Check your inbox.',
  });
};

module.exports.resetPassword = async (req, res) => {
  const { token } = req.body;
  const { password, confirmPassword } = req.body;

  if (!token) {
    throw new ExpressError('That reset link is invalid or has expired. Request a new one.', 400);
  }
  if (!password || password.length < 8) {
    throw new ExpressError('Please choose a password with at least 8 characters.', 400);
  }
  if (password !== confirmPassword) {
    throw new ExpressError('Those passwords don’t match.', 400);
  }

  const user = await User.findOne({
    resetPasswordToken: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ExpressError('That reset link is invalid or has expired. Request a new one.', 400);
  }

  await user.setPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ ok: true, message: 'Your password is updated. You can sign in now.' });
};

