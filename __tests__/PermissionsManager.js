import PermissionsManager, { MediaPlanPermissions, BENPermissionsManager } from '../src/PermissionsManager';
import Joi from 'joi';

describe('PermissionsManager', () => {
  let pm;

  beforeEach(() => {
    pm = new PermissionsManager('meh', {
      test: 'it is something',
    });
  });

  it('should do something', () => {
    pm.add('test', Joi.number());
    expect(pm.check('test', 5)).toBeTruthy();
  });

  // it('should work with media plan', () => {
  //   const mp = new PermissionsManager('mediaplan', {
  //     read: 'GET /mediaplan/id',
  //   });
  //
  //   mp.add('read', { roles: ['internal'] });
  //   mp.add('read', { roles: ['external'], states: ['published'] });
  //   // mp.add('create', { roles: ['internal', 'external'] });
  //
  //   const internal = {
  //     role: 'internal',
  //   };
  //
  //   const external = {
  //     role: 'external',
  //   };
  //
  //   const mediaPlan = {
  //     status: 'published',
  //   };
  //
  //   expect(mp.can(internal, 'read')).toBeTruthy();
  //   expect(mp.can(external, 'read', mediaPlan)).toBeTruthy();
  // });

  it('should work with alex examples', () => {
    const ben = new BENPermissionsManager('mediaplan', {
      read: [
        { roles: ['internal'] },
        { roles: ['external'], states: ['published'] },
      ],
    }, (rules) => {
      const schema = {};
      if (Array.isArray(rules.roles)) {
        schema.user = Joi.object().keys({
          role: Joi.string().valid(rules.roles),
        }).required();
      }

      if (rules.states) {
        schema.subject = Joi.object().keys({
          status: Joi.string().valid(rules.states),
        }).required();
      }

      return schema;
    });

    expect(ben.can({ role: 'internal' }, 'read')).toBeTruthy();
    expect(ben.can({ role: 'external' }, 'read', { status: 'published' })).toBeTruthy();
  });
});
