import { Permissions } from '#apps/shared/enums/permissions'

export default class PermissionsService {
  declare permissionSet: Permissions

  isValidMask(mask: number): boolean {
    const maxPermissionValue = this.calculateMaxPermissionValue()
    const maxPermissionLength = this.calculateMaxPermissionLength()

    if (mask > maxPermissionValue || mask < 0) return false

    if (mask.toString(2).length > maxPermissionLength) return false

    return true
  }

  calculateMaxPermissionValue() {
    return Math.max(
      ...(Object.values(Permissions).filter((value) => typeof value === 'number') as number[])
    )
  }

  calculateMaxPermissionLength() {
    return this.calculateMaxPermissionValue().toString(2).length
  }

  has_permission(mask: number, permission: Permissions): boolean {
    // Check if mask is valid
    if (!this.isValidMask(mask)) {
      return false
    }

    // Bitwise AND to check if all required permissions are present
    return (mask & permission) === permission
  }

  validate_permissions(mask: number, permissions: Permissions[]): boolean {
    return permissions.every((permission) => this.has_permission(mask, permission))
  }
}
