import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class PasswordMismatchException extends Exception {
  handler(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send(error.code)
  }
}
