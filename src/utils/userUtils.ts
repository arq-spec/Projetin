import { SystemUser, Freelancer } from '../types';

export function generateUsername(fullName: string, existingUsers: { username: string }[]): string {
  const cleanName = fullName.trim();
  const parts = cleanName.split(/\s+/);
  const firstName = parts[0] || 'User';
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
  
  // Format as Name.surname (First letter uppercase, rest lowercase. Surname lowercase)
  const formattedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const formattedLast = lastName ? lastName.toLowerCase() : '';
  
  const baseUsername = formattedLast ? `${formattedFirst}.${formattedLast}` : formattedFirst;
  
  let candidate = baseUsername;
  let counter = 1;
  const lowercasedUsernames = existingUsers.map(u => u.username.toLowerCase());
  
  while (lowercasedUsernames.includes(candidate.toLowerCase())) {
    candidate = `${baseUsername}${counter}`;
    counter++;
  }
  
  return candidate;
}

export function createNewUserForFreelancer(free: Freelancer, existingUsers: SystemUser[]): SystemUser {
  const username = generateUsername(free.nome, existingUsers);
  const rawCpf = free.cpfCif || '000.000.000-00';
  
  return {
    id: `user-free-${free.id}`,
    nome: free.nome,
    email: free.email || `${username.toLowerCase()}@frello.com`,
    perfil: 'Freelancer',
    freelancerId: free.id,
    username,
    cpf: rawCpf,
    password: '',
  };
}

export function createInitialUsers(allFreelancers: any[]): SystemUser[] {
  const initialList: SystemUser[] = [];
  
  // Master Admin Core System Credential (guaranteed roots)
  initialList.push({
    id: 'user-admin-master',
    nome: 'Admin Master',
    email: 'admin@frello.com',
    perfil: 'Administrador',
    username: 'admin',
    cpf: '000.000.000-00',
    password: 'admin',
    isMasterAdmin: true,
  });
  
  const presets = [
    { nome: 'Gabriel Arq', email: 'g.arq@companhia.com', perfil: 'Administrador' as const, cpf: '111.111.111-11' },
    { nome: 'Amanda Silva', email: 'a.silva@companhia.com', perfil: 'Administrador' as const, cpf: '222.222.222-22' },
    { nome: 'Carolina Lima', email: 'c.lima@companhia.com', perfil: 'Gestor' as const, cpf: '333.333.333-33' },
    { nome: 'Mateus Souza', email: 'm.souza@companhia.com', perfil: 'Gestor' as const, cpf: '444.444.444-44' },
    { nome: 'Bruno Becker', email: 'b.becker@companhia.com', perfil: 'Produtor' as const, cpf: '555.555.555-55' },
    { nome: 'Fernanda Rocha', email: 'f.rocha@companhia.com', perfil: 'Produtor' as const, cpf: '666.666.666-66' },
  ];
  
  for (const preset of presets) {
    const username = generateUsername(preset.nome, initialList);
    initialList.push({
      id: `user-preset-${preset.perfil.toLowerCase()}-${initialList.length}`,
      nome: preset.nome,
      email: preset.email,
      perfil: preset.perfil,
      username,
      cpf: preset.cpf,
      password: '', // blank password initially
    });
  }
  
  // Map freelancers to user accounts
  for (const free of allFreelancers) {
    initialList.push(createNewUserForFreelancer(free, initialList));
  }
  
  return initialList;
}

export function ensureMasterAdmin(usersList: SystemUser[]): SystemUser[] {
  if (!Array.isArray(usersList)) {
    return [
      {
        id: 'user-admin-master',
        nome: 'Admin Master',
        email: 'admin@frello.com',
        perfil: 'Administrador',
        username: 'admin',
        cpf: '000.000.000-00',
        password: 'admin',
        isMasterAdmin: true,
      }
    ];
  }

  const hasMaster = usersList.some(u => u.username.toLowerCase() === 'admin' || u.isMasterAdmin === true);
  if (!hasMaster) {
    const masterAdmin: SystemUser = {
      id: 'user-admin-master',
      nome: 'Admin Master',
      email: 'admin@frello.com',
      perfil: 'Administrador',
      username: 'admin',
      cpf: '000.000.000-00',
      password: 'admin',
      isMasterAdmin: true,
    };
    return [masterAdmin, ...usersList];
  }
  
  // If master exists but password has been cleared or altered to incompatible values, or its profile changed, restore it
  return usersList.map(u => {
    if (u.username.toLowerCase() === 'admin' || u.isMasterAdmin === true) {
      return {
        ...u,
        nome: 'Admin Master',
        email: 'admin@frello.com',
        perfil: 'Administrador',
        username: 'admin', // Enforce exact lowercase 'admin'
        password: 'admin', // Always force 'admin' password so login never fails
        isMasterAdmin: true
      };
    }
    return u;
  });
}
