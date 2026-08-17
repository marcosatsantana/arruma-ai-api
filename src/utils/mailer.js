const nodemailer = require('nodemailer');
require('dotenv').config();

// Força o Node.js a usar IPv4 ao invés de IPv6 para evitar o erro ENETUNREACH no Render
require('dns').setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
  host: 'smtp.kinghost.net',
  port: 465,
  secure: true, // SSL/TLS exigido pela Kinghost na porta 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Arruma AI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log('Email enviado: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
};

module.exports = {
  sendEmail
};
