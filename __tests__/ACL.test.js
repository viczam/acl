import ACL, { decorators, MatchersACL } from '../src';
const { allowRoles, denyRoles } = decorators;

describe('ACL', () => {
  let acl;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should do something', () => {
    acl.define('user.doSomething', () => true);
    acl.define('user.doSomething.bad', () => false);
    expect(acl.check('user.doSomething')).toBeTruthy();
    expect(acl.check('user.doSomething.bad')).toBeFalsy();
  });

  it('should cascade access', () => {
    acl.define('ns', () => false);
    acl.define('ns.permission', () => true);
    expect(acl.check('ns.permission')).toBeFalsy();
  });

  it('should work with roles', () => {
    acl.define('vault', allowRoles(['owner']));
    acl.define('value', denyRoles(['thief']));

    const owner = {
      role: 'owner',
    };

    const thief = {
      role: 'thief',
    };

    expect(acl.check('vault', { user: owner })).toBeTruthy();
    expect(acl.check('vault', { user: thief })).toBeFalsy();
  });

  it('should work with composable roles', () => {
    acl.define('vault', denyRoles(['thief'], allowRoles(['owner'])));
    expect(acl.check('vault', { user: { role: 'owner' } })).toBeTruthy();
    expect(acl.check('vault', { user: { role: 'thief' } })).toBeFalsy();
  });

  it('should work against hackers', () => {
    acl.define('website.adminArea', allowRoles(['admin']));
    acl.define('website.public', () => true);
    acl.define('website', ({ user }) => (user.role === 'hacker' ? user.isWhiteHat : true));

    expect(acl.check('website', { user: { role: 'admin' } })).toBeTruthy();
    expect(acl.check('website.adminArea', { user: { role: 'anonymous' } })).toBeFalsy();
    expect(
      acl.check('website.public', { user: { role: 'hacker', isWhiteHat: false } })
    ).toBeFalsy();
  });

  it('should work with promises', () => {
    acl.define('doSomething', () => new Promise((resolve) => setTimeout(resolve, 100)));

    return acl.asyncCheck('doSomething').then(() => {
      expect(true).toBeTruthy();
    }, () => {
      expect(false).toBeTruthy();
    });
  });

  it('should work with regular expressions', () => {
    acl = new MatchersACL();
    acl.define(/^product\.update/, () => true);
    acl.define(/^product\.delete/, () => false);
    expect(acl.check('product.update.price')).toBeTruthy();
    expect(acl.check('product.delete')).toBeFalsy();
  });
});
