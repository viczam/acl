import intersection from 'lodash/intersection';

export const allowRoles = (roles, check = () => true) => (...args) => {
  const { user } = args[0];

  if (!user) {
    throw new Error('You have to check against a user.');
  }

  if (
    (user.role && !roles.includes(user.role)) ||
    (Array.isArray(user.roles) && !intersection(roles, user.roles).length)
  ) {
    return false;
  }

  return check(...args);
};

export const denyRoles = (roles, check = () => true) => (...args) => {
  const { user } = args[0];

  if (!user) {
    throw new Error('You have to check against a user.');
  }

  if (
    (user.role && roles.includes(user.role)) ||
    (Array.isArray(user.roles) && intersection(roles, user.roles).length > 0)
  ) {
    return false;
  }

  return check(...args);
};
