import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const FilesController = () => import('#apps/storage/controllers/storages_controller')
router
  .group(() => {
    router
      .group(() => {
        router.get('/:id', [FilesController, 'show'])
        router.post('/', [FilesController, 'store'])
        router.put('/:id', [FilesController, 'update'])
        router.delete('/:id', [FilesController, 'destroy'])
      })
      .prefix('/files')
  })
  .prefix('/storage')
  .use(
    middleware.auth({
      guards: ['jwt'],
    })
  )
