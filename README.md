# Orbit — Portal de login

Login de verdade: RA + senha, senhas guardadas em **texto puro** em `data/users.json`
(sem hash — não use em produção), sessão com cookie `httpOnly`.

## Instalar

```powershell
cd orbit
npm install
```

## Cadastrar um usuário

Use o script (ou edite o JSON na mão, campo `senha`):

```powershell
npm run create-user -- 202412345 MinhaSenhaForte "Maria Silva"
```

Isso cria/atualiza `data/users.json` com o RA, o nome e a `senha`.

## Rodar

```powershell
npm start
```

Abra http://localhost:3000, entre com o RA e a senha cadastrados. Em caso de
sucesso você vai para `/manutencao` (página de manutenção); o botão **Sair** encerra a sessão.

## Segurança — o que já está coberto

- Comparação de senha em tempo constante (mas as senhas ficam em texto puro no arquivo).
- Sessão regenerada no login (anti session-fixation); cookie `httpOnly` + `sameSite`.
- Resposta de erro igual para "RA não existe" e "senha errada" (não vaza quais RAs existem).

## Antes de colocar em produção

- Sirva por **HTTPS** e defina `NODE_ENV=production` (ativa `cookie.secure`).
- Defina `SESSION_SECRET` no ambiente (uma string longa e aleatória, fixa).
- Troque o `data/users.json` por um banco de dados real e adicione limite de
  tentativas (rate limiting) para dificultar força bruta.

## Estrutura

```
orbit/
  server.js              # app Express (login, sessão, painel, logout)
  auth.js                # verificação de senha e leitura do users.json
  scripts/create-user.js # cadastra usuários (senha em texto puro)
  public/
    index.html           # página de login (RA + senha)
    styles.css
  data/users.json        # criado ao cadastrar o primeiro usuário
```
