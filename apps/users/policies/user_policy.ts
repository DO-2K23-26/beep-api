
import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import User from '#apps/users/models/user'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'

@inject()
export default class UserPolicy extends BasePolicy {
  constructor(
    protected permissionResolver: PermissionResolver,
  ) {
    super()
  }

  async before(payload: JwtPayload) {
    const isAdmin = await this.permissionResolver
      .createResolve(payload.resource_access)
      .verifyAccess('admin')

    if (isAdmin) return true
  }

  async view(payload: JwtPayload): Promise<AuthorizerResponse> {
    return this.permissionResolver
      .createResolve(payload.resource_access)
      .verifyAccess('view-users')
  }

  async store(payload: JwtPayload): Promise<AuthorizerResponse> {
    return this.permissionResolver
      .createResolve(payload.resource_access)
      .verifyAccess('create-users')
  }

  async delete(payload: JwtPayload): Promise<AuthorizerResponse> {
    return this.permissionResolver
      .createResolve(payload.resource_access)
      .verifyAccess('view-users')
  }

  @allowGuest()
  async updateEmail(
    _user: User | null,
    senderId: string,
    userId: string
  ): Promise<AuthorizerResponse> {
    return senderId === userId
  }
}
