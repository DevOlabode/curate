function registrationErrorMessage(err) {
  if (!err) {
    return 'Unable to create this account. Please try again.';
  }

  const isDuplicate =
    err.code === 11000 ||
    err.code === 11001 ||
    (typeof err.message === 'string' && err.message.includes('E11000'));

  if (isDuplicate) {
    const field = duplicateField(err);
    if (field === 'email') {
      return 'An account with this email already exists. Try signing in, or use a different email.';
    }
    if (field === 'username') {
      return 'That username is already taken. Please choose another.';
    }
    return 'An account with these details already exists. Try signing in instead.';
  }

  if (typeof err.message === 'string' && /already registered/i.test(err.message)) {
    return 'That username is already taken. Please choose another.';
  }

  return err.message || 'Unable to create this account. Please try again.';
}

function duplicateField(err) {
  if (err.keyPattern) {
    return Object.keys(err.keyPattern)[0];
  }
  if (err.keyValue) {
    return Object.keys(err.keyValue)[0];
  }

  const match = String(err.message || '').match(/index:\s+(\w+)_/);
  return match ? match[1] : null;
}

module.exports = { registrationErrorMessage };
