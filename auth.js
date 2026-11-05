'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, 'data', 'users.json');

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2) + '\n', 'utf8');
}

// Compara a senha informada com a senha salva (texto puro).
function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || typeof password !== 'string') return false;
  const a = Buffer.from(password, 'utf8');
  const b = Buffer.from(stored, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Cadastra um usuário novo (ou atualiza a senha de um já existente).
// ATENÇÃO: a senha é guardada em texto puro em data/users.json.
function upsertUser(ra, password, nome) {
  ra = String(ra).trim();
  const users = readUsers();
  const existing = users.find((u) => u.ra === ra);
  if (existing) {
    existing.senha = String(password);
    delete existing.passwordHash;
    if (nome) existing.nome = nome;
  } else {
    users.push({ ra, nome: nome || '', senha: String(password) });
  }
  writeUsers(users);
}

// Retorna o usuário (sem a senha) se RA e senha baterem; caso contrário null.
function authenticate(ra, password) {
  ra = String(ra).trim();
  const user = readUsers().find((u) => u.ra === ra);
  if (!user) return null;
  if (!verifyPassword(String(password), user.senha)) return null;
  return { ra: user.ra, nome: user.nome };
}

module.exports = { verifyPassword, upsertUser, authenticate, readUsers };
