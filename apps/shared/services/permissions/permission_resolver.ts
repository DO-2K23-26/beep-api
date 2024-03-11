import { ResourceAccess } from '#apps/authentication/contracts/jwt'
import PermissionResolverBuilder from '#apps/shared/services/permissions/permission_resolver_builder'

export default class PermissionResolver {
  createResolve(resourceAccess: ResourceAccess): PermissionResolverBuilder {
    return new PermissionResolverBuilder(resourceAccess)
  }
}
