import ACL, { allowRoles, denyRoles, whenStates, MatchersACL } from '../src/ACL';

describe('ACL', () => {
  let acl;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should do something', () => {
    acl.define('mediaPlan.doSomething', (bool) => bool);
    acl.define('mediaPlan.doSomething.very.bad', () => true);
    expect(acl.check('mediaPlan.doSomething', true)).toBeTruthy();
    expect(acl.check('mediaPlan.doSomething.very', true)).toBeTruthy();
  });

  it('should do something else', () => {
    acl.define('mediaPlan.allow', allowRoles(['admin']));
    acl.define('mediaPlan.deny', denyRoles(['test']));
    acl.define('mediaPlan.doSomething',
      denyRoles(['test'],
        allowRoles(['admin'])
      )
    );

    expect(acl.check('mediaPlan.doSomething', { user: { role: 'admin' } })).toBeTruthy();
    expect(acl.check('mediaPlan.doSomething', { user: { role: 'test' } })).toBeFalsy();
    expect(acl.check('mediaPlan.allow', { user: { role: 'admin' } })).toBeTruthy();
    expect(acl.check('mediaPlan.deny', { user: { role: 'test' } })).toBeFalsy();
  });

  it('should handle mediaPlan permissions', () => {
    acl
      .define('mediaPlan.update',
        whenStates({
          draft: allowRoles(['internalAdmin', 'internalSuperUser', 'internalSeniorManager']),
          completed: allowRoles(['internalAdmin']),
        })
      )
      .define('mediaPlan.update.cpm',
        whenStates({
          notSubmitted: allowRoles(['internalAdmin', 'internalSuperUser', 'internalSeniorManager']),
        })
      );

    expect(
      acl.check('mediaPlan.update', {
        user: { role: 'internalAdmin' },
        mediaPlan: { state: 'draft' },
      })
    ).toBeTruthy();

    expect(
      acl.check('mediaPlan.update.cpm', {
        user: { role: 'internalSeniorManager' },
        mediaPlan: { state: 'notSubmitted' },
      })
    ).toBeTruthy();

    expect(
      acl.check('mediaPlan.update.cpm', {
        user: { role: 'internalReadOnly' },
        mediaPlan: { state: 'notSubmitted' },
      })
    ).toBeFalsy();
  });

  it('should work with promises', () => {
    acl.define('mediaPlan.doSomething', () => new Promise((resolve) => {
      setTimeout(resolve, 100);
    }));

    return acl.asyncCheck('mediaPlan.doSomething').then(() => {
      expect(true).toBeTruthy();
    }, () => {
      expect(false).toBeTruthy();
    });
  });

  it('should work with regular expressions', () => {
    acl = new MatchersACL();
    acl.define(/^mediaPlan\.update\./, () => true);
    expect(acl.check('mediaPlan.update.CPM')).toBeTruthy();
  });
});
