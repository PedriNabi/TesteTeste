'use strict';

// Envia um e-mail de divulgação (somente texto) para uma lista de destinatários.
//
// Uso:
//   1. Configure o SMTP por variáveis de ambiente (não deixe senha no código):
//        SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//      Ex.: Gmail -> host smtp.gmail.com, porta 587, e uma "Senha de app".
//   2. Liste os destinatários em scripts/destinatarios.txt (um e-mail por linha;
//      linhas em branco e as que começam com # são ignoradas).
//   3. Rode:
//        SMTP_HOST=smtp.gmail.com SMTP_PORT=587 \
//        SMTP_USER=voce@gmail.com SMTP_PASS="sua-senha-de-app" \
//        node scripts/send-announcement.js
//
//      Para apenas testar sem enviar de verdade, use DRY_RUN=1.

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const DIR = __dirname;
const EMAIL_FILE = path.join(DIR, 'email-divulgacao.txt');
const RECIPIENTS_FILE = path.join(DIR, 'destinatarios.txt');

function parseEmailFile(raw) {
  // A primeira linha pode ser "Assunto: ...". O resto é o corpo.
  const lines = raw.split(/\r?\n/);
  let subject = 'Apresentação do meu projeto acadêmico — Orbit';
  if (lines[0] && /^assunto:/i.test(lines[0].trim())) {
    subject = lines.shift().replace(/^assunto:/i, '').trim();
    if (lines[0] === '') lines.shift();
  }
  return { subject, body: lines.join('\n').trim() + '\n' };
}

function readRecipients() {
  let raw;
  try {
    raw = fs.readFileSync(RECIPIENTS_FILE, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Crie ${RECIPIENTS_FILE} com um e-mail por linha.`);
      process.exit(1);
    }
    throw err;
  }
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

async function main() {
  const { subject, body } = parseEmailFile(fs.readFileSync(EMAIL_FILE, 'utf8'));
  const recipients = readRecipients();

  if (recipients.length === 0) {
    console.error('Nenhum destinatário em destinatarios.txt.');
    process.exit(1);
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, DRY_RUN } = process.env;

  console.log(`Assunto: ${subject}`);
  console.log(`Destinatários (${recipients.length}): ${recipients.join(', ')}`);

  if (DRY_RUN) {
    console.log('\n[DRY_RUN] Nada foi enviado. Corpo do e-mail:\n');
    console.log(body);
    return;
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('Defina SMTP_HOST, SMTP_USER e SMTP_PASS no ambiente.');
    process.exit(1);
  }

  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // true para 465, false para 587/25 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.verify();

  // Envia individualmente, com cada destinatário em "to" (sem expor a lista
  // inteira em cópia para todos).
  for (const to of recipients) {
    const info = await transporter.sendMail({
      from: SMTP_USER,
      to,
      subject,
      text: body, // somente texto, sem HTML e sem links
    });
    console.log(`Enviado para ${to} (id: ${info.messageId})`);
  }

  console.log('Concluído.');
}

main().catch((err) => {
  console.error('Falha no envio:', err.message);
  process.exit(1);
});
