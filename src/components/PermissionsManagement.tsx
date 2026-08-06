import React from 'react';
import { ProfilePermissions } from '../types';
import { 
  Shield, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  Briefcase, 
  Calendar, 
  Settings, 
  HelpCircle,
  RotateCcw,
  PlusCircle,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface PermissionsManagementProps {
  permissions: ProfilePermissions[];
  onUpdatePermissions: (updated: ProfilePermissions[]) => void;
  onResetToDefaults: () => void;
  currentUserProfile: string;
}

export default function PermissionsManagement({
  permissions,
  onUpdatePermissions,
  onResetToDefaults,
  currentUserProfile
}: PermissionsManagementProps) {

  // Function to toggle a particular permission for a specific profile
  const handleToggle = (perfil: ProfilePermissions['perfil'], field: keyof Omit<ProfilePermissions, 'perfil'>) => {
    // Safety check: Don't allow degrading the current Administrador role too easily if that blocks core features on themselves
    if (perfil === 'Administrador' && field === 'canConfigurePermissions') {
      alert('Por segurança corporativa, o perfil Administrador não pode ter a permissão de ditar configurações revogada!');
      return;
    }

    const updated = permissions.map(p => {
      if (p.perfil === perfil) {
        return {
          ...p,
          [field]: !p[field]
        };
      }
      return p;
    });
    
    onUpdatePermissions(updated);
  };

  const getProfileBadge = (perfil: string) => {
    switch (perfil) {
      case 'Administrador':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Gestor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Produtor':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Freelancer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const permissionRow = (
    title: string, 
    description: string, 
    field: keyof Omit<ProfilePermissions, 'perfil'>, 
    icon: React.ReactNode
  ) => {
    return (
      <tr className="hover:bg-neutral-50/60 transition-colors border-b border-neutral-100">
        <td className="py-4 px-4 max-w-sm">
          <div className="flex gap-3">
            <span className="p-2 bg-neutral-100 text-neutral-600 rounded-xl flex items-center justify-center shrink-0 w-9 h-9 border border-neutral-200">
              {icon}
            </span>
            <div>
              <span className="font-bold text-neutral-900 block text-xs leading-tight">{title}</span>
              <span className="text-[11px] text-neutral-500 leading-normal block mt-1 font-medium">{description}</span>
            </div>
          </div>
        </td>
        {(['Administrador', 'Gestor', 'Produtor', 'Freelancer'] as const).map(role => {
          const profilePerm = permissions.find(p => p.perfil === role);
          const isEnabled = profilePerm ? profilePerm[field] : false;
          // Administrador always has some fields forced-on
          const isLocked = role === 'Administrador' && field === 'canConfigurePermissions';

          return (
            <td key={role} className="py-4 px-4 text-center align-middle">
              <div className="flex items-center justify-center">
                {isLocked ? (
                  <button
                    type="button"
                    title="Permissão obrigatória travada"
                    className="w-10 h-6 bg-neutral-200 text-neutral-400 rounded-full flex items-center justify-start px-1 cursor-not-allowed opacity-60"
                  >
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-neutral-400" />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggle(role, field)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                      isEnabled ? 'bg-purple-600 border border-amber-600' : 'bg-neutral-200 border border-neutral-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 shadow-sm flex items-center justify-center ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      {isEnabled ? (
                        <div className="w-1 h-1 bg-amber-600 rounded-full" />
                      ) : (
                        <div className="w-1 h-1 bg-neutral-400 rounded-full" />
                      )}
                    </div>
                  </button>
                )}
              </div>
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" id="permissions-manager-module">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-neutral-900 text-white p-6 rounded-2xl border border-neutral-800 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded bg-purple-500 text-neutral-950 text-[10px] uppercase font-bold tracking-widest font-mono">
              Segurança
            </span>
            <h1 className="text-lg font-bold tracking-tight">Matriz Operacional de Alocação de Permissões</h1>
          </div>
          <p className="text-neutral-400 text-xs font-medium">
            Clique nos interruptores abaixo para moldar dinamicamente os privilégios das 4 funções. Mudanças são aplicadas instantaneamente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Deseja de fato restaurar a matriz original de segurança de perfis para as configurações de fábrica?')) {
              onResetToDefaults();
            }
          }}
          className="px-3.5 py-2 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:text-white transition-all select-none self-start sm:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-neutral-50/85 border-b border-neutral-200 text-neutral-550 text-[10px] font-extrabold uppercase tracking-widest">
                <th className="py-4 px-6 w-[45%] font-bold">Especificação de Permissão / Funcionalidade</th>
                {(['Administrador', 'Gestor', 'Produtor', 'Freelancer'] as const).map(role => (
                  <th key={role} className="py-4 px-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getProfileBadge(role)}`}>
                      {role}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {permissionRow(
                'Visualizar Dashboard Estatístico',
                'Acesso à visualização panorâmica de métricas de faturamento médio, gráficos de diárias, número de reuniões e contagem consolidada de demandas.',
                'canViewDashboard',
                <Briefcase className="w-4 h-4 text-neutral-600" />
              )}
              {permissionRow(
                'Operar Projetos e Atribuir Profissionais',
                'Acesso completo para criação e remoção de projetos, definição de diárias operacionais, contratação de especialidades e alocação de freelancers em canais.',
                'canManageProjects',
                <Settings className="w-4 h-4 text-neutral-600" />
              )}
              {permissionRow(
                'Visualizar Cadastro de Talentos',
                'Permissão para abrir a carteira consolidada de talentos da corporação, ler históricos de projetos de cada um, visualizar e-mails e bios de apresentação.',
                'canViewRegistry',
                <Users className="w-4 h-4 text-neutral-600" />
              )}
              {permissionRow(
                'Modificar Base de Talentos Corporativa',
                'Permissão de nível de escrita para cadastrar novos profissionais, editar habilitações e dados de CPF/CNPJ, arquivar em quarentena ou deletar permanentemente.',
                'canEditRegistry',
                <PlusCircle className="w-4 h-4 text-neutral-600" />
              )}
              {permissionRow(
                'Visualizar Filtros e Agenda Global de Diárias',
                'Acesso visual ao calendário interativo geral para ver a agenda, datas indisponíveis e agendas operacionais de todos os freelancers do sistema.',
                'canViewCalendarAll',
                <Calendar className="w-4 h-4 text-neutral-600" />
              )}
              {permissionRow(
                'Painel Administrativo Interno',
                'Acesso ao menu de administração geral, incluindo a visualização e restauração de talentos arquivados em quarentena, bem como o módulo de Clientes Corporativos.',
                'canViewAdminPanel',
                <Shield className="w-4 h-4 text-neutral-600" />
              )}
              {permissionRow(
                'Configuração de Matrizes de Perfis',
                'Privilégio máximo de alteração de chaves lógicas de permissões dos cargos do sistema (esta tela).',
                'canConfigurePermissions',
                <Settings className="w-4 h-4 text-neutral-600" />
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-purple-600/10 p-5 rounded-2xl border border-amber-500/15 flex gap-3 text-xs leading-relaxed text-amber-900 max-w-4xl font-medium">
        <div className="shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="space-y-1">
          <span className="font-bold text-neutral-900 block uppercase tracking-wide text-[10px]">Alinhamento de Segurança Operacional</span>
          <p>
            O perfil <strong className="text-neutral-950 font-bold">Freelancer</strong> herda um fluxo de visualização especial quando integrado. Mesmo com bloqueios visuais na barra de menus principal, o perfil Freelancer de logado pode responder aos convites de demandas na <strong className="text-neutral-950 font-bold">Central de Notificações Pessoais</strong>, além de ler seu próprio cronograma individualizado.
          </p>
        </div>
      </div>
    </div>
  );
}
