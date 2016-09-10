export const allowRoles = (roles, check = () => true) => (...args) => {
  const { user } = args[0];
  if (!user) {
    throw new Error('You have to check against a user.');
  }
  if (!roles.includes(user.role)) {
    return false;
  }

  return check(...args);
};

export const denyRoles = (roles, check = () => true) => (...args) => {
  const { user } = args[0];
  if (!user) {
    throw new Error('You have to check against a user.');
  }
  if (roles.includes(user.role)) {
    return false;
  }

  return check(...args);
};
