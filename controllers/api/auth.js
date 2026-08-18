const User = require('../../models/user');
const { signToken } = require('../../utils/jwt');
const ExpressError = require('../../utils/expressError');
const { registrationErrorMessage } = require('../../utils/duplicateKeyError');

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
    throw new ExpressError('All registration fields are required', 400);
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
    throw new ExpressError('Username and password are required', 400);
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
    throw new ExpressError('Invalid username or password', 401);
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
