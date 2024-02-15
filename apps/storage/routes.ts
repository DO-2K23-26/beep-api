import router from '@adonisjs/core/services/router'
const FilesController = () => import('#apps/storage/controllers/storages_controller')
router
  .group(() => {
    router
      .group(() => {
        router.get('/:key', [FilesController, 'show'])
        router.post('/', [FilesController, 'store'])
        router.delete('/:key', [FilesController, 'destroy'])
      })
      .prefix('/files')
  })
  .prefix('/storage')
