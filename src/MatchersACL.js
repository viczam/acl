import ACL from './ACL';

export default class MatchersACL extends ACL {
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
