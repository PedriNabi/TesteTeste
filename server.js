'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');

const { upsertUser } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Em produção defina SESSION_SECRET no ambiente. Aqui geramos um fallback
// aleatório por execução (isso invalida sessões a cada restart, o que é ok em dev).
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

app.set('view engine', null);
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    name: 'orbit.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      // Ative secure:true quando servir por HTTPS.
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60, // 1 hora
    },
  })
);

function requireLogin(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/');
}

// Página de login (estática).
app.use(express.static(path.join(__dirname, 'public')));

// Processa o login.
// Não confere RA nem senha: qualquer valor digitado leva à manutenção.
app.post('/login', (req, res) => {
  const ra = String(req.body.ra || '').trim();
  req.session.regenerate((err) => {
    if (err) return res.redirect('/');
    req.session.user = { ra, nome: '' };
    res.redirect('/manutencao');
  });
});

// Página de manutenção (destino após o login).
app.get('/manutencao', requireLogin, (req, res) => {
  const user = req.session.user;
  const nome = (user.nome || user.ra).replace(/[<>&"]/g, '');
  res.type('html').send(`<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Orbit — Em manutenção</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="painel">
  <div class="page">
    <main class="card">
      <header class="card-head">
        <span class="brand">
          <svg class="logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="7.5" stroke="#fff" stroke-width="2"/>
            <ellipse cx="16" cy="16" rx="14.5" ry="5.6" stroke="#fff" stroke-width="1.6"
                     transform="rotate(-22 16 16)"/>
          </svg>
          Orbit
        </span>
      </header>

      <div class="card-body">
        <div class="orb" aria-hidden="true"><span></span></div>

        <h1>Portal em manutenção</h1>
        <p class="sub">Olá, <strong>${nome}</strong>. Estamos realizando melhorias no portal.</p>
        <p class="aviso">Algumas funcionalidades estão temporariamente indisponíveis. Tente novamente mais tarde.</p>

        <form method="post" action="/logout"><button type="submit" class="btn">Sair</button></form>
      </div>
    </main>

    <footer class="foot">Portal interno · acesso restrito</footer>
  </div>
</body>
</html>`);
});

// A tela de cadastro agora é a página principal (public/index.html em "/").
app.get('/cadastro', (_req, res) => res.redirect('/'));

// Processa o cadastro: grava a conta criada pela própria pessoa no users.json.
app.post('/cadastro', (req, res) => {
  const ra = String(req.body.ra || '').trim();
  const senha = String(req.body.senha || '');
  const nome = String(req.body.nome || '').trim();
  if (!ra || !senha) {
    return res.redirect('/?erro=1');
  }
  // upsertUser grava a senha em texto puro (campo `senha`) em data/users.json.
  // Para estudar hashing, troque a gravação no auth.js pelo seu algoritmo.
  upsertUser(ra, senha, nome);
  // Inicia a sessão do usuário recém-criado e leva para a manutenção.
  req.session.regenerate((err) => {
    if (err) return res.redirect('/cadastro?erro=1');
    req.session.user = { ra, nome };
    res.redirect('/manutencao');
  });
});

// Rota antiga: manda para a manutenção.
app.get('/painel', (req, res) => res.redirect('/manutencao'));

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('orbit.sid');
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Orbit rodando em http://localhost:${PORT}`);
});
