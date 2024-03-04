import User from '#apps/users/models/user'

export default class UserService {
  public async findAll() {
    return User.query()
  }

  public async create(data: { email: string, password: string}) {
    return User.create(data)
  }
}
