import Token from '#apps/users/models/token'
import User from '#apps/users/models/user'
import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import AuthenticationService from './authentication_service.js'

export default class MailService {
  constructor(private authenticationService: AuthenticationService) {}
  async sendMail(email: string, subject: string, htmlMessage: string) {
    const emailApp: string = env.get('SMTP_USERNAME')

    const logoUrl: string = 'https://beep.baptistebronsin.be/logo.png'
    const heightLogo: number = 100
    // Car l'image fait 400px par 400px, dans d'autres cas cette règle de mathématique est nécessaire
    const widthLogo: number = (heightLogo * 400) / 400

    const logoBody: string =
      "<img src='" +
      logoUrl +
      "' alt='Logo Beep' width='" +
      widthLogo +
      "' height='" +
      heightLogo +
      "'>"

    const emailBody: string =
      `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Beep</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #EEEEEE;">
            
                <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td>
                            <!-- En-tête de l'email avec logo -->
                            <table align="center" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 20px;">
                                        ` +
      logoBody +
      `
                                    </td>
                                </tr>
                            </table>
            
                            <!-- Contenu principal de l'email -->
                            <table style="background: white; border-radius: 10px; max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 10px 20px;">
                                        ` +
      htmlMessage +
      `
                                    </td>
                                </tr>
                            </table>
            
                            <!-- Pied de page de l'email -->
                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="text-align: center; padding: 20px;">
                                        <p>Un problème, une question ? Contactez-nous à <a href="mailto:` +
      emailApp +
      `">` +
      emailApp +
      `</a></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `

    try {
      await mail.send((message) => {
        message.to(email).from(emailApp, 'Beep').subject(subject).html(emailBody)
      })
    } catch (error) {
      console.log(error)
    }
  }

  async sendSignUpMail(user: User) {
    const subject: string = 'Bienvenue sur Beep !'
    const verificationToken: Token = await this.authenticationService.createToken(user)

    const htmlMessage: string =
      "<p>Bonjour $_PRENOM_$,</p><p>Veuillez trouver ci-dessous un bouton pour faire vérifier votre compte :</p><div style='text-align: center; margin: 40px 0;'><a href='$_URL_TOKEN_$' style='background-color: #4a7ab4; padding: 10px; border-radius: 10px; margin: 0 auto; color: white; text-decoration: none;'>Vérifier mon compte</a></div><p>Ce bouton possède une durée de validité de <span style='font-weight: bold; text-decoration: underline;'>$_TEMPS_VALIDITE_TOKEN_$ heures</span> à compter de la réception de ce mail.</p><p>Si vous n'êtes pas l'auteur de cette demande, merci de ne pas tenir compte de ce message.</p>"
        .replace('$_PRENOM_$', user.firstName)
        .replace(
          '$_URL_TOKEN_$',
          `${env.get('FRONTEND_URL')}/authentication/verify/` + verificationToken.token
        )
        .replace('$_TEMPS_VALIDITE_TOKEN_$', '2')

    this.sendMail(user.email, subject, htmlMessage)
  }

  async sendResetPasswordMail(user: User) {
    const subject: string = 'Réinitialisation de votre mot de passe'
    const verificationToken: Token = await this.authenticationService.createToken(user)

    const htmlMessage: string =
      "<p>Bonjour $_PRENOM_$,</p><p>Veuillez trouver ci-dessous un bouton pour réinitialiser votre mot de passe :</p><div style='text-align: center; margin: 40px 0;'><a href='$_URL_TOKEN_$' style='background-color: #4a7ab4; padding: 10px; border-radius: 10px; margin: 0 auto; color: white; text-decoration: none;'>Réinitialiser mon mot de passe</a></div><p>Ce bouton possède une durée de validité de <span style='font-weight: bold; text-decoration: underline;'>$_TEMPS_VALIDITE_TOKEN_$ heures</span> à compter de la réception de ce mail.</p><p>Si vous n'êtes pas l'auteur de cette demande, merci de ne pas tenir compte de ce message.</p>"
        .replace('$_PRENOM_$', user.firstName)
        .replace(
          '$_URL_TOKEN_$',
          `${env.get('FRONTEND_URL')}/authentication/reset-password/` + verificationToken.token
        )
        .replace('$_TEMPS_VALIDITE_TOKEN_$', '2')

    this.sendMail(user.email, subject, htmlMessage)
  }
}
