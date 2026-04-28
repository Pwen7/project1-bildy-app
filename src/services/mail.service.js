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
    subject: 'Verify your account in BildyApp',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
                <h2 style="color: #4f46e5;">Welcome to BildyApp </h2>
                <p>Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                            background: #f3f4f6; padding: 16px; border-radius: 8px;
                            text-align: center; color: #1a1a2e;">
                    ${code}
                </div>
                <p style="color: #6b7280; margin-top: 16px; font-size: 12px;">
                    This code expires in 24 hours
                </p>
            </div>
        `
  })
}
