'use strict';

// Uso:
//   node scripts/create-user.js <RA> <senha> ["Nome do usuario"]
// Exemplo:
//   node scripts/create-user.js 202412345 MinhaSenhaForte "Maria Silva"
//
// Cadastra o usuario (ou troca a senha, se o RA ja existir). A senha e
// guardada em texto puro em data/users.json.

const path = require('path');
const { upsertUser } = require(path.join(__dirname, '..', 'auth'));

const [, , ra, senha, nome] = process.argv;

if (!ra || !senha) {
  console.error('Uso: node scripts/create-user.js <RA> <senha> ["Nome"]');
  process.exit(1);
}

if (String(senha).length < 8) {
  console.error('A senha deve ter pelo menos 8 caracteres.');
  process.exit(1);
}

upsertUser(ra, senha, nome);
console.log(`Usuario ${ra} cadastrado/atualizado com sucesso.`);
