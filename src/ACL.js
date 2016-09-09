import set from 'lodash/set';
import get from 'lodash/get';
import has from 'lodash/has';

export default class ACL {
  constructor() {
    this.permissionsTree = {};
  }

  define(permission, check) {
    if (
      has(this.permissionsTree, permission) &&
      (typeof get(this.permissionsTree, permission) === 'function')
    ) {
      throw new Error(`Permission ${permission} already registered!`);
    }

    if (typeof check !== 'function') {
      throw new Error(
        `Permission ${permission} needs to be registered with a check function
        (got a ${typeof check} instead)!`
      );
    }

    set(
      this.permissionsTree,
      permission,
      Object.assign(check, get(this.permissionsTree, permission, {}))
    );

    return this;
  }

  check(permission, ...args) {
    if (!has(this.permissionsTree, permission)) {
      throw new Error(`Permission "${permission}" was not defined!`);
    }

    let doCheck;
    const segments = permission.split('.');
    do {
      doCheck = get(this.permissionsTree, segments.join('.'));
      segments.pop();
    } while (segments.length && typeof doCheck !== 'function');

    if (typeof doCheck !== 'function') {
      throw new Error(`No check function for "${permission}" permission!`);
    }

    return doCheck(...args);
  }

  asyncCheck(permission, args) {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.check(permission, args));
      } catch (err) {
        reject(err);
      }
    });
  }
}

export class MatchersACL extends ACL {
  constructor() {
    super();
    this.matchersMap = new Map();
  }

  define(permissionOrMatcher, check) {
    if (!(permissionOrMatcher instanceof RegExp)) {
      return super.defined(permissionOrMatcher, check);
    }

    const matcher = permissionOrMatcher;
    if (this.matchersMap.has(matcher)) {
      throw new Error(`Matcher ${matcher} already registered!`);
    }

    this.matchersMap.set(matcher, check);

    return this;
  }

  check(permission, ...args) {
    try {
      return super.check(permission, ...args);
    } catch (err) {
      for (const matcher of this.matchersMap.keys()) {
        if (matcher.test(permission)) {
          return this.matchersMap.get(matcher)(...args);
        }
      }

      throw new Error(`Unable to find matcher for "${permission}" permission!`);
    }
  }
}

export const allowRoles = (roles, check = () => true) => (...args) => {
  const { user } = args[0];
  if (!roles.includes(user.role)) {
    return false;
  }

  return check(...args);
};

export const denyRoles = (roles, check = () => true) => (...args) => {
  const { user } = args[0];
  if (roles.includes(user.role)) {
    return false;
  }

  return check(...args);
};

export const whenStates = (states) => (...args) => {
  const { mediaPlan } = args[0];
  const { state } = mediaPlan;
  const doCheck = states[state];

  if (typeof doCheck === 'function') {
    return doCheck(...args);
  }

  return !!doCheck;
};

export const whenAssociated = (check = () => true) => (...args) => {
  const { mediaPlan, user } = args[0];
  const isAssociated = mediaPlan.primaryContact._id.toString() === user._id.toString();
  if (!isAssociated) {
    return false;
  }

  return check(...args);
};

export const withConfig = (config, check = () => true) => (...args) => {
  return check(...args);
};
