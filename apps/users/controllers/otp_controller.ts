import { HttpContext } from '@adonisjs/core/http'
import OtpService from '#apps/users/services/otp_service'
import MailService from '#apps/authentication/services/mail_service'
import AuthenticationService from '#apps/authentication/services/authentication_service'

export default class OtpController {
  private otpService: OtpService

  constructor() {
    const authenticationService = new AuthenticationService()
    const mailService = new MailService(authenticationService)
    this.otpService = new OtpService(mailService)
  }

  /**
   * Generate and send OTP
   */
  public async generateOtp({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email) {
      return response.badRequest({ message: 'Email is required' })
    }

    await this.otpService.generateOtp(email)
    return response.ok({ message: 'OTP sent successfully' })
  }

  /**
   * Verify OTP
   */
  public async verifyOtp({ request, response }: HttpContext) {
    const { email, otp } = request.only(['email', 'otp'])

    if (!email || !otp) {
      return response.badRequest({ message: 'Email and OTP are required' })
    }

    const isValid = await this.otpService.verifyOtp(email, otp)
    if (!isValid) {
      return response.unauthorized({ message: 'Invalid or expired OTP' })
    }

    return response.ok({ message: 'OTP verified successfully' })
  }
}
