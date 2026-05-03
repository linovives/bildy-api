import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

export const sendVerificationEmail = async (to, code) => {
  if (process.env.NODE_ENV === 'test') return;
  await transporter.sendMail({
    from: '"BildyApp" <no-reply@bildyapp.com>',
    to,
    subject: 'Verifica tu cuenta en BildyApp',
    text: `Tu código de verificación es: ${code}`,
    html: `<p>Tu código de verificación es: <strong>${code}</strong></p>`
  });
};
