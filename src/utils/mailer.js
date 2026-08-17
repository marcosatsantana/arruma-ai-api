const axios = require('axios');
require('dotenv').config();

const sendEmail = async (to, subject, text, html) => {
  try {
    // O EMAIL_FROM precisa ser EXATAMENTE o email que você validar no Brevo (ex: marcosxk12@gmail.com)
    const fromEmail = process.env.EMAIL_FROM;

    if (!fromEmail) {
      throw new Error("Variável EMAIL_FROM não configurada no .env/Render. Configure com o e-mail que você verificou no Brevo.");
    }

    const payload = {
      sender: { name: "Arruma AI", email: fromEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
      textContent: text,
    };

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      }
    });

    console.log('Email enviado via Brevo com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro inesperado ao enviar email via Brevo:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  sendEmail
};
