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
      throw new Error(`Permission "${permission}" already registered!`);
    }

    if (typeof check !== 'function') {
      throw new Error(
        `Permission "${permission}" needs to be registered with a check function
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

    if (typeof get(this.permissionsTree, permission) !== 'function') {
      throw new Error(`No check function for "${permission}" permission!`);
    }

    let doCheck;
    let isAllowed;
    const segments = permission.split('.');
    let index = 1;
    do {
      doCheck = get(this.permissionsTree, segments.slice(0, index).join('.'));
      isAllowed = typeof doCheck === 'function' ? doCheck(...args) : true;
      index++;
    } while ((index <= segments.length) && isAllowed);

    return isAllowed;
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
