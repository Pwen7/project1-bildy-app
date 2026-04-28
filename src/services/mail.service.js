import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

export const sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: `"BildyApp" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Verifica tu cuenta en BildyApp',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
                <h2 style="color: #4f46e5;">Bienvenido a BildyApp </h2>
                <p>Tu código de verificación es:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                            background: #f3f4f6; padding: 16px; border-radius: 8px;
                            text-align: center; color: #1a1a2e;">
                    ${code}
                </div>
                <p style="color: #6b7280; margin-top: 16px; font-size: 12px;">
                    Este código expira en 24 horas. No lo compartas con nadie.
                </p>
            </div>
        `
  })
}
