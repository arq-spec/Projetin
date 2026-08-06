import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Freelancer, Task, Client, ProfilePermissions, SystemUser, UserProfile, RegistrationRequest } from '../types';
import PermissionsManagement from './PermissionsManagement';
import ApiWebhooksManagement from './ApiWebhooksManagement';
import WhatsAppManagement from './WhatsAppManagement';
import { generateUsername, ensureMasterAdmin } from '../utils/userUtils';
import { saveToDatabase, loadFromDatabase } from '../database';
import { 
  Shield, 
  UserX, 
  RefreshCw, 
  Search, 
  Trash2, 
  AlertCircle,
  FileSpreadsheet,
  Smile,
  Eye,
  Building2,
  Plus,
  Edit2,
  Phone,
  Mail,
  Tag,
  Calendar,
  X,
  Briefcase,
  Key,
  Lock,
  Unlock,
  Check,
  CheckCircle2,
  Users,
  Palette,
  Archive,
  Database,
  Upload,
  Download,
  ShieldAlert,
  FileText,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const formatCNPJ = (value: string) => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 14);
  if (cleanValue.length <= 2) return cleanValue;
  if (cleanValue.length <= 5) return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2)}`;
  if (cleanValue.length <= 8) return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5)}`;
  if (cleanValue.length <= 12) return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8)}`;
  return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8, 12)}-${cleanValue.slice(12)}`;
};

interface AdministrationProps {
  freelancers: Freelancer[];
  tasks?: Task[];
  clients?: Client[];
  registrationRequests?: RegistrationRequest[];
  onApproveRegistrationRequest?: (req: RegistrationRequest) => void;
  onRejectRegistrationRequest?: (reqId: string) => void;
  activeSubTab?: 'aprovacoes' | 'arquivados' | 'clientes' | 'permissoes' | 'usuarios' | 'customizacao' | 'dados' | 'pdf' | 'api' | 'whatsapp';
  setActiveSubTab?: (tab: 'aprovacoes' | 'arquivados' | 'clientes' | 'permissoes' | 'usuarios' | 'customizacao' | 'dados' | 'pdf' | 'api' | 'whatsapp') => void;
  onAddClient?: (client: Client) => void;
  onUpdateClient?: (client: Client) => void;
  onDeleteClient?: (id: string) => void;
  onRestoreFreelancer: (id: string) => void;
  onFullyDeleteFreelancer: (id: string) => void;
  onBulkImportFreelancers?: (imported: Freelancer[]) => void;
  permissions?: ProfilePermissions[];
  onUpdatePermissions?: (updated: ProfilePermissions[]) => void;
  onResetToDefaults?: () => void;
  currentUserProfile?: string;
  canConfigurePermissions?: boolean;
  users?: SystemUser[];
  onUpdateUsers?: (updated: SystemUser[]) => void;
  colorTheme?: 'padrao' | 'customizado';
  onUpdateColorTheme?: (theme: 'padrao' | 'customizado') => void;
  companyLogo?: string | null;
  onUpdateCompanyLogo?: (logo: string | null) => void;
  pdfTheme?: any; 
  onUpdatePdfTheme?: (theme: any) => void;
  currentUser?: UserProfile | null;
}

