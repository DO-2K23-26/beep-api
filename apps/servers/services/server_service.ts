import Server from '#apps/servers/models/server'
import { CreateServerSchema, UpdateServerSchema } from '../validators/server.js'

export default class ServerService {
  async findAll(page: number = 1, limit: number = 10): Promise<Server[]> {
    return Server.query().paginate(page, limit)
  }

  async findByUserId(userId: string): Promise<Server[]> {
    return Server.query()
      .whereHas('users', (builder) => {
        builder.where('user_id', userId)
      })
      .paginate(1, 10)
  }

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
