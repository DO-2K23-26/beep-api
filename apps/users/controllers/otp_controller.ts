import { HttpContext } from '@adonisjs/core/http'
import OtpService from '#apps/users/services/otp_service'
import MailService from '#apps/authentication/services/mail_service'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import vine from '@vinejs/vine'
import { emailUpdateValidator } from '../validators/users.js'

export default class OtpController {
  private otpService: OtpService

  constructor() {
    const authenticationService = new AuthenticationService()
    const mailService = new MailService(authenticationService)
    this.otpService = new OtpService(mailService)
  }

  // Generate OTP
  public async generateOtp({ request, response }: HttpContext) {
    try {
      const { email } = await request.validateUsing(emailUpdateValidator)
      await this.otpService.generateOtp({ email })
      return response.ok({ message: 'OTP sent successfully' })
    } catch (error) {
      return response.badRequest({ errors: error.messages })
    }
  }

  // Verify OTP
  public async verifyOtp({ request, response }: HttpContext) {
    const otpVerificationValidator = vine.compile(
      vine.object({
        email: vine.string().email(),
        otp: vine.string().fixedLength(6), // OTP is a 6-digit code
      })
    )

    // Validate the incoming request using the otpVerificationValidator schema
    const { email, otp } = await request.validateUsing(otpVerificationValidator)

    const isValid = await this.otpService.verifyOtp({ email, otp })
    if (!isValid) {
      return response.badRequest({ error: 'Invalid or expired OTP' })
    }

    return response.ok({ message: 'OTP verified successfully' })
  }
}
