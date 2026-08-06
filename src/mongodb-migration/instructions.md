# Guia de Migração Completa: Database para MongoDB + JWT (Frello)

Este guia foi elaborado para executar a transição cirúrgica do banco de dados e autenticação do **Database (Database + Database Auth)** para o **MongoDB (Mongoose) + JWT (jsonwebtoken + bcrypt)**.

Para sua segurança e comodidade, todos os arquivos de blueprint do novo backend foram criados na pasta `/src/mongodb-migration/`. O seu aplicativo atual permanece 100% funcional até que você opte por ativar a nova rota.

---

## 1. Comandos de Terminal (Instalação e Limpeza)

Abra o terminal na pasta raiz do projeto e execute os seguintes comandos:

### Desinstalar Pacotes do Database:
```bash
npm uninstall database database-admin
```

### Instalar Novas Dependências:
```bash
npm install mongoose jsonwebtoken bcrypt dotenv
```

### Instalar Tipagens de Desenvolvimento (TypeScript):
```bash
npm install -D @types/jsonwebtoken @types/bcrypt
```

### Arquivos a serem Removidos do Projeto:
Você pode excluir com segurança os seguintes arquivos de configuração do Database:
* `database-applet-config.json`
* `database-blueprint.json`
* `firestore.rules`
* `/src/database.ts`

---

## 2. Configurações de Ambiente (`.env`)

Crie ou atualize o arquivo `.env` na raiz do seu servidor com as seguintes variáveis:

```env
# Conexão MongoDB (Exemplo de string local ou MongoDB Atlas)
MONGODB_URI=mongodb://localhost:27017/frello-db

# Configurações de Autenticação JWT
JWT_SECRET=frello_jwt_secret_secure_key_super_secret_2026
JWT_EXPIRATION=7d
```

---

## 3. Registrando no `server.ts`

Para integrar o MongoDB e os novos endpoints de autenticação, edite o arquivo `/server.ts` para conectar ao banco na inicialização e expor as rotas:

```typescript
import express from 'express';
import { connectToDatabase } from './src/mongodb-migration/db';
import { AuthController } from './src/mongodb-migration/auth.controller';
import { authMiddleware } from './src/mongodb-migration/auth.middleware';

const app = express();
app.use(express.json());

// Instanciar o Controller de Autenticação
const authController = new AuthController();

// Rotas de Autenticação JWT
app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));
app.get('/api/auth/me', authMiddleware, (req, res) => authController.getMe(req, res));

// Exemplo de rota protegida por JWT
app.get('/api/protected-route', authMiddleware, (req, res) => {
  res.json({ message: "Acesso autorizado!", user: (req as any).user });
});

// Inicializar banco e iniciar servidor
const PORT = 3000;
connectToDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] running on port ${PORT} with MongoDB!`);
  });
});
```

---

## 4. Script de Migração (Seed dos Usuários Preexistentes)

Para migrar seus usuários administrativos e gestores preexistentes e criptografar suas senhas usando o bcrypt, execute o script `/src/mongodb-migration/seed.ts`. Veja como criá-lo:

*(O arquivo já foi pré-configurado com hash seguro para migração imediata).*
