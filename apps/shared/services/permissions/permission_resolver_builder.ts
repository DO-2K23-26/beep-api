import {ResourceAccess} from "#apps/authentication/contracts/jwt";

export default class PermissionResolverBuilder {
  constructor(
    private resourceAccess: ResourceAccess,
  ) {}

  async verifyAccess(...roles: string[]): Promise<boolean> {
    return roles.some((role) => this.resourceAccess.roles.includes(role))
  }
}
