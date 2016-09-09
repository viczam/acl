import Joi from 'joi';
// - merge together
// - remove the namespace
// - validate simple functions instead of Joi: user, resource, arguments
// - write tests

export default class PermissionsManager extends Map {
  constructor(namespace = '', permissions = {}) {
    super();
    this.namespace = namespace;
    this.permissions = permissions;
  }

  add(permission, validator) {
    if (!Object.keys(this.permissions).includes(permission)) {
      throw new Error(`You must first allow this permission (${permission})!`);
    }

    if (!this.has(permission)) {
      this.set(permission, []);
    }

    this.get(permission).push(validator);
  }

  check(permission, data) {
    if (!this.has(permission)) {
      throw new Error(`Couldn't find "${permission}" permission!`);
    }

    const validator = Joi.alternatives().try(...this.get(permission));
    const { error } = Joi.validate(data, validator);

    return !error;
  }
}

export class BENPermissionsManager extends PermissionsManager {
  constructor(namespace, serializedPermissions, rulesGenerator = () => {}) {
    super(
      namespace,
      Object.keys(serializedPermissions).reduce((acc, permission) => ({
        ...acc,
        [permission]: '',
      }), {})
    );

    this.rulesGenerator = rulesGenerator;

    Object.keys(serializedPermissions).forEach((permission) => {
      const rules = serializedPermissions[permission];
      rules.forEach((rule) => {
        this.add(permission, rule);
      });
    });
  }

  add(permission, rules) {
    const schema = this.rulesGenerator(rules);
    return super.add(permission, Joi.object().keys(schema).unknown(true));
  }

  can(user, permission, subject = {}) {
    return this.check(permission, {
      user,
      subject,
    });
  }
}

export class MediaPlanPermissions extends BENPermissionsManager {
  add(permission, rules) {
    const schema = {};
    if (Array.isArray(rules.roles)) {
      schema.user = Joi.object().keys({
        role: Joi.string().valid(rules.roles),
      }).required();
    }

    if (rules.states) {
      schema.mediaPlan = Joi.object().keys({
        status: Joi.string().valid(rules.states),
      });
    }

    return super.add(permission, schema);
  }
}
