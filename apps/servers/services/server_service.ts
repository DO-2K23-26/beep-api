import Server from '#apps/servers/models/server'
import User from '#apps/users/models/user'
import { CreateServerSchema, UpdateBannerSchema, UpdateServerSchema } from '../validators/server.js'
import StorageService from '#apps/storage/services/storage_service'
import { assert } from 'node:console'
import { inject } from '@adonisjs/core'

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

  async findById(serverId: string): Promise<Server> {
    return Server.query().where('id', serverId).firstOrFail()
  }

  async create(
    { name, description, visibility, icon }: CreateServerSchema,
    ownerId: string
  ): Promise<Server> {
    assert(name === 'public' || name === 'private') // assert that the name is either 'public' or 'private', if not the case validator failed

    const checkIfServerExists = await Server.query().where('name', name).first()
    if (checkIfServerExists) {
      throw new Error('Server already exists')
    }

    const server = await Server.create({
      banner: '',
      icon: '',
      name: name,
      description: description,
      visibility: visibility as 'public' | 'private',
      ownerId: ownerId,
    })

    let path: string | null = null

    if (icon) {
      path = await this.storageService.updatePicture(icon, server.id)
    } else {
      throw new Error('No icon provided')
    }

    server.icon = path

    return server.save()
  }

  // get owner of the server and return its id
  async getOwner(serverId: string): Promise<string> {
    const server = await Server.findOrFail(serverId)
    return server.ownerId
  }

  async findUsersByServerId(serverId: string): Promise<User[]> {
    // Rechercher le serveur par id et précharger les utilisateurs associés
    const server = await Server.query().where('id', serverId).preload('users').firstOrFail()

    // Retourner la liste des utilisateurs
    return server.users
  }

  // async timeout(serverId: string, userId: string): Promise<void> {
  //   const server = await Server.findOrFail(serverId)
  //   return server.isTimedOut(userId)
  // }

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

  async join(serverId: string, userId: string): Promise<Server> {
    const server = await Server.findOrFail(serverId)
    try {
      await server.related('users').attach([userId])
    } catch (e) {
      console.error(e)
    }
    return server
  }

  async discover(page: number = 1, limit: number = 10): Promise<Server[]> {
    const pageServers = await Server.query().where('visibility', 'public').paginate(page, limit)
    return pageServers.all()
  }

  async discoverAndSearch(search: string, page: number = 1, limit: number = 10): Promise<Server[]> {
    const pageServers = await Server.query()
      .where('visibility', 'public')
      .where('name', 'like', `%${search}%`)
      .paginate(page, limit)
    return pageServers.all()
  }
}
