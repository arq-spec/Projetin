import { UserModel } from './user.schema';
import { connectToDatabase, disconnectFromDatabase } from './db';

// List of preset system credentials to populate on initial setup
const PRESET_USERS = [
  {
    id: 'user-admin-master',
    nome: 'Admin Master',
    email: 'admin@frello.com',
    perfil: 'Administrador' as const,
    username: 'admin',
    cpf: '000.000.000-00',
    password: 'admin', // Will be hashed securely via the pre-save schema hook
    isMasterAdmin: true,
    statusAprovacao: 'Aprovado' as const
  },
  {
    id: 'user-preset-administrador-1',
    nome: 'Gabriel Arq',
    email: 'g.arq@companhia.com',
    perfil: 'Administrador' as const,
    username: 'Gabriel.arq',
    cpf: '111.111.111-11',
    password: 'frello_gabriel_2026', // Assigned safe password
    statusAprovacao: 'Aprovado' as const
  },
  {
    id: 'user-preset-administrador-2',
    nome: 'Amanda Silva',
    email: 'a.silva@companhia.com',
    perfil: 'Administrador' as const,
    username: 'Amanda.silva',
    cpf: '222.222.222-22',
    password: 'frello_amanda_2026',
    statusAprovacao: 'Aprovado' as const
  },
  {
    id: 'user-preset-gestor-3',
    nome: 'Carolina Lima',
    email: 'c.lima@companhia.com',
    perfil: 'Gestor' as const,
    username: 'Carolina.lima',
    cpf: '333.333.333-33',
    password: 'frello_carolina_2026',
    statusAprovacao: 'Aprovado' as const
  },
  {
    id: 'user-preset-gestor-4',
    nome: 'Mateus Souza',
    email: 'm.souza@companhia.com',
    perfil: 'Gestor' as const,
    username: 'Mateus.souza',
    cpf: '444.444.444-44',
    password: 'frello_mateus_2026',
    statusAprovacao: 'Aprovado' as const
  },
  {
    id: 'user-preset-produtor-5',
    nome: 'Bruno Becker',
    email: 'b.becker@companhia.com',
    perfil: 'Produtor' as const,
    username: 'Bruno.becker',
    cpf: '555.555.555-55',
    password: 'frello_bruno_2026',
    statusAprovacao: 'Aprovado' as const
  },
  {
    id: 'user-preset-produtor-6',
    nome: 'Fernanda Rocha',
    email: 'f.rocha@companhia.com',
    perfil: 'Produtor' as const,
    username: 'Fernanda.rocha',
    cpf: '666.666.666-66',
    password: 'frello_fernanda_2026',
    statusAprovacao: 'Aprovado' as const
  }
];

async function runSeed() {
  try {
    console.log('[Seed] Starting database migration seed...');
    await connectToDatabase();

    // Loop through each preset and upsert safely
    for (const user of PRESET_USERS) {
      const exists = await UserModel.findOne({ id: user.id }).exec();
      
      if (!exists) {
        // Instantiate and save so that the pre-save hook handles the bcrypt hashing
        const newUser = new UserModel(user);
        await newUser.save();
        console.log(`[Seed] Created user: ${user.nome} (${user.username})`);
      } else {
        console.log(`[Seed] User already exists, skipping: ${user.nome}`);
      }
    }

    console.log('[Seed] Seed completed successfully!');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
  } finally {
    await disconnectFromDatabase();
  }
}

// Check if running from command line to run seed script automatically
if (require.main === module) {
  runSeed();
}

export { runSeed };
