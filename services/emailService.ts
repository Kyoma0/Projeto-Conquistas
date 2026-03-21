
import nodemailer from 'nodemailer';

// Configuração para o Nodemailer (usando um serviço de teste como Ethereal ou SMTP real se fornecido)
// Para este projeto, usaremos uma configuração genérica que pode ser sobrescrita por variáveis de ambiente.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'test@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

export const sendConfirmationEmail = async (to: string, name: string) => {
  try {
    console.log(`[MOCK EMAIL] Confirmação para ${to} (${name})`);
    // Envio desativado conforme solicitação
  } catch (error) {
    console.error(`Erro ao processar mock de email:`, error);
  }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  try {
    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log(`[MOCK EMAIL] Redefinição para ${to}. Link: ${resetLink}`);
    // Envio desativado conforme solicitação
  } catch (error) {
    console.error(`Erro ao processar mock de email:`, error);
  }
};
