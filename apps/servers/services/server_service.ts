import Server from '#apps/servers/models/server'
import User from '#apps/users/models/user'
import { CreateServerSchema, UpdateServerSchema } from '../validators/server.js'

export default class ServerService {
  async findAll(page: number = 1, limit: number = 10): Promise<Server[]> {
    const pageServers = await Server.query().paginate(page, limit)
    return pageServers.all()
  }

  // public async findByUserId(userId: string): Promise<Server[]> {
  //   // Rechercher l'utilisateur par id et précharger les serveurs associés
  //   const user = await User.query()
  //     .where('id', userId)
  //     .preload('servers')
  //     .firstOrFail()

  //   // Retourner la liste des serveurs
  //   return user.servers
  // }

  async findById(serverId: string): Promise<Server> {
    return Server.query().where('id', serverId).firstOrFail()
  }

  async create(payload: CreateServerSchema, ownerId: string): Promise<Server> {
    return await Server.create({
      ...payload,
      ownerId: ownerId,
    })
  }

  async join(userId: string, serverId: string): Promise<Server> {
    const server = await Server.findOrFail(serverId)
    await server.related('users').attach([userId])
    return server
  }

  async getOwner(serverId: string): Promise<string> {
    const server = await Server.findOrFail(serverId)
    return server.ownerId
  }

  public async findUsersByServerId(serverId: string): Promise<User[]> {
    // Rechercher le serveur par id et précharger les utilisateurs associés
    const server = await Server.query()
      .where('id', serverId)
      .preload('users')
      .firstOrFail()

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
}
