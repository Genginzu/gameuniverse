import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Configuration des emails
export const EMAIL_CONFIG = {
  from: "Game Universe <noreply@gamesuniverse.com>",
  replyTo: "support@gamesuniverse.com",
} as const;

// Types pour les templates d'email
export interface EmailVerificationData {
  email: string;
  confirmationUrl: string;
  locale: string;
}

export interface PasswordResetData {
  email: string;
  resetUrl: string;
  locale: string;
}

// Templates d'email
export const EMAIL_TEMPLATES = {
  verification: {
    fr: {
      subject: "Vérifiez votre adresse email - Game Universe",
      html: (data: EmailVerificationData) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vérification de votre compte</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Game Universe</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Bienvenue dans l'univers du gaming</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Vérifiez votre adresse email</h2>
            
            <p>Bonjour,</p>
            
            <p>Merci de vous être inscrit sur Game Universe ! Pour activer votre compte et commencer à explorer notre bibliothèque de jeux, veuillez cliquer sur le bouton ci-dessous :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.confirmationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Vérifier mon email
              </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${data.confirmationUrl}
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Ce lien expirera dans 24 heures. Si vous n'avez pas créé de compte sur Game Universe, vous pouvez ignorer cet email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Game Universe - Votre plateforme de découverte gaming<br>
              Cet email a été envoyé à ${data.email}
            </p>
          </div>
        </body>
        </html>
      `,
    },
    en: {
      subject: "Verify your email address - Game Universe",
      html: (data: EmailVerificationData) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Game Universe</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Welcome to the gaming universe</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Verify your email address</h2>
            
            <p>Hello,</p>
            
            <p>Thank you for signing up for Game Universe! To activate your account and start exploring our game library, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.confirmationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Verify my email
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${data.confirmationUrl}
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              This link will expire in 24 hours. If you didn't create an account on Game Universe, you can ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Game Universe - Your gaming discovery platform<br>
              This email was sent to ${data.email}
            </p>
          </div>
        </body>
        </html>
      `,
    },
  },

  passwordReset: {
    fr: {
      subject: "Réinitialisation de votre mot de passe - Game Universe",
      html: (data: PasswordResetData) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Réinitialisation de mot de passe</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Game Universe</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Réinitialisation de mot de passe</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Réinitialisez votre mot de passe</h2>
            
            <p>Bonjour,</p>
            
            <p>Vous avez demandé la réinitialisation de votre mot de passe sur Game Universe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${data.resetUrl}
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Game Universe - Votre plateforme de découverte gaming<br>
              Cet email a été envoyé à ${data.email}
            </p>
          </div>
        </body>
        </html>
      `,
    },
    en: {
      subject: "Reset your password - Game Universe",
      html: (data: PasswordResetData) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Game Universe</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Password Reset</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset your password</h2>
            
            <p>Hello,</p>
            
            <p>You requested a password reset for your Game Universe account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Reset my password
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px; font-family: monospace;">
              ${data.resetUrl}
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              Game Universe - Your gaming discovery platform<br>
              This email was sent to ${data.email}
            </p>
          </div>
        </body>
        </html>
      `,
    },
  },
} as const;

// Fonctions utilitaires pour envoyer les emails
export async function sendVerificationEmail(data: EmailVerificationData) {
  const template =
    EMAIL_TEMPLATES.verification[data.locale as keyof typeof EMAIL_TEMPLATES.verification] ||
    EMAIL_TEMPLATES.verification.fr;

  return await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: data.email,
    subject: template.subject,
    html: template.html(data),
  });
}

export async function sendPasswordResetEmail(data: PasswordResetData) {
  const template =
    EMAIL_TEMPLATES.passwordReset[data.locale as keyof typeof EMAIL_TEMPLATES.passwordReset] ||
    EMAIL_TEMPLATES.passwordReset.fr;

  return await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: data.email,
    subject: template.subject,
    html: template.html(data),
  });
}
