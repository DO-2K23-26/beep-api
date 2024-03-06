import env from "#start/env";
import mail from "@adonisjs/mail/services/main";

export default class MailService {
    async sendMail(email: string, subject: string, htmlMessage: string) {
        const emailApp: string = env.get('SMTP_USERNAME');

        const url_logo: string = "https://beep.baptistebronsin.be/logo.png";
        const hauteurLogo: number = 100;
        // Car l'image fait 400px par 400px, dans d'autres cas cette règle de mathématique est nécessaire
        const longueurLogo: number = (hauteurLogo * 400) / 400;

        const corps_logo: string = "<img src='" + url_logo + "' alt='Logo Beep' width='" + longueurLogo + "' height='" + hauteurLogo + "'>";

        const emailBody: string = `
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
                                        ` + corps_logo + `
                                    </td>
                                </tr>
                            </table>
            
                            <!-- Contenu principal de l'email -->
                            <table style="background: white; border-radius: 10px; max-width: 600px;" align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding: 10px 20px;">
                                        ` + htmlMessage + `
                                    </td>
                                </tr>
                            </table>
            
                            <!-- Pied de page de l'email -->
                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="text-align: center; padding: 20px;">
                                        <p>Un problème, une question ? Contactez-nous à <a href="mailto:` + emailApp + `">` + emailApp + `</a></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        try {
            await mail.send((message) => {
                message
                    .to(email)
                    .from(emailApp, "Beep")
                    .subject(subject)
                    .html(emailBody);
            });
        } catch (error) {
            console.log(error);
        }
    }
}