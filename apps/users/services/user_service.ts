import User from '#apps/users/models/user'

export default class UserService {
  public async findAll() {
    return User.query()
  }
}
