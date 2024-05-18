import User from '#apps/users/models/user'

export default class UserService {
  async findAll() {
    return User.query().preload('roles')
  }

  async findAllToDisplay() {
    return User.query().select('id', 'username')
  }

  async findById(userId: string): Promise<User> {
    return User.query().where('id', userId).firstOrFail()
  }

  async create(data: {
    username: string
    firstName: string
    lastName: string
    email: string
    password: string
  }) {
    return User.create(data)
  }
}
