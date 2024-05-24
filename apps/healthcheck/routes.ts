import router from '@adonisjs/core/services/router'

const HealthchecksController = () => import('#apps/healthcheck/controllers/healthchecks_controller')

router.group(() => {
  router.get('up', [HealthchecksController, 'up'])
})
