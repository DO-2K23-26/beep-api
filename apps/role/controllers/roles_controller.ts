import { inject } from '@adonisjs/core'
import RoleService from '#apps/role/services/role_service'
@inject()
export default class RolesController {
  constructor(protected roleService: RoleService) { }
}
