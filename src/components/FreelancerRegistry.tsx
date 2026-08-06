import React, { useState } from 'react';
import { Freelancer, PerformanceReview, ProjectHistory, Task, UserProfile, RegistrationRequest } from '../types';
import { loadFromDatabase, saveToDatabase } from '../database';
import { 
  Search, 
  Plus, 
  MapPin, 
  Mail, 
  Phone, 
  Star, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  Trash2, 
  Award, 
  PlusCircle,
  Calendar,
  Sparkles,
  ArrowUpRight,
  LayoutGrid,
  List,
  User,
  AlertCircle,
  Settings,
  Paperclip,
  Edit2,
  Check,
  X,
  Copy,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FreelancerRegistryProps {
  freelancers: Freelancer[];
  tasks?: Task[];
  onAddFreelancer: (freelancer: Freelancer) => void;
  onUpdateFreelancer: (freelancer: Freelancer) => void;
  onDeleteFreelancer: (id: string, motivo: string, quemMoveu: string) => void;
  readOnly?: boolean;
  onNavigateToProject?: (projectId: string) => void;
  currentUser?: UserProfile | null;
  pendingApprovalRegistration?: RegistrationRequest | null;
  onClearPendingRegistration?: () => void;
  onRegistrationCompleted?: (reqId: string) => void;
}

function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 3) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}.${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)}.${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

import { compressImage } from '../utils/imageUtils';

export default function FreelancerRegistry({ 
  freelancers, 
  tasks = [],
  onAddFreelancer, 
  onUpdateFreelancer, 
  onDeleteFreelancer,
  readOnly = false,
  onNavigateToProject,
  currentUser,
  pendingApprovalRegistration,
  onClearPendingRegistration,
  onRegistrationCompleted
}: FreelancerRegistryProps) {
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    const key = `freelancer_favorites_${currentUser?.id || 'default'}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(id);
      const updated = isFav ? prev.filter(fId => fId !== id) : [...prev, id];
      const key = `freelancer_favorites_${currentUser?.id || 'default'}`;
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  };
  
  interface RoleFunction {
    id: string;
    name: string;
    baseHourlyRate: number;
  }

  const [dbLoaded, setDbLoaded] = useState(false);

  const isLoadedRef = React.useRef({
    roles: false,
    certifications: false,
  });

  const lastDbValueRef = React.useRef<{
    roles: any;
    certifications: any;
  }>({
    roles: null,
    certifications: null,
  });

  // Base de dados de funções cadastradas
  const [roles, setRoles] = useState<RoleFunction[]>(() => {
    const saved = localStorage.getItem('freelance_management_roles');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'role-1', name: 'UI/UX Designer', baseHourlyRate: 850 },
      { id: 'role-2', name: 'Adesivador Comercial', baseHourlyRate: 600 },
      { id: 'role-3', name: 'Ilustrador de Vetores', baseHourlyRate: 650 },
      { id: 'role-4', name: 'Web Designer Sênior', baseHourlyRate: 750 },
      { id: 'role-5', name: 'Sênior Back-End Developer', baseHourlyRate: 950 },
      { id: 'role-6', name: 'Redator', baseHourlyRate: 450 },
      { id: 'role-7', name: 'Fotógrafo', baseHourlyRate: 800 },
      { id: 'role-8', name: 'Especialista em Conteúdo', baseHourlyRate: 500 },
      { id: 'role-9', name: 'Gestora de Tráfego', baseHourlyRate: 700 },
      { id: 'role-10', name: 'Monitor de Eventos', baseHourlyRate: 350 }
    ];
  });

  // Base de dados de certificações cadastradas
  const [certificationsDb, setCertificationsDb] = useState<string[]>(() => {
    const saved = localStorage.getItem('freelance_management_certifications');
    if (saved) return JSON.parse(saved);
    return [
      'NR10 - Segurança em Eletricidade',
      'NR35 - Trabalho em Altura',
      'Brigada de Incêndio',
      'Operador de Empilhadeira',
      'Primeiros Socorros Sênior',
      'ISO 9001 - Auditor Líder',
      'Gerenciamento de Projetos (PMP)',
      'Trabalho em Espaço Confinado (NR33)',
      'Direção Defensiva'
    ];
  });

  // Sync initial state from Database on mount
  React.useEffect(() => {
    async function loadRolesAndCerts() {
      try {
        const [dbRoles, dbCerts] = await Promise.all([
          loadFromDatabase('roles').catch(err => { console.warn('[Database] failed load roles', err); return null; }),
          loadFromDatabase('certifications').catch(err => { console.warn('[Database] failed load certifications', err); return null; })
        ]);
        if (dbRoles !== null) {
          setRoles(dbRoles);
          lastDbValueRef.current.roles = dbRoles;
        }
        isLoadedRef.current.roles = true;

        if (dbCerts !== null) {
          setCertificationsDb(dbCerts);
          lastDbValueRef.current.certifications = dbCerts;
        }
        isLoadedRef.current.certifications = true;
      } catch (err) {
        console.warn("Failed to load roles/certs from Database", err);
      } finally {
        setDbLoaded(true);
      }
    }
    loadRolesAndCerts();
  }, []);

  // Salva no localStorage sempre que alterado
  React.useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.roles) return;
    localStorage.setItem('freelance_management_roles', JSON.stringify(roles));
    if (JSON.stringify(roles) !== JSON.stringify(lastDbValueRef.current.roles)) {
      lastDbValueRef.current.roles = roles;
      saveToDatabase('roles', roles);
    }
  }, [roles, dbLoaded]);

  const [showRolesModal, setShowRolesModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState<string>('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleRate, setNewRoleRate] = useState('');

  React.useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current.certifications) return;
    localStorage.setItem('freelance_management_certifications', JSON.stringify(certificationsDb));
    if (JSON.stringify(certificationsDb) !== JSON.stringify(lastDbValueRef.current.certifications)) {
      lastDbValueRef.current.certifications = certificationsDb;
      saveToDatabase('certifications', certificationsDb);
    }
  }, [certificationsDb, dbLoaded]);

  const [showCertificationsDbModal, setShowCertificationsDbModal] = useState(false);
  const [newCertDbName, setNewCertDbName] = useState('');
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [editingCertName, setEditingCertName] = useState('');

  // Individual certification insertion in profile sidebar
  const [showAddCertificationForm, setShowAddCertificationForm] = useState(false);
  const [newCertNome, setNewCertNome] = useState('');
  const [newCertValidade, setNewCertValidade] = useState('');
  const [newCertAnexo, setNewCertAnexo] = useState<{ name: string; size: number; type: string; dataUrl?: string } | null>(null);

  const handleCertAnexoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 300 * 1024) {
      alert('Limite de 300KB excedido. Documentos muito grandes não podem ser salvos no banco de dados operacional. Por favor, comprima seu anexo (PDF/Imagem) ou divida-o.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewCertAnexo({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Selected array states for multi-select of roles
  const [formHabilidades, setFormHabilidades] = useState<string[]>([]);
  const [formTarifasSecundarias, setFormTarifasSecundarias] = useState<Record<string, number>>({});
  const [formFotoPerfil, setFormFotoPerfil] = useState('');
  const [selectedSecondaryRoleToAdd, setSelectedSecondaryRoleToAdd] = useState('');

  // Interface states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisponibilidade, setSelectedDisponibilidade] = useState('Todos');
  const [selectedMainRole, setSelectedMainRole] = useState('Todos');
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);

  // Derived Project History including tasks from global tasks array
  const activeCompletedHistory = React.useMemo(() => {
    if (!selectedFreelancer) return [];
    
    // Map existing history explicitly saved in freelancer
    const explicitHistory = selectedFreelancer.historicoProjetos || [];
    
    // Compute from global tasks
    const derivedHistory: ProjectHistory[] = [];
    tasks.forEach(tb => {
      if (tb.status === 'Concluído' && tb.alocacoes) {
        const match = tb.alocacoes.find(a => a.freelancerId === selectedFreelancer.id && (a.statusConfirmacao === 'Confirmado' || !a.statusConfirmacao));
        if (match) {
          // Avoid duplicates if also saved explicitly (though unlikely since we use different id prefixes)
          const isDuplicate = explicitHistory.some(existing => existing.nome === tb.titulo && existing.dataInicio === tb.dataInicio);
          if (!isDuplicate) {
            derivedHistory.push({
              id: `derived-${tb.id}`,
              nome: tb.titulo,
              cliente: tb.projeto || 'Sistema',
              dataInicio: tb.dataInicio || '',
              dataFim: tb.dataFim || tb.dataInicio || '',
              status: 'Concluído',
              cargo: match.funcao,
              valorRecebido: match.valorHora
            });
          }
        }
      }
    });

    return [...explicitHistory, ...derivedHistory].sort((a, b) => new Date(b.dataFim).getTime() - new Date(a.dataFim).getTime());
  }, [selectedFreelancer, tasks]);

  const handleProjectClick = (proj: ProjectHistory) => {
    if (!onNavigateToProject) return;
    
    let targetTaskId: string | null = null;
    if (proj.id && proj.id.startsWith('derived-')) {
      targetTaskId = proj.id.replace('derived-', '');
    } else {
      const matchingTask = tasks.find(t => 
        t.id === proj.id || 
        t.titulo.toLowerCase().trim() === proj.nome.toLowerCase().trim()
      );
      if (matchingTask) {
        targetTaskId = matchingTask.id;
      }
    }
    
    onNavigateToProject(targetTaskId || '');
    setSelectedFreelancer(null);
  };

  const [deletingFreelancerId, setDeletingFreelancerId] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleFunction | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveOperator, setArchiveOperator] = useState('Gabriel Arq (gabrielfeliciano.arq@gmail.com)');
  
  // Registration and addition forms toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);

  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Edit Freelancer form fields
  const [editNome, setEditNome] = useState('');
  const [editCargo, setEditCargo] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editValorHora, setEditValorHora] = useState(600);
  const [editCpfCif, setEditCpfCif] = useState('');
  const [editCnpj, setEditCnpj] = useState('');
  const [editEnderecoCompleto, setEditEnderecoCompleto] = useState('');
  const [editFotoPerfil, setEditFotoPerfil] = useState('');
  const [editHabilidades, setEditHabilidades] = useState<string[]>([]);
  const [editTarifasSecundarias, setEditTarifasSecundarias] = useState<Record<string, number>>({});
  const [selectedSecondaryRoleToEditAdd, setSelectedSecondaryRoleToEditAdd] = useState('');

  // New Freelancer form fields
  const [formNome, setFormNome] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formValorHora, setFormValorHora] = useState(600);
  const [formDisponibilidade, setFormDisponibilidade] = useState<'Disponível' | 'Indisponível' | 'Parcial'>('Disponível');
  const [formCpfCif, setFormCpfCif] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formEnderecoCompleto, setFormEnderecoCompleto] = useState('');

  // Add Project History fields
  const [newProjectNome, setNewProjectNome] = useState('');
  const [newProjectCliente, setNewProjectCliente] = useState('');
  const [newProjectInicio, setNewProjectInicio] = useState('');
  const [newProjectFim, setNewProjectFim] = useState('');
  const [newProjectCargo, setNewProjectCargo] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<'Concluído' | 'Em Andamento' | 'Cancelado'>('Concluído');
  const [newProjectValorRecebido, setNewProjectValorRecebido] = useState('');

  // Add Review fields
  const [reviewProjeto, setReviewProjeto] = useState('');
  const [reviewCliente, setReviewCliente] = useState('');
  const [reviewNota, setReviewNota] = useState(5);
  const [reviewComentario, setReviewComentario] = useState('');

  React.useEffect(() => {
    if (pendingApprovalRegistration) {
      setFormNome(pendingApprovalRegistration.nome + ' ' + pendingApprovalRegistration.sobrenome);
      setFormCargo(''); // User needs to select a valid one or we pre-fill and let them edit
      setFormEmail(pendingApprovalRegistration.email);
      setFormTelefone(pendingApprovalRegistration.whatsapp);
      setFormCpfCif(pendingApprovalRegistration.cpf);
      setFormBio(`Especialidade informada pelo talento: ${pendingApprovalRegistration.cargo}\n\n${pendingApprovalRegistration.instagram ? 'Instagram: ' + pendingApprovalRegistration.instagram + '\n' : ''}${pendingApprovalRegistration.siteReferencia ? 'Site: ' + pendingApprovalRegistration.siteReferencia : ''}`);
      setShowAddModal(true);
    }
  }, [pendingApprovalRegistration]);

  // Extract all unique main functions across all freelancers and roles to populate filters
  const allMainRoles = Array.from(
    new Set([
      ...roles.map(r => r.name),
      ...freelancers.filter(f => f.arquivado !== true).map(f => f.cargo)
    ])
  ).filter(Boolean).sort();

  // Filter freelancers list
  const filteredFreelancers = freelancers.filter(f => {
    if (f.arquivado === true) return false;
    
    const matchesSearch = f.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.habilidades.some(h => h.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMainRole = selectedMainRole === 'Todos' || f.cargo === selectedMainRole;

    return matchesSearch && matchesMainRole;
  });

  const getDisponibilidadeBadge = (status: Freelancer['disponibilidade']) => {
    switch (status) {
      case 'Disponível':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Disponível
          </span>
        );
      case 'Parcial':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            Parcial
          </span>
        );
      case 'Indisponível':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full border border-neutral-250">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
            Indisponível
          </span>
        );
    }
  };

  const getAverageStars = (f: Freelancer) => {
    if (f.avaliacoes.length === 0) return 0;
    const sum = f.avaliacoes.reduce((acc, current) => acc + current.nota, 0);
    return Number((sum / f.avaliacoes.length).toFixed(1));
  };

  // Submit handlings
  const handleCreateFreelancer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome || !formCargo || !formTelefone) {
      alert('Nome, Função Principal e Telefone são de preenchimento obrigatório.');
      return;
    }

    const newFreelancer: Freelancer = {
      id: `free-${Date.now()}`,
      nome: formNome,
      cargo: formCargo,
      email: formEmail,
      telefone: formTelefone,
      cidade: 'Home Office',
      habilidades: formHabilidades.length > 0 ? formHabilidades : ['Geral'],
      tarifasSecundarias: formTarifasSecundarias,
      disponibilidade: 'Disponível',
      bio: formBio || 'Nenhuma biografia fornecida.',
      valorHora: Number(formValorHora) || 50,
      fotoPerfil: formFotoPerfil || undefined,
      cpfCif: formCpfCif || undefined,
      cnpj: formCnpj || undefined,
      enderecoCompleto: formEnderecoCompleto || undefined,
      avaliacoes: [],
      historicoProjetos: []
    };

    onAddFreelancer(newFreelancer);
    setShowAddModal(false);
    
    if (pendingApprovalRegistration && onRegistrationCompleted) {
      onRegistrationCompleted(pendingApprovalRegistration.id);
      if (onClearPendingRegistration) onClearPendingRegistration();
    }

    // Reset fields
    setFormNome('');
    setFormCargo(roles[0]?.name || '');
    setFormEmail('');
    setFormTelefone('');
    setFormBio('');
    setFormValorHora(roles[0]?.baseHourlyRate || 600);
    setFormHabilidades([]);
    setFormTarifasSecundarias({});
    setFormFotoPerfil('');
    setFormCpfCif('');
    setFormCnpj('');
    setFormEnderecoCompleto('');
  };

  const handleAddProjectToHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFreelancer || !newProjectNome || !newProjectCliente) {
      alert('Preencha os campos obrigatórios do projeto.');
      return;
    }

    const newProj: ProjectHistory = {
      id: `proj-${Date.now()}`,
      nome: newProjectNome,
      cliente: newProjectCliente,
      dataInicio: newProjectInicio || '2026-01-01',
      dataFim: newProjectFim || '2026-02-01',
      status: newProjectStatus,
      cargo: newProjectCargo || selectedFreelancer.cargo,
      valorRecebido: newProjectValorRecebido ? Number(newProjectValorRecebido) : undefined
    };

    const updatedFreelancer: Freelancer = {
      ...selectedFreelancer,
      historicoProjetos: [newProj, ...selectedFreelancer.historicoProjetos]
    };

    onUpdateFreelancer(updatedFreelancer);
    setSelectedFreelancer(updatedFreelancer);

    // Clear and toggle
    setNewProjectNome('');
    setNewProjectCliente('');
    setNewProjectInicio('');
    setNewProjectFim('');
    setNewProjectCargo('');
    setNewProjectValorRecebido('');
    setShowAddProjectForm(false);
  };

  const handleAddCertificationToFreelancer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFreelancer || !newCertNome) {
      alert('Selecione uma certificação para adicionar.');
      return;
    }

    const newCert = {
      id: `cert-${Date.now()}`,
      nome: newCertNome,
      dataValidade: newCertValidade || 'Sem data',
      anexo: newCertAnexo || undefined
    };

    const currentCertificacoes = selectedFreelancer.certificacoes || [];
    
    // Check if freelancer already has this certification
    if (currentCertificacoes.some(c => c.nome === newCertNome)) {
      alert('Este colaborador já possui esta certificação cadastrada.');
      return;
    }

    const updatedFreelancer: Freelancer = {
      ...selectedFreelancer,
      certificacoes: [newCert, ...currentCertificacoes]
    };

    onUpdateFreelancer(updatedFreelancer);
    setSelectedFreelancer(updatedFreelancer);
    
    // Clear form
    setNewCertNome('');
    setNewCertValidade('');
    setNewCertAnexo(null);
    setShowAddCertificationForm(false);
  };

  const handleRemoveCertificationFromFreelancer = (certId: string) => {
    if (!selectedFreelancer) return;
    
    const currentCertificacoes = selectedFreelancer.certificacoes || [];
    const updatedFreelancer: Freelancer = {
      ...selectedFreelancer,
      certificacoes: currentCertificacoes.filter(c => c.id !== certId)
    };

    onUpdateFreelancer(updatedFreelancer);
    setSelectedFreelancer(updatedFreelancer);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFreelancer || !reviewProjeto || !reviewCliente || !reviewComentario) {
      alert('Por favor, preencha todos os campos da avaliação.');
      return;
    }

    const newRev: PerformanceReview = {
      id: `rev-${Date.now()}`,
      projetoNome: reviewProjeto,
      cliente: reviewCliente,
      nota: Number(reviewNota),
      comentario: reviewComentario,
      data: new Date().toISOString().split('T')[0]
    };

    const updatedFreelancer: Freelancer = {
      ...selectedFreelancer,
      avaliacoes: [newRev, ...selectedFreelancer.avaliacoes]
    };

    onUpdateFreelancer(updatedFreelancer);
    setSelectedFreelancer(updatedFreelancer);

    // Clear and toggle
    setReviewProjeto('');
    setReviewCliente('');
    setReviewNota(5);
    setReviewComentario('');
    setShowAddReviewForm(false);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!selectedFreelancer) return;
    if (window.confirm('Tem certeza de que deseja apagar este comentário de desempenho?')) {
      const updatedFreelancer: Freelancer = {
        ...selectedFreelancer,
        avaliacoes: selectedFreelancer.avaliacoes.filter(rev => rev.id !== reviewId)
      };
      onUpdateFreelancer(updatedFreelancer);
      setSelectedFreelancer(updatedFreelancer);
    }
  };

  const handleUpdateAvailability = (status: Freelancer['disponibilidade']) => {
    if (!selectedFreelancer) return;
    const updated = {
      ...selectedFreelancer,
      disponibilidade: status
    };
    onUpdateFreelancer(updated);
    setSelectedFreelancer(updated);
  };

  const handleOpenEditModal = () => {
    if (!selectedFreelancer) return;
    setEditNome(selectedFreelancer.nome);
    setEditCargo(selectedFreelancer.cargo);
    setEditEmail(selectedFreelancer.email || '');
    setEditTelefone(selectedFreelancer.telefone);
    setEditBio(selectedFreelancer.bio || '');
    setEditValorHora(selectedFreelancer.valorHora);
    setEditCpfCif(selectedFreelancer.cpfCif || '');
    setEditCnpj(selectedFreelancer.cnpj || '');
    setEditEnderecoCompleto(selectedFreelancer.enderecoCompleto || '');
    setEditFotoPerfil(selectedFreelancer.fotoPerfil || '');
    setEditHabilidades(selectedFreelancer.habilidades || []);
    setEditTarifasSecundarias(selectedFreelancer.tarifasSecundarias || {});
    setSelectedSecondaryRoleToEditAdd('');
    setShowEditModal(true);
  };

  const handleUpdateFreelancerDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFreelancer) return;
    if (!editNome || !editCargo || !editTelefone) {
      alert('Nome, Função Principal e Telefone são de preenchimento obrigatório.');
      return;
    }

    const updated: Freelancer = {
      ...selectedFreelancer,
      nome: editNome,
      cargo: editCargo,
      email: editEmail,
      telefone: editTelefone,
      bio: editBio,
      valorHora: Number(editValorHora) || 0,
      cpfCif: editCpfCif || undefined,
      cnpj: editCnpj || undefined,
      enderecoCompleto: editEnderecoCompleto || undefined,
      fotoPerfil: editFotoPerfil || undefined,
      habilidades: editHabilidades,
      tarifasSecundarias: editTarifasSecundarias,
    };

    onUpdateFreelancer(updated);
    setSelectedFreelancer(updated);
    setShowEditModal(false);
  };

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedFreelancer || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check file size limit strictly for Database
    if (file.size > 300 * 1024) {
      alert('Limite de 300KB excedido. Documentos muito grandes impedem o salvamento do cadastro na nuvem. Por favor comprima ou envie um arquivo menor.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newAnexo = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: dataUrl
      };
      
      const currentAnexos = selectedFreelancer.anexos || [];
      const updated = {
        ...selectedFreelancer,
        anexos: [...currentAnexos, newAnexo]
      };
      
      onUpdateFreelancer(updated);
      setSelectedFreelancer(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAnexo = (fileName: string) => {
    if (!selectedFreelancer) return;
    const currentAnexos = selectedFreelancer.anexos || [];
    const updated = {
      ...selectedFreelancer,
      anexos: currentAnexos.filter(a => a.name !== fileName)
    };
    onUpdateFreelancer(updated);
    setSelectedFreelancer(updated);
  };

  const handleDownloadAnexo = (anexo: { name: string; dataUrl?: string }) => {
    if (!anexo.dataUrl) return;
    const link = document.createElement('a');
    link.href = anexo.dataUrl;
    link.download = anexo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveRoleName = (roleId: string) => {
    const trimmedName = editingRoleName.trim();
    if (!trimmedName) {
      alert('O nome da função não pode estar em branco.');
      return;
    }

    const currentRole = roles.find(r => r.id === roleId);
    if (!currentRole) return;

    const oldName = currentRole.name;

    // Check if the name already exists in OTHER roles
    if (roles.some(r => r.id !== roleId && r.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert('Já existe outra função com este nome.');
      return;
    }

    // Update the role name in the functions list
    setRoles(prev => prev.map(item => item.id === roleId ? { ...item, name: trimmedName } : item));

    // Propagate changes to freelancers
    if (trimmedName !== oldName) {
      freelancers.forEach(free => {
        let changed = false;
        const updatedFree = { ...free };

        if (updatedFree.cargo === oldName) {
          updatedFree.cargo = trimmedName;
          changed = true;
        }

        if (updatedFree.outrasFuncoes && updatedFree.outrasFuncoes.includes(oldName)) {
          updatedFree.outrasFuncoes = updatedFree.outrasFuncoes.map(of => of === oldName ? trimmedName : of);
          changed = true;
        }

        if (updatedFree.tarifasSecundarias && (oldName in updatedFree.tarifasSecundarias)) {
          const rateVal = updatedFree.tarifasSecundarias[oldName];
          const newTarifasSecundarias = { ...updatedFree.tarifasSecundarias };
          delete newTarifasSecundarias[oldName];
          newTarifasSecundarias[trimmedName] = rateVal;
          updatedFree.tarifasSecundarias = newTarifasSecundarias;
          changed = true;
        }

        if (changed) {
          onUpdateFreelancer(updatedFree);
          if (selectedFreelancer && selectedFreelancer.id === free.id) {
            setSelectedFreelancer(updatedFree);
          }
        }
      });
    }

    setEditingRoleId(null);
    setEditingRoleName('');
  };

  return (
    <div className="space-y-6" id="freelancers-tab">

      {/* Upper Registry Menu Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Registro de Freelancers</h1>
          <p className="text-neutral-500 text-sm mt-1">Gerencie a base de talentos, competências, opiniões e contatos diretos.</p>
        </div>
        <div className="flex items-stretch gap-2.5">
          <div className="flex flex-col gap-2 w-48">
            <button
              onClick={() => setShowRolesModal(true)}
              className="inline-flex items-center gap-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm bg-white cursor-pointer justify-center h-[38px]"
              id="btn-manage-roles"
            >
              <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
              Gerenciar Funções
            </button>
            <button
              onClick={() => setShowCertificationsDbModal(true)}
              className="inline-flex items-center gap-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm bg-white cursor-pointer justify-center h-[38px]"
              id="btn-manage-certifications"
            >
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              Gerenciar Certificações
            </button>
          </div>
          
          {!readOnly && (
            <button
              onClick={() => {
                if (roles.length > 0) {
                  if (!formCargo) {
                    setFormCargo(roles[0].name);
                    setFormValorHora(roles[0].baseHourlyRate);
                  }
                }
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer self-stretch flex-1 sm:max-w-xs"
              id="btn-register-freelancer"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Profissional
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-neutral-400">
            <Search className="w-5 h-5" />
          </span>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, especialidade ou habilidade (ex: React, Figma)..." 
            className="w-full text-sm pl-10 pr-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-lg placeholder-neutral-450 focus:outline-none focus:ring-1 focus:ring-neutral-950"
          />
        </div>

        {/* Filters dropdowns */}
        <div className="flex flex-wrap gap-2.5">

          <div className="bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-2">
            <span className="text-neutral-400 text-xs">Função Principal:</span>
            <select 
              value={selectedMainRole}
              onChange={(e) => setSelectedMainRole(e.target.value)}
              className="bg-transparent text-neutral-700 outline-none cursor-pointer pr-1"
            >
              <option value="Todos">Todas</option>
              {allMainRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>

          <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 p-0.5" id="view-mode-toggle">
            <button
              onClick={() => setViewMode('grid')}
              type="button"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white text-neutral-900 shadow-xs' 
                  : 'text-neutral-400 hover:text-neutral-750'
              }`}
              title="Visualização em Painel"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              type="button"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-neutral-900 shadow-xs' 
                  : 'text-neutral-400 hover:text-neutral-750'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conditional View Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFreelancers.length === 0 ? (
            <div className="col-span-full bg-neutral-50 text-center py-16 border border-dashed border-neutral-200 rounded-xl text-neutral-500 text-sm">
              Nenhum freelancer encontrado com os termos pesquisados.
            </div>
          ) : (
            filteredFreelancers.map((free) => {
              const stars = getAverageStars(free);
              return (
                <motion.div
                  layout
                  key={free.id}
                  className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  id={`free-card-${free.id}`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      {/* User Profile Header */}
                      <div className="flex items-center gap-3">
                        {free.fotoPerfil ? (
                          <img referrerPolicy="no-referrer" src={free.fotoPerfil} className="w-12 h-12 rounded-full object-cover border border-neutral-200" alt={free.nome} />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-200 flex items-center justify-center text-white font-semibold text-lg tracking-wide uppercase">
                            {free.nome.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-neutral-900 leading-tight text-base hover:text-neutral-700 transition-colors cursor-pointer" onClick={() => {
                            setSelectedFreelancer(free);
                            setShowAddProjectForm(false);
                            setShowAddReviewForm(false);
                          }}>
                            {free.nome}
                          </h3>
                          <p className="text-xs text-neutral-500 font-medium mt-0.5">{free.cargo}</p>
                        </div>
                      </div>

                      {/* Favorite Button on Card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(free.id);
                        }}
                        className="p-1 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer focus:outline-none shrink-0"
                        title={favorites.includes(free.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Star className={`w-4 h-4 transition-transform active:scale-125 ${
                          favorites.includes(free.id)
                            ? 'fill-amber-400 text-purple-500 scale-110'
                            : 'text-neutral-300 hover:text-neutral-450'
                        }`} />
                      </button>
                    </div>

                    {/* Rating stars */}
                    <div className="flex items-center gap-1.5 mt-4">
                      <span className="flex items-center text-purple-600 text-xs">
                        <Star className="w-4 h-4 fill-amber-500" />
                      </span>
                      <span className="text-xs font-bold text-neutral-800">
                        {stars > 0 ? stars : 'Sem avaliações'}
                      </span>
                      <span className="text-neutral-400 text-xs">
                        ({free.avaliacoes.length} {free.avaliacoes.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>

                    {/* Micro bio */}
                    <p className="text-neutral-500 text-xs mt-3 line-clamp-2 md:line-clamp-3 leading-relaxed">
                      {free.bio}
                    </p>

                    {/* Skill Badges */}
                    <div className="flex flex-wrap gap-1 md:gap-1.5 mt-4">
                      {free.habilidades.slice(0, 4).map((sk, index) => (
                        <span key={index} className="text-[10px] font-semibold bg-neutral-50 text-neutral-600 px-2 py-0.5 rounded-full border border-neutral-250">
                          {sk}
                        </span>
                      ))}
                      {free.habilidades.length > 4 && (
                        <span className="text-[10px] font-bold text-neutral-400 px-2 py-0.5">
                          +{free.habilidades.length - 4} mais
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer specs */}
                  <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-400 uppercase font-medium">Cache (diária)</span>
                      <span className="text-sm font-semibold text-neutral-900">R$ {free.valorHora} /dia</span>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedFreelancer(free);
                        setShowAddProjectForm(false);
                        setShowAddReviewForm(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-black hover:underline transition-all cursor-pointer"
                    >
                      Ver Perfil Completo
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs" id="freelancers-list-view">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Nome</th>
                  <th className="py-3.5 px-6">Função Principal</th>
                  <th className="py-3.5 px-6">Valor do Cache</th>
                  <th className="py-3.5 px-6">Nota (Média)</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-150 text-sm">
                {filteredFreelancers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-neutral-450 italic">
                      Nenhum freelancer encontrado com os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  filteredFreelancers.map((free) => {
                    const stars = getAverageStars(free);
                    return (
                      <tr 
                        key={free.id} 
                        className="hover:bg-neutral-50/70 transition-all cursor-pointer"
                        id={`free-row-${free.id}`}
                        onClick={() => {
                          setSelectedFreelancer(free);
                          setShowAddProjectForm(false);
                          setShowAddReviewForm(false);
                        }}
                      >
                        <td className="py-3.5 px-6 font-semibold text-neutral-900">
                          <div className="flex items-center gap-3">
                            {free.fotoPerfil ? (
                              <img referrerPolicy="no-referrer" src={free.fotoPerfil} className="w-8 h-8 rounded-full object-cover border border-neutral-250" alt={free.nome} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-250 flex items-center justify-center text-white font-semibold text-xs tracking-wide uppercase font-sans">
                                {free.nome.slice(0, 2)}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="hover:underline text-neutral-950 font-bold font-sans truncate">{free.nome}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(free.id);
                                }}
                                className="p-1 rounded hover:bg-neutral-100 transition-colors cursor-pointer focus:outline-none shrink-0"
                                title={favorites.includes(free.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                              >
                                <Star className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                                  favorites.includes(free.id)
                                    ? 'fill-amber-400 text-purple-500 scale-110'
                                    : 'text-neutral-300 hover:text-neutral-450'
                                }`} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-neutral-600 font-medium font-sans">{free.cargo}</td>
                        <td className="py-3.5 px-6 text-neutral-900 font-semibold font-mono">R$ {free.valorHora} /dia</td>
                        <td className="py-3.5 px-6 text-neutral-700 font-sans">
                          {stars > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center text-purple-600">
                                <Star className="w-3.5 h-3.5 fill-amber-500" />
                              </span>
                              <span className="font-bold text-xs">{stars}</span>
                              <span className="text-[10px] text-neutral-400">({free.avaliacoes.length} {free.avaliacoes.length === 1 ? 'avaliacao' : 'avaliacoes'})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">Sem notas</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => {
                                setSelectedFreelancer(free);
                                setShowAddProjectForm(false);
                                setShowAddReviewForm(false);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-black hover:underline bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
                            >
                              Ver Perfil
                              <ArrowUpRight className="w-3.5 h-3.5" />
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

      {/* 1. Modal detailed profile view */}
      <AnimatePresence>
        {selectedFreelancer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-neutral-300 max-h-[90vh] flex flex-col select-text"
            >
              {/* Profile banner layout */}
              <div className="bg-neutral-900 px-6 py-5 flex items-start justify-between text-white relative">
                <div className="flex items-center gap-4">
                  {selectedFreelancer.fotoPerfil ? (
                    <img 
                      referrerPolicy="no-referrer" 
                      src={selectedFreelancer.fotoPerfil} 
                      className="w-14 h-14 rounded-full object-cover border border-white/20 cursor-zoom-in hover:scale-105 transition-all" 
                      alt={selectedFreelancer.nome} 
                      onClick={() => setZoomedPhoto(selectedFreelancer.fotoPerfil!)}
                      title="Clique para ampliar"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-xl text-purple-500 uppercase">
                      {selectedFreelancer.nome.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight select-text">{selectedFreelancer.nome}</h3>
                    <p className="text-neutral-400 text-xs font-semibold mt-0.5 select-text">{selectedFreelancer.cargo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleFavorite(selectedFreelancer.id)}
                    className="p-1.5 transition-colors cursor-pointer select-none"
                    title={favorites.includes(selectedFreelancer.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <Star className={`w-4 h-4 transition-all active:scale-125 ${
                      favorites.includes(selectedFreelancer.id) 
                        ? 'fill-amber-400 text-purple-500 scale-110' 
                        : 'text-neutral-400 hover:text-white'
                    }`} />
                  </button>
                  {!readOnly && (
                    <>
                      <button 
                        onClick={handleOpenEditModal}
                        className="text-neutral-400 hover:text-white p-1.5 transition-colors cursor-pointer"
                        title="Editar Cadastro"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setDeletingFreelancerId(selectedFreelancer.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-1.5 transition-colors cursor-pointer"
                        title="Remover Cadastro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setSelectedFreelancer(null)}
                    className="text-neutral-450 hover:text-white transition-colors p-1.5 border border-white/10 rounded-lg bg-white/5"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Profile content - scrollable */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-neutral-700">
                
                {/* Visual grid segment */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-5">
                  <div className="space-y-3.5 md:col-span-2">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest mb-1.5">Sobre o Profissional</h4>
                      <p className="text-neutral-600 leading-relaxed text-xs">
                        {selectedFreelancer.bio}
                      </p>
                    </div>
                    
                    {/* Função Principal Section */}
                    <div>
                      <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Função Principal</h5>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs bg-neutral-900 text-white px-2.5 py-0.5 rounded-full border border-neutral-950 font-medium font-sans">
                          {selectedFreelancer.cargo} {selectedFreelancer.valorHora ? `(R$ ${selectedFreelancer.valorHora}/diária)` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Funções Secundárias */}
                    <div>
                      <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Funções Secundárias</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFreelancer.habilidades.map((sk, i) => {
                          const rate = selectedFreelancer.tarifasSecundarias?.[sk];
                          return (
                            <span key={i} className="text-xs bg-neutral-50 text-neutral-700 px-2.5 py-0.5 rounded-full border border-neutral-250 font-medium">
                              {sk} {rate ? `(R$ ${rate}/diária)` : ''}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Anexos e Documentos */}
                    <div className="pt-3 border-t border-neutral-100">
                      <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5 text-neutral-405 shrink-0" />
                        Anexos e Documentos
                      </h5>
                      
                      {/* Attach button & input */}
                      <div className="flex items-center gap-2 mb-3">
                        <label className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 cursor-pointer font-medium transition-all shadow-xs">
                          <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
                          Anexar Arquivo
                          <input 
                            type="file" 
                            onChange={handleAttachFile} 
                            className="hidden" 
                          />
                        </label>
                        <span className="text-[10px] text-neutral-400 italic">Limites: Máx 5MB (PDF, DOCX, PNG, JPG)</span>
                      </div>

                      {/* Attached files list */}
                      {(!selectedFreelancer.anexos || selectedFreelancer.anexos.length === 0) ? (
                        <p className="text-[11px] text-neutral-400 italic bg-neutral-50 border border-dashed border-neutral-200 rounded-lg p-2.5 text-center">
                          Nenhum arquivo anexado a este perfil.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedFreelancer.anexos.map((anexo, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-100/50 transition-colors">
                              <div className="flex items-center gap-2 truncate">
                                <Paperclip className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <div className="truncate text-left">
                                  <p className="font-medium text-neutral-800 truncate" title={anexo.name}>{anexo.name}</p>
                                  <p className="text-[10px] text-neutral-400 font-mono">{(anexo.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAnexo(anexo)}
                                  className="text-neutral-600 hover:text-neutral-900 font-semibold text-[10px] px-2 py-1 bg-white hover:bg-neutral-50 rounded border border-neutral-200 shadow-xs cursor-pointer"
                                >
                                  Baixar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAnexo(anexo.name)}
                                  className="text-red-500 hover:text-red-700 font-semibold text-[10px] px-1.5 py-1 bg-white hover:bg-red-50 rounded border border-neutral-200 cursor-pointer"
                                  title="Apagar Anexo"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Outras Funções Section */}
                    {selectedFreelancer.outrasFuncoes && selectedFreelancer.outrasFuncoes.length > 0 && (
                      <div className="pt-1.5">
                        <h5 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-1.5">Outras Funções e Especialidades</h5>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedFreelancer.outrasFuncoes.map((of, i) => (
                            <span key={i} className="text-xs bg-neutral-100/50 text-neutral-800 px-2.5 py-0.5 rounded-md border border-neutral-200 font-medium font-sans">
                              {of}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Sidebar controls of profile */}
                  <div className="bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/60 space-y-3.5 h-fit">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Dados Operacionais</h4>

                    <div className="space-y-2 text-xs text-neutral-600">
                      <div className="flex items-center justify-between gap-1 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-medium break-all select-text">{selectedFreelancer.email}</span>
                        </div>
                        {selectedFreelancer.email && (
                          <button
                            onClick={() => handleCopyToClipboard(selectedFreelancer.email || '', 'email')}
                            className="p-1 text-neutral-400 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
                            title="Copiar e-mail"
                          >
                            {copiedField === 'email' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="font-medium select-text">{selectedFreelancer.telefone}</span>
                        </div>
                        {selectedFreelancer.telefone && (
                          <button
                            onClick={() => handleCopyToClipboard(selectedFreelancer.telefone || '', 'phone')}
                            className="p-1 text-neutral-400 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors shrink-0 cursor-pointer"
                            title="Copiar telefone"
                          >
                            {copiedField === 'phone' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Personal data registries like CPF/CIF and Physical exact Address */}
                    <div className="pt-3.5 border-t border-neutral-100 space-y-2.5 text-xs text-neutral-600">
                      <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Cadastro & Registro</h5>
                      
                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-150 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-neutral-400 block font-bold leading-none mb-1">REGISTRO PESSOAL (CPF / CIF)</span>
                          <span className="font-mono text-neutral-900 font-bold text-xs select-text">{selectedFreelancer.cpfCif || 'Não cadastrado'}</span>
                        </div>
                        {selectedFreelancer.cpfCif && (
                          <button
                            onClick={() => handleCopyToClipboard(selectedFreelancer.cpfCif || '', 'cpf')}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded hover:bg-white transition-colors shrink-0 cursor-pointer"
                            title="Copiar CPF/CIF"
                          >
                            {copiedField === 'cpf' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-150 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-neutral-400 block font-bold leading-none mb-1">REGISTRO JURÍDICO (CNPJ)</span>
                          <span className="font-mono text-neutral-900 font-bold text-xs select-text">{selectedFreelancer.cnpj || 'Não cadastrado'}</span>
                        </div>
                        {selectedFreelancer.cnpj && (
                          <button
                            onClick={() => handleCopyToClipboard(selectedFreelancer.cnpj || '', 'cnpj')}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded hover:bg-white transition-colors shrink-0 cursor-pointer"
                            title="Copiar CNPJ"
                          >
                            {copiedField === 'cnpj' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-150 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-neutral-400 block font-bold leading-none mb-1">ENDEREÇO COMPLETO</span>
                          <span className="text-[11px] text-neutral-700 leading-snug block font-medium select-text">{selectedFreelancer.enderecoCompleto || 'Endereço físico não informado'}</span>
                        </div>
                        {selectedFreelancer.enderecoCompleto && (
                          <button
                            onClick={() => handleCopyToClipboard(selectedFreelancer.enderecoCompleto || '', 'endereco')}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded hover:bg-white transition-colors shrink-0 self-center cursor-pointer"
                            title="Copiar Endereço"
                          >
                            {copiedField === 'endereco' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificações Section */}
                <div className="pt-6 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      Certificações ({selectedFreelancer.certificacoes?.length || 0})
                    </h4>
                    
                    <button
                      onClick={() => setShowAddCertificationForm(!showAddCertificationForm)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-md hover:bg-neutral-50 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Adicionar Certificação
                    </button>
                  </div>

                  {showAddCertificationForm && (
                     <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleAddCertificationToFreelancer}
                      className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 space-y-3"
                    >
                      <h5 className="text-xs font-bold text-neutral-700">Adicionar Certificação ao Profissional</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-neutral-500">Certificação *</label>
                          <select
                            value={newCertNome}
                            onChange={(e) => setNewCertNome(e.target.value)}
                            className="w-full text-xs border border-neutral-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                            required
                          >
                            <option value="">Selecione uma certificação...</option>
                            {certificationsDb.map((c, idx) => (
                              <option key={idx} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] uppercase font-bold text-neutral-500 block">Data de Validade</label>
                          <input 
                            type="date"
                            value={newCertValidade}
                            onChange={(e) => setNewCertValidade(e.target.value)}
                            className="w-full text-xs border border-neutral-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white shadow-xs"
                          />
                        </div>
                      </div>

                      {/* Optional Document Attachment Input */}
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] uppercase font-bold text-neutral-500 block">Comprovante / Documento do Certificado (Opcional)</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="flex items-center gap-1.5 bg-white hover:bg-neutral-100 text-neutral-805 text-xs px-2.5 py-1.5 rounded border border-neutral-250 cursor-pointer font-medium transition-all shadow-xs shrink-0 select-none">
                            <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
                            {newCertAnexo ? 'Alterar Arquivo' : 'Anexar Documento'}
                            <input 
                              type="file" 
                              onChange={handleCertAnexoChange} 
                              className="hidden" 
                            />
                          </label>
                          {newCertAnexo ? (
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-250 px-2.5 py-1 rounded text-xs truncate max-w-xs">
                              <span className="font-semibold truncate" title={newCertAnexo.name}>{newCertAnexo.name}</span>
                              <span className="text-[10px] text-emerald-600 font-mono">({(newCertAnexo.size / 1024).toFixed(1)} KB)</span>
                              <button 
                                type="button" 
                                onClick={() => setNewCertAnexo(null)}
                                className="text-red-500 hover:text-red-700 font-bold ml-1 text-xs cursor-pointer"
                                title="Remover documento"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-400 italic">Limites: Máx 5MB (PDF, DOCX, PNG, JPG)</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNewCertNome('');
                            setNewCertValidade('');
                            setNewCertAnexo(null);
                            setShowAddCertificationForm(false);
                          }}
                          className="px-3 py-1.5 border border-neutral-200 rounded text-xs hover:bg-neutral-100 cursor-pointer text-neutral-600 font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          Adicionar
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {(!selectedFreelancer.certificacoes || selectedFreelancer.certificacoes.length === 0) ? (
                    <p className="text-xs text-neutral-400 italic">Nenhuma certificação registrada para este freelancer.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {selectedFreelancer.certificacoes.map((cert) => (
                        <div key={cert.id} className="bg-neutral-50/50 p-3 rounded-lg border border-neutral-200/60 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-xs text-neutral-900 truncate" title={cert.nome}>{cert.nome}</h5>
                            <p className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-400" />
                              Validade: <span className="font-medium text-neutral-700">{cert.dataValidade || 'Sem data'}</span>
                            </p>
                            {cert.anexo && (
                              <div className="mt-2 text-left">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAnexo(cert.anexo!)}
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-neutral-700 bg-white hover:bg-neutral-50 hover:text-neutral-900 rounded border border-neutral-200 px-2 py-1 shadow-2xs cursor-pointer"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Visualizar Documento</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertificationFromFreelancer(cert.id)}
                            className="p-1 px-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-650 rounded-md border border-transparent hover:border-red-100 transition-all text-xs font-bold font-mono cursor-pointer shrink-0"
                            title="Remover certificação"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Avaliacoes por Gestores Review Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600 fill-amber-500" />
                      Avaliações de Desempenho pelo Gestor ({selectedFreelancer.avaliacoes.length})
                    </h4>
                    
                    <button
                      onClick={() => setShowAddReviewForm(!showAddReviewForm)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-950 border border-neutral-250 px-2.5 py-1 rounded-md hover:bg-neutral-50"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Registrar Avaliação de Gestor (Fim de Evento)
                    </button>
                  </div>

                  {showAddReviewForm && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleAddReview}
                      className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 mb-4 space-y-3"
                    >
                      <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-amber-400 text-purple-500" />
                        Registrar Avaliação de Desempenho pelo Gestor
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                           type="text" 
                           placeholder="Nome do Projeto / Evento *"
                           value={reviewProjeto} 
                           onChange={(e) => setReviewProjeto(e.target.value)}
                           className="w-full text-xs border border-neutral-200 rounded p-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                           required
                        />
                        <input 
                           type="text" 
                           placeholder="Nome do Gestor do Projeto Responsável *"
                           value={reviewCliente} 
                           onChange={(e) => setReviewCliente(e.target.value)}
                           className="w-full text-xs border border-neutral-200 rounded p-2 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                           required
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-neutral-700">Nota atribuída (1-5 estrelas):</span>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((starsNum) => (
                            <button
                              key={starsNum}
                              type="button"
                              onClick={() => setReviewNota(starsNum)}
                              className="p-0.5"
                            >
                              <Star className={`w-5 h-5 ${
                                reviewNota >= starsNum ? 'fill-amber-400 text-purple-500' : 'text-neutral-300'
                              }`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <textarea 
                          rows={2}
                          value={reviewComentario} 
                          onChange={(e) => setReviewComentario(e.target.value)}
                          placeholder="Comentário descritivo elaborado pelo gestor sobre a performance técnica, produtividade e cooperação no encerramento do evento..."
                          className="w-full text-xs border border-neutral-200 rounded p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddReviewForm(false)}
                          className="px-3 py-1 border border-neutral-200 rounded text-xs hover:bg-neutral-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold"
                        >
                          Publicar Avaliação do Gestor
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {selectedFreelancer.avaliacoes.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Profissional sem notas ou relatórios de gestores de projeto inseridos até o momento.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {selectedFreelancer.avaliacoes.map((rev) => (
                        <div key={rev.id} className="bg-neutral-50/20 p-4 rounded-xl border border-neutral-200/80">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h5 className="font-semibold text-xs text-neutral-950">{rev.projetoNome}</h5>
                              <p className="text-[11px] text-neutral-400 font-medium font-sans">Gestor do Projeto: {rev.cliente} • {rev.data}</p>
                            </div>
                            
                            {/* Stars badge */}
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${
                                    i < rev.nota ? 'fill-amber-400 text-purple-500' : 'text-neutral-200'
                                  }`} />
                                ))}
                              </div>
                              {currentUser?.perfil === 'Administrador' && !readOnly && (
                                <button
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="text-neutral-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 flex items-center gap-1 text-[10px] font-medium"
                                  title="Excluir Avaliação"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Excluir
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-neutral-600 mt-2.5 leading-relaxed italic">
                            "{rev.comentario}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Histórico de Projetos Finalizados Section */}
                <div className="pt-6 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-500 fill-indigo-100" />
                      Histórico dos Projetos Finalizados ({activeCompletedHistory.length})
                    </h4>
                    <button
                      onClick={() => setShowAddProjectForm(true)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-indigo-700 font-semibold text-xs rounded transition-colors flex items-center gap-1 border border-purple-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Histórico
                    </button>
                  </div>

                  {activeCompletedHistory.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">Este profissional ainda não possui projetos finalizados registrados no sistema.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {activeCompletedHistory.map((proj) => (
                        <div 
                          key={proj.id} 
                          onClick={() => handleProjectClick(proj)}
                          className="group bg-neutral-50/50 p-3 rounded-lg border border-neutral-200/60 hover:bg-purple-50/20 hover:border-indigo-300 flex flex-col gap-2 relative overflow-hidden cursor-pointer transition-all hover:shadow-2xs duration-150"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                          <div className="flex justify-between items-start pl-2">
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1">
                                <h5 className="font-semibold text-xs text-neutral-900 group-hover:text-indigo-700 transition-colors truncate" title={proj.nome}>
                                  {proj.nome}
                                </h5>
                                <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 opacity-60 group-hover:opacity-100 group-hover:text-purple-600 transition-all shrink-0" />
                              </div>
                              <p className="text-[10px] text-neutral-500 font-medium truncate" title={proj.cliente}>{proj.cliente}</p>
                            </div>
                            {proj.valorRecebido && (
                              <div className="bg-purple-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center whitespace-nowrap">
                                <DollarSign className="w-3 h-3 mr-0.5" />
                                {proj.valorRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/diária
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between pl-2 mt-1 border-t border-neutral-100 pt-2">
                            <span className="text-[10px] font-semibold text-indigo-700 bg-purple-50/50 px-2 py-0.5 rounded truncate max-w-[60%]">
                              {proj.cargo}
                            </span>
                            <span className="text-[10px] text-neutral-400 flex items-center truncate">
                              <CheckCircle className="w-3 h-3 text-emerald-500 mr-1 shrink-0" />
                              {new Date(proj.dataFim).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Project History Modal */}
      {showAddProjectForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-[600px] rounded-xl shadow-2xl overflow-hidden border border-neutral-250 my-8"
          >
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-semibold">Adicionar Histórico de Projeto</h3>
              </div>
              <button 
                onClick={() => setShowAddProjectForm(false)}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProjectToHistory} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Nome do Projeto *</label>
                  <input
                    type="text"
                    value={newProjectNome}
                    onChange={(e) => setNewProjectNome(e.target.value)}
                    required
                    placeholder="Ex: Evento de Lançamento Tech"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-neutral-50/50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Cliente/Agência *</label>
                  <input
                    type="text"
                    value={newProjectCliente}
                    onChange={(e) => setNewProjectCliente(e.target.value)}
                    required
                    placeholder="Ex: Agência XPTO"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-neutral-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Data Início</label>
                  <input
                    type="date"
                    value={newProjectInicio}
                    onChange={(e) => setNewProjectInicio(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-neutral-50/50 text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={newProjectFim}
                    onChange={(e) => setNewProjectFim(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-neutral-50/50 text-neutral-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Função/Cargo Desempenhado</label>
                  <input
                    type="text"
                    value={newProjectCargo}
                    onChange={(e) => setNewProjectCargo(e.target.value)}
                    placeholder="Se não informado, usará a função principal"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-neutral-50/50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Valor da Diária (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProjectValorRecebido}
                    onChange={(e) => setNewProjectValorRecebido(e.target.value)}
                    placeholder="Ex: 500"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 bg-neutral-50/50 font-mono"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProjectForm(false)}
                  className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors shadow flex items-center gap-2 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4" /> Cadastrar Histórico
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Freelancer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-neutral-250 my-8"
          >
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                <h3 className="text-base font-semibold">Editar Perfil do Colaborador</h3>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateFreelancerDetails} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Foto de Perfil do Colaborador */}
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Foto de Perfil do Colaborador</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="w-14 h-14 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center overflow-hidden flex-shrink-0 animate-fade-in">
                    {editFotoPerfil ? (
                      <img referrerPolicy="no-referrer" src={editFotoPerfil} className="w-full h-full object-cover" alt="Pré-visualização" />
                    ) : (
                      <User className="w-7 h-7 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 w-full text-left">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           try {
                             const compressed = await compressImage(file, 0.8, 300);
                             setEditFotoPerfil(compressed);
                           } catch (err) {
                             console.warn("Error compressing image", err);
                             alert("Erro ao processar imagem.");
                           }
                        }
                      }}
                      className="block w-full text-xs text-neutral-500
                        file:mr-2.5 file:py-1 file:px-2.5
                        file:rounded-md file:border-0
                        file:text-xs file:font-semibold
                        file:bg-neutral-900 file:text-white
                        hover:file:bg-neutral-800 file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-[10px] text-neutral-400">JPG, JPEG ou PNG. A imagem será salva no cadastro do colaborador.</p>
                  </div>
                  {editFotoPerfil && (
                    <button
                      type="button"
                      onClick={() => setEditFotoPerfil('')}
                      className="text-red-500 hover:text-red-700 font-semibold text-[10px] border border-red-200 rounded px-2 py-1 bg-white cursor-pointer hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={editNome} 
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Função Principal *</label>
                  <select 
                    value={editCargo} 
                    onChange={(e) => {
                      const selectedRoleName = e.target.value;
                      setEditCargo(selectedRoleName);
                      const matched = roles.find(r => r.name === selectedRoleName);
                      if (matched) {
                        setEditValorHora(matched.baseHourlyRate);
                      }
                    }}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  >
                    <option value="">Selecione uma função...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">E-MAIL</label>
                  <input 
                    type="email" 
                    value={editEmail} 
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Cache (diária) (R$)</label>
                  <input 
                    type="number" 
                    value={editValorHora === 0 ? '' : editValorHora} 
                    onChange={(e) => setEditValorHora(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Telefone WhatsApp *</label>
                <input 
                  type="text" 
                  value={editTelefone} 
                  onChange={(e) => setEditTelefone(formatWhatsApp(e.target.value))}
                  placeholder="(11) 9.0000-0000"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Descrição</label>
                <textarea 
                  rows={2}
                  value={editBio} 
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Breve descrição"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Registro Pessoal (CPF)</label>
                <input 
                  type="text" 
                  value={editCpfCif} 
                  onChange={(e) => setEditCpfCif(formatCPF(e.target.value))}
                  placeholder="Ex: 123.456.789-00"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Registro Jurídico (CNPJ)</label>
                <input 
                  type="text" 
                  value={editCnpj} 
                  onChange={(e) => setEditCnpj(formatCNPJ(e.target.value))}
                  placeholder="Ex: 12.345.678/0001-95"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Endereço Físico Completo</label>
                <input 
                  type="text" 
                  value={editEnderecoCompleto} 
                  onChange={(e) => setEditEnderecoCompleto(e.target.value)}
                  placeholder="Rua, Número, Complemento, Bairro - Cidade / UF"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              {/* Seleção de Função Secundária na Edição */}
              <div className="pt-3 border-t border-neutral-100">
                <label className="block font-bold text-neutral-705 uppercase tracking-wide mb-1.5 text-neutral-700">Funções Secundárias Atribuídas</label>
                <div className="flex gap-2">
                  <select
                    value={selectedSecondaryRoleToEditAdd}
                    onChange={(e) => setSelectedSecondaryRoleToEditAdd(e.target.value)}
                    className="flex-1 text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  >
                    <option value="">Selecione uma função para atribuir...</option>
                    {roles
                      .filter(r => r.name !== editCargo && !editHabilidades.includes(r.name))
                      .map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSecondaryRoleToEditAdd) {
                        if (!editHabilidades.includes(selectedSecondaryRoleToEditAdd)) {
                          setEditHabilidades(prev => [...prev, selectedSecondaryRoleToEditAdd]);
                          const matchedRole = roles.find(r => r.name === selectedSecondaryRoleToEditAdd);
                          const defaultRate = matchedRole ? matchedRole.baseHourlyRate : 600;
                          setEditTarifasSecundarias(prev => ({
                            ...prev,
                            [selectedSecondaryRoleToEditAdd]: defaultRate
                          }));
                        }
                        setSelectedSecondaryRoleToEditAdd('');
                      }
                    }}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold text-xs cursor-pointer transition-all shrink-0"
                  >
                    Atribuir
                  </button>
                </div>

                <div className="mt-2 space-y-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200 max-h-48 overflow-y-auto">
                  {editHabilidades.length === 0 ? (
                    <span className="text-neutral-400 italic text-[11px] block text-center py-2">Nenhuma função secundária atribuída.</span>
                  ) : (
                    editHabilidades.map(h => {
                      const rate = editTarifasSecundarias[h] !== undefined ? editTarifasSecundarias[h] : 0;
                      return (
                        <div
                          key={h}
                          className="flex items-center justify-between gap-3 bg-white p-2 rounded-md border border-neutral-200 shadow-xs"
                        >
                          <span className="text-xs font-semibold text-neutral-700 truncate flex-1 block text-left">
                            {h}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-neutral-400 font-bold font-mono">R$</span>
                            <input
                              type="number"
                              value={rate === 0 ? '' : rate}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                setEditTarifasSecundarias(prev => ({
                                  ...prev,
                                  [h]: val
                                }));
                              }}
                              className="w-16 text-center text-xs p-1 bg-neutral-50 border border-neutral-200 rounded font-mono font-bold text-neutral-800 focus:ring-1 focus:ring-neutral-950 focus:outline-none"
                            />
                            <span className="text-[9px] text-neutral-400 font-medium">/dia</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditHabilidades(prev => prev.filter(item => item !== h));
                                setEditTarifasSecundarias(prev => {
                                  const copy = { ...prev };
                                  delete copy[h];
                                  return copy;
                                });
                              }}
                              className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors ml-1 cursor-pointer"
                              title="Remover"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-neutral-200 rounded-lg font-semibold text-neutral-600 hover:bg-neutral-50 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-sm transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. New Freelancer full creation dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-neutral-250 my-8"
          >
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-base font-semibold">Ficha Cadastral do Colaborador</h3>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  if (onClearPendingRegistration) onClearPendingRegistration();
                }}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFreelancer} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={formNome} 
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Função Principal *</label>
                  <select 
                    value={formCargo} 
                    onChange={(e) => {
                      const selectedRoleName = e.target.value;
                      setFormCargo(selectedRoleName);
                      const matched = roles.find(r => r.name === selectedRoleName);
                      if (matched) {
                        setFormValorHora(matched.baseHourlyRate);
                      }
                    }}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  >
                    <option value="">Selecione uma função...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">E-MAIL</label>
                  <input 
                    type="email" 
                    value={formEmail} 
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Cache (diária) (R$)</label>
                  <input 
                    type="number" 
                    value={formValorHora === 0 ? '' : formValorHora} 
                    onChange={(e) => setFormValorHora(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Telefone WhatsApp *</label>
                <input 
                  type="text" 
                  value={formTelefone} 
                  onChange={(e) => setFormTelefone(formatWhatsApp(e.target.value))}
                  placeholder="(11) 9.0000-0000"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  required
                />
              </div>

              {/* Foto de Perfil do Colaborador */}
              <div>
                <label className="block font-bold text-neutral-750 uppercase tracking-wide mb-1.5">Foto de Perfil do Colaborador</label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="w-14 h-14 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {formFotoPerfil ? (
                      <img referrerPolicy="no-referrer" src={formFotoPerfil} className="w-full h-full object-cover" alt="Pré-visualização" />
                    ) : (
                      <User className="w-7 h-7 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           try {
                             const compressed = await compressImage(file, 0.8, 300);
                             setFormFotoPerfil(compressed);
                           } catch (err) {
                             console.warn("Error compressing image", err);
                             alert("Erro ao processar imagem.");
                           }
                        }
                      }}
                      className="block w-full text-xs text-neutral-500
                        file:mr-2.5 file:py-1 file:px-2.5
                        file:rounded-md file:border-0
                        file:text-xs file:font-semibold
                        file:bg-neutral-900 file:text-white
                        hover:file:bg-neutral-800 file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-[10px] text-neutral-400">JPG, JPEG ou PNG. A imagem será salva no cadastro local.</p>
                  </div>
                  {formFotoPerfil && (
                    <button
                      type="button"
                      onClick={() => setFormFotoPerfil('')}
                      className="text-red-500 hover:text-red-700 font-semibold text-[10px] border border-red-200 rounded px-2 py-1 bg-white cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              {/* Seleção de Função Secundária */}
              <div>
                <label className="block font-bold text-neutral-750 uppercase tracking-wide mb-1.5">Funções Secundárias</label>
                <div className="flex gap-2">
                  <select
                    value={selectedSecondaryRoleToAdd}
                    onChange={(e) => setSelectedSecondaryRoleToAdd(e.target.value)}
                    className="flex-1 text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                  >
                    <option value="">Selecione uma função secundária...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSecondaryRoleToAdd) {
                        if (!formHabilidades.includes(selectedSecondaryRoleToAdd)) {
                          setFormHabilidades(prev => [...prev, selectedSecondaryRoleToAdd]);
                          const matchedRole = roles.find(r => r.name === selectedSecondaryRoleToAdd);
                          const defaultRate = matchedRole ? matchedRole.baseHourlyRate : 600;
                          setFormTarifasSecundarias(prev => ({
                            ...prev,
                            [selectedSecondaryRoleToAdd]: defaultRate
                          }));
                        }
                        setSelectedSecondaryRoleToAdd('');
                      }
                    }}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold text-xs cursor-pointer transition-all"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="mt-2 space-y-2 p-3 bg-neutral-50 rounded-lg border border-neutral-205 max-h-48 overflow-y-auto">
                  {formHabilidades.length === 0 ? (
                    <span className="text-neutral-400 italic text-[11px] block text-center py-2">Nenhuma função secundária adicionada.</span>
                  ) : (
                    formHabilidades.map(h => {
                      const rate = formTarifasSecundarias[h] !== undefined ? formTarifasSecundarias[h] : 0;
                      return (
                        <div
                          key={h}
                          className="flex items-center justify-between gap-3 bg-white p-2 rounded-md border border-neutral-200 shadow-xs"
                        >
                          <span className="text-xs font-semibold text-neutral-700 truncate flex-1 block text-left">
                            {h}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-neutral-400 font-bold">R$</span>
                            <input
                              type="number"
                              value={rate === 0 ? '' : rate}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                setFormTarifasSecundarias(prev => ({
                                  ...prev,
                                  [h]: val
                                }));
                              }}
                              className="w-16 text-center text-xs p-1 bg-neutral-50 border border-neutral-200 rounded font-mono font-bold text-neutral-800 focus:ring-1 focus:ring-neutral-950 focus:outline-none"
                            />
                            <span className="text-[9px] text-neutral-400">/dia</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormHabilidades(prev => prev.filter(item => item !== h));
                                setFormTarifasSecundarias(prev => {
                                  const copy = { ...prev };
                                  delete copy[h];
                                  return copy;
                                });
                              }}
                              className="p-1 text-neutral-400 hover:text-red-500 rounded transition-colors ml-1 cursor-pointer"
                              title="Remover"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Registro Pessoal (CPF / CIF)</label>
                <input 
                  type="text" 
                  value={formCpfCif} 
                  onChange={(e) => setFormCpfCif(formatCPF(e.target.value))}
                  placeholder="Ex: 123.456.789-00"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Registro Jurídico (CNPJ)</label>
                <input 
                  type="text" 
                  value={formCnpj} 
                  onChange={(e) => setFormCnpj(formatCNPJ(e.target.value))}
                  placeholder="Ex: 12.345.678/0001-95"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Endereço Físico Completo</label>
                <input 
                  type="text" 
                  value={formEnderecoCompleto} 
                  onChange={(e) => setFormEnderecoCompleto(e.target.value)}
                  placeholder="Rua, Número, Complemento, Bairro - Cidade / UF, CEP"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wide mb-1">Descrição</label>
                <textarea 
                  rows={2}
                  value={formBio} 
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Breve descrição"
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 bg-neutral-50/50 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onClearPendingRegistration) onClearPendingRegistration();
                  }}
                  className="px-4 py-2 border border-neutral-200 rounded-lg font-semibold text-neutral-600 hover:bg-neutral-50 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold shadow-xs text-xs cursor-pointer"
                >
                  Concluir Registro
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Manage Roles/Functions DB dialog */}
      {showRolesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-neutral-250 flex flex-col max-h-[85vh]"
          >
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-500" />
                <h3 className="text-base font-semibold">Base de Funções & Tarifas</h3>
              </div>
              <button 
                onClick={() => setShowRolesModal(false)}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <h4 className="font-bold text-neutral-800 uppercase tracking-wider mb-2">Cadastrar Nova Função</h4>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newRoleName || !newRoleRate) {
                      alert('Digite o nome e a tarifa base para cadastrar.');
                      return;
                    }
                    if (roles.some(r => r.name.toLowerCase() === newRoleName.trim().toLowerCase())) {
                      alert('Esta função já está cadastrada na base.');
                      return;
                    }
                    const newRole: RoleFunction = {
                      id: `role-${Date.now()}`,
                      name: newRoleName.trim(),
                      baseHourlyRate: Number(newRoleRate)
                    };
                    setRoles(prev => [...prev, newRole]);
                    setNewRoleName('');
                    setNewRoleRate('');
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-neutral-50 p-3 rounded-lg border border-neutral-100"
                >
                  <div className="sm:col-span-2">
                    <input 
                      type="text"
                      placeholder="Nome da Função"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-neutral-905"
                    />
                  </div>
                  <div>
                    <input 
                      type="number"
                      placeholder="Cache R$/diária"
                      value={newRoleRate}
                      onChange={(e) => setNewRoleRate(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-neutral-905 font-medium"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="sm:col-span-3 w-full py-2 bg-neutral-900 text-white rounded font-bold hover:bg-neutral-800 transition-colors cursor-pointer text-center text-xs"
                  >
                    Adicionar à Base de Dados
                  </button>
                </form>
              </div>

              <div>
                <h4 className="font-bold text-neutral-800 uppercase tracking-wider mb-2">Funções Cadastradas ({roles.length})</h4>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {roles.length === 0 ? (
                    <p className="text-neutral-400 italic">Nenhuma função cadastrada na base de dados.</p>
                  ) : (
                    roles.map((r) => (
                      <div key={r.id} className="flex flex-col sm:flex-row sm:items-center bg-white p-2.5 rounded border border-neutral-150 hover:bg-neutral-50 transition-colors gap-3 justify-between">
                        
                        {/* Name Column */}
                        <div className="flex-1 min-w-0 w-full">
                          {editingRoleId === r.id ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input 
                                type="text"
                                value={editingRoleName}
                                onChange={(e) => setEditingRoleName(e.target.value)}
                                className="w-full text-xs p-1.5 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-950 font-semibold text-neutral-950"
                                placeholder="Nome da Função"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRoleName(r.id)}
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded border border-emerald-200 cursor-pointer text-xs flex items-center justify-center shrink-0"
                                title="Salvar alteração de nome"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(null);
                                  setEditingRoleName('');
                                }}
                                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded border border-neutral-200 cursor-pointer text-xs flex items-center justify-center shrink-0"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group truncate justify-between sm:justify-start w-full">
                              <span className="font-bold text-neutral-900 block truncate" title={r.name}>{r.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(r.id);
                                  setEditingRoleName(r.name);
                                }}
                                className="p-1 text-neutral-400 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                                title="Editar nome da função"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Rate and Actions Row */}
                        <div className="flex items-center gap-2 shrink-0 justify-end w-full sm:w-auto">
                          <div className="relative flex items-center max-w-[125px]">
                            <span className="absolute left-2 text-[10px] text-neutral-400 font-semibold font-mono">R$</span>
                            <input 
                              type="number"
                              value={r.baseHourlyRate}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setRoles(prev => prev.map(item => item.id === r.id ? { ...item, baseHourlyRate: val } : item));
                              }}
                              className="w-full text-xs p-1.5 pl-6 pr-8 bg-neutral-50 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono text-right font-bold text-neutral-800"
                            />
                            <span className="absolute right-1 text-[9px] text-neutral-400">/dia</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRoleToDelete(r)}
                            className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-red-100 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-150 bg-neutral-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRolesModal(false)}
                className="px-4 py-2 bg-white border border-neutral-200 text-neutral-750 hover:bg-neutral-100 rounded text-xs font-semibold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manage Certifications DB dialog */}
      {showCertificationsDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-neutral-250 flex flex-col max-h-[85vh]"
          >
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold">Base de Certificações</h3>
              </div>
              <button 
                onClick={() => setShowCertificationsDbModal(false)}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1 text-left">
              <div>
                <h4 className="font-bold text-neutral-800 uppercase tracking-wider mb-2">Cadastrar Nova Certificação</h4>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newCertDbName.trim()) {
                      alert('Digite o nome da certificação para cadastrar.');
                      return;
                    }
                    if (certificationsDb.some(c => c.toLowerCase() === newCertDbName.trim().toLowerCase())) {
                      alert('Esta certificação já está cadastrada na base.');
                      return;
                    }
                    setCertificationsDb(prev => [...prev, newCertDbName.trim()]);
                    setNewCertDbName('');
                  }}
                  className="flex gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100"
                >
                  <input 
                    type="text"
                    placeholder="Ex: NR10 - Segurança em Eletricidade"
                    value={newCertDbName}
                    onChange={(e) => setNewCertDbName(e.target.value)}
                    className="flex-1 text-xs p-2 bg-white border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-neutral-905"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 text-white rounded font-bold hover:bg-neutral-800 transition-colors cursor-pointer text-xs shrink-0"
                  >
                    Adicionar
                  </button>
                </form>
              </div>

              <div>
                <h4 className="font-bold text-neutral-800 uppercase tracking-wider mb-2">Certificações Cadastradas ({certificationsDb.length})</h4>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {certificationsDb.length === 0 ? (
                    <p className="text-neutral-400 italic text-center py-4">Nenhuma certificação cadastrada.</p>
                  ) : (
                    certificationsDb.map((c, index) => (
                      <div key={index} className="flex items-center bg-white p-2.5 rounded border border-neutral-150 hover:bg-neutral-50 transition-colors gap-3 justify-between">
                        
                        <div className="flex-1 min-w-0">
                          {editingCertIndex === index ? (
                            <div className="flex items-center gap-1.5 w-full">
                              <input 
                                type="text"
                                value={editingCertName}
                                onChange={(e) => setEditingCertName(e.target.value)}
                                className="w-full text-xs p-1.5 bg-neutral-50 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-neutral-950 font-semibold text-neutral-950"
                                placeholder="Nome da Certificação"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editingCertName.trim()) return;
                                  setCertificationsDb(prev => prev.map((item, idx) => idx === index ? editingCertName.trim() : item));
                                  setEditingCertIndex(null);
                                  setEditingCertName('');
                                }}
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded border border-emerald-200 cursor-pointer text-xs flex items-center justify-center shrink-0"
                                title="Salvar alteração"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCertIndex(null);
                                  setEditingCertName('');
                                }}
                                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded border border-neutral-200 cursor-pointer text-xs flex items-center justify-center shrink-0"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group truncate justify-between w-full">
                              <span className="font-bold text-neutral-900 block truncate" title={c}>{c}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCertIndex(index);
                                  setEditingCertName(c);
                                }}
                                className="p-1 text-neutral-400 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-all cursor-pointer shrink-0"
                                title="Editar certificação"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja realmente apagar a certificação "${c}"?`)) {
                                setCertificationsDb(prev => prev.filter((_, idx) => idx !== index));
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-red-100 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-150 bg-neutral-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCertificationsDbModal(false)}
                className="px-4 py-2 bg-white border border-neutral-200 text-neutral-750 hover:bg-neutral-100 rounded text-xs font-semibold cursor-pointer shadow-xs"
              >
                Concluir
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Visual confirmation dialog */}
      <AnimatePresence>
        {deletingFreelancerId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-neutral-350 p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 border border-amber-250 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-base">Arquivar Profissional</h4>
                  <p className="text-neutral-500 text-xs mt-0.5">
                    O perfil deste freelancer será arquivado na plataforma operativa. Suas informações não serão permanentemente perdidas e poderão ser restabelecidas a qualquer momento.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Motivo do Arquivamento *
                  </label>
                  <textarea
                    value={archiveReason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    placeholder="Ex: Removido a pedido do profissional / Encerramento do contrato temporário / Sem responder às comunicações..."
                    rows={3}
                    className="w-full text-xs border border-neutral-250 p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50 text-neutral-800 placeholder-neutral-400 font-sans"
                    required
                  />
                  {!archiveReason.trim() && (
                    <p className="text-[10px] text-amber-600 font-medium font-sans">Por favor, digite o motivo para habilitar o arquivamento.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingFreelancerId(null);
                    setArchiveReason('');
                  }}
                  className="flex-1 border border-neutral-250 hover:bg-neutral-50 text-neutral-700 py-2 rounded-lg text-xs font-semibold cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!archiveReason.trim()}
                  onClick={() => {
                    if (!archiveReason.trim()) return;
                    onDeleteFreelancer(deletingFreelancerId, archiveReason, archiveOperator);
                    setDeletingFreelancerId(null);
                    setArchiveReason('');
                    setSelectedFreelancer(null); // Fecha o modal se estiver aberto
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold shadow-xs cursor-pointer text-white transition-all font-sans ${
                    archiveReason.trim()
                      ? 'bg-neutral-900 hover:bg-neutral-800'
                      : 'bg-neutral-200 text-neutral-450 cursor-not-allowed'
                  }`}
                >
                  Concluir e Arquivar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {roleToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-neutral-350 p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 border border-red-200 rounded-full flex items-center justify-center text-red-500 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-base">Apagar Função</h4>
                  <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
                    Deseja realmente apagar a função <span className="font-bold text-neutral-800">"{roleToDelete.name}"</span> da base de dados? Esta ação removerá a tarifa associada.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-neutral-100 font-sans">
                <button
                  type="button"
                  onClick={() => setRoleToDelete(null)}
                  className="flex-1 border border-neutral-250 hover:bg-neutral-50 text-neutral-750 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoles(prev => prev.filter(item => item.id !== roleToDelete.id));
                    setRoleToDelete(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
                >
                  Sim
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {zoomedPhoto && (
          <div 
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 cursor-zoom-out"
            onClick={() => setZoomedPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl max-h-[85vh] bg-neutral-900 rounded-xl overflow-hidden shadow-2xl border border-neutral-800 flex items-center justify-center p-1"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                referrerPolicy="no-referrer"
                src={zoomedPhoto} 
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-inner" 
                alt="Foto de perfil ampliada" 
              />
              <button 
                type="button"
                onClick={() => setZoomedPhoto(null)} 
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/85 text-white p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
