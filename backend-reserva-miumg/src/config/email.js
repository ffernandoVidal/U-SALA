const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_ADDRESS = process.env.SMTP_FROM || 'noreply@usala.com';

const sendResetEmail = async (to, token, frontendUrl) => {
  const resetLink = `${frontendUrl}/reset-password/${token}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log('==========================================');
    console.log('RESET PASSWORD LINK (dev mode):');
    console.log(resetLink);
    console.log('==========================================');
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  await transporter.sendMail({
    from: `"U-SALA" <${FROM_ADDRESS}>`,
    to,
    subject: 'Recuperación de contraseña - U-SALA',
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">U-SALA</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 15px;">Has solicitado recuperar tu contraseña. Haz clic en el botón para establecer una nueva:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="background: #6366f1; color: #fff; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Restablecer contraseña</a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">Sistema de Gestión de Reservas - Universidad Mariano Gálvez</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendResetEmail };
