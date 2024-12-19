import Member from '#apps/members/models/member'
import Server from '#apps/servers/models/server'
import { generateSnowflake } from '#apps/shared/services/snowflake'
import StorageService from '#apps/storage/services/storage_service'
import UserNotFoundException from '#apps/users/exceptions/user_not_found_exception'
import User from '#apps/users/models/user'
import { inject } from '@adonisjs/core'
import ServerAlreadyExistsException from '../exceptions/server_already_exists_exception.js'
import { CreateServerSchema, UpdateBannerSchema, UpdateServerSchema } from '../validators/server.js'

@inject()
export default class ServerService {
  constructor(private storageService: StorageService) {}

  async findAll(page: number = 1, limit: number = 10): Promise<Server[]> {
    const pageServers = await Server.query().paginate(page, limit)
    return pageServers.all()
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<Server[]> {
    const pageServers = await Server.query()
      .whereHas('users', (builder) => {
        builder.where('id', userId)
      })
      .paginate(page, limit)
    return pageServers.all()
  }

  async findByChannelId(channelId: string): Promise<Server> {
    const server = await Server.query()
      .whereHas('channels', (builder) => {
        builder.where('id', channelId)
      })
      .firstOrFail()
    return server
  }

  async findById(serverId: string): Promise<Server> {
    return Server.query().where('id', serverId).firstOrFail()
  }

  async create(
    { name, description, visibility, icon }: CreateServerSchema,
    ownerId: string
  ): Promise<Server> {
    const checkIfServerExists = await Server.query().where('name', name).first()
    if (checkIfServerExists) {
      throw new ServerAlreadyExistsException('Server already exists', {
        status: 400,
        code: 'E_SERVER_ALREADY_EXISTS',
      })
    }

    const user = await User.findOrFail(ownerId).catch(() => {
      throw new UserNotFoundException('User not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })
    const sn = generateSnowflake()
    const server = await Server.create({
      banner: '',
      icon: '',
      name: name,
      description: description ?? '',
      visibility: visibility as 'public' | 'private',
      ownerId: ownerId,
      serialNumber: sn,
    })
    Member.create({
      userId: ownerId,
      serverId: server.id,
      avatar: user.profilePicture,
      nickname: user.username,
    })

    let path: string | null = null

    if (icon) {
      path = await this.storageService.updatePicture(icon, server.id)
      server.icon = path
    }

    return server.save()
  }

  async getOwner(serverId: string): Promise<string> {
    const server = await Server.findOrFail(serverId)
    return server.ownerId
  }

  async findUsersByServerId(serverId: string): Promise<User[]> {
    const server = await Server.query().where('id', serverId).preload('users').firstOrFail()
    return server.users
  }

  async update(serverId: string, payload: UpdateServerSchema): Promise<Server> {
    const server = await Server.findOrFail(serverId)
    server.merge(payload)
    await server.save()
    return server
  }

  async delete(serverId: string): Promise<void> {
    const server: Server = await Server.findOrFail(serverId)
    await server.delete()
  }

  // banner

  async updateBanner(payload: UpdateBannerSchema): Promise<void> {
    const server = await Server.findOrFail(payload.params.serverId)
    server.banner = await new StorageService().updateBanner(payload.attachment, server.id)
    await server.save()
  }

  // picture

  async updatePicture(payload: UpdateBannerSchema): Promise<void> {
    const server = await Server.findOrFail(payload.params.serverId)
    server.icon = await new StorageService().updatePicture(payload.attachment, server.id)
    await server.save()
  }

  async discover(page: number = 1, limit: number = 10): Promise<Server[]> {
    const pageServers = await Server.query().where('visibility', 'public').paginate(page, limit)
    return pageServers.all()
  }

  async discoverAndSearch(search: string, page: number = 1, limit: number = 10): Promise<Server[]> {
    const pageServers = await Server.query()
      .where('visibility', 'public')
      .where('name', 'ilike', `%${search}%`)
      .paginate(page, limit)
    return pageServers.all()
  }
}