export default function Administration({ 
  freelancers, 
  tasks = [],
  clients = [],
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onRestoreFreelancer, 
  onFullyDeleteFreelancer,
  onBulkImportFreelancers,
  permissions = [],
  onUpdatePermissions = () => {},
  onResetToDefaults = () => {},
  currentUserProfile = '',
  canConfigurePermissions = false,
  users = [],
  onUpdateUsers = () => {},
  registrationRequests = [],
  onApproveRegistrationRequest = () => {},
  onRejectRegistrationRequest = () => {},
  colorTheme = 'padrao',
  onUpdateColorTheme = () => {},
  companyLogo = null,
  onUpdateCompanyLogo = () => {},
  pdfTheme,
  onUpdatePdfTheme = () => {},
  currentUser = null
}: AdministrationProps) {
  const [localActiveSubTab, setLocalActiveSubTab] = useState<'aprovacoes' | 'arquivados' | 'clientes' | 'permissoes' | 'usuarios' | 'customizacao' | 'dados' | 'pdf' | 'api' | 'whatsapp'>('usuarios');
  const activeSubTab = propActiveSubTab || localActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab || setLocalActiveSubTab;

  const [logoDimensions, setLogoDimensions] = useState({ width: 100, height: 62.5 });

  // Database Backup / Restore State declarations
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFileContent, setRestoreFileContent] = useState<any | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const getLocalStorageKey = (key: string): string => {
    if (key === 'freelancers') return 'freelance_management_freelancers_v2';
    if (key === 'tasks') return 'freelance_management_tasks_v2';
    if (key === 'calendarEvents') return 'freelance_management_calendar_v2';
    if (key === 'notifications') return 'freelance_management_notifications_v2';
    if (key === 'clients') return 'freelance_management_clients_v2';
    if (key === 'users') return 'freelance_management_users_v3';
    if (key === 'registrationRequests') return 'freelance_management_reg_reqs';
    if (key === 'permissions') return 'freelance_management_permissions_v2';
    if (key === 'inventory') return 'freelance_management_inventory';
    if (key === 'doc_catalog') return 'freelance_management_doc_catalog';
    if (key === 'doc_projects') return 'freelance_management_doc_projects';
    if (key === 'api_config') return 'freelance_management_api_config';
    if (key === 'whatsapp_api_config') return 'freelance_management_whatsapp_api_config';
    return `freelance_management_${key}`;
  };

  const updateStateInApp = (key: string, data: any) => {
    if (key === 'users') onUpdateUsers(data);
    else if (key === 'permissions') onUpdatePermissions(data);
  };

  const handleExportFullBackupJSON = async () => {
    setIsBackingUp(true);
    try {
      const collectionsToBackup = [
        { key: 'freelancers', source: freelancers },
        { key: 'tasks', source: tasks },
        { key: 'clients', source: clients },
        { key: 'users', source: users },
        { key: 'registrationRequests', source: registrationRequests },
        { key: 'permissions', source: permissions },
        { key: 'calendarEvents', source: null },
        { key: 'notifications', source: null },
        { key: 'inventory', source: null },
        { key: 'doc_catalog', source: null },
        { key: 'doc_projects', source: null },
        { key: 'api_config', source: null },
        { key: 'whatsapp_api_config', source: null },
        { key: 'workstation_workspaces', source: null },
        { key: 'workstation_columns', source: null },
        { key: 'workstation_cards', source: null },
        { key: 'roles', source: null },
        { key: 'certifications', source: null }
      ];

      const backupData: Record<string, any> = {};

      for (const col of collectionsToBackup) {
        if (col.source !== null) {
          backupData[col.key] = col.source;
        } else {
          try {
            const dbVal = await loadFromDatabase(col.key);
            if (dbVal !== null) {
              backupData[col.key] = dbVal;
            } else {
              const localSaved = localStorage.getItem(getLocalStorageKey(col.key));
              backupData[col.key] = localSaved ? JSON.parse(localSaved) : [];
            }
          } catch (e) {
            console.warn(`[Backup] Failed to load ${col.key} for backup:`, e);
            backupData[col.key] = [];
          }
        }
      }

      const fullPayload = {
        app: "Frello Management Platform",
        version: "2.5",
        exportedAt: new Date().toISOString(),
        databaseType: "Cloud Database",
        collections: backupData
      };

      const jsonStr = JSON.stringify(fullPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `frello_database_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar o arquivo de backup do banco de dados.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFullBackupJSON = async () => {
    if (!restoreFileContent || !restoreFileContent.collections) {
      alert('Nenhum arquivo de backup válido carregado.');
      return;
    }

    const { collections } = restoreFileContent;

    if (restoreMode === 'overwrite' && restoreConfirmText !== 'RESTAURAR') {
      alert('Por favor, digite "RESTAURAR" no campo de confirmação para autorizar a substituição completa.');
      return;
    }

    setIsRestoring(true);
    try {
      const keys = Object.keys(collections);
      
      for (const key of keys) {
        const importedData = collections[key];
        if (!importedData) continue;

        if (restoreMode === 'overwrite') {
          let finalData = importedData;
          if (key === 'users') {
            finalData = ensureMasterAdmin(importedData);
          }
          await saveToDatabase(key, finalData);
          localStorage.setItem(getLocalStorageKey(key), JSON.stringify(finalData));
          updateStateInApp(key, finalData);
        } else {
          let currentData: any = null;
          
          if (key === 'freelancers') currentData = freelancers;
          else if (key === 'tasks') currentData = tasks;
          else if (key === 'clients') currentData = clients;
          else if (key === 'users') currentData = users;
          else if (key === 'registrationRequests') currentData = registrationRequests;
          else if (key === 'permissions') currentData = permissions;
          else {
            currentData = await loadFromDatabase(key);
            if (!currentData) {
              const localSaved = localStorage.getItem(getLocalStorageKey(key));
              currentData = localSaved ? JSON.parse(localSaved) : [];
            }
          }

          let finalData = currentData;
          if (Array.isArray(currentData) && Array.isArray(importedData)) {
            const mergedMap = new Map();
            currentData.forEach((item: any) => {
              if (item && item.id) mergedMap.set(item.id, item);
            });
            importedData.forEach((item: any) => {
              if (item && item.id) mergedMap.set(item.id, item);
            });
            finalData = Array.from(mergedMap.values());
          } else if (currentData && importedData) {
            finalData = { ...currentData, ...importedData };
          } else {
            finalData = importedData;
          }

          if (key === 'users') {
            finalData = ensureMasterAdmin(finalData);
          }

          await saveToDatabase(key, finalData);
          localStorage.setItem(getLocalStorageKey(key), JSON.stringify(finalData));
          updateStateInApp(key, finalData);
        }
      }

      alert('Restauração de banco de dados concluída com sucesso! Os dados foram sincronizados em tempo real.');
      setShowRestoreModal(false);
      setRestoreFileContent(null);
      setRestoreConfirmText('');
      
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      alert('Erro durante a restauração de backup: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsRestoring(false);
    }
  };


  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedArchived, setSelectedArchived] = useState<Freelancer | null>(null);
  const [freelancerToFullyDelete, setFreelancerToFullyDelete] = useState<Freelancer | null>(null);

  // New Client Input Form State
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCnpj, setNewClientCnpj] = useState('');
  const [newClientSegment, setNewClientSegment] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Editing Client state variables
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientCnpj, setEditClientCnpj] = useState('');
  const [editClientSegment, setEditClientSegment] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');

  // User Management state
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Form states and handlers
  const [formUserName, setFormUserName] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserPerfil, setFormUserPerfil] = useState<'Administrador' | 'Produtor' | 'Gestor' | 'Freelancer'>('Freelancer');
  const [formUserCpf, setFormUserCpf] = useState('');
  const [formUserFreelancerId, setFormUserFreelancerId] = useState('');
  const [formUserError, setFormUserError] = useState('');
  const [deleteWarning, setDeleteWarning] = useState<SystemUser | null>(null);

  // Handle open add user modal
  const handleOpenAddUser = () => {
    setFormUserName('');
    setFormUserEmail('');
    setFormUserPerfil('Freelancer');
    setFormUserCpf('');
    setFormUserFreelancerId('');
    setFormUserError('');
    setShowAddUserModal(true);
  };

  // Handle open edit user modal
  const handleOpenEditUser = (user: SystemUser) => {
    if (user.isMasterAdmin || user.username.toLowerCase() === 'admin') {
      alert('O perfil de Administrador Master ("admin") possui configurações globais protegidas e não necessita de edição.');
      return;
    }
    setEditingUser(user);
    setFormUserName(user.nome);
    setFormUserEmail(user.email);
    setFormUserPerfil(user.perfil);
    setFormUserCpf(user.cpf);
    setFormUserFreelancerId(user.freelancerId || '');
    setFormUserError('');
    setShowEditUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormUserError('');

    if (!formUserName.trim()) {
      setFormUserError('Por favor, insira o nome completo.');
      return;
    }

    if (!formUserCpf.trim()) {
      setFormUserError('Por favor, informe o CPF.');
      return;
    }

    if (formUserPerfil === 'Freelancer' && !formUserFreelancerId) {
      setFormUserError('Usuários com perfil Freelancer precisam obrigatoriamente estar vinculados a um talento profissional.');
      return;
    }

    const matchedCpfDuplicate = users.find(u => u.cpf.replace(/\D/g, '') === formUserCpf.replace(/\D/g, '') && (!editingUser || u.id !== editingUser.id));
    if (matchedCpfDuplicate) {
      setFormUserError('Já existe um usuário cadastrado com este CPF.');
      return;
    }

    if (!editingUser) {
      // Create new user
      const generated = generateUsername(formUserName, users);
      const newUser: SystemUser = {
        id: `user-${Date.now()}`,
        nome: formUserName.trim(),
        email: formUserEmail.trim() || `${generated.toLowerCase()}@companhia.com`,
        perfil: formUserPerfil,
        username: generated,
        cpf: formUserCpf.trim(),
        password: '', // Blank initially for first login
        freelancerId: formUserFreelancerId || undefined
      };
      const updatedList = [...users, newUser];
      onUpdateUsers(updatedList);
      saveToDatabase('users', updatedList);
      setShowAddUserModal(false);
    } else {
      // Edit existing user - permit editing name and linked freelancer
      const updatedUsers = users.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            nome: formUserName.trim(),
            freelancerId: formUserFreelancerId || undefined
          };
        }
        return u;
      });
      onUpdateUsers(updatedUsers);
      saveToDatabase('users', updatedUsers);
      setShowEditUserModal(false);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const userToDel = users.find(u => u.id === userId);
    if (!userToDel) return;
    if (userToDel.isMasterAdmin || userToDel.username.toLowerCase() === 'admin') {
      alert('O perfil de Administrador Master ("admin") não pode ser excluído.');
      return;
    }
    setDeleteWarning(userToDel);
  };

  const handleResetPassword = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (confirm(`Deseja revogar a senha atual do usuário "${user.nome}"? Na próxima vez que ele logar, necessitará escolher uma nova senha.`)) {
      const updatedList = users.map(u => u.id === userId ? { ...u, password: '' } : u);
      onUpdateUsers(updatedList);
      saveToDatabase('users', updatedList);
      alert('A senha do usuário foi limpada com sucesso. Agora ele precisará redefinir sua senha no primeiro login.');
    }
  };

  // Filter archived freelancers
  const archivedFreelancers = freelancers.filter(f => f.arquivado === true);
  
  const filteredArchived = archivedFreelancers.filter(f => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    // 1. Check basic attributes
    if (f.nome.toLowerCase().includes(term)) return true;
    if (f.cargo.toLowerCase().includes(term)) return true;
    if (f.email?.toLowerCase().includes(term)) return true;

    // 2. Check freelancer's registered project history for project/client name
    const hasInHistory = f.historicoProjetos?.some(p => 
      p.cliente.toLowerCase().includes(term) || 
      p.nome.toLowerCase().includes(term)
    );
    if (hasInHistory) return true;

    // 3. Check performance reviews for project/client name
    const hasInReviews = f.avaliacoes?.some(a => 
      a.cliente.toLowerCase().includes(term) || 
      a.projetoNome.toLowerCase().includes(term)
    );
    if (hasInReviews) return true;

    // 4. Check allocated tasks in project system for client name/project title
    const associatedTasks = tasks.filter(t => 
      t.freelancerId === f.id || 
      t.alocacoes?.some(a => a.freelancerId === f.id)
    );
    const hasInTasks = associatedTasks.some(t => 
      t.projeto.toLowerCase().includes(term) || 
      t.titulo.toLowerCase().includes(term)
    );
    if (hasInTasks) return true;

    return false;
  });

  return (
    <div className="space-y-6" id="administration-tab">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Painel Administrativo</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Gerenciamento interno da plataforma, restauração de registros e privacidade de dados.
        </p>
      </div>

      {/* Administration Tabs Grouped by Category */}
      <div className="flex flex-col gap-6 border-b border-neutral-200 pb-6 mb-6">
        
        {/* Ajustes de Login e Perfil */}
        <div>
          <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Ajustes de Login e Perfil</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('aprovacoes')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'aprovacoes'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <div className="relative flex items-center">
                <UserCheck className="w-4 h-4" />
                {registrationRequests.length > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {registrationRequests.length}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium ml-1">Aprovações</span>
            </button>  

            <button
              type="button"
              onClick={() => setActiveSubTab('usuarios')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'usuarios'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Usuários ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('arquivados')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'arquivados'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span className="text-sm font-medium">Arquivados ({archivedFreelancers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('clientes')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'clientes'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">Clientes ({clients.length})</span>
            </button>

            {canConfigurePermissions && (
              <button
                type="button"
                onClick={() => setActiveSubTab('permissoes')}
                className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                  activeSubTab === 'permissoes'
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Permissões</span>
              </button>
            )}
          </div>
        </div>

        {/* Customização */}
        <div>
          <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Customização</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('customizacao')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'customizacao'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Interface</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('pdf')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'pdf'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Comprovante PDF</span>
            </button>
          </div>
        </div>

        {/* Configuração Técnica */}
        <div>
          <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">Configuração Técnica</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('api')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'api'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">API & Webhooks</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('whatsapp')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'whatsapp'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp API</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('dados')}
              className={`px-4 py-2 flex items-center justify-center gap-2 rounded-lg transition-all cursor-pointer border ${
                activeSubTab === 'dados'
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">Dados / Migrações</span>
            </button>
          </div>
        </div>


      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
        {activeSubTab === 'aprovacoes' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600 font-mono" />
                Aprovações Pendentes
              </h3>
              <p className="text-xs text-neutral-500 mt-1">Gerencie os novos cadastros solicitados por freelancers.</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-[10px] uppercase font-bold tracking-wider border-b border-neutral-200">
                    <th className="p-3 font-medium">Freelancer</th>
                    <th className="p-3 font-medium">Contato</th>
                    <th className="p-3 font-medium">Especialidade</th>
                    <th className="p-3 font-medium text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-neutral-100">
                  {registrationRequests.map(req => {
                    return (
                      <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-neutral-900">{req.nome} {req.sobrenome}</p>
                          <p className="text-neutral-500 font-mono text-[10px] mt-0.5">{req.cpf}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-neutral-900">{req.email}</p>
                          <p className="text-neutral-500 text-[10px] mt-0.5">{req.whatsapp}</p>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-neutral-200 bg-white text-neutral-600 text-[10px]">
                            {req.cargo}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2 text-white">
                            <button
                              type="button"
                              onClick={() => onApproveRegistrationRequest?.(req)}
                              className="bg-emerald-500 hover:bg-emerald-600 rounded-lg px-3 py-1.5 flex items-center gap-1.5 font-bold cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja REJEITAR a solicitação de ${req.nome} ${req.sobrenome}?`)) {
                                  onRejectRegistrationRequest?.(req.id);
                                }
                              }}
                              className="bg-rose-500 hover:bg-rose-600 rounded-lg px-3 py-1.5 flex items-center gap-1.5 font-bold cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Rejeitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {registrationRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-neutral-400 font-medium">
                        Nenhuma solicitação pendente no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'usuarios' && (
          <div className="space-y-6">
            {/* Header and Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-600 font-mono" />
                  Módulo de Usuários e Login de Acesso
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Cadastre contas de acesso de forma centralizada. Username gerado automaticamente e senha definida no primeiro login.
                </p>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-auto shrink-0">
                <div className="relative flex-1 sm:flex-initial sm:w-64">
                  <span className="absolute left-2.5 top-2.5 text-neutral-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrar por nome, login, CPF..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-neutral-200 rounded-lg placeholder-neutral-450 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-850 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                >
                  <Plus className="w-4 h-4 text-purple-500" />
                  <span>Cadastrar Novo Usuário</span>
                </button>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto border border-neutral-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-bold uppercase text-neutral-500 border-b border-neutral-200">
                    <th className="p-4 font-mono">Nome do Usuário</th>
                    <th className="p-4 font-mono">Nome de Login / Username</th>
                    <th className="p-4 font-mono">CPF Cadastrado</th>
                    <th className="p-4 font-mono">Perfil / Função</th>
                    <th className="p-4 font-mono">Status da Senha</th>
                    <th className="p-4 font-mono text-right">Ações de Controle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-150 text-xs">
                  {users
                    .filter(u => {
                      const term = userSearchTerm.toLowerCase().trim();
                      if (!term) return true;
                      return (
                        u.nome.toLowerCase().includes(term) ||
                        u.username.toLowerCase().includes(term) ||
                        u.cpf.includes(term) ||
                        u.perfil.toLowerCase().includes(term)
                      );
                    })
                    .map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-neutral-900">{user.nome}</div>
                          <div className="text-[10px] text-neutral-450 mt-0.5">{user.email}</div>
                          {user.freelancerId && (
                             <div className="text-[10px] text-emerald-600 font-bold mt-1 max-w-[200px] truncate" title="Talento Vinculado">
                               ↳ Talento: {freelancers.find(f => f.id === user.freelancerId)?.nome || 'Não Encontrado'}
                             </div>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-600">
                          {user.username}
                        </td>
                        <td className="p-4 font-mono text-neutral-600">
                          {user.cpf}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            user.perfil === 'Administrador' ? 'bg-amber-100 text-amber-800' :
                            user.perfil === 'Gestor' ? 'bg-blue-100 text-blue-800' :
                            user.perfil === 'Produtor' ? 'bg-purple-100 text-purple-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {user.perfil}
                          </span>
                        </td>
                        <td className="p-4">
                          {!user.password ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" />
                              Senha Pendente (Primeiro Login)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              Senha Ativa e Definida
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {user.isMasterAdmin || user.username.toLowerCase() === 'admin' ? (
                              <span
                                title="Senha protegida do Administrador Master"
                                className="p-1.5 text-neutral-300 rounded-lg cursor-not-allowed opacity-40"
                              >
                                <Lock className="w-4 h-4" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleResetPassword(user.id)}
                                title="Limpar senha para nova redefinição"
                                className="p-1.5 text-neutral-400 hover:text-amber-600 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}
                            {user.isMasterAdmin || user.username.toLowerCase() === 'admin' ? (
                              <span
                                title="Perfil do Administrador Master é protegido"
                                className="p-1.5 text-neutral-300 rounded-lg cursor-not-allowed opacity-40"
                              >
                                <Edit2 className="w-4 h-4" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(user)}
                                title="Editar Perfil"
                                className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {user.isMasterAdmin || user.username.toLowerCase() === 'admin' ? (
                              <span
                                title="Administrador Master não pode ser removido"
                                className="p-1.5 text-neutral-300 rounded-lg cursor-not-allowed opacity-40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user.id)}
                                title="Remover Usuário"
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-neutral-400">
                        Nenhum usuário cadastrado no sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Create/Edit User Modals */}
            <AnimatePresence>
              {(showAddUserModal || showEditUserModal) && (
                <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-neutral-200 p-6 w-full max-w-md shadow-2xl relative"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddUserModal(false);
                        setShowEditUserModal(false);
                        setEditingUser(null);
                      }}
                      className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <form onSubmit={handleSaveUser} className="space-y-4 text-left">
                      <div>
                        <h3 className="text-base font-bold text-neutral-900">
                          {showAddUserModal ? 'Cadastrar Novo Usuário' : 'Editar Usuário'}
                        </h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {showAddUserModal 
                            ? 'Cadastre o funcionário abaixo. O nome e sobrenome serão convertidos em login corporativo.'
                            : 'Altere as configurações do usuário cadastrado.'}
                        </p>
                      </div>

                      {formUserError && (
                        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex gap-1.5 items-center font-semibold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{formUserError}</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                          Nome Completo (Nome + Sobrenome)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Lucas Silva"
                          value={formUserName}
                          onChange={(e) => setFormUserName(e.target.value)}
                          className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-905"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                          E-mail Corporativo
                        </label>
                        <input
                          type="email"
                          placeholder="Ex: lucas.silva@companhia.com (Opcional)"
                          value={formUserEmail}
                          onChange={(e) => setFormUserEmail(e.target.value)}
                          disabled={!!editingUser}
                          className={`w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-905 ${editingUser ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : ''}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            Perfil / Função
                          </label>
                          <select
                            value={formUserPerfil}
                            onChange={(e) => setFormUserPerfil(e.target.value as any)}
                            disabled={!!editingUser}
                            className={`w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-905 ${editingUser ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : ''}`}
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Gestor">Gestor</option>
                            <option value="Produtor">Produtor</option>
                            <option value="Freelancer">Freelancer</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                            CPF (Serve como Login)
                          </label>
                          <input
                            type="text"
                            placeholder="000.000.000-00"
                            value={formUserCpf}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                              if (v.length <= 3) setFormUserCpf(v);
                              else if (v.length <= 6) setFormUserCpf(`${v.slice(0,3)}.${v.slice(3)}`);
                              else if (v.length <= 9) setFormUserCpf(`${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6)}`);
                              else setFormUserCpf(`${v.slice(0,3)}.${v.slice(3,6)}.${v.slice(6,9)}-${v.slice(9)}`);
                            }}
                            disabled={!!editingUser}
                            className={`w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-905 font-mono ${editingUser ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : ''}`}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                        <label className={`block text-[10px] font-extrabold uppercase tracking-wider ${formUserPerfil === 'Freelancer' ? 'text-emerald-700' : 'text-neutral-600'}`}>
                          Vincular conta de talento profissional {formUserPerfil === 'Freelancer' ? '*' : '(Opcional)'}
                        </label>
                        <p className="text-[10px] text-neutral-500 mb-2">
                          Selecione o profissional cadastrado para vincular a este usuário de login:
                        </p>
                        <select
                          value={formUserFreelancerId}
                          onChange={(e) => setFormUserFreelancerId(e.target.value)}
                          className={`w-full text-xs p-2 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white`}
                          required={formUserPerfil === 'Freelancer'}
                        >
                          <option value="">-- {formUserPerfil === 'Freelancer' ? 'Escolha um Talento Cadastrado' : 'Nenhum / Não vinculado'} --</option>
                          {freelancers
                            .filter(f => !f.arquivado)
                            .map(f => (
                              <option key={f.id} value={f.id}>{f.nome} ({f.cargo})</option>
                            ))}
                        </select>
                      </div>

                      <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddUserModal(false);
                            setShowEditUserModal(false);
                            setEditingUser(null);
                          }}
                          className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-neutral-950 hover:bg-neutral-850 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          {showAddUserModal ? 'Criar Usuário' : 'Salvar Alterações'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
              {deleteWarning && (
                <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-neutral-200 p-6 w-full max-w-sm shadow-2xl relative"
                  >
                    <h3 className="text-base font-bold text-neutral-900">Excluir usuário?</h3>
                    <p className="text-sm text-neutral-600 mt-2">Deseja realmente excluir a conta do usuário "{deleteWarning.nome}" ({deleteWarning.username})?</p>
                    {deleteWarning.freelancerId && (
                      <p className="text-xs text-rose-600 mt-2 font-bold flex items-start gap-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Atenção: O cadastro de talento associado a este usuário também será definitivamente apagado, incluindo históricos de alocações.
                      </p>
                    )}
                    <div className="flex gap-3 justify-end mt-6">
                      <button onClick={() => setDeleteWarning(null)} className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-neutral-50 cursor-pointer">Cancelar</button>
                      <button onClick={() => {
                         if (deleteWarning.freelancerId) {
                           onFullyDeleteFreelancer(deleteWarning.freelancerId);
                         } else {
                           const updatedList = users.filter(u => u.id !== deleteWarning.id);
                           onUpdateUsers(updatedList);
                         }
                         setDeleteWarning(null);
                      }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer">Excluir Usuário</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeSubTab === 'permissoes' && (
          <PermissionsManagement
            permissions={permissions}
            onUpdatePermissions={onUpdatePermissions}
            onResetToDefaults={onResetToDefaults}
            currentUserProfile={currentUserProfile}
          />
        )}

        {activeSubTab === 'customizacao' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Aparência e Customização de Cores
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configure a identidade visual do sistema. As alterações de tema são aplicadas em tempo real para todos os perfis e salvos na memória do seu navegador.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Theme Padrão */}
              <div 
                onClick={() => onUpdateColorTheme('padrao')}
                className={`group cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-56 select-none ${
                  colorTheme === 'padrao'
                    ? 'border-neutral-950 bg-neutral-50/50 shadow-md'
                    : 'border-neutral-200 hover:border-neutral-350 hover:bg-neutral-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 text-sm">Tema Padrão</span>
                    {colorTheme === 'padrao' ? (
                      <span className="bg-neutral-950 text-white text-[10px] font-bold uppercase py-0.5 px-2 rounded-full">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-neutral-400 group-hover:text-neutral-600 text-[10px] uppercase font-bold">
                        Selecionar
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Visual clássico da plataforma com tons neutros profundos e elegantes realces em âmbar (Amber 500). Proporciona elegância e contraste equilibrado.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Paleta de Cores Padrão</span>
                  <div className="flex gap-2.5 items-center">
                    <div className="flex -space-x-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#f59e0b] border border-white dark:border-zinc-900 shadow-xs" title="Amber 500" />
                      <div className="w-6 h-6 rounded-full bg-[#d97706] border border-white dark:border-zinc-900 shadow-xs" title="Amber 600" />
                      <div className="w-6 h-6 rounded-full bg-[#fef3c7] border border-white dark:border-zinc-900 shadow-xs" title="Amber 100" />
                      <div className="w-6 h-6 rounded-full bg-[#fffbeb] border border-white dark:border-zinc-900 shadow-xs" title="Amber 50" />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-600 block">Âmbar Clássico (#F59E0B)</span>
                  </div>
                </div>
              </div>

              {/* Theme Customizado */}
              <div 
                onClick={() => onUpdateColorTheme('customizado')}
                className={`group cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-56 select-none ${
                  colorTheme === 'customizado'
                    ? 'border-neutral-950 bg-neutral-50/50 shadow-md'
                    : 'border-neutral-200 hover:border-neutral-350 hover:bg-neutral-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 text-sm">Tema Customizado</span>
                    {colorTheme === 'customizado' ? (
                      <span className="bg-neutral-950 text-white text-[10px] font-bold uppercase py-0.5 px-2 rounded-full">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-neutral-400 group-hover:text-neutral-600 text-[10px] uppercase font-bold">
                        Selecionar
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Novo visual moderno solicitado com harmonia de cores vivas e vibrantes baseadas nas especificações RGB e CMYK de alto contraste.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Paleta de Cores Customizada</span>
                  <div className="flex gap-2.5 items-center">
                    <div className="flex -space-x-1.5">
                      <div className="w-6 h-6 rounded-full bg-[rgb(255,77,64)] border border-white dark:border-zinc-900 shadow-sm" title="RGB 255 77 64" />
                      <div className="w-6 h-6 rounded-full bg-[rgb(255,46,36)] border border-white dark:border-zinc-900 shadow-sm" title="CMYK 0 82 86 0" />
                      <div className="w-6 h-6 rounded-full bg-[rgb(214,230,235)] border border-white dark:border-zinc-900 shadow-sm" title="CMYK 16 10 8 0" />
                    </div>
                    <div className="text-[11px] leading-tight text-neutral-605 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px]">RGB(255, 77, 64)</span>
                        <span className="font-mono text-[10px]/none opacity-60">•</span>
                        <span className="font-mono text-[10px]">CMYK(0, 82, 86, 0)</span>
                        <span className="font-mono text-[10px]/none opacity-60">•</span>
                        <span className="font-mono text-[10px]">CMYK(16, 10, 8, 0)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick explanation panel */}
            <div className="bg-neutral-50 p-4 border border-neutral-205 rounded-xl space-y-1.5 text-xs text-neutral-600">
              <span className="font-bold text-neutral-800 block">ℹ️ Detalhes das Especificações de Cor Aplicadas:</span>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-neutral-700 font-semibold">Cor Principal (RGB 255 77 64):</strong> Coral vibrante e vivo usado como preenchimento principal de ações importantes e identidade de marca.</li>
                <li><strong className="text-neutral-700 font-semibold">Tom de Destaque / Hover (CMYK 0 82 86 0):</strong> Vermelho carmesim ativo de alta visibilidade usado para efeitos interativos, botões focados e alertas de marca.</li>
                <li><strong className="text-neutral-700 font-semibold">Fundo e Transparências Suaves (CMYK 16 10 8 0):</strong> Cinza azulado suave pastel usado para preencher containers de visualização secundária, tags de projetos, legendas e fundos claros de tabelas.</li>
              </ul>
            </div>
          </div>
        )}


        {activeSubTab === 'arquivados' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                  <UserX className="w-5 h-5 text-neutral-500" />
                  Perfis Arquivados / Removidos
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Estes profissionais foram colocados em quarentena de segurança de dados. Suas informações não foram perdidas e podem ser recuperadas a qualquer momento.
                </p>
              </div>

              {/* Search Bar inside sub-tab */}
              <div className="relative w-full sm:w-80">
                <span className="absolute left-2.5 top-2.5 text-neutral-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nome, especialidade, cliente ou projeto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 border border-neutral-200 rounded-lg placeholder-neutral-450 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>
            </div>

            {/* List Table of Archived Files */}
            <div className="overflow-x-auto min-w-full mt-4">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-bold">Profissional</th>
                    <th className="py-2.5 px-4 font-bold">Função / Especialidade</th>
                    <th className="py-2.5 px-4 font-bold">Arquivado Por / Data</th>
                    <th className="py-2.5 px-4 font-bold max-w-xs">Motivo</th>
                    <th className="py-2.5 px-4 text-center font-bold">Ações Disponíveis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredArchived.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-400 italic">
                        {searchTerm ? 'Nenhum resultado correspondente à sua busca.' : 'Nenhum perfil arquivado ou pendente de administração.'}
                      </td>
                    </tr>
                  ) : (
                    filteredArchived.map((free) => (
                      <tr key={free.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-250 flex items-center justify-center text-neutral-600 font-semibold text-xs tracking-wide uppercase">
                              {free.nome.slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-neutral-900 block">{free.nome}</span>
                              <span className="text-[10px] text-neutral-400">{free.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-600">
                          {free.cargo}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">
                          <div className="font-semibold text-neutral-700">{free.arquivadoPor || 'N/A'}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{free.dataArquivamento || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 max-w-xs truncate" title={free.motivoArquivamento}>
                          {free.motivoArquivamento || <span className="text-neutral-400 italic">Sem motivo informado</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Profile details button */}
                            <button
                              onClick={() => setSelectedArchived(free)}
                              className="inline-flex items-center gap-1 bg-white border border-neutral-250 hover:bg-neutral-50 text-neutral-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Ver dados do perfil arquivado"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Dados</span>
                            </button>

                            {/* Restore Button */}
                            <button
                              onClick={() => {
                                onRestoreFreelancer(free.id);
                              }}
                              className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              title="Restaurar de volta à base ativa"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Restaurar Perfil</span>
                            </button>

                            {/* Permanent deletion button */}
                            {currentUserProfile === 'Administrador' && (
                              <button
                                onClick={() => setFreelancerToFullyDelete(free)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir Permanentemente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-neutral-500" />
                  Módulo de Clientes Corporativos
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Cadastre e gerencie a carteira de parceiros comerciais. Estes nomes serão sugeridos e filtrados ao registrar novos projetos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search Client */}
                <div className="relative w-full sm:w-64 border-neutral-100">
                  <span className="absolute left-2.5 top-2.5 text-neutral-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-neutral-200 rounded-lg placeholder-neutral-450 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  />
                </div>

                {/* Add new Client trigger */}
                <button
                  onClick={() => setShowAddClientForm(!showAddClientForm)}
                  className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {showAddClientForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{showAddClientForm ? 'Fechar Form' : 'Novo Cliente'}</span>
                </button>
              </div>
            </div>

            {/* Insertion Form */}
            {showAddClientForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-neutral-50 p-5 rounded-xl border border-neutral-250 space-y-4"
              >
                <div className="flex items-center gap-2 text-neutral-800 border-b border-neutral-200 pb-2">
                  <Plus className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">Cadastrar Novo Cliente</span>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newClientName.trim()) {
                      alert('O nome do cliente é obrigatório.');
                      return;
                    }
                    const newClient: Client = {
                      id: `client-${Date.now()}`,
                      nome: newClientName.trim(),
                      cnpj: newClientCnpj.trim() || undefined,
                      segmento: newClientSegment.trim() || undefined,
                      email: newClientEmail.trim() || undefined,
                      telefone: newClientPhone.trim() || undefined,
                      dataCadastro: new Date().toLocaleDateString('pt-BR')
                    };
                    if (onAddClient) {
                      onAddClient(newClient);
                      // Reset values
                      setNewClientName('');
                      setNewClientCnpj('');
                      setNewClientSegment('');
                      setNewClientEmail('');
                      setNewClientPhone('');
                      setShowAddClientForm(false);
                    }
                  }} 
                  className="grid grid-cols-1 sm:grid-cols-4 gap-4"
                >
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Razão Social / Nome do Cliente *</label>
                    <input
                      type="text"
                      placeholder="Ex: Coca-Cola Brasil"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">CNPJ (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: 00.000.000/0000-00"
                      value={newClientCnpj}
                      onChange={(e) => setNewClientCnpj(formatCNPJ(e.target.value))}
                      className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Segmento / Setor</label>
                    <input
                      type="text"
                      placeholder="Ex: Tecnologia, Bebidas"
                      value={newClientSegment}
                      onChange={(e) => setNewClientSegment(e.target.value)}
                      className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Telefone de Contato</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 99999-9999"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">E-mail Corporativo</label>
                    <input
                      type="email"
                      placeholder="Ex: contato@cliente.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-neutral-950 border border-neutral-850 hover:bg-neutral-850 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Efetuar Cadastro</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Clients Listing Table */}
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-bold">Cliente</th>
                    <th className="py-2.5 px-4 font-bold">Segmento / Setor</th>
                    <th className="py-2.5 px-4 font-bold">Contato Direto</th>
                    <th className="py-2.5 px-4 text-center font-bold">Projetos Relacionados</th>
                    <th className="py-2.5 px-4 text-center font-bold">Ações Disponíveis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs text-neutral-800">
                  {clients
                    .filter(c => {
                      const t = clientSearchTerm.toLowerCase().trim();
                      if (!t) return true;
                      return (
                        c.nome.toLowerCase().includes(t) ||
                        (c.cnpj && c.cnpj.toLowerCase().includes(t)) ||
                        (c.segmento && c.segmento.toLowerCase().includes(t)) ||
                        (c.email && c.email.toLowerCase().includes(t))
                      );
                    })
                    .length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-neutral-400 italic">
                          {clientSearchTerm ? 'Nenhum cliente correspondente encontrado.' : 'Nenhum parceiro ou cliente registrado até o momento.'}
                        </td>
                      </tr>
                    ) : (
                      clients
                        .filter(c => {
                          const t = clientSearchTerm.toLowerCase().trim();
                          if (!t) return true;
                          return (
                            c.nome.toLowerCase().includes(t) ||
                            (c.cnpj && c.cnpj.toLowerCase().includes(t)) ||
                            (c.segmento && c.segmento.toLowerCase().includes(t)) ||
                            (c.email && c.email.toLowerCase().includes(t))
                          );
                        })
                        .map((client) => {
                          // Find tasks matching this client name
                          const associatedTasks = tasks.filter(task => 
                            task.projeto.toLowerCase() === client.nome.toLowerCase()
                          );

                          return (
                            <tr key={client.id} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200/85 flex items-center justify-center text-neutral-700 font-bold uppercase text-[11px]">
                                    {client.nome.slice(0, 2)}
                                  </div>
                                  <div>
                                    <span className="font-bold text-neutral-900 block">{client.nome}</span>
                                    {client.cnpj && (
                                      <span className="text-[10px] text-amber-600 font-mono block font-bold">CNPJ: {client.cnpj}</span>
                                    )}
                                    <span className="text-[9px] text-neutral-400 block flex items-center gap-1 font-mono mt-0.5">
                                      <Calendar className="w-2.5 h-2.5" />
                                      Registrado em: {client.dataCadastro || '—'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {client.segmento ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-600/10 border border-amber-500/10 text-amber-800 font-semibold font-sans">
                                    <Tag className="w-2.5 h-2.5" />
                                    {client.segmento}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400 italic">Geral</span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 space-y-0.5">
                                {client.email && (
                                  <div className="flex items-center gap-1 text-neutral-600">
                                    <Mail className="w-3 h-3 text-neutral-400" />
                                    <span>{client.email}</span>
                                  </div>
                                )}
                                {client.telefone && (
                                  <div className="flex items-center gap-1 text-neutral-600 font-mono text-[10px]">
                                    <Phone className="w-3 h-3 text-neutral-400" />
                                    <span>{client.telefone}</span>
                                  </div>
                                )}
                                {!client.email && !client.telefone && (
                                  <span className="text-neutral-450 italic text-[10px]">Sem contatos</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center font-bold text-neutral-700">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  associatedTasks.length > 0 
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                    : 'bg-neutral-100 text-neutral-450'
                                }`}>
                                  {associatedTasks.length} Projetos
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {/* Edit Client details */}
                                  <button
                                    onClick={() => {
                                      setEditingClient(client);
                                      setEditClientName(client.nome);
                                      setEditClientCnpj(client.cnpj || '');
                                      setEditClientSegment(client.segmento || '');
                                      setEditClientEmail(client.email || '');
                                      setEditClientPhone(client.telefone || '');
                                    }}
                                    className="p-1 px-2.5 border border-neutral-250 hover:bg-neutral-50 rounded-lg text-neutral-650 transition-colors flex items-center gap-1 cursor-pointer font-semibold text-xs"
                                    title="Editar informações do cliente"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Editar</span>
                                  </button>

                                  {/* Delete Client */}
                                  <button
                                    onClick={() => {
                                      if (confirm(`Deseja mesmo remover o cliente ${client.nome}? Isso removerá a sugestão nos filtros.`)) {
                                        if (onDeleteClient) {
                                          onDeleteClient(client.id);
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Excluir Registro"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'dados' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-600 font-mono" />
                  Administração do Banco de Dados & Backups Globais
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Gerencie o armazenamento persistente em nuvem do Frello. Exporte a base completa ou faça restaurações rápidas para migração em servidores externos.
                </p>
              </div>
            </div>

            {/* Banco de dados - Estatísticas Atuais */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block mb-3">Estatísticas do Banco de Dados</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white border border-neutral-150 p-3 rounded-lg text-center shadow-xs">
                  <span className="block text-xl font-bold text-neutral-800">{users.length}</span>
                  <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Contas de Usuário</span>
                </div>
                <div className="bg-white border border-neutral-150 p-3 rounded-lg text-center shadow-xs">
                  <span className="block text-xl font-bold text-purple-600">{freelancers.length}</span>
                  <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Talentos</span>
                </div>
                <div className="bg-white border border-neutral-150 p-3 rounded-lg text-center shadow-xs">
                  <span className="block text-xl font-bold text-blue-600">{tasks.length}</span>
                  <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Diárias / Projetos</span>
                </div>
                <div className="bg-white border border-neutral-150 p-3 rounded-lg text-center shadow-xs">
                  <span className="block text-xl font-bold text-amber-600">{clients.length}</span>
                  <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Clientes Corp</span>
                </div>
                <div className="bg-white border border-neutral-150 p-3 rounded-lg text-center shadow-xs col-span-2 sm:col-span-1">
                  <span className="block text-xl font-bold text-emerald-600">{registrationRequests.length}</span>
                  <span className="text-[10px] text-neutral-450 font-bold uppercase tracking-wider">Aprovações Pendentes</span>
                </div>
              </div>
            </div>

            {/* Painel Central de Backup e Restauração JSON */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Exportação Completa JSON */}
              <div className="bg-gradient-to-br from-purple-50/40 to-white border border-purple-100 rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-xs">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-purple-600/10 text-purple-600 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800">Exportar Backup Completo (JSON)</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Baixe uma cópia de segurança instantânea contendo absolutamente todos os dados salvos em nuvem (usuários, talentos, diárias, configurações do WhatsApp, inventário e kanban). Recomendado antes de efetuar atualizações críticas ou para migrar para outro servidor.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isBackingUp}
                  onClick={handleExportFullBackupJSON}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  {isBackingUp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processando Banco de Dados...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Gerar Cópia Completa (.JSON)
                    </>
                  )}
                </button>
              </div>

              {/* Importação Completa JSON */}
              <div className="bg-gradient-to-br from-indigo-50/40 to-white border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-xs">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800">Restaurar do Backup (.JSON)</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Carregue um arquivo JSON gerado anteriormente para restaurar o estado completo da plataforma. Você poderá optar por mesclar as informações ou substituir todo o banco de dados atual por completo (útil para instalação do zero em ambientes externos).
                  </p>
                </div>
                
                <div className="w-full">
                  <label className="w-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl py-3 px-4 flex items-center justify-center gap-2 cursor-pointer bg-indigo-50/20 text-indigo-700 text-xs font-semibold transition-all">
                    <Upload className="w-4 h-4" />
                    Carregar arquivo de backup...
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const parsed = JSON.parse(event.target?.result as string);
                            if (!parsed.collections || !parsed.app) {
                              alert('Este arquivo não parece ser um backup válido do Frello.');
                              return;
                            }
                            setRestoreFileContent(parsed);
                            setRestoreMode('merge');
                            setRestoreConfirmText('');
                            setShowRestoreModal(true);
                          } catch (err) {
                            alert('Erro ao ler arquivo JSON de backup: arquivo corrompido.');
                          }
                        };
                        reader.readAsText(file);
                        e.target.value = ''; // reset file input
                      }}
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Seção Tradicional de CSV */}
            <div className="border-t border-neutral-200 pt-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs uppercase font-extrabold text-neutral-500 tracking-wider">Mapeamento em Lote (Excel / CSV)</h4>
              </div>
              <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                As opções abaixo são específicas para exportar e importar a lista de profissionais (Talentos) em formato CSV compatível com planilhas como Excel e Google Sheets.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CSV Export */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between items-start gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-800 mb-0.5">Exportar Talentos (CSV)</h5>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Cria uma planilha CSV com dados cadastrais e de PIX dos freelancers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const headers = [
                        'ID', 'Nome', 'Email', 'Celular', 'CPF_CNPJ', 'RG', 
                        'DataNascimento', 'Sexo', 'FuncaoPrincipal', 'ChavePix', 
                        'CEP', 'Endereco', 'Numero', 'Complemento', 'Bairro', 
                        'Cidade', 'UF', 'Ativo'
                      ];
                      const rows = freelancers.map(f => [
                        f.id,
                        f.nome,
                        f.email || '',
                        f.celular || '',
                        f.cpfCif || '',
                        f.identidadeRg || '',
                        f.dataNascimento || '',
                        f.sexo || '',
                        f.funcaoPrincipal || '',
                        f.chavePix || '',
                        f.enderecoCep || '',
                        f.endereco || '',
                        f.enderecoNumero || '',
                        f.enderecoComplemento || '',
                        f.enderecoBairro || '',
                        f.enderecoCidade || '',
                        f.enderecoUf || '',
                        f.arquivado ? 'Não' : 'Sim'
                      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
                      
                      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `freelancers_backup_${new Date().getTime()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Exportar para CSV
                  </button>
                </div>

                {/* CSV Import */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-col justify-between items-start gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-800 mb-0.5">Importar Talentos (CSV)</h5>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Carrega talentos a partir de uma planilha CSV no formato padronizado do Frello.
                    </p>
                  </div>
                  <div>
                    <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Importar do CSV
                      <input
                        title="Importar do CSV"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            if (!result) return;
                            try {
                              const lines = result.split('\n');
                              const rawHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
                              const headers = rawHeaders.map(h => h.replace(/^\uFEFF/, ''));

                              const newFreelancers: Freelancer[] = [];
                              
                              for (let i = 1; i < lines.length; i++) {
                                let line = lines[i];
                                if (!line || !line.trim()) continue;
                                
                                const values = [];
                                let regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
                                let match;
                                while (match = regex.exec(line)) {
                                  values.push(match[1].replace(/^"|"$/g, '').replace(/""/g, '"').trim());
                                }

                                const getVal = (colName: string) => {
                                  const idx = headers.indexOf(colName);
                                  return idx >= 0 && idx < values.length ? values[idx] : '';
                                };

                                const id = getVal('ID');
                                if (!id) continue;

                                newFreelancers.push({
                                  id: id,
                                  nome: getVal('Nome') || 'Importado sem nome',
                                  email: getVal('Email'),
                                  celular: getVal('Celular'),
                                  cpfCif: getVal('CPF_CNPJ'),
                                  identidadeRg: getVal('RG'),
                                  dataNascimento: getVal('DataNascimento'),
                                  sexo: getVal('Sexo'),
                                  funcaoPrincipal: getVal('FuncaoPrincipal'),
                                  chavePix: getVal('ChavePix'),
                                  enderecoCep: getVal('CEP'),
                                  endereco: getVal('Endereco'),
                                  enderecoNumero: getVal('Numero'),
                                  enderecoComplemento: getVal('Complemento'),
                                  enderecoBairro: getVal('Bairro'),
                                  enderecoCidade: getVal('Cidade'),
                                  enderecoUf: getVal('UF'),
                                  arquivado: getVal('Ativo') === 'Não',
                                  fotoAtiva: '',
                                  cacheSugerido: 0,
                                  rating: 'bronze',
                                  recomendacoes: 0,
                                  dataCadastro: new Date().toLocaleDateString('pt-BR'),
                                  historicoTrabalhos: [],
                                  cargo: getVal('FuncaoPrincipal') || 'Sem Cargo',
                                  telefone: getVal('Celular') || '',
                                  cidade: getVal('Cidade') || '',
                                  habilidades: [],
                                  bio: '',
                                  valorHora: 0,
                                  avaliacoes: [],
                                  historicoProjetos: []
                                });
                              }
                              
                              if (onBulkImportFreelancers && newFreelancers.length > 0) {
                                onBulkImportFreelancers(newFreelancers);
                                alert(`${newFreelancers.length} talentos foram encontrados no arquivo.`);
                              } else {
                                alert('Nenhum talento válido encontrado no arquivo.');
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Erro ao importar CSV! Tem certeza que está no mesmo formato de exportação?');
                            }
                          };
                          reader.readAsText(file);
                          e.target.value = ''; // reset
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal para Confirmação do Backup JSON */}
            <AnimatePresence>
              {showRestoreModal && restoreFileContent && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl max-w-lg w-full p-6 border border-neutral-200 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden text-left text-neutral-800"
                  >
                    <button
                      type="button"
                      onClick={() => setShowRestoreModal(false)}
                      className="absolute right-4 top-4 p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="space-y-4 overflow-y-auto pr-1">
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="w-6 h-6 text-indigo-600 shrink-0 animate-pulse" />
                        <div>
                          <h3 className="text-base font-bold text-neutral-900">Restauração do Banco de Dados</h3>
                          <p className="text-[11px] text-neutral-500">Arquivo: frello_database_backup.json</p>
                        </div>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl space-y-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-800 tracking-wider block">Sumário dos Dados Carregados</span>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                          <div className="flex justify-between border-b border-indigo-100/50 pb-1">
                            <span className="text-neutral-500">Contas de Usuário:</span>
                            <span className="font-bold text-neutral-800">{restoreFileContent.collections.users?.length || 0}</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-100/50 pb-1">
                            <span className="text-neutral-500">Profissionais:</span>
                            <span className="font-bold text-neutral-800">{restoreFileContent.collections.freelancers?.length || 0}</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-100/50 pb-1">
                            <span className="text-neutral-500">Diárias / Projetos:</span>
                            <span className="font-bold text-neutral-800">{restoreFileContent.collections.tasks?.length || 0}</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-100/50 pb-1">
                            <span className="text-neutral-500">Clientes Corp:</span>
                            <span className="font-bold text-neutral-800">{restoreFileContent.collections.clients?.length || 0}</span>
                          </div>
                          <div className="flex justify-between border-b border-indigo-100/50 pb-1 col-span-2">
                            <span className="text-neutral-500">Módulos Extras:</span>
                            <span className="font-bold text-indigo-700">
                              {Object.keys(restoreFileContent.collections).filter(k => !['users', 'freelancers', 'tasks', 'clients'].includes(k)).length} encontrados
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-indigo-600/90 leading-relaxed font-semibold pt-1">
                          Exportado em: {new Date(restoreFileContent.exportedAt).toLocaleDateString('pt-BR')} às {new Date(restoreFileContent.exportedAt).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Selecione o Método de Restauração</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRestoreMode('merge')}
                            className={`p-3 border rounded-xl flex flex-col gap-1 text-left transition-all cursor-pointer ${
                              restoreMode === 'merge'
                                ? 'border-purple-600 bg-purple-50/20 text-purple-900 shadow-sm'
                                : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                            }`}
                          >
                            <span className="text-xs font-bold block">Mesclar Registros (Merge)</span>
                            <span className="text-[10px] opacity-80 leading-normal">
                              Recomendado. Preserva dados que já existem no banco local/nuvem e apenas adiciona ou atualiza registros que possuem IDs conflitantes.
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRestoreMode('overwrite')}
                            className={`p-3 border rounded-xl flex flex-col gap-1 text-left transition-all cursor-pointer ${
                              restoreMode === 'overwrite'
                                ? 'border-rose-600 bg-rose-50/10 text-rose-900 shadow-sm'
                                : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                            }`}
                          >
                            <span className="text-xs font-bold block text-rose-700">Substituir Banco de Dados (Overwrite)</span>
                            <span className="text-[10px] opacity-80 leading-normal text-rose-600">
                              Perigo! Limpa totalmente a base atual e reconstrói as coleções do zero com o arquivo. Ideal para subir o site do zero em domínios novos.
                            </span>
                          </button>
                        </div>
                      </div>

                      {restoreMode === 'overwrite' && (
                        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-3 animate-fade-in">
                          <p className="text-[11px] text-rose-800 leading-relaxed font-bold flex gap-1.5 items-center">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                            <span>CONFIRMAÇÃO EXIGIDA — RISCO DE PERDA DE DADOS</span>
                          </p>
                          <p className="text-[10px] text-rose-700/90 leading-relaxed">
                            Ao optar por substituir, todos os freelancers, diárias, clientes e configurações atualmente cadastrados serão apagados de forma permanente. As contas de login também serão alteradas de acordo com as contas presentes no backup.
                          </p>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                              Digite <span className="underline font-black">RESTAURAR</span> para confirmar:
                            </label>
                            <input
                              type="text"
                              value={restoreConfirmText}
                              onChange={(e) => setRestoreConfirmText(e.target.value)}
                              placeholder="Digite RESTAURAR"
                              className="w-full text-xs font-bold font-mono px-3 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowRestoreModal(false)}
                          className="px-4 py-2 border border-neutral-200 rounded-xl text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isRestoring || (restoreMode === 'overwrite' && restoreConfirmText !== 'RESTAURAR')}
                          onClick={handleRestoreFullBackupJSON}
                          className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                            restoreMode === 'overwrite'
                              ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
                              : 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400'
                          }`}
                        >
                          {isRestoring ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Sincronizando Database...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Iniciar Sincronização
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )}

        {activeSubTab === 'pdf' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Customização do Comprovante PDF
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Altere as cores e o logo que aparecerão no "Resumo de Prestação de Serviços".
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const doc = new jsPDF();
                  
                  const hexToRgb = (hex: string) => {
                    let h = hex.replace('#', '');
                    if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
                    const bigint = parseInt(h, 16);
                    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
                  };

                  const t = pdfTheme || { bannerColor: '#0f172a', titleColor: '#ffffff', subtitleColor: '#94a3b8', highlightColor: '#059669', logoSize: 40, logoOffsetX: 0, logoOffsetY: 0 };
                  const bannerRgb = hexToRgb(t.bannerColor);
                  const titleRgb = hexToRgb(t.titleColor);
                  const subRgb = hexToRgb(t.subtitleColor);
                  const highRgb = hexToRgb(t.highlightColor);

                  doc.setFillColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]);
                  doc.rect(0, 0, 210, 38, 'F');

                  doc.setTextColor(titleRgb[0], titleRgb[1], titleRgb[2]);
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(16);
                  doc.text('RESUMO DE PRESTACAO DE SERVIÇOS', 15, 15);
                  
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(9);
                  doc.setTextColor(subRgb[0], subRgb[1], subRgb[2]);
                  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 15, 22);
                  doc.text(`Projeto: Exemplo Preview | Cliente: Exemplo Cliente`, 15, 27);

                  if (companyLogo) {
                    await new Promise<void>((resolve) => {
                      const img = new Image();
                      img.onload = () => {
                        try {
                          let fmt = 'PNG';
                          if (companyLogo.startsWith('data:image/jpeg') || companyLogo.startsWith('data:image/jpg')) fmt = 'JPEG';
                          let logoWidth = t.logoSize || 40;
                          const ratio = img.naturalHeight / img.naturalWidth;
                          let logoHeight = logoWidth * ratio;

                          // Budget height constraint: Maximum height is 34mm inside the 38mm banner to leave 2mm margins
                          if (logoHeight > 34) {
                            logoHeight = 34;
                            logoWidth = logoHeight / ratio;
                          }

                          let xPos = 200 - logoWidth + (t.logoOffsetX || 0); 
                          let yPos = 19 - (logoHeight / 2) + (t.logoOffsetY || 0); 
                          
                          // Clamp to keep it within the 210mm x 38mm banner
                          if (xPos < 10) xPos = 10;
                          if (xPos + logoWidth > 200) xPos = 200 - logoWidth;
                          
                          if (yPos < 2) yPos = 2;
                          if (yPos + logoHeight > 36) yPos = 36 - logoHeight;

                          doc.addImage(companyLogo, fmt, xPos, yPos, logoWidth, logoHeight, undefined, 'FAST');
                        } catch (err) {
                          console.error('Error adding logo to PDF:', err);
                        }
                        resolve();
                      };
                      img.onerror = () => resolve();
                      img.src = companyLogo;
                    });
                  }

                  doc.setFillColor(highRgb[0], highRgb[1], highRgb[2]);
                  doc.rect(0, 38, 210, 3, 'F');

                  doc.save('Comprovante_Teste.pdf');
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-3xs transition-all border border-neutral-950 self-start"
              >
                <FileText className="w-3.5 h-3.5" />
                Gerar Comprovante Teste
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Logo Upload Section */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-neutral-900">1. Logo da Empresa</h4>
                <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-neutral-50 transition-colors relative h-48">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            onUpdateCompanyLogo(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="bg-neutral-100 text-neutral-600 rounded-full p-3 mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-neutral-900 text-sm block mb-1">Upload da Imagem</span>
                  <span className="text-xs text-neutral-500 block max-w-[200px]">Clique ou arraste um arquivo JPG ou PNG.</span>
                </div>

                {companyLogo && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[120px]">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 absolute top-3 left-4">Pré-visualização</span>
                    <img 
                      src={companyLogo} 
                      alt="Logo Preview" 
                      className="max-h-16 max-w-full object-contain mt-4"
                    />
                    <button 
                      onClick={() => onUpdateCompanyLogo(null)}
                      className="absolute -top-3 -right-3 bg-white text-neutral-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-full border border-neutral-200 shadow-sm transition-all"
                      title="Remover Logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="w-full mt-6 pt-4 border-t border-neutral-200 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-neutral-800 block">Tamanho da Imagem no PDF</span>
                          <span className="text-xs text-neutral-500 font-mono">{pdfTheme?.logoSize || 40}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="20" 
                          max="80" 
                          value={pdfTheme?.logoSize || 40}
                          onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, logoSize: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-neutral-800 block">Posição Horizontal (Eixo X)</span>
                          <span className="text-xs text-neutral-500 font-mono">{pdfTheme?.logoOffsetX || 0}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="-100" 
                          max="100" 
                          value={pdfTheme?.logoOffsetX || 0}
                          onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, logoOffsetX: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-neutral-800 block">Posição Vertical (Eixo Y)</span>
                          <span className="text-xs text-neutral-500 font-mono">{pdfTheme?.logoOffsetY || 0}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="-30" 
                          max="30" 
                          value={pdfTheme?.logoOffsetY || 0}
                          onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, logoOffsetY: parseInt(e.target.value) })}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Dados da Empresa Section */}
                <div className="space-y-4 pt-4 border-t border-neutral-200">
                  <h4 className="text-sm font-bold text-neutral-900">3. Dados da Empresa</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-800 block mb-1">
                        Razão Social
                      </label>
                      <input 
                        type="text"
                        placeholder="Ex: Empresa Exemplo LTDA"
                        value={pdfTheme?.companyName || ''}
                        onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, companyName: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-800 block mb-1">
                        CNPJ
                      </label>
                      <input 
                        type="text"
                        placeholder="Ex: 00.000.000/0001-00"
                        value={pdfTheme?.companyCnpj || ''}
                        onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, companyCnpj: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Settings */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-neutral-900">2. Paleta de Cores do PDF</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Fundo do Cabeçalho</span>
                      <span className="text-[10px] text-neutral-500">Banner colorido onde o título fica</span>
                    </div>
                    <input 
                      type="color" 
                      value={pdfTheme?.bannerColor || '#0f172a'}
                      onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, bannerColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Cor do Título</span>
                      <span className="text-[10px] text-neutral-500">RESUMO DE PRESTAÇÃO DE SERVIÇOS</span>
                    </div>
                    <input 
                      type="color" 
                      value={pdfTheme?.titleColor || '#ffffff'}
                      onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, titleColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Cor do Subtítulo</span>
                      <span className="text-[10px] text-neutral-500">Data de geração e nome do projeto</span>
                    </div>
                    <input 
                      type="color" 
                      value={pdfTheme?.subtitleColor || '#94a3b8'}
                      onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, subtitleColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Linha de Destaque</span>
                      <span className="text-[10px] text-neutral-500">Barra fina de separação abaixo do cabeçalho</span>
                    </div>
                    <input 
                      type="color" 
                      value={pdfTheme?.highlightColor || '#059669'}
                      onChange={(e) => onUpdatePdfTheme({ ...pdfTheme, highlightColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                <div className="bg-neutral-100 p-6 border border-neutral-200 rounded-xl flex flex-col items-center">
                  {(() => {
                    const t = pdfTheme || { bannerColor: '#0f172a', titleColor: '#ffffff', subtitleColor: '#94a3b8', highlightColor: '#059669', logoSize: 40, logoOffsetX: 0, logoOffsetY: 0 };
                    let logoWidth = t.logoSize || 40;
                    const ratio = logoDimensions.width > 0 ? logoDimensions.height / logoDimensions.width : (25 / 40);
                    let logoHeight = logoWidth * ratio;
                    
                    // Budget height constraint: Maximum height is 34mm inside the 38mm banner
                    if (logoHeight > 34) {
                      logoHeight = 34;
                      logoWidth = logoHeight / ratio;
                    }

                    let xPos = 200 - logoWidth + (t.logoOffsetX || 0);
                    let yPos = 19 - (logoHeight / 2) + (t.logoOffsetY || 0);
                    
                    // Clamp to keep it within the 210mm x 38mm banner bounds
                    if (xPos < 10) xPos = 10;
                    if (xPos + logoWidth > 200) xPos = 200 - logoWidth;
                    
                    if (yPos < 2) yPos = 2;
                    if (yPos + logoHeight > 36) yPos = 36 - logoHeight;
                    
                    const leftPercent = (xPos / 210) * 100;
                    const topPercent = (yPos / 38) * 100;
                    const widthPercent = (logoWidth / 210) * 100;
                    const heightPercent = (logoHeight / 38) * 100;

                    return (
                      <>
                        <span className="text-[11px] font-bold text-neutral-500 mb-4 uppercase tracking-wider block">
                          Pré-visualização da Página A4 Real
                        </span>
                        
                        {/* Miniature A4 Sheet container */}
                        <div 
                          style={{ aspectRatio: '210/297' }}
                          className="w-full max-w-[320px] bg-white rounded shadow-lg border border-neutral-300 relative flex flex-col select-none overflow-hidden"
                        >
                           {/* 210 x 38mm Banner (12.8% of the A4 height) */}
                           <div 
                             className="w-full relative overflow-hidden"
                             style={{ backgroundColor: t.bannerColor, height: '12.8%' }}
                           >
                             <div className="absolute left-[7.14%] top-[14%] h-[72%] flex flex-col justify-between text-left">
                               <span 
                                 style={{ color: t.titleColor, fontSize: '0.45rem' }} 
                                 className="font-bold tracking-tight leading-none uppercase"
                               >
                                 RESUMO DE PRESTAÇÃO DE SERVIÇOS
                               </span>
                               <div className="flex flex-col gap-[3%] leading-none">
                                 <span 
                                   style={{ color: t.subtitleColor, fontSize: '0.24rem' }}
                                   className="opacity-90 font-medium"
                                 >
                                   Gerado em: {new Date().toLocaleDateString('pt-BR')}
                                 </span>
                                 <span 
                                   style={{ color: t.subtitleColor, fontSize: '0.24rem' }}
                                   className="opacity-95 font-medium"
                                 >
                                   Projeto: Preview | Cliente: Preview
                                 </span>
                               </div>
                             </div>

                             {/* Clamped and Proportional Logo */}
                             {companyLogo && (
                               <img 
                                 src={companyLogo} 
                                 alt="Logo" 
                                 onLoad={(e) => {
                                   const target = e.currentTarget;
                                   setLogoDimensions({
                                     width: target.naturalWidth,
                                     height: target.naturalHeight
                                   });
                                 }}
                                 style={{ 
                                   position: 'absolute',
                                   left: `${leftPercent}%`,
                                   top: `${topPercent}%`,
                                   width: `${widthPercent}%`,
                                   height: `${heightPercent}%`,
                                   objectFit: 'contain'
                                 }}
                                 className="pointer-events-none"
                               />
                             )}
                           </div>

                           {/* Highlight line 3mm / 297mm = 1.01% */}
                           <div 
                             className="w-full"
                             style={{ backgroundColor: t.highlightColor, height: '1.01%' }}
                           />

                           {/* PDF Mock Page Body below */}
                           <div className="flex-1 p-[7.14%] flex flex-col text-left text-neutral-800 font-sans gap-[3%]">
                             {/* Grid containing Professional and Company details */}
                              <div className="grid grid-cols-2 gap-4 border-b border-neutral-200 pb-[3%]">
                                {/* Profissional Section */}
                                <div className="space-y-1">
                                  <span className="block text-[6px] font-bold text-neutral-800 uppercase tracking-wide">
                                    DADOS DO PROFISSIONAL
                                  </span>
                                  <div className="text-[5px] flex flex-col gap-0.5">
                                    <div>
                                      <span className="font-semibold text-neutral-400">Nome:</span> <span className="text-neutral-700">Fulano de Tal</span>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-neutral-400">Função:</span> <span className="text-purple-600 font-semibold font-sans">Video Producer</span>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-neutral-400">E-mail:</span> <span className="text-neutral-700">exemplo@email.com</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Empresa Section */}
                                <div className="space-y-1">
                                  <span className="block text-[6px] font-bold text-neutral-800 uppercase tracking-wide">
                                    DADOS DA EMPRESA
                                  </span>
                                  <div className="text-[5px] flex flex-col gap-0.5">
                                    <div>
                                      <span className="font-semibold text-neutral-400">Razão Social:</span> <span className="text-neutral-700 truncate block max-w-[100px]">{t.companyName || 'Nao informado'}</span>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-neutral-400">CNPJ:</span> <span className="text-neutral-700">{t.companyCnpj || 'Nao informado'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                                 

                             {/* Table mockup */}
                             <div className="flex-1 flex flex-col">
                               <span className="block text-[6px] font-bold text-neutral-800 uppercase tracking-wide mb-[2%]">
                                 DETALHAMENTO DE DIÁRIAS E HORÁRIOS
                               </span>
                               {/* Fake Table Header */}
                               <div className="bg-neutral-50 border border-neutral-200 h-[6.5%] flex items-center justify-between px-1 text-[4px] font-semibold text-neutral-500">
                                 <span>Dia / Turno</span>
                                 <span>Refeições</span>
                                 <span>Total</span>
                               </div>
                               {/* Rows */}
                               <div className="border-x border-b border-neutral-200 flex-1 flex flex-col divide-y divide-neutral-100">
                                 <div className="flex-1 flex items-center justify-between px-1 text-[4px] text-neutral-600 bg-white">
                                   <span>10/06 - Diurna</span>
                                   <span>Almoço</span>
                                   <span className="font-medium">R$ 350,00</span>
                                 </div>
                                 <div className="flex-1 flex items-center justify-between px-1 text-[4px] text-neutral-600 bg-neutral-50/20">
                                   <span>11/06 - Diurna</span>
                                   <span>Almoço</span>
                                   <span className="font-medium">R$ 350,00</span>
                                 </div>
                                 <div className="flex-1 flex items-center justify-between px-1 text-[4px] text-neutral-600 bg-white">
                                   <span>12/06 - Noturna</span>
                                   <span>Jantar</span>
                                   <span className="font-medium">R$ 420,00</span>
                                 </div>
                               </div>
                             </div>

                             {/* Financeiro total box */}
                             <div className="bg-neutral-50 border border-neutral-200 p-1.5 rounded flex flex-col gap-0.5">
                               <span className="text-[5px] font-bold text-neutral-700">RESUMO FINANCEIRO DO ACORDO</span>
                               <hr className="border-neutral-200 my-0.5" />
                               <div className="grid grid-cols-2 gap-y-0.5 text-[4px] text-neutral-600">
                                 <span>Dias Trabalhados: 3</span>
                                 <span>Subtotal Cachê: R$ 1.120,00</span>
                                 <span>Total Horas: 24h</span>
                                 <span>Total Alimentação: R$ 75,00</span>
                               </div>
                               <div className="mt-1 bg-emerald-50 border border-emerald-100 rounded p-[2%] flex justify-between items-center text-[5px] text-emerald-800 font-bold">
                                 <span>TOTAL A RECEBER:</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'api' && (
          <ApiWebhooksManagement
            freelancers={freelancers}
            tasks={tasks}
            clients={clients}
            users={users}
          />
        )}

        {activeSubTab === 'whatsapp' && (
          <WhatsAppManagement />
        )}
      </div>

      {/* Modal for editing selected Client */}
      <AnimatePresence>
        {editingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-neutral-300 flex flex-col"
            >
              <div className="bg-neutral-900 border-b border-neutral-800 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold text-sm">Editar Cliente Corporativo</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="text-white bg-neutral-800 hover:bg-neutral-700 p-1 px-2 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editClientName.trim()) {
                    alert('O nome do cliente é obrigatório.');
                    return;
                  }
                  if (onUpdateClient && editingClient) {
                                    onUpdateClient({
                                      ...editingClient,
                                      nome: editClientName.trim(),
                                      cnpj: editClientCnpj.trim() || undefined,
                                      segmento: editClientSegment.trim() || undefined,
                                      email: editClientEmail.trim() || undefined,
                                      telefone: editClientPhone.trim() || undefined
                                    });
                                    setEditingClient(null);
                                  }
                }}
                className="p-5 space-y-4 text-xs"
              >
                <div>
                  <label className="block font-bold text-neutral-500 uppercase mb-1">Nome / Razão Social *</label>
                  <input
                    type="text"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-500 uppercase mb-1">CNPJ (Opcional)</label>
                  <input
                    type="text"
                    value={editClientCnpj}
                    onChange={(e) => setEditClientCnpj(formatCNPJ(e.target.value))}
                    placeholder="Ex: 00.000.000/0000-00"
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-500 uppercase mb-1">Segmento / Setor</label>
                  <input
                    type="text"
                    value={editClientSegment}
                    onChange={(e) => setEditClientSegment(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-500 uppercase mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={editClientEmail}
                    onChange={(e) => setEditClientEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-500 uppercase mb-1">Telefone de Contato</label>
                  <input
                    type="text"
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-mono"
                  />
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="border border-neutral-250 hover:bg-neutral-50 px-4 py-2 rounded-lg text-neutral-700 cursor-pointer text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer text-xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for viewing archived freelancer info */}
      <AnimatePresence>
        {selectedArchived && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-neutral-300 flex flex-col"
            >
              <div className="bg-neutral-900 border-b border-neutral-800 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-purple-500">
                    {selectedArchived.nome.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{selectedArchived.nome}</h3>
                    <p className="text-neutral-400 text-xs">{selectedArchived.cargo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArchived(null)}
                  className="text-white bg-neutral-800 hover:bg-neutral-700 p-1.5 px-2.5 rounded-lg transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-sm text-neutral-750">
                {selectedArchived.motivoArquivamento && (
                  <div className="bg-purple-600/10 border border-amber-500/20 p-4 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Motivo do Arquivamento</span>
                      <span className="text-[10px] font-bold text-neutral-400 font-mono">{selectedArchived.dataArquivamento}</span>
                    </div>
                    <p className="text-neutral-800 text-xs font-medium italic">
                      "{selectedArchived.motivoArquivamento}"
                    </p>
                    <div className="text-[10px] text-neutral-500 pt-1.5 border-t border-amber-500/10 flex justify-between">
                      <span>Arquivado por:</span>
                      <span className="font-bold text-neutral-700">{selectedArchived.arquivadoPor}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Telefone</span>
                    <span className="font-medium text-neutral-900">{selectedArchived.telefone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">E-mail</span>
                    <span className="font-medium text-neutral-900">{selectedArchived.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Cachê Base</span>
                    <span className="font-semibold text-neutral-900 font-mono">R$ {selectedArchived.valorHora}/diária</span>
                  </div>
                  {selectedArchived.cpfCif && (
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">CPF / CIF</span>
                      <span className="font-semibold text-neutral-900 font-mono">{selectedArchived.cpfCif}</span>
                    </div>
                  )}
                  {selectedArchived.cnpj && (
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">CNPJ</span>
                      <span className="font-semibold text-neutral-900 font-mono">{selectedArchived.cnpj}</span>
                    </div>
                  )}
                </div>

                {selectedArchived.enderecoCompleto && (
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Endereço Completo</span>
                    <span className="text-neutral-700">{selectedArchived.enderecoCompleto}</span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider">Biografia</span>
                  <p className="text-neutral-600 bg-neutral-50 border border-neutral-150 p-3 rounded-lg text-xs italic">
                    "{selectedArchived.bio}"
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      onRestoreFreelancer(selectedArchived.id);
                      setSelectedArchived(null);
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Restaurar à Base Ativa
                  </button>
                  <button
                    onClick={() => setSelectedArchived(null)}
                    className="border border-neutral-250 hover:bg-neutral-50 px-4 py-2 rounded-lg text-xs text-neutral-700 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Permanent Deletion */}
      <AnimatePresence>
        {freelancerToFullyDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-rose-200 p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rose-100 border border-rose-200 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-base">Atenção Extrema</h4>
                  <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
                    Deseja apagar de vez e de forma permanente o freelancer <span className="font-bold text-neutral-800">{freelancerToFullyDelete.nome}</span>? Esta ação NÃO poderá ser desfeita. Todos os acessos e históricos serão removidos.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setFreelancerToFullyDelete(null)}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onFullyDeleteFreelancer(freelancerToFullyDelete.id);
                    setFreelancerToFullyDelete(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Permanentemente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rodapé da página */}
      <footer className="pt-8 pb-4 text-center border-t border-neutral-200/80 mt-8 text-xs text-neutral-400 font-mono">
        versão 0.0.1
      </footer>
    </div>
  );
}
