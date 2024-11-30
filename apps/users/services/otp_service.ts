import redis from '@adonisjs/redis/services/main'
import MailService from '#apps/authentication/services/mail_service'
import cryptoRandomString from 'crypto-random-string'

export default class OtpService {
  private otpExpiry = 300 // OTP expires in 5 minutes

  constructor(private mailService: MailService) { }

  /**
   * Generate and send OTP for email update
   * @param email - Recipient's email
   */
  public async generateOtp(email: string): Promise<void> {
    const otp = cryptoRandomString({ length: 6, type: 'numeric' }) // Generate 6-digit OTP
    const redisKey = this.getRedisKey(email)

    // Store OTP in Redis with expiration
    await redis.setex(redisKey, this.otpExpiry, otp)

    // Send OTP via email
    await this.mailService.sendEmailUpdateMail(email, otp)
  }

  /**
   * Verify the provided OTP
   * @param email - Email associated with the OTP
   * @param otp - OTP to verify
   * @returns True if valid, False otherwise
   */
  public async verifyOtp(email: string, otp: string): Promise<boolean> {
    const redisKey = this.getRedisKey(email)
    const storedOtp = await redis.get(redisKey)

    if (storedOtp && storedOtp === otp) {
      await redis.del(redisKey) // Delete OTP after successful verification
      return true
    }

    return false
  }

  /**
   * Helper: Generate Redis key
   * @param email - Email address
   */
  private getRedisKey(email: string): string {
    return `otp:${email}`
  }
}
