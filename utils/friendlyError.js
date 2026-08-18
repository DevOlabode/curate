const { registrationErrorMessage } = require('./duplicateKeyError');

function friendlyError(err) {
  if (!err) {
    return {
      statusCode: 500,
      message: 'Something went wrong. Please try again.',
    };
  }

  if (err.name === 'CastError') {
    const model = err.model?.modelName;
    if (model === 'Bookmark' || err.path === '_id' && /bookmark/i.test(String(err.message))) {
      return { statusCode: 404, message: "We couldn't find that bookmark." };
    }
    if (model === 'Collection') {
      return { statusCode: 404, message: "We couldn't find that collection." };
    }
    if (model === 'User') {
      return { statusCode: 404, message: "We couldn't find that account." };
    }
    return { statusCode: 404, message: "We couldn't find that page." };
  }

  if (err.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors)
      .map((item) => friendlyPathMessage(item))
      .join(' ');
    return { statusCode: 400, message };
  }

  if (err.code === 11000 || String(err.message || '').includes('E11000')) {
    return { statusCode: 400, message: registrationErrorMessage(err) };
  }

  const statusCode = err.statusCode || 500;
  const raw = err.message || '';

  if (statusCode >= 500) {
    return {
      statusCode,
      message: 'Something went wrong on our side. Please try again.',
    };
  }

  return {
    statusCode,
    message: friendlyKnownMessage(raw) || raw || 'Something went wrong. Please try again.',
  };
}

function friendlyPathMessage(item) {
  const path = item.path;
  if (item.kind === 'required') {
    if (path === 'title') return 'Please add a title.';
    if (path === 'url') return 'Please add a URL.';
    if (path === 'name') return 'Please add a collection name.';
    return `Please fill in ${path}.`;
  }
  return 'Some of that information wasn’t valid. Please try again.';
}

function friendlyJoiMessage(error) {
  return error.details
    .map((detail) => {
      const field = detail.path[0];
      if (detail.type === 'any.required' || detail.type === 'string.empty') {
        if (field === 'title') return 'Please add a title.';
        if (field === 'url') return 'Please add a URL.';
        if (field === 'name') return 'Please add a collection name.';
        if (field === 'username') return 'Please enter a username.';
        if (field === 'password') return 'Please enter a password.';
        return `Please fill in ${field}.`;
      }
      if (detail.type === 'string.uri') {
        return 'Please enter a valid URL. voult.dev or reddit.com is fine - no https:// needed.';
      }
      if (detail.type === 'string.email') return 'Please enter a valid email address.';
      return 'Some of that information wasn’t valid. Please try again.';
    })
    .join(' ');
}

function friendlyKnownMessage(message) {
  const map = {
    'Page not found': "That page doesn’t exist.",
    'Bookmark not found': "We couldn't find that bookmark.",
    'Bookmark not found!': "We couldn't find that bookmark.",
    'Collection not found': "We couldn't find that collection.",
    'User not found!': "We couldn't find that account.",
    'Authentication required': 'Please sign in to continue.',
    'Invalid token': 'Your session expired. Please sign in again.',
    'Invalid or expired token': 'Your session expired. Please sign in again.',
    'Invalid username or password': 'That username or password doesn’t match.',
    'API route not found': "That API route doesn’t exist.",
  };
  return map[message];
}

function redirectForError(req) {
  if (req.path.startsWith('/collections')) return '/collections';
  if (req.path.startsWith('/bookmark')) return '/bookmark';
  if (req.path.startsWith('/user')) return '/user/info';
  return '/';
}

module.exports = {
  friendlyError,
  friendlyJoiMessage,
  redirectForError,
};
