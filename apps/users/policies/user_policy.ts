import PermissionResolver from "#apps/shared/services/permissions/permission_resolver";
import User from '#apps/users/models/user';
import { allowGuest, BasePolicy } from "@adonisjs/bouncer";
import { AuthorizerResponse } from "@adonisjs/bouncer/types";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import { JwtPayload } from "jsonwebtoken";


@inject()
export default class UserPolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected permissionResolver: PermissionResolver,
    protected ctx: HttpContext
  ) {
    super();
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  async before() {
    const isAdmin = await this.permissionResolver
      .createResolve(this.payload.resource_access)
      .verifyAccess('admin')

    if (isAdmin) return true
  }


  @allowGuest()
  async view(): Promise<AuthorizerResponse> {
    return this.permissionResolver
      .createResolve(this.payload.resource_access)
      .verifyAccess('view-users')
  }

  @allowGuest()
  async store(): Promise<AuthorizerResponse> {
    return this.permissionResolver
      .createResolve(this.payload.resource_access)
      .verifyAccess('create-users')
  }

  @allowGuest()
  async delete(): Promise<AuthorizerResponse> {
    return this.permissionResolver
      .createResolve(this.payload.resource_access)
      .verifyAccess('view-users')
  }
  @allowGuest()
  async updateEmail(_user: User | null, senderId: string, userId: string): Promise<AuthorizerResponse> {
    return senderId == userId
  }


}
