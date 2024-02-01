import router from '@adonisjs/core/services/router'

const UsersController = () => import("#apps/users/controllers/users_controller")

router.group(() => {
  router.get('', [UsersController, 'index'])
}).prefix('/users')
