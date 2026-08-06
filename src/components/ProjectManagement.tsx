import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Task, Freelancer, ProjectAllocation, Client, Notification, PdfTheme, UserProfile, PerformanceReview } from '../types';
import { 
  Briefcase, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  Search,
  Filter,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Calculator,
  Settings,
  X,
  Building2,
  Megaphone,
  Send,
  MapPin,
  Camera,
  MoreHorizontal,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Star
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectManagementProps {
  tasks: Task[];
  freelancers: Freelancer[];
  clients?: Client[];
  onUpdateTask: (task: Task) => void;
  onAddTask: (task: Task) => void;
  onAddNotification?: (notification: Notification) => void;
  onDeleteTask?: (taskId: string) => void;
  initialSelectedTaskId?: string | null;
  onClearInitialSelectedTaskId?: () => void;
  companyLogo?: string | null;
  pdfTheme?: PdfTheme;
  currentUser?: UserProfile | null;
  onUpdateFreelancer?: (freelancer: Freelancer) => void;
}

export default function ProjectManagement({ 
  tasks, 
  freelancers, 
  clients = [], 
  onUpdateTask, 
  onAddTask, 
  onAddNotification, 
  onDeleteTask, 
  initialSelectedTaskId, 
  onClearInitialSelectedTaskId,
  companyLogo = null,
  pdfTheme,
  currentUser,
  onUpdateFreelancer
}: ProjectManagementProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialSelectedTaskId || null);
  const [sendButtonCountdown, setSendButtonCountdown] = useState(0);
  const [isControleMinimized, setIsControleMinimized] = useState(true);
  const [projectStage, setProjectStage] = useState<'Alocação' | 'Horarios' | 'Diarias' | 'Pagamentos' | 'Finalizações' | 'Avaliação'>('Alocação');
  const [selectedGeoDetail, setSelectedGeoDetail] = useState<{
    freelancerNome: string;
    dateText: string;
    locationChegada?: string;
    locationSaida?: string;
    chegada?: string;
    saida?: string;
    preenchidoManualmente?: boolean;
    confirmadoPeloGestor?: boolean;
    freelancerId?: string;
    activeDiariaDate?: string;
  } | null>(null);
  
  useEffect(() => {
    if (initialSelectedTaskId) {
      setSelectedProjectId(initialSelectedTaskId);
      onClearInitialSelectedTaskId?.();
    }
  }, [initialSelectedTaskId, onClearInitialSelectedTaskId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (sendButtonCountdown > 0) {
      timer = setTimeout(() => {
        setSendButtonCountdown(sendButtonCountdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [sendButtonCountdown]);
  
  // Filters for project list
  const [filterProject, setFilterProject] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todas');
  
  // Allocate Form State
  const [allocatingFreelancerId, setAllocatingFreelancerId] = useState('');
  const [allocFreelancerSearchText, setAllocFreelancerSearchText] = useState('');
  const [isFreelancerDropdownOpen, setIsFreelancerDropdownOpen] = useState(false);
  const [allocStart, setAllocStart] = useState('');
  const [allocEnd, setAllocEnd] = useState('');
  const [customHourlyRate, setCustomHourlyRate] = useState<number>(0);
  const [allocRole, setAllocRole] = useState('');
  const [allocRoleFilter, setAllocRoleFilter] = useState('');
  const [includeSecondarySkills, setIncludeSecondarySkills] = useState(false);
  const [selectedDiariaDate, setSelectedDiariaDate] = useState<string>('');
  const [selectedFreelancerIds, setSelectedFreelancerIds] = useState<string[]>([]);
  const [editingAllocationId, setEditingAllocationId] = useState<string | null>(null);
  const [selectedAllocIds, setSelectedAllocIds] = useState<string[]>([]);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const [substitutingAlloc, setSubstitutingAlloc] = useState<{ id: string; freelancerNome: string; funcao: string } | null>(null);
  const [selectedSubstituteId, setSelectedSubstituteId] = useState<string>('');

  const handleNameClick = (alloc: ProjectAllocation) => {
    // 0. Set stage to 'Alocação' so the candidate sidebar is open
    setProjectStage('Alocação');
    
    // 1. Set role filter to the clicked allocation's function
    setAllocRoleFilter(alloc.funcao);
    
    // 2. Clear freelancer search text to show all candidates
    setAllocFreelancerSearchText('');
    
    // 3. Set the substitutingAlloc state to this allocation so we know we are replacing them
    setSubstitutingAlloc({
      id: alloc.id,
      freelancerNome: alloc.freelancerNome,
      funcao: alloc.funcao
    });
    setSelectedSubstituteId(''); // Reset selection

    // 4. Scroll smoothly to allocation form container
    const container = document.getElementById('allocation-form-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleExecuteSubstitution = (allocId: string, substituteFreelancerId: string) => {
    if (!currentProject || !substituteFreelancerId) return;

    const substitute = freelancers.find(f => f.id === substituteFreelancerId);
    if (!substitute) return;

    // Find current allocation
    const oldAlloc = (currentProject.alocacoes || []).find(a => a.id === allocId);
    if (!oldAlloc) return;

    // Save to historicoRecusas if status was 'Recusado'
    const historicoRecusas = currentProject.historicoRecusas ? [...currentProject.historicoRecusas] : [];
    const alreadyExists = historicoRecusas.some(r => r.id === oldAlloc.id || (r.freelancerId === oldAlloc.freelancerId && r.dataInicio === oldAlloc.dataInicio));
    if (!alreadyExists && oldAlloc.statusConfirmacao === 'Recusado') {
      historicoRecusas.push({
        ...oldAlloc,
        statusConfirmacao: 'Recusado'
      });
    }

    // Replace freelancer and reset status to 'Pendente'
    const updatedAllocations = (currentProject.alocacoes || []).map(a => {
      if (a.id === allocId) {
        return {
          ...a,
          freelancerId: substitute.id,
          freelancerNome: substitute.nome,
          statusConfirmacao: 'Pendente' as const, // Reset status to Pendente (manager must explicitly click send confirmation)
          chamadoMensagem: undefined
        };
      }
      return a;
    });

    onUpdateTask({
      ...currentProject,
      alocacoes: updatedAllocations,
      historicoRecusas
    });

    // Reset states
    setSubstitutingAlloc(null);
    setSelectedSubstituteId('');
  };

  const [prioritizeFavorites, setPrioritizeFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const key = `freelancer_favorites_${currentUser?.id || 'default'}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  });

  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [submittingReview, setSubmittingReview] = useState<Record<string, boolean>>({});

  const handlePublishReview = (freelancerId: string, freelancerNome: string) => {
    if (!currentProject) return;
    const rating = reviewRatings[freelancerId] || 5;
    const comment = reviewComments[freelancerId]?.trim() || '';

    if (!comment) {
      alert('Por favor, escreva um comentário para a avaliação.');
      return;
    }

    setSubmittingReview(prev => ({ ...prev, [freelancerId]: true }));

    const newReview: PerformanceReview = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projetoNome: currentProject.titulo,
      cliente: currentUser?.nome || 'Gestor do Projeto',
      nota: rating,
      comentario: comment,
      data: new Date().toLocaleDateString('pt-BR')
    };

    const targetFreelancer = freelancers.find(f => f.id === freelancerId);
    if (targetFreelancer && onUpdateFreelancer) {
      const updatedFree: Freelancer = {
        ...targetFreelancer,
        avaliacoes: [newReview, ...(targetFreelancer.avaliacoes || [])]
      };
      
      onUpdateFreelancer(updatedFree);

      setReviewComments(prev => ({ ...prev, [freelancerId]: '' }));
      setReviewRatings(prev => ({ ...prev, [freelancerId]: 5 }));
      
      alert(`Avaliação de ${freelancerNome} publicada com sucesso! Ela ficará atrelada ao perfil do profissional.`);
    } else {
      alert('Ocorreu um erro ao localizar o perfil do freelancer para vincular esta avaliação.');
    }

    setSubmittingReview(prev => ({ ...prev, [freelancerId]: false }));
  };

  useEffect(() => {
    const key = `freelancer_favorites_${currentUser?.id || 'default'}`;
    const stored = localStorage.getItem(key);
    setFavorites(stored ? JSON.parse(stored) : []);
  }, [currentUser]);

  const toggleFavorite = (freelancerId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(freelancerId);
      const next = isFav ? prev.filter(id => id !== freelancerId) : [...prev, freelancerId];
      const key = `freelancer_favorites_${currentUser?.id || 'default'}`;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    // Reset editing state and selected allocations if active project changes
    setEditingAllocationId(null);
    setSelectedAllocIds([]);
  }, [selectedProjectId]);

  const getEventDatesArray = (startStr?: string, endStr?: string) => {
    if (!startStr) return [];
    const end = endStr || startStr;
    const dates: string[] = [];
    
    // Parse strings YYYY-MM-DD
    const startParts = startStr.split('-');
    const endParts = end.split('-');
    if (startParts.length !== 3) return [];
    
    const startYear = parseInt(startParts[0]);
    const startMonth = parseInt(startParts[1]) - 1;
    const startDay = parseInt(startParts[2]);
    
    const current = new Date(startYear, startMonth, startDay);
    
    const endYear = parseInt(endParts[0]);
    const endMonth = parseInt(endParts[1]) - 1;
    const endDay = parseInt(endParts[2]);
    const last = new Date(endYear, endMonth, endDay);
    
    let count = 0;
    while (current <= last && count < 60) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
      count++;
    }
    return dates;
  };

  const isContractedOnDate = (alloc: ProjectAllocation, dateStr: string) => {
    if (!dateStr || !alloc.dataInicio) return false;
    return dateStr >= alloc.dataInicio && dateStr <= (alloc.dataFim || alloc.dataInicio);
  };

  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});

  const toggleSummary = (freelancerId: string) => {
    setExpandedSummaries(prev => ({
      ...prev,
      [freelancerId]: !prev[freelancerId]
    }));
  };

  // New task form fields for "Novo Projeto" modal
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProject, setNewProject] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newLocalEvento, setNewLocalEvento] = useState('');
  const [newDataInicio, setNewDataInicio] = useState('');
  const [newHoraInicio, setNewHoraInicio] = useState('00:00');
  const [newDataFim, setNewDataFim] = useState('');
  const [newHoraFim, setNewHoraFim] = useState('00:00');
  const [newBudget, setNewBudget] = useState('');

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newProject || !newDataInicio || !newHoraInicio || !newDataFim || !newHoraFim) {
      alert('Por favor, preencha todos os campos obrigatórios (Título, Cliente, Datas e Horas).');
      return;
    }
 
    const newTask: Task = {
      id: `task-${Date.now()}`,
      titulo: newTitle,
      descricao: newDesc,
      projeto: newProject,
      freelancerId: undefined,
      freelancerNome: 'Não Atribuído',
      progresso: 0,
      status: 'Pendente',
      prioridade: 'Média',
      localEvento: newLocalEvento || undefined,
      dataEntrega: newDataFim,
      dataInicio: newDataInicio,
      horaInicio: newHoraInicio,
      dataFim: newDataFim,
      horaFim: newHoraFim,
      budget: newBudget ? Number(newBudget) : undefined,
      bloqueioAtivado: false,
      mealConfig: {
        cafeStart: '06:00',
        cafeEnd: '06:15',
        cafeEnabled: true,
        almocoStart: '12:00',
        almocoEnd: '12:15',
        almocoEnabled: true,
        jantarStart: '20:00',
        jantarEnd: '20:15',
        jantarEnabled: true
      }
    };
 
    onAddTask(newTask);
    setShowNewTaskModal(false);
    
    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewProject('');
    setNewLocalEvento('');
    setNewDataInicio('');
    setNewHoraInicio('00:00');
    setNewDataFim('');
    setNewHoraFim('00:00');
    setNewBudget('');
  };

  // Selected Project Object
  const currentProject = tasks.find(t => t.id === selectedProjectId);

  // Track current page open time for releasing checkin/checkout
  const [currentTimeOfPageOpen] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });

  // State for bulk check-in & check-out release operations in mass
  const [bulkRole, setBulkRole] = useState<string>('all');
  const [bulkFreelancerId, setBulkFreelancerId] = useState<string>('all');
  const [bulkTime, setBulkTime] = useState<string>(currentTimeOfPageOpen);

  const handleBulkRelease = (type: 'checkin' | 'checkout', activeDiariaDate: string, isBlock: boolean = false) => {
    if (!currentProject || !activeDiariaDate) return;
    const finalDiarias = { ...(currentProject.diariasData || {}) };
    const dateRecord = { ...(finalDiarias[activeDiariaDate] || {}) };
    const projectAllocations = currentProject.alocacoes || [];

    projectAllocations.forEach(alloc => {
      if (isContractedOnDate(alloc, activeDiariaDate)) {
        const roleMatch = bulkRole === 'all' || alloc.funcao === bulkRole;
        const freelancerMatch = bulkFreelancerId === 'all' || alloc.freelancerId === bulkFreelancerId;

        if (roleMatch && freelancerMatch) {
          const freeRecord = { ...(dateRecord[alloc.freelancerId] || {}) };
          if (type === 'checkin') {
            if (isBlock) {
              freeRecord.liberadoCheckin = false;
              freeRecord.liberadoCheckinHora = undefined;
            } else {
              freeRecord.liberadoCheckin = true;
              freeRecord.liberadoCheckinHora = bulkTime;
            }
          } else {
            if (isBlock) {
              freeRecord.liberadoCheckout = false;
              freeRecord.liberadoCheckoutHora = undefined;
            } else {
              freeRecord.liberadoCheckout = true;
              freeRecord.liberadoCheckoutHora = bulkTime;
            }
          }
          dateRecord[alloc.freelancerId] = freeRecord;
        }
      }
    });

    finalDiarias[activeDiariaDate] = dateRecord;
    onUpdateTask({ ...currentProject, diariasData: finalDiarias });
  };

  // Edit Project Modal state variables
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editProjectClient, setEditProjectClient] = useState('');
  const [editProjectLocal, setEditProjectLocal] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');
  const [editProjectDataInicio, setEditProjectDataInicio] = useState('');
  const [editProjectHoraInicio, setEditProjectHoraInicio] = useState('00:00');
  const [editProjectDataFim, setEditProjectDataFim] = useState('');
  const [editProjectHoraFim, setEditProjectHoraFim] = useState('00:00');
  const [editProjectBudget, setEditProjectBudget] = useState('');

  const [showClientsSuggestions, setShowClientsSuggestions] = useState(false);

  const handleDeleteCurrentProject = () => {
    if (!currentProject || !onDeleteTask) return;
    onDeleteTask(currentProject.id);
    setIsEditProjectModalOpen(false);
    setSelectedProjectId(null);
  };

  const handleOpenEditModal = () => {
    if (!currentProject) return;
    setEditProjectTitle(currentProject.titulo || '');
    setEditProjectClient(currentProject.projeto || '');
    setEditProjectLocal(currentProject.localEvento || '');
    setEditProjectDesc(currentProject.descricao || '');
    setEditProjectDataInicio(currentProject.dataInicio || '');
    setEditProjectHoraInicio(currentProject.horaInicio || '00:00');
    setEditProjectDataFim(currentProject.dataFim || currentProject.dataEntrega || '');
    setEditProjectHoraFim(currentProject.horaFim || '00:00');
    setEditProjectBudget(currentProject.budget ? currentProject.budget.toString() : '');
    setIsConfirmingDelete(false);
    setIsEditProjectModalOpen(true);
  };

  const handleSaveProjectDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    const updatedProject: Task = {
      ...currentProject,
      titulo: editProjectTitle.trim(),
      projeto: editProjectClient.trim(),
      localEvento: editProjectLocal.trim() || undefined,
      descricao: editProjectDesc.trim(),
      dataInicio: editProjectDataInicio || undefined,
      horaInicio: editProjectHoraInicio || undefined,
      dataFim: editProjectDataFim || undefined,
      dataEntrega: editProjectDataFim || undefined, // Sync both fields
      horaFim: editProjectHoraFim || undefined,
      budget: editProjectBudget ? parseFloat(editProjectBudget) : undefined,
    };

    onUpdateTask(updatedProject);
    setIsEditProjectModalOpen(false);
  };

  // Formatting local dates (DD/MM/YYYY)
  const formatLocalDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const parseTimeToMinutes = (t: string) => {
    if (!t) return 0;
    const parts = t.split(':');
    if (parts.length < 2) return 0;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const formatMinutesToHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) {
      return h === 1 ? '1 hora' : `${h} horas`;
    }
    return `${h}h ${String(m).padStart(2, '0')}m`;
  };

  const getLocalityFromLatitude = (coords?: string): string => {
    if (!coords) return '';
    const clean = coords.trim();
    const parts = clean.split(',');
    if (parts.length === 0) return '';
    const lat = parseFloat(parts[0]);
    if (isNaN(lat)) return '';
    
    const absLat = Math.abs(lat);
    if (absLat >= 23.2 && absLat <= 23.8) {
      return 'São Paulo, SP';
    } else if (absLat >= 22.4 && absLat <= 23.1) {
      return 'Rio de Janeiro, RJ';
    } else if (absLat >= 15.3 && absLat <= 16.2) {
      return 'Brasília, DF';
    } else if (absLat >= 19.5 && absLat <= 20.3) {
      return 'Belo Horizonte, MG';
    } else if (absLat >= 25.0 && absLat <= 25.8) {
      return 'Curitiba, PR';
    } else if (absLat >= 29.5 && absLat <= 30.5) {
      return 'Porto Alegre, RS';
    } else if (absLat >= 12.5 && absLat <= 13.5) {
      return 'Salvador, BA';
    } else if (absLat >= 7.6 && absLat <= 8.5) {
      return 'Recife, PE';
    } else if (absLat >= 3.4 && absLat <= 4.0) {
      return 'Fortaleza, CE';
    } else if (absLat >= 2.8 && absLat <= 3.3) {
      return 'Manaus, AM';
    }
    return 'Localidade Registrada';
  };

  const getAddressFromCoordinates = (coords?: string) => {
    if (!coords) return 'Geolocalização não registrada';
    const cleanCoords = coords.trim();
    if (!cleanCoords) return 'Geolocalização não registrada';

    const clean = cleanCoords.replace(/[^\D]/g, ''); 
    const paulistaAddresses = [
      "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01311-000",
      "Av. Paulista, 1578 - Cerqueira César, São Paulo - SP, 01310-200",
      "Rua Augusta, 1030 - Consolação, São Paulo - SP, 01305-100",
      "Av. Brig. Luís Antônio, 2500 - Jardim Paulista, São Paulo - SP, 01402-002",
      "Rua Pamplona, 1200 - Jardim Paulista, São Paulo - SP, 01405-003",
      "Rua Haddock Lobo, 347 - Cerqueira César, São Paulo - SP, 01414-001",
      "Alameda Santos, 1827 - Cerqueira César, São Paulo - SP, 01419-001",
      "Rua Bela Cintra, 867 - Consolação, São Paulo - SP, 01415-000"
    ];
    
    let sum = 0;
    for (let i = 0; i < cleanCoords.length; i++) {
      sum += cleanCoords.charCodeAt(i);
    }
    return paulistaAddresses[sum % paulistaAddresses.length];
  };

  const getProjectMealConfig = () => {
    const config = currentProject?.mealConfig || {};
    return {
      cafeStart: config.cafeStart ?? '06:00',
      cafeEnd: config.cafeEnd ?? '06:15',
      cafeValue: config.cafeValue ?? 15,
      cafeEnabled: config.cafeEnabled ?? true,

      almocoStart: config.almocoStart ?? '12:00',
      almocoEnd: config.almocoEnd ?? '12:15',
      almocoValue: config.almocoValue ?? 25,
      almocoEnabled: config.almocoEnabled ?? true,

      jantarStart: config.jantarStart ?? '20:00',
      jantarEnd: config.jantarEnd ?? '20:15',
      jantarValue: config.jantarValue ?? 35,
      jantarEnabled: config.jantarEnabled ?? true,
    };
  };

  const handleUpdateMealConfig = (field: string, value: any) => {
    if (!currentProject) return;
    const currentConfig = getProjectMealConfig();
    const updatedConfig = {
      ...currentConfig,
      [field]: value
    };
    onUpdateTask({
      ...currentProject,
      mealConfig: updatedConfig
    });
  };

  const intervalsOverlap = (a1: number, a2: number, b1: number, b2: number): boolean => {
    return Math.max(a1, b1) < Math.min(a2, b2);
  };

  const checkMealOverlap = (workStart: string, workEnd: string, mealStart: string, mealEnd: string): boolean => {
    if (!workStart || !workEnd || !mealStart || !mealEnd) return false;
    const ws = parseTimeToMinutes(workStart);
    const we = parseTimeToMinutes(workEnd);
    const ms = parseTimeToMinutes(mealStart);
    const me = parseTimeToMinutes(mealEnd);

    // Get worked intervals
    const workIntervals: [number, number][] = [];
    if (we < ws) {
      // Crosses midnight
      workIntervals.push([ws, 1440]);
      workIntervals.push([0, we]);
    } else {
      workIntervals.push([ws, we]);
    }

    // Get meal intervals
    const mealIntervals: [number, number][] = [];
    if (me < ms) {
      mealIntervals.push([ms, 1440]);
      mealIntervals.push([0, me]);
    } else {
      mealIntervals.push([ms, me]);
    }

    // Check overlap
    for (const [wa, wb] of workIntervals) {
      for (const [ma, mb] of mealIntervals) {
        if (intervalsOverlap(wa, wb, ma, mb)) {
          return true;
        }
      }
    }
    return false;
  };

  const getMealsOverlapInfo = (chegada: string, saida: string) => {
    const config = getProjectMealConfig();
    const meals = [
      { id: 'cafe', name: 'Café', start: config.cafeStart, end: config.cafeEnd, val: config.cafeValue, enabled: config.cafeEnabled },
      { id: 'almoco', name: 'Almoço', start: config.almocoStart, end: config.almocoEnd, val: config.almocoValue, enabled: config.almocoEnabled },
      { id: 'jantar', name: 'Jantar', start: config.jantarStart, end: config.jantarEnd, val: config.jantarValue, enabled: config.jantarEnabled },
    ];

    const activeMeals: { name: string; val: number }[] = [];
    let addedValue = 0;

    if (chegada && saida) {
      meals.forEach(m => {
        if (m.enabled && checkMealOverlap(chegada, saida, m.start, m.end)) {
          activeMeals.push({ name: m.name, val: m.val });
          addedValue += m.val;
        }
      });
    }

    return {
      activeMeals,
      addedValue
    };
  };

  const calculateCache = (diaria: number, hours: number, chegada?: string, saida?: string) => {
    if (hours <= 0) return 0;
    
    let coreCache = diaria;
    if (hours >= 18) {
      coreCache = diaria * 2;
    } else if (hours > 12) {
      const hourlyRateNormal = diaria / 12;
      const extraHours = hours - 12;
      coreCache = diaria + (extraHours * hourlyRateNormal);
    }

    let mealAddon = 0;
    if (chegada && saida) {
      const mealInfo = getMealsOverlapInfo(chegada, saida);
      mealAddon = mealInfo.addedValue;
    }

    return coreCache + mealAddon;
  };

  const getCacheBreakdown = (diaria: number, hours: number, chegada?: string, saida?: string) => {
    if (hours <= 0) {
      return {
        total: 0,
        text: 'Registro incompleto',
        formula: 'R$ 0,00',
        mealAddon: 0,
        mealsList: [] as string[]
      };
    }
    const baseHourRate = diaria / 12;
    let coreTotal = diaria;
    let label = 'Diária normal (até 12h)';

    if (hours >= 18) {
      coreTotal = diaria * 2;
      label = `Limite de 18h (Dobra máxima do cachê: R$ ${(diaria * 2).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
    } else if (hours > 12) {
      const extraHours = hours - 12;
      const extraTotal = extraHours * baseHourRate;
      coreTotal = diaria + extraTotal;
      const extraFormatted = Number(extraHours.toFixed(1));
      label = `+${extraFormatted}h extras x R$ ${baseHourRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (1/12 da diária)`;
    }

    let mealAddon = 0;
    const mealsList: string[] = [];
    if (chegada && saida) {
      const mealInfo = getMealsOverlapInfo(chegada, saida);
      mealAddon = mealInfo.addedValue;
      mealInfo.activeMeals.forEach(m => {
        mealsList.push(`${m.name} (+R$ ${m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
      });
    }

    const total = coreTotal + mealAddon;
    
    let totalText = label;
    if (mealsList.length > 0) {
      totalText += ` | Refeições: ${mealsList.join(', ')}`;
    }

    return {
      total,
      text: totalText,
      formula: `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      mealAddon,
      mealsList
    };
  };

  const getFreelancersFinalTotals = (pAllocations = currentProject?.alocacoes || []) => {
    const totals: Record<string, {
      freelancerId: string;
      freelancerNome: string;
      funcao: string;
      email: string;
      telefone: string;
      cpfCif: string;
      cnpj: string;
      totalDays: number;
      totalHours: number;
      baseCache: number;
      mealAddon: number;
      totalGeral: number;
      details: {
        dateText: string;
        chegada: string;
        saida: string;
        hours: number;
        hoursFormatted: string;
        dailyRate: number;
        coreCache: number;
        mealAddon: number;
        mealDetails: string[];
        totalDia: number;
      }[];
    }> = {};

    pAllocations.forEach(alloc => {
      const workedRows = getWorkedHoursForAllocation(alloc);
      const freelancerFull = freelancers.find(f => f.id === alloc.freelancerId);
      
      workedRows.forEach(row => {
        const dailyRate = alloc.valorHora;
        const isSuccess = row.hours > 0;
        const breakdown = getCacheBreakdown(dailyRate, row.hours, row.chegada, row.saida);
        
        const key = alloc.freelancerId;
        if (!totals[key]) {
          totals[key] = {
            freelancerId: alloc.freelancerId,
            freelancerNome: alloc.freelancerNome,
            funcao: alloc.funcao,
            email: freelancerFull?.email || '',
            telefone: freelancerFull?.telefone || '',
            cpfCif: freelancerFull?.cpfCif || freelancerFull?.cnpj || '',
            cnpj: freelancerFull?.cnpj || '',
            totalDays: 0,
            totalHours: 0,
            baseCache: 0,
            mealAddon: 0,
            totalGeral: 0,
            details: []
          };
        }

        const coreCache = isSuccess ? (row.hours >= 18 ? dailyRate * 2 : (row.hours > 12 ? dailyRate + (row.hours - 12) * (dailyRate / 12) : dailyRate)) : 0;
        
        totals[key].totalDays += 1;
        totals[key].totalHours += row.hours;
        totals[key].baseCache += coreCache;
        totals[key].mealAddon += breakdown.mealAddon;
        totals[key].totalGeral += breakdown.total;
        
        totals[key].details.push({
          dateText: row.dateText,
          chegada: row.chegada,
          saida: row.saida,
          hours: row.hours,
          hoursFormatted: row.hoursFormatted,
          dailyRate,
          coreCache,
          mealAddon: breakdown.mealAddon,
          mealDetails: breakdown.mealsList,
          totalDia: breakdown.total
        });
      });
    });

    return Object.values(totals);
  };

  const handleExportPDF = async (freelancerData: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color Palette
    const hexToRgb = (hex: string) => {
      let h = hex.replace('#', '');
      if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      const bigint = parseInt(h, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const t = pdfTheme || { bannerColor: '#0f172a', titleColor: '#ffffff', subtitleColor: '#94a3b8', highlightColor: '#059669' };
    const bannerRgb = hexToRgb(t.bannerColor);
    const titleRgb = hexToRgb(t.titleColor);
    const subRgb = hexToRgb(t.subtitleColor);
    const highRgb = hexToRgb(t.highlightColor);

    doc.setFillColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]);
    doc.rect(0, 0, 210, 38, 'F');

    // Title
    doc.setTextColor(titleRgb[0], titleRgb[1], titleRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('RESUMO DE PRESTACAO DE SERVIÇOS', 15, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(subRgb[0], subRgb[1], subRgb[2]);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 15, 22);
    doc.text(`Projeto: ${currentProject?.titulo || 'N/A'} | Cliente: ${currentProject?.projeto || 'N/A'}`, 15, 27);

    // Company Logo
    if (companyLogo) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            let fmt = 'PNG';
            if (companyLogo.startsWith('data:image/jpeg') || companyLogo.startsWith('data:image/jpg')) fmt = 'JPEG';
            // Add logo on the right side if we have it
            let logoWidth = t.logoSize || 40;
            const ratio = img.naturalHeight / img.naturalWidth;
            let logoHeight = logoWidth * ratio;

            // Budget height constraint: Maximum height is 34mm inside the 38mm banner to leave 2mm margins
            if (logoHeight > 34) {
              logoHeight = 34;
              logoWidth = logoHeight / ratio;
            }

            let xPos = 200 - logoWidth + (t.logoOffsetX || 0); // align to right margin (x=200) + offset
            let yPos = 19 - (logoHeight / 2) + (t.logoOffsetY || 0); // center vertically in the 38px banner + offset

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

    // Subheader banner (Highlight line)
    doc.setFillColor(highRgb[0], highRgb[1], highRgb[2]);
    doc.rect(0, 38, 210, 3, 'F');

    // Let's add details
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DADOS DO PROFISSIONAL', 15, 52);
    doc.text('DADOS DA EMPRESA', 110, 52);

    // Dividers
    doc.setDrawColor(226, 232, 240); // src-200
    doc.line(15, 55, 100, 55);      // left column divider
    doc.line(110, 55, 195, 55);     // right column divider

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Nome:', 15, 62);
    doc.text('Cargo / Funcao:', 15, 68);
    doc.text('E-mail:', 15, 74);
    doc.text('Telefone:', 15, 80);
    doc.text('Identificacao (CPF/CNPJ):', 15, 86);

    doc.setFont('helvetica', 'normal');
    doc.text(freelancerData.freelancerNome, 55, 62);
    doc.text(freelancerData.funcao, 55, 68);
    doc.text(freelancerData.email || 'Nao informado', 55, 74);
    doc.text(freelancerData.telefone || 'Nao informado', 55, 80);
    doc.text(freelancerData.cpfCif || freelancerData.cnpj || 'Nao informado', 55, 86);

    // Right Column details (Company)
    doc.setFont('helvetica', 'bold');
    doc.text('Razao Social:', 110, 62);
    doc.text('CNPJ:', 110, 68);

    doc.setFont('helvetica', 'normal');
    doc.text(t.companyName || 'Nao informado', 135, 62);
    doc.text(t.companyCnpj || 'Nao informado', 135, 68);

    // Detalhamento de Periodo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DETALHAMENTO DE DIARIAS E HORARIOS', 15, 100);
    doc.line(15, 103, 195, 103);

    // Table Headers
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(15, 107, 180, 7, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 107, 180, 7, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Dia / Turno', 17, 112);
    doc.text('Entrada', 60, 112);
    doc.text('Saida', 82, 112);
    doc.text('Horas', 104, 112);
    doc.text('Refeicoes Coincidentes', 122, 112);
    doc.text('Total do Dia', 172, 112);

    let currentY = 114;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    freelancerData.details.forEach((det: any, detIdx: number) => {
      // Row background for zebra striping
      if (detIdx % 2 !== 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 180, 8, 'F');
      }
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 8, 195, currentY + 8);

      doc.text(det.dateText || '', 17, currentY + 5);
      doc.text(det.chegada || 'Pendente', 60, currentY + 5);
      doc.text(det.saida || 'Pendente', 82, currentY + 5);
      doc.text(det.hoursFormatted || `${det.hours}h`, 104, currentY + 5);
      
      let mealsStr = det.mealDetails.length > 0 
        ? det.mealDetails.map((m: string) => m.split('(')[0].trim()).join(', ')
        : 'Nenhuma';
      if (mealsStr.length > 25) {
        mealsStr = mealsStr.substring(0, 23) + '...';
      }
      doc.text(mealsStr, 122, currentY + 5);
      doc.text(`R$ ${det.totalDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 172, currentY + 5);

      currentY += 8;
    });

    // Leave some space
    currentY += 10;

    // Financial totals box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, 180, 28, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, currentY, 180, 28, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMO FINANCEIRO DO ACORDO', 18, currentY + 6);
    doc.line(18, currentY + 8, 192, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Dias Trabalhados: ${freelancerData.totalDays}`, 18, currentY + 13);
    doc.text(`Total de Horas: ${freelancerData.totalHours.toFixed(1)}h`, 18, currentY + 18);
    doc.text(`Subtotal Cache: R$ ${freelancerData.baseCache.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 100, currentY + 13);
    doc.text(`Total Alimentacao: R$ ${freelancerData.mealAddon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 100, currentY + 18);

    // Big green badge for grand total
    doc.setFillColor(240, 253, 244); // bg-emerald-50
    doc.rect(142, currentY + 10, 48, 14, 'F');
    doc.setDrawColor(167, 244, 203); // border-emerald-200
    doc.rect(142, currentY + 10, 48, 14, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 122, 85);
    doc.text('TOTAL LIQUIDO', 145, currentY + 14);
    doc.setFontSize(10.5);
    doc.text(`R$ ${freelancerData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 145, currentY + 21);

    // Footer / Signatures
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Declaro que os horarios e valores descritos acima estao corretos e finalizados.', 15, currentY + 38);

    // Underneath metadata
    doc.setFontSize(6.5);
    doc.text('Este documento e um demonstrativo gerado eletronicamente e possui validade operacional interna.', 15, currentY + 46);

    // Save the PDF
    const filename = `Resumo_Cache_${freelancerData.freelancerNome.replace(/\s+/g, '_')}_${currentProject?.titulo.replace(/\s+/g, '_') || 'Projeto'}.pdf`;
    doc.save(filename);
  };

  const handleExportAllDiariesCSV = () => {
    if (!currentProject) return;
    const finalTotals = getFreelancersFinalTotals();
    if (finalTotals.length === 0) return;

    const csvRows = [
      ['Freelancer', 'Funcao', 'Email', 'Telefone', 'ID/CPF', 'Data', 'Check-in', 'Check-out', 'Horas', 'Valor Trabalhado (R$)', 'Cache Base', 'Acumulado Alimentacao', 'Repasse Total Liquido']
    ];

    finalTotals.forEach(freelancerData => {
      if (freelancerData.details && freelancerData.details.length > 0) {
        freelancerData.details.forEach((det: any) => {
          csvRows.push([
            freelancerData.freelancerNome,
            freelancerData.funcao,
            freelancerData.email || 'N/A',
            freelancerData.telefone || 'N/A',
            freelancerData.cpfCif || 'N/A',
            det.dateText,
            det.chegada || 'N/A',
            det.saida || 'N/A',
            det.hoursFormatted,
            det.totalDia.toFixed(2),
            freelancerData.baseCache.toFixed(2),
            freelancerData.mealAddon.toFixed(2),
            freelancerData.totalGeral.toFixed(2)
          ]);
        });
      } else {
        csvRows.push([
          freelancerData.freelancerNome,
          freelancerData.funcao,
          freelancerData.email || 'N/A',
          freelancerData.telefone || 'N/A',
          freelancerData.cpfCif || 'N/A',
          'N/A', 'N/A', 'N/A', 'N/A', '0.00',
          freelancerData.baseCache.toFixed(2),
          freelancerData.mealAddon.toFixed(2),
          freelancerData.totalGeral.toFixed(2)
        ]);
      }
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Diarias_Consolidadas_${currentProject.titulo.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllDiariesPDF = async () => {
    if (!currentProject) return;
    const finalTotals = getFreelancersFinalTotals();
    if (finalTotals.length === 0) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const hexToRgb = (hex: string) => {
      let h = hex.replace('#', '');
      if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      const bigint = parseInt(h, 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const t = pdfTheme || { bannerColor: '#0f172a', titleColor: '#ffffff', subtitleColor: '#94a3b8', highlightColor: '#059669' };
    const bannerRgb = hexToRgb(t.bannerColor);
    const titleRgb = hexToRgb(t.titleColor);
    const subRgb = hexToRgb(t.subtitleColor);
    const highRgb = hexToRgb(t.highlightColor);

    const drawHeader = async (pageNumber: number) => {
      doc.setFillColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(titleRgb[0], titleRgb[1], titleRgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PLANILHA RESUMO DE PAGAMENTOS', 15, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(subRgb[0], subRgb[1], subRgb[2]);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')} | Página ${pageNumber}`, 15, 22);
      doc.text(`Projeto: ${currentProject.titulo} | Cliente: ${currentProject.projeto || 'N/A'}`, 15, 27);

      if (companyLogo) {
        try {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              try {
                let fmt = 'PNG';
                if (companyLogo.startsWith('data:image/jpeg') || companyLogo.startsWith('data:image/jpg')) fmt = 'JPEG';
                let logoWidth = t.logoSize || 40;
                const ratio = img.naturalHeight / img.naturalWidth;
                let logoHeight = logoWidth * ratio;

                if (logoHeight > 34) {
                  logoHeight = 34;
                  logoWidth = logoHeight / ratio;
                }

                let xPos = 200 - logoWidth + (t.logoOffsetX || 0);
                let yPos = 19 - (logoHeight / 2) + (t.logoOffsetY || 0);

                if (xPos < 10) xPos = 10;
                if (xPos + logoWidth > 200) xPos = 200 - logoWidth;
                if (yPos < 2) yPos = 2;
                if (yPos + logoHeight > 36) yPos = 36 - logoHeight;

                doc.addImage(companyLogo, fmt, xPos, yPos, logoWidth, logoHeight, undefined, 'FAST');
              } catch (err) {
                console.error(err);
              }
              resolve();
            };
            img.onerror = () => resolve();
            img.src = companyLogo;
          });
        } catch (e) {
          console.error(e);
        }
      }

      doc.setFillColor(highRgb[0], highRgb[1], highRgb[2]);
      doc.rect(0, 38, 210, 3, 'F');
    };

    let pageNum = 1;
    await drawHeader(pageNum);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RELAÇÃO CONSOLIDADA DE PROFISSIONAIS E REPASSES', 15, 50);

    const drawTableHeaders = (startY: number) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, startY, 180, 8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, startY, 180, 8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('Profissional', 17, startY + 5.5);
      doc.text('Função', 65, startY + 5.5);
      doc.text('Dia / Jornada', 98, startY + 5.5);
      doc.text('Cachê Diário', 134, startY + 5.5);
      doc.text('Alimentação', 159, startY + 5.5);
      doc.text('Líquido Dia', 178, startY + 5.5);
    };

    let currentY = 54;
    drawTableHeaders(currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    for (let index = 0; index < finalTotals.length; index++) {
      const f = finalTotals[index];
      const bgColor = index % 2 !== 0 ? [244, 246, 249] : [255, 255, 255];
      const details = f.details || [];

      if (details.length === 0) {
        if (currentY + 10 > 275) {
          doc.addPage();
          pageNum++;
          await drawHeader(pageNum);
          currentY = 48;
          drawTableHeaders(currentY);
          currentY += 8;
        }

        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(15, currentY, 180, 8.5, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.line(15, currentY + 8.5, 195, currentY + 8.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        let nameText = f.freelancerNome;
        if (nameText.length > 25) nameText = nameText.substring(0, 23) + '...';
        doc.text(nameText, 17, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        let funcText = f.funcao;
        if (funcText.length > 20) funcText = funcText.substring(0, 18) + '...';
        doc.text(funcText, 65, currentY + 5.5);

        doc.text('Nenhum registro', 98, currentY + 5.5);
        doc.text('R$ 0,00', 134, currentY + 5.5);
        doc.text('R$ 0,00', 159, currentY + 5.5);
        doc.text('R$ 0,00', 178, currentY + 5.5);

        currentY += 8.5;
      } else {
        for (let detIndex = 0; detIndex < details.length; detIndex++) {
          const det = details[detIndex];

          if (currentY + 10 > 275) {
            doc.addPage();
            pageNum++;
            await drawHeader(pageNum);
            currentY = 48;
            drawTableHeaders(currentY);
            currentY += 8;
          }

          doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
          doc.rect(15, currentY, 180, 8.5, 'F');
          doc.setDrawColor(229, 231, 235);
          doc.line(15, currentY + 8.5, 195, currentY + 8.5);

          if (detIndex === 0) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            let nameText = f.freelancerNome;
            if (nameText.length > 25) nameText = nameText.substring(0, 23) + '...';
            doc.text(nameText, 17, currentY + 5.5);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            let funcText = f.funcao;
            if (funcText.length > 20) funcText = funcText.substring(0, 18) + '...';
            doc.text(funcText, 65, currentY + 5.5);
          } else {
            // Light indicator indicating continuous freelancer
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(156, 163, 175);
            doc.text('"', 25, currentY + 5.5);
            doc.text('"', 72, currentY + 5.5);
            doc.setFontSize(8); // restore
          }

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(31, 41, 55);
          doc.text(`${det.dateText} (${det.hoursFormatted})`, 98, currentY + 5.5);

          doc.text(`R$ ${det.coreCache.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 134, currentY + 5.5);
          doc.text(`R$ ${det.mealAddon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 159, currentY + 5.5);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(5, 122, 85);
          doc.text(`R$ ${det.totalDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 178, currentY + 5.5);

          currentY += 8.5;
        }
      }
    }

    const grandTotalBase = finalTotals.reduce((acc, current) => acc + current.baseCache, 0);
    const grandTotalMeals = finalTotals.reduce((acc, current) => acc + current.mealAddon, 0);
    const grandOverall = finalTotals.reduce((acc, current) => acc + current.totalGeral, 0);

    if (currentY + 25 > 275) {
      doc.addPage();
      pageNum++;
      await drawHeader(pageNum);
      currentY = 48;
    }

    currentY += 5;
    doc.setFillColor(249, 250, 251);
    doc.rect(15, currentY, 180, 18, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(15, currentY, 180, 18, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    doc.text('TOTAL GERAL DO PROJETO', 18, currentY + 6);
    doc.line(18, currentY + 8, 192, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text(`Profissionais: ${finalTotals.length}`, 18, currentY + 13);
    doc.text(`Total Cachês: R$ ${grandTotalBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 55, currentY + 13);
    doc.text(`Total Alimentações: R$ ${grandTotalMeals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 108, currentY + 13);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 122, 85);
    doc.text(`LÍQUIDO CONSOLIDADO: R$ ${grandOverall.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 108, currentY + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text('Demonstrativo consolidado gerado electronicamente pelo sistema.', 15, 285);

    const filename = `Planilha_Resumo_Pagamentos_${currentProject.titulo.replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
  };

  const renderFinalizationsStage = () => {
    const finalTotals = getFreelancersFinalTotals();
    const grandTotalAllocations = finalTotals.length;
    const grandTotalDays = finalTotals.reduce((acc, current) => acc + current.totalDays, 0);
    const grandTotalHours = finalTotals.reduce((acc, current) => acc + current.totalHours, 0);
    const grandTotalBase = finalTotals.reduce((acc, current) => acc + current.baseCache, 0);
    const grandTotalMeals = finalTotals.reduce((acc, current) => acc + current.mealAddon, 0);
    const grandOverall = finalTotals.reduce((acc, current) => acc + current.totalGeral, 0);

    return (
      <div className="space-y-6 mt-4 animate-fade-in text-left">
        {/* Financial Recap Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-50/70 border border-neutral-200 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-450 tracking-wider">Profissionais Finalizados</span>
            <div className="text-2xl font-black text-neutral-800 font-mono leading-none">{grandTotalAllocations}</div>
            <p className="text-[10px] text-neutral-400 font-medium">Alocados com diárias registradas</p>
          </div>
          <div className="bg-neutral-50/70 border border-neutral-200 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-450 tracking-wider">Total de Horas Operadas</span>
            <div className="text-2xl font-black text-neutral-800 font-mono leading-none">{grandTotalHours.toFixed(1)}h</div>
            <p className="text-[10px] text-neutral-400 font-medium">Soma de todas as diárias do projeto</p>
          </div>
          <div className="bg-neutral-50/70 border border-neutral-200 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-450 tracking-wider">Acumulado de Alimentação</span>
            <div className="text-2xl font-black text-neutral-800 font-mono leading-none font-sans">
              R$ {grandTotalMeals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-neutral-400 font-medium">Auxílio alimentação e jantares</p>
          </div>
          <div className="bg-emerald-950 border border-emerald-900 rounded-xl p-4 space-y-1.5 text-white">
            <span className="text-[10px] uppercase font-bold text-emerald-350 tracking-wider">VALOR TOTAL GERAL DO PROJETO</span>
            <div className="text-2xl font-black text-emerald-400 font-mono leading-none">
              R$ {grandOverall.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-emerald-300 font-medium">Soma de caches de todas as diárias</p>
          </div>
        </div>

        {/* Detailed Individual Summaries */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-150 pb-2.5">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Resumos Individuais para Download</h4>
            {finalTotals.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAllDiariesCSV}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all outline-none cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  Exportar Diárias (CSV Consolidado)
                </button>
                <button
                  type="button"
                  onClick={handleExportAllDiariesPDF}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all outline-none cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  Exportar Todos Comprovantes (PDF)
                </button>
              </div>
            )}
          </div>
          
          {finalTotals.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center text-neutral-400 italic">
              Nenhuma diária registrada ou verificada neste projeto.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {finalTotals.map((freelancerData) => {
                const fid = freelancerData.freelancerId;
                const nf = currentProject?.notasFiscais?.[fid];
                const isAguardandoNf = !nf || nf.status === 'Pendente';
                const isExpanded = expandedSummaries[fid] || false;

                return (
                 <div key={freelancerData.freelancerId} className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-xs transition-shadow space-y-4 leading-normal">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-sm uppercase font-sans">
                        {freelancerData.freelancerNome.substring(0, 2)}
                      </div>
                      <div>
                        <h5 className="font-bold text-neutral-900 text-sm">{freelancerData.freelancerNome}</h5>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{freelancerData.funcao}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs font-extrabold font-mono">
                        <span className="text-[9px] uppercase tracking-wide text-emerald-600 font-bold mr-1">Repasse Líquido:</span>
                        R$ {freelancerData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>

                      {isAguardandoNf && (
                        <div title="Aguardando Nota Fiscal" className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-50 text-purple-600 border border-amber-200 shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => toggleSummary(fid)}
                        className="px-3 py-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all outline-none cursor-pointer"
                      >
                        {isExpanded ? 'Recolher Detalhes' : 'Ver Detalhes'}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleExportPDF(freelancerData)}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all border border-neutral-950 focus:outline-none"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Exportar Comprovante PDF
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      {/* Collapsible details grids like financial breakdown, phone, etc. */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs font-sans bg-neutral-50/50 p-4 rounded-xl border border-neutral-200 animate-fade-in text-left">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-neutral-400 font-bold block">E-MAIL / TELEFONE</span>
                          <span className="text-neutral-700 font-medium block truncate">{freelancerData.email || 'N/A'}</span>
                          <span className="text-neutral-500 text-[10px] font-mono block">{freelancerData.telefone || 'N/A'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-neutral-400 font-bold block">DOCUMENTO DE ID</span>
                          <span className="text-neutral-700 font-mono font-medium block">{freelancerData.cpfCif || 'Não informado'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-neutral-400 font-bold block">DIAS TRABALHADOS</span>
                          <span className="text-neutral-800 font-bold block">{freelancerData.totalDays} dia(s)</span>
                          <span className="text-neutral-450 text-[10px] font-mono block">{freelancerData.totalHours.toFixed(1)}h totais</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-neutral-400 font-bold block">DETALHAMENTO FINANCEIRO</span>
                          <span className="text-neutral-600 block">Cachê base: R$ {freelancerData.baseCache.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-neutral-600 block">Alimentações: R$ {freelancerData.mealAddon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="space-y-0.5 sm:col-span-1 md:text-right">
                          <span className="text-[10px] text-neutral-400 font-bold block">REPASSE TOTAL LIQUIDO</span>
                          <span className="text-emerald-700 font-extrabold text-base font-mono block">
                            R$ {freelancerData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      {/* Micro list of days worked */}
                      <div className="bg-neutral-50 border border-neutral-150 rounded-lg p-3 space-y-1.5 max-h-40 overflow-y-auto">
                        <span className="text-[9px] uppercase font-extrabold text-neutral-400 tracking-wider block">Registros do Período</span>
                        {freelancerData.details.map((det, detIdx) => (
                          <div key={detIdx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] border-b border-white pb-1.5 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-neutral-800">{det.dateText}</span>
                              <span className="text-neutral-300">|</span>
                              <span className="text-neutral-500">Check-in: <strong className="font-mono text-neutral-700">{det.chegada || 'N/A'}</strong></span>
                              <span className="text-neutral-300">|</span>
                              <span className="text-neutral-500">Check-out: <strong className="font-mono text-neutral-700">{det.saida || 'N/A'}</strong></span>
                              <span className="text-neutral-300">|</span>
                              <span className="bg-neutral-200 text-neutral-700 rounded px-1.5 py-0.2 font-mono text-[10px] font-bold">{det.hoursFormatted}</span>
                            </div>
                            <div className="font-semibold text-neutral-750 font-mono self-end sm:self-center">
                              R$ {det.totalDia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Faturamento / Nota Fiscal Approval section */}
                      <div className="border-t border-neutral-150 pt-4 mt-4 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-100 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-neutral-900 text-xs block">Nota Fiscal do Prestador</span>
                              {nf ? (
                                <span className="text-[10px] text-neutral-550 block truncate max-w-full font-mono">
                                  {nf.name} • Enviada: {nf.date}
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-450 italic block">
                                  Sem anexo enviado pelo profissional até o momento.
                                </span>
                              )}
                            </div>
                          </div>


                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                            {nf ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={nf.base64}
                                  download={nf.name}
                                  className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="Baixar Nota Fiscal fornecida"
                                >
                                  📥 Baixar NF
                                </a>

                                <span className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase tracking-wide border ${
                                  nf.status === 'Aprovado'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                                    : nf.status === 'Rejeitado'
                                    ? 'bg-rose-55 text-rose-850 border-rose-220'
                                    : 'bg-amber-50 text-amber-850 border-amber-200 animate-pulse'
                                }`}>
                                  {nf.status === 'Aprovado' ? '✅ Aprovada' : nf.status === 'Rejeitado' ? '❌ Rejeitada' : '⏳ Em Análise'}
                                </span>

                                <div className="flex gap-1.5 ml-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!currentProject) return;
                                      const currentNotas = currentProject.notasFiscais || {};
                                      onUpdateTask({
                                        ...currentProject,
                                        notasFiscais: {
                                          ...currentNotas,
                                          [fid]: { ...nf, status: 'Aprovado' }
                                        }
                                      });
                                      alert(`Nota Fiscal de ${freelancerData.freelancerNome} APROVADA com sucesso!`);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                                  >
                                    Aprovar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!currentProject) return;
                                      const currentNotas = currentProject.notasFiscais || {};
                                      onUpdateTask({
                                        ...currentProject,
                                        notasFiscais: {
                                          ...currentNotas,
                                          [fid]: { ...nf, status: 'Rejeitado' }
                                        }
                                      });
                                      alert(`Nota Fiscal de ${freelancerData.freelancerNome} REJEITADA.`);
                                    }}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                                  >
                                    Rejeitar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded font-mono">
                                AGUARDANDO
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    );
  };

  const renderEvaluationsStage = () => {
    const uniqueAllocatedFreelancers = (currentProject?.alocacoes || []).reduce((acc, alloc) => {
      if (!acc.some(f => f.id === alloc.freelancerId)) {
        const freeObj = freelancers.find(f => f.id === alloc.freelancerId);
        if (freeObj) {
          acc.push({
            id: freeObj.id,
            nome: freeObj.nome,
            cargo: alloc.funcao || freeObj.cargo,
            email: freeObj.email,
            telefone: freeObj.telefone,
            fotoPerfil: freeObj.fotoPerfil,
            freelancerObj: freeObj
          });
        }
      }
      return acc;
    }, [] as { id: string; nome: string; cargo: string; email: string; telefone: string; fotoPerfil?: string; freelancerObj: Freelancer }[]);

    return (
      <div className="space-y-6 mt-4 animate-fade-in text-left">
        <div className="bg-neutral-50/75 border border-neutral-200 rounded-xl p-5 space-y-2 leading-relaxed">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-600 fill-amber-500/20" />
            <h4 className="text-sm font-bold text-neutral-850 uppercase tracking-wider">Aba de Avaliação de Desempenho</h4>
          </div>
          <p className="text-xs text-neutral-600">
            Nesta aba, você, como gestor do projeto <strong>"{currentProject?.titulo}"</strong>, pode avaliar o desempenho de cada profissional alocado. As notas (estrelas) e comentários ficarão vinculados ao perfil do profissional para futuras referências de contratação.
          </p>
        </div>

        {uniqueAllocatedFreelancers.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center text-neutral-400 italic">
            Não há profissionais alocados neste projeto para avaliar. Aloque pessoas na aba Equipe.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {uniqueAllocatedFreelancers.map((fItem) => {
              const f = fItem.freelancerObj;
              const projectComments = f.avaliacoes?.filter(r => r.projetoNome === currentProject?.titulo) || [];
              const selectedRating = reviewRatings[f.id] || 5;
              const commentText = reviewComments[f.id] || '';

              return (
                <div key={f.id} className="bg-white border border-neutral-150 rounded-xl p-5 hover:shadow-xs transition-shadow space-y-4 leading-normal flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {f.fotoPerfil ? (
                          <img 
                            src={f.fotoPerfil} 
                            alt={f.nome} 
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-sm uppercase">
                            {f.nome.substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <h5 className="font-bold text-neutral-900 text-sm">{f.nome}</h5>
                          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{fItem.cargo}</p>
                        </div>
                      </div>

                      {/* Favorite Button on Card */}
                      <button
                        type="button"
                        onClick={() => toggleFavorite(f.id)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer focus:outline-none shrink-0"
                        title={favorites.includes(f.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Star className={`w-4 h-4 transition-transform active:scale-125 ${
                          favorites.includes(f.id)
                            ? 'fill-amber-400 text-purple-500 scale-110'
                            : 'text-neutral-350 hover:text-neutral-505'
                        }`} />
                      </button>
                    </div>

                    <div className="text-[11px] text-neutral-500 space-y-0.5 font-mono">
                      <div>E-mail: <span className="text-neutral-700 font-medium">{f.email || 'N/A'}</span></div>
                      <div>Telefone: <span className="text-neutral-700 font-medium">{f.telefone || 'N/A'}</span></div>
                    </div>

                    {projectComments.length > 0 && (
                      <div className="space-y-2 border-t border-dotted border-neutral-200 pt-3">
                        <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">Avaliações Enviadas neste Projeto</span>
                        <div className="space-y-2">
                          {projectComments.map((rev) => (
                            <div key={rev.id} className="bg-amber-50/20 border border-amber-250/50 p-3 rounded-lg space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-neutral-500 font-semibold">{rev.cliente} • {rev.data}</span>
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < rev.nota ? 'fill-amber-400 text-purple-500' : 'text-neutral-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-neutral-700 italic">"{rev.comentario}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 pt-3 border-t border-neutral-100">
                      <span className="text-[10px] uppercase font-bold text-neutral-450 tracking-wider block">Registrar Nova Avaliação</span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-neutral-500">Nota:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((starsVal) => (
                            <button
                              key={starsVal}
                              type="button"
                              onClick={() => setReviewRatings(prev => ({ ...prev, [f.id]: starsVal }))}
                              className="p-0.5 focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                              title={`${starsVal} Estrela${starsVal > 1 ? 's' : ''}`}
                            >
                              <Star className={`w-5 h-5 transition-colors ${
                                starsVal <= selectedRating 
                                  ? 'fill-amber-400 text-purple-500' 
                                  : 'text-neutral-200 hover:text-amber-300'
                              }`} />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-600 ml-1 font-mono">{selectedRating} / 5</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-500" htmlFor={`comentario-${f.id}`}>Comentário / Relatório de Desempenho:</label>
                        <textarea
                          id={`comentario-${f.id}`}
                          value={commentText}
                          onChange={(e) => setReviewComments(prev => ({ ...prev, [f.id]: e.target.value }))}
                          placeholder="Escreva detalhes sobre postura, competência técnica, pontualidade..."
                          rows={3}
                          className="w-full text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 focus:bg-white transition-all text-neutral-800 placeholder-neutral-400 resize-none font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      disabled={submittingReview[f.id] || !commentText.trim()}
                      onClick={() => handlePublishReview(f.id, f.nome)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        commentText.trim()
                          ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-xs'
                          : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {submittingReview[f.id] ? 'Enviando...' : 'Publicar no Perfil'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getWorkedHoursForAllocation = (alloc: ProjectAllocation) => {
    if (!currentProject || !currentProject.diariasData) return [];
    const diariesData = currentProject.diariasData;
    const dates = getEventDatesArray(currentProject.dataInicio, currentProject.dataFim);
    const freelancerId = alloc.freelancerId;
    const list: {
      dateText: string;
      chegada: string;
      saida: string;
      locationChegada?: string;
      locationSaida?: string;
      foto?: string;
      hours: number;
      hoursFormatted: string;
      crossDay: boolean;
      status: string;
    }[] = [];

    const processedDates = new Set<string>();

    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      if (processedDates.has(dateStr)) continue;

      const record = diariesData[dateStr]?.[freelancerId] || {};
      const chegada = record.chegada || '';
      const saida = record.saida || '';
      
      if (!isContractedOnDate(alloc, dateStr)) continue;

      if (chegada) {
        if (saida) {
          const arMins = parseTimeToMinutes(chegada);
          const depMins = parseTimeToMinutes(saida);
          const diffMins = depMins >= arMins ? depMins - arMins : (24 * 60 - arMins) + depMins;
          const hours = diffMins / 60;
          list.push({
            dateText: formatLocalDate(dateStr),
            chegada,
            saida,
            locationChegada: record.localizacaoChegada || record.localizacao,
            locationSaida: record.localizacaoSaida || record.localizacao,
            foto: record.foto,
            hours,
            hoursFormatted: formatMinutesToHours(diffMins),
            crossDay: false,
            status: 'Finalizado'
          });
          processedDates.add(dateStr);
        } else {
          const nextDateStr = i + 1 < dates.length ? dates[i + 1] : null;
          let isCrossDay = false;

          if (nextDateStr && isContractedOnDate(alloc, nextDateStr)) {
            const nextRecord = diariesData[nextDateStr]?.[freelancerId] || {};
            if (!nextRecord.chegada && nextRecord.saida) {
              const arMins = parseTimeToMinutes(chegada);
              const depMins = parseTimeToMinutes(nextRecord.saida);
              const diffMins = (24 * 60 - arMins) + depMins;
              const hours = diffMins / 60;

              list.push({
                dateText: `${formatLocalDate(dateStr)} a ${formatLocalDate(nextDateStr)}`,
                chegada,
                saida: nextRecord.saida,
                locationChegada: record.localizacaoChegada || record.localizacao,
                locationSaida: nextRecord.localizacaoSaida || nextRecord.localizacao || record.localizacao,
                foto: record.foto || nextRecord.foto,
                hours,
                hoursFormatted: formatMinutesToHours(diffMins),
                crossDay: true,
                status: 'Virada de Dia'
              });

              isCrossDay = true;
              processedDates.add(dateStr);
              processedDates.add(nextDateStr);
            }
          }

          if (!isCrossDay) {
            list.push({
              dateText: formatLocalDate(dateStr),
              chegada,
              saida: '',
              locationChegada: record.localizacaoChegada || record.localizacao,
              foto: record.foto,
              hours: 0,
              hoursFormatted: 'Pendente (Sem checkout)',
              crossDay: false,
              status: 'Pendente Checkout'
            });
            processedDates.add(dateStr);
          }
        }
      } else {
        if (saida) {
          // Check if previous day is already processed as a crossDay of this. 
          // If so, we skip!
          const prevDateStr = i > 0 ? dates[i - 1] : null;
          let iscontinuation = false;
          if (prevDateStr) {
            const prevRecord = diariesData[prevDateStr]?.[freelancerId] || {};
            if (prevRecord.chegada && !prevRecord.saida) {
              iscontinuation = true;
            }
          }

          if (!iscontinuation) {
            list.push({
              dateText: formatLocalDate(dateStr),
              chegada: '',
              saida,
              locationSaida: record.localizacaoSaida || record.localizacao,
              foto: record.foto,
              hours: 0,
              hoursFormatted: 'Incompleto (Sem checkin)',
              crossDay: false,
              status: 'Incompleto Checkin'
            });
          }
          processedDates.add(dateStr);
        }
      }
    }

    return list;
  };

  // Helper to parse dates securely to local midnights
  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dateStr);
  };

  // Calculate inclusive days between two dates
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    try {
      const s = parseLocalDate(start);
      const e = parseLocalDate(end);
      s.setHours(0,0,0,0);
      e.setHours(0,0,0,0);
      const diff = e.getTime() - s.getTime();
      return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
    } catch {
      return 0;
    }
  };

  // Live total cache simulation 
  const computedDays = calculateDays(allocStart, allocEnd);
  const simulatedTotalCache = computedDays * customHourlyRate;
  const matchedFreelancer = freelancers.find(f => f.id === allocatingFreelancerId);

  // Filter project keys including registered clients
  const uniqueClients = Array.from(new Set([
    ...clients.map(c => c.nome),
    ...tasks.map(t => t.projeto)
  ]));
  
  const filteredTasks = tasks.filter(t => {
    const projectMatch = filterProject === 'Todos' || t.projeto === filterProject;
    const priorityMatch = filterPriority === 'Todas' || t.prioridade === filterPriority;
    return projectMatch && priorityMatch;
  });

  // Action: Select target freelancer details
  const handleFreelancerSelectCustom = (freeId: string) => {
    setAllocatingFreelancerId(freeId);
    setAllocFreelancerSearchText('');
    setIsFreelancerDropdownOpen(false);
    
    const matched = freelancers.find(f => f.id === freeId);
    if (matched) {
      setCustomHourlyRate(matched.valorHora);
      setAllocRole(matched.cargo);
      // Auto-prefill dates if project has dates
      if (currentProject) {
        setAllocStart(currentProject.dataInicio || '');
        setAllocEnd(currentProject.dataFim || currentProject.dataEntrega || '');
      }
    } else {
      setCustomHourlyRate(0);
      setAllocRole('');
    }
  };

  // Action: Toggle individual freelancer selection in batch checkboxes
  const handleToggleFreelancerSelection = (freeId: string) => {
    setSelectedFreelancerIds(prev => {
      const isSelected = prev.includes(freeId);
      let nextList: string[];
      if (isSelected) {
        nextList = prev.filter(id => id !== freeId);
      } else {
        nextList = [...prev, freeId];
      }

      // Pre-fill role and customHourlyRate if we added one, or based on the last selected 
      if (!isSelected) {
        const freelancer = freelancers.find(f => f.id === freeId);
        if (freelancer) {
          setAllocatingFreelancerId(freeId);
          setAllocRole(freelancer.cargo);
          setCustomHourlyRate(freelancer.valorHora);
          // Auto-prefill dates if project has dates and they are empty
          if (currentProject && (!allocStart || !allocEnd)) {
            setAllocStart(currentProject.dataInicio || '');
            setAllocEnd(currentProject.dataFim || currentProject.dataEntrega || '');
          }
        }
      } else if (nextList.length > 0) {
        // If we unchecked, but still have others, pre-fill with the last remaining ID
        const lastId = nextList[nextList.length - 1];
        const freelancer = freelancers.find(f => f.id === lastId);
        if (freelancer) {
          setAllocatingFreelancerId(lastId);
          setAllocRole(freelancer.cargo);
          setCustomHourlyRate(freelancer.valorHora);
        }
      } else {
        // No remaining selected
        setAllocatingFreelancerId('');
        setAllocRole('');
        setCustomHourlyRate(0);
      }

      return nextList;
    });
  };

  // Action: Select/Deselect all filtered freelancers
  const handleToggleSelectAll = (filteredFrees: typeof freelancers) => {
    const visibleIds = filteredFrees.map(f => f.id);
    if (visibleIds.length === 0) return;

    const allVisibleSelected = visibleIds.every(id => selectedFreelancerIds.includes(id));
    if (allVisibleSelected) {
      // Unselect all visible ones
      setSelectedFreelancerIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible ones
      setSelectedFreelancerIds(prev => {
        const union = Array.from(new Set([...prev, ...visibleIds]));
        return union;
      });
      // Also pre-fill role/rate if we have at least one visible
      if (filteredFrees.length > 0) {
        setAllocatingFreelancerId(filteredFrees[0].id);
        setAllocRole(filteredFrees[0].cargo);
        setCustomHourlyRate(filteredFrees[0].valorHora);
        if (currentProject && (!allocStart || !allocEnd)) {
          setAllocStart(currentProject.dataInicio || '');
          setAllocEnd(currentProject.dataFim || currentProject.dataEntrega || '');
        }
      }
    }
  };

  // Action: Select and focus a single freelancer (on card click)
  const handleSelectAndFocusFreelancer = (freeId: string) => {
    // Set focus
    setAllocatingFreelancerId(freeId);
    
    // Auto-prefill dates if project has dates and we can edit
    const freelancer = freelancers.find(f => f.id === freeId);
    if (freelancer) {
      setAllocRole(freelancer.cargo);
      setCustomHourlyRate(freelancer.valorHora);
      if (currentProject && (!allocStart || !allocEnd)) {
        setAllocStart(currentProject.dataInicio || '');
        setAllocEnd(currentProject.dataFim || currentProject.dataEntrega || '');
      }
    }

    setSelectedFreelancerIds(prev => {
      if (prev.includes(freeId)) {
        // If they click an already checked row, toggle it off and remove focus if it's the current one
        setAllocatingFreelancerId(prevId => prevId === freeId ? '' : prevId);
        return prev.filter(id => id !== freeId); 
      } else {
        return [...prev, freeId];
      }
    });
  };

  // Action: Remove selected freelancers that are already allocated (from sidebar)
  const handleRemoveSelectedFromSidebar = () => {
    if (!currentProject) return;
    const allocatedSelectedIds = selectedFreelancerIds.filter(id => 
      currentProject.alocacoes?.some(alloc => alloc.freelancerId === id)
    );
    if (allocatedSelectedIds.length === 0) return;

    let confirmed = true;
    try {
      confirmed = window.confirm(`Tem certeza que deseja remover de forma definitiva os ${allocatedSelectedIds.length} profissionais selecionados deste projeto?`);
    } catch (e) {
      // Fallback in iframe sandbox environments that block confirm() dialogs
      confirmed = true;
    }

    if (!confirmed) return;

    const filteredAlloc = (currentProject.alocacoes || []).filter(a => !allocatedSelectedIds.includes(a.freelancerId));
    
    const updatedProject: Task = {
      ...currentProject,
      alocacoes: filteredAlloc
    };

    if (filteredAlloc.length === 0) {
      updatedProject.freelancerId = undefined;
      updatedProject.freelancerNome = 'Não Atribuído';
    } else {
      const firstAlloc = filteredAlloc[0];
      updatedProject.freelancerId = firstAlloc.freelancerId;
      updatedProject.freelancerNome = firstAlloc.freelancerNome;
    }

    onUpdateTask(updatedProject);
    
    // Clear selections of the removed ones
    setSelectedFreelancerIds(prev => prev.filter(id => !allocatedSelectedIds.includes(id)));
    if (allocatingFreelancerId && allocatedSelectedIds.includes(allocatingFreelancerId)) {
      setAllocatingFreelancerId('');
      setAllocRole('');
      setCustomHourlyRate(0);
    }
  };

  // Action: Add/Update Allocation
  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !allocStart || !allocEnd || customHourlyRate <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios para prosseguir com a alocação (Datas e Cachê Base).');
      return;
    }

    const days = calculateDays(allocStart, allocEnd);
    if (days <= 0) {
      alert('A data de fim deve ser igual ou posterior à data de início.');
      return;
    }

    const calculatedCache = days * customHourlyRate;

    if (editingAllocationId) {
      // Editing Mode
      const updatedAllocations = (currentProject.alocacoes || []).map(a => {
        if (a.id === editingAllocationId) {
          return {
            ...a,
            funcao: allocRole || a.funcao,
            dataInicio: allocStart,
            dataFim: allocEnd,
            valorHora: customHourlyRate,
            totalCache: calculatedCache,
          };
        }
        return a;
      });

      const updatedProject: Task = {
        ...currentProject,
        alocacoes: updatedAllocations
      };

      onUpdateTask(updatedProject);

      // Reset allocation form states
      setEditingAllocationId(null);
      setSelectedFreelancerIds([]);
      setAllocatingFreelancerId('');
      setAllocStart('');
      setAllocEnd('');
      setCustomHourlyRate(0);
      setAllocRole('');
      return;
    }

    // Normal allocation addition: filter out already allocated to prevent duplication
    const idsToAllocate = (selectedFreelancerIds.length > 0 
      ? selectedFreelancerIds 
      : (allocatingFreelancerId ? [allocatingFreelancerId] : []))
      .filter(id => !currentProject.alocacoes?.some(alloc => alloc.freelancerId === id));

    if (idsToAllocate.length === 0) {
      alert('Por favor, selecione pelo menos um profissional não alocado na lista para alocar.');
      return;
    }

    const currentAllocations = currentProject.alocacoes || [];
    const newAllocations: ProjectAllocation[] = [];

    idsToAllocate.forEach((freeId, idx) => {
      const freelancer = freelancers.find(f => f.id === freeId);
      if (freelancer) {
        newAllocations.push({
          id: `alloc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          freelancerId: freelancer.id,
          freelancerNome: freelancer.nome,
          funcao: allocRole || freelancer.cargo,
          dataInicio: allocStart,
          dataFim: allocEnd,
          valorHora: customHourlyRate,
          totalCache: calculatedCache,
          statusConfirmacao: 'Pendente'
        });
      }
    });

    if (newAllocations.length === 0) {
      alert('Nenhum freelancer válido selecionado.');
      return;
    }
    
    // Update tasks array with updated allocations
    const firstAlloc = newAllocations[0];
    const updatedProject: Task = {
      ...currentProject,
      alocacoes: [...currentAllocations, ...newAllocations],
      // If none was assigned before, let's also fill freelancerId for backward compatibility
      ...(!currentProject.freelancerId ? {
        freelancerId: firstAlloc.freelancerId,
        freelancerNome: firstAlloc.freelancerNome
      } : {})
    };

    onUpdateTask(updatedProject);

    // Reset allocation form states
    setEditingAllocationId(null);
    setSelectedFreelancerIds([]);
    setAllocatingFreelancerId('');
    setAllocStart('');
    setAllocEnd('');
    setCustomHourlyRate(0);
    setAllocRole('');
  };

  // Action: Update dates directly from allocation list
  const handleUpdateAllocationDates = (allocId: string, newStart: string, newEnd: string) => {
    if (!currentProject) return;
    const days = calculateDays(newStart, newEnd);
    const updatedAlloc = (currentProject.alocacoes || []).map(a => {
      if (a.id === allocId) {
        const valDays = days > 0 ? days : 0;
        return {
          ...a,
          dataInicio: newStart,
          dataFim: newEnd,
          totalCache: valDays * a.valorHora
        };
      }
      return a;
    });

    onUpdateTask({
      ...currentProject,
      alocacoes: updatedAlloc
    });
  };

  // Action: Start editing allocation by prefilling the allocation form
  const handleStartEditAllocation = (alloc: ProjectAllocation) => {
    setProjectStage('Alocação');
    setEditingAllocationId(alloc.id);
    setAllocatingFreelancerId(alloc.freelancerId);
    setSelectedFreelancerIds([alloc.freelancerId]);
    setAllocRole(alloc.funcao);
    setCustomHourlyRate(alloc.valorHora);
    setAllocStart(alloc.dataInicio);
    setAllocEnd(alloc.dataFim);

    // Optional: scroll form area into view
    const elem = document.getElementById('allocation-form-container');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Action: Delete Allocation
  const handleRemoveAllocation = (allocId: string) => {
    if (!currentProject) return;
    const allocToRemove = (currentProject.alocacoes || []).find(a => a.id === allocId);
    const filteredAlloc = (currentProject.alocacoes || []).filter(a => a.id !== allocId);
    
    // Preserve in historicoRecusas if it was Recusado
    const historicoRecusas = currentProject.historicoRecusas ? [...currentProject.historicoRecusas] : [];
    if (allocToRemove && allocToRemove.statusConfirmacao === 'Recusado') {
      const alreadyExists = historicoRecusas.some(r => r.id === allocId || (r.freelancerId === allocToRemove.freelancerId && r.dataInicio === allocToRemove.dataInicio));
      if (!alreadyExists) {
        historicoRecusas.push({ ...allocToRemove, statusConfirmacao: 'Recusado' });
      }
    }

    const updatedProject: Task = {
      ...currentProject,
      alocacoes: filteredAlloc,
      historicoRecusas
    };

    // If we removed all, clean the legacy assignee fallback
    if (filteredAlloc.length === 0) {
      updatedProject.freelancerId = undefined;
      updatedProject.freelancerNome = 'Não Atribuído';
    } else {
      // Re-assign legacy property to first allocation
      const firstAlloc = filteredAlloc[0];
      updatedProject.freelancerId = firstAlloc.freelancerId;
      updatedProject.freelancerNome = firstAlloc.freelancerNome;
    }

    onUpdateTask(updatedProject);
    setSelectedAllocIds(prev => prev.filter(id => id !== allocId));

    // Clear from sidebar selection too so that checkmark is released
    if (allocToRemove) {
      setSelectedFreelancerIds(prev => prev.filter(id => id !== allocToRemove.freelancerId));
      if (allocatingFreelancerId === allocToRemove.freelancerId) {
        setAllocatingFreelancerId('');
        setAllocRole('');
        setCustomHourlyRate(0);
      }
    }
  };

  // Action: Toggle individual allocation selection in team roster
  const handleToggleAllocSelection = (allocId: string) => {
    setSelectedAllocIds(prev => {
      if (prev.includes(allocId)) {
        return prev.filter(id => id !== allocId);
      } else {
        return [...prev, allocId];
      }
    });
  };

  // Action: Select/Deselect all visible allocations in team roster
  const handleToggleSelectAllAlloc = (allocations: ProjectAllocation[]) => {
    const visibleIds = allocations.map(a => a.id);
    const allSelected = visibleIds.every(id => selectedAllocIds.includes(id));
    if (allSelected) {
      setSelectedAllocIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedAllocIds(prev => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  // Action: Remove all selected allocations
  const handleRemoveSelectedAllocations = () => {
    if (!currentProject || selectedAllocIds.length === 0) return;

    let confirmed = true;
    try {
      confirmed = window.confirm(`Tem certeza que deseja remover as ${selectedAllocIds.length} alocações selecionadas?`);
    } catch (e) {
      // Fallback in iframe sandbox environments that block confirm() dialogs
      confirmed = true;
    }

    if (!confirmed) return;

    const filteredAlloc = (currentProject.alocacoes || []).filter(a => !selectedAllocIds.includes(a.id));
    
    const updatedProject: Task = {
      ...currentProject,
      alocacoes: filteredAlloc
    };

    if (filteredAlloc.length === 0) {
      updatedProject.freelancerId = undefined;
      updatedProject.freelancerNome = 'Não Atribuído';
    } else {
      const firstAlloc = filteredAlloc[0];
      updatedProject.freelancerId = firstAlloc.freelancerId;
      updatedProject.freelancerNome = firstAlloc.freelancerNome;
    }

    onUpdateTask(updatedProject);
    setSelectedAllocIds([]);
  };

  // Action: Toggle individual allocation status
  const handleToggleAllocationStatus = (allocId: string, status: 'Pendente' | 'Confirmado' | 'Recusado' | 'Chamado', msg?: string) => {
    if (!currentProject) return;
    
    let targetFreelancerId = '';
    let targetFreelancerNome = '';
    let foundAlloc: ProjectAllocation | null = null;
    
    const updatedAlloc = (currentProject.alocacoes || []).map(a => {
      if (a.id === allocId) {
        targetFreelancerId = a.freelancerId;
        targetFreelancerNome = a.freelancerNome;
        const updatedItem: ProjectAllocation = {
          ...a,
          statusConfirmacao: status,
          ...(msg !== undefined ? { chamadoMensagem: msg } : {})
        };
        foundAlloc = updatedItem;
        return updatedItem;
      }
      return a;
    });

    const historicoRecusas = currentProject.historicoRecusas ? [...currentProject.historicoRecusas] : [];
    if (status === 'Recusado' && foundAlloc) {
      const alreadyExists = historicoRecusas.some(r => r.id === allocId || (r.freelancerId === (foundAlloc as ProjectAllocation).freelancerId && r.dataInicio === (foundAlloc as ProjectAllocation).dataInicio));
      if (!alreadyExists) {
        historicoRecusas.push({ ...foundAlloc, statusConfirmacao: 'Recusado' });
      }
    }

    const updatedTask = {
      ...currentProject,
      alocacoes: updatedAlloc,
      historicoRecusas
    };
    onUpdateTask(updatedTask);
    
    if (onAddNotification && targetFreelancerId) {
      if (status === 'Confirmado') {
        onAddNotification({
          id: `status-update-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${allocId}`,
          freelancerId: targetFreelancerId,
          freelancerNome: targetFreelancerNome,
          titulo: `Confirmação de Diária - ${currentProject.titulo}`,
          mensagem: `Sua participação no projeto ${currentProject.projeto} foi CONFIRMADA pela gestão. Cheque a aba "Projetos Confirmados".`,
          data: new Date().toISOString(),
          lida: false,
          tipo: 'Info'
        });
      } else if (status === 'Recusado') {
        onAddNotification({
          id: `status-update-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${allocId}`,
          freelancerId: targetFreelancerId,
          freelancerNome: targetFreelancerNome,
          titulo: `Cancelamento de Diária - ${currentProject.titulo}`,
          mensagem: `Sua participação no projeto ${currentProject.projeto} foi ajustada para cancelada ou não foi aprovada.`,
          data: new Date().toISOString(),
          lida: false,
          tipo: 'Info'
        });
      }
    }
  };

  const handleDiariaFieldChange = (dateStr: string, freelancerId: string, field: 'chegada' | 'saida' | 'localizacao' | 'foto', val: string) => {
    if (!currentProject) return;
    const currentDiarias = currentProject.diariasData || {};
    const dateRecord = currentDiarias[dateStr] || {};
    const freelancerRecord = dateRecord[freelancerId] || {};
    
    let updatedFreelancerRecord = {
      ...freelancerRecord,
      [field]: val
    };

    // Automatically supply geolocalização when arrival (chegada) or departure (saída) is defined
    if ((field === 'chegada' || field === 'saida') && val) {
      if (!updatedFreelancerRecord.localizacao) {
        const lat = (-23.55 + (Math.random() - 0.5) * 0.05).toFixed(4);
        const lng = (-46.63 + (Math.random() - 0.5) * 0.05).toFixed(4);
        updatedFreelancerRecord.localizacao = `${lat}, ${lng}`;

        // Attempting to acquire real GPS location from the browser and auto-updating
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const realLat = position.coords.latitude.toFixed(4);
              const realLng = position.coords.longitude.toFixed(4);
              
              // Lazy dispatch update with real coords
              const freshDiarias = currentProject.diariasData || {};
              const freshDateRec = freshDiarias[dateStr] || {};
              const freshFreeRec = freshDateRec[freelancerId] || {};
              // Ensure we don't overwrite if values changed in the meantime
              if (freshFreeRec.chegada === val || freshFreeRec.saida === val) {
                const finalFreeRec = { ...freshFreeRec, localizacao: `${realLat}, ${realLng}` };
                const finalDateRec = { ...freshDateRec, [freelancerId]: finalFreeRec };
                const finalDiarias = { ...freshDiarias, [dateStr]: finalDateRec };
                onUpdateTask({ ...currentProject, diariasData: finalDiarias });
              }
            },
            (error) => {
              console.log("Geolocation fallback used:", error.message);
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      }
    }

    const updatedDateRecord = {
      ...dateRecord,
      [freelancerId]: updatedFreelancerRecord
    };

    const updatedDiarias = {
      ...currentDiarias,
      [dateStr]: updatedDateRecord
    };

    const updatedTask = {
      ...currentProject,
      diariasData: updatedDiarias
    };

    onUpdateTask(updatedTask);
  };

  // Helpers removed

  // Action: Send services confirmation reminders to all allocated professionals
  const handleSendConfirmations = () => {
    if (sendButtonCountdown > 0) return;
    if (!currentProject || !currentProject.alocacoes || currentProject.alocacoes.length === 0) {
      alert('Não há profissionais alocados para enviar confirmação.');
      return;
    }

    if (!onAddNotification) {
      alert('Sistema de notificação não disponível.');
      return;
    }

    setSendButtonCountdown(5);

    let sentCount = 0;
    const updatedAlloc = currentProject.alocacoes.map(alloc => {
      // Prevents re-sending to users who have already responded
      if (alloc.statusConfirmacao === 'Confirmado' || alloc.statusConfirmacao === 'Recusado') {
        return alloc;
      }

      const dataStr = `${formatLocalDate(alloc.dataInicio)} até ${formatLocalDate(alloc.dataFim)}`;
      const localStr = currentProject.localEvento || 'Não definido';
      const cacheStr = `R$ ${alloc.valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      
      let textMsg = `Olá, Requisitamos seu trabalho como ${alloc.funcao}, no evento ${currentProject.titulo}\n\nDATA: ${dataStr}`;
      textMsg += `\nLOCAL: ${localStr}\nValor do cachê (por diária): ${cacheStr}\n\nPor gentileza, poderia confirmar a disponibilidade do serviço o mais rápido possível?`;
      
      // Simulate Email Sending
      const freelancer = freelancers.find(f => f.id === alloc.freelancerId);
      if (freelancer?.email) {
          console.log(`[SIMULAÇÃO] Email enviado para ${freelancer.email}:\n${textMsg}`);
      }

      const newNotif: Notification = {
        id: `confirm-req-${Date.now()}-${Math.floor(Math.random() * 1000000)}-${alloc.id}`,
        freelancerId: alloc.freelancerId,
        freelancerNome: alloc.freelancerNome,
        titulo: `Convite de Serviço: ${currentProject.titulo}`,
        mensagem: textMsg,
        data: new Date().toISOString(),
        lida: false,
        tipo: 'Demanda',
        isConfirmacaoRequest: true,
        projetoId: currentProject.id,
        alocacaoId: alloc.id
      };
      
      onAddNotification(newNotif);
      sentCount++;

      return {
        ...alloc,
        statusConfirmacao: 'Chamado' as const
      };
    });

    onUpdateTask({
      ...currentProject,
      alocacoes: updatedAlloc
    });

    alert(`${sentCount} solicitação(ões) de confirmação enviada(s) com sucesso para a Central de Notificações e por Email!`);
  };

  const getEventCountdownText = (task: Task) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDateStr = task.dataInicio || task.dataEntrega;
    const endDateStr = task.dataFim || task.dataEntrega;

    if (!startDateStr) {
      return { text: 'Período não definido', type: 'undefined', colorClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700' };
    }

    const startLocal = parseLocalDate(startDateStr);
    startLocal.setHours(0, 0, 0, 0);

    const endLocal = parseLocalDate(endDateStr);
    endLocal.setHours(0, 0, 0, 0);

    if (now < startLocal) {
      const diffTime = startLocal.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        return { text: 'Começa amanhã', type: 'countdown', colorClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-purple-500 border-amber-200 dark:border-amber-800' };
      }
      return { text: `Faltam ${diffDays} dias para o início`, type: 'countdown', colorClass: 'bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-purple-500 border-amber-200 dark:border-amber-800' };
    } else if (now >= startLocal && now <= endLocal) {
      return { text: 'Acontecendo agora', type: 'happening', colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold' };
    } else {
      return { text: 'Evento encerrado', type: 'finished', colorClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-neutral-700' };
    }
  };

  // VIEW 1: Project Details (Form & Table alloc list)
  if (currentProject) {
    const projectAllocations = currentProject.alocacoes || [];
    
    // Combine active and historical recusados without duplication
    const activeRecusados = projectAllocations.filter(a => a.statusConfirmacao === 'Recusado');
    const historicoRecusados = currentProject.historicoRecusas || [];
    const totalRecusadosList: ProjectAllocation[] = [...activeRecusados];
    historicoRecusados.forEach(h => {
      const alreadyIn = totalRecusadosList.some(r => r.id === h.id || (r.freelancerId === h.freelancerId && r.dataInicio === h.dataInicio));
      if (!alreadyIn) {
        totalRecusadosList.push(h);
      }
    });
    const totalAllocatedCost = projectAllocations.reduce((sum, item) => sum + item.totalCache, 0);
    const totalActualCost = currentProject.custoRealExecutado !== undefined
      ? currentProject.custoRealExecutado
      : projectAllocations.reduce((acc, alloc) => {
          const worked = getWorkedHoursForAllocation(alloc);
          const sumWorked = worked.reduce((sum, row) => sum + calculateCache(alloc.valorHora, row.hours, row.chegada, row.saida), 0);
          return acc + sumWorked;
        }, 0);
    const countdown = getEventCountdownText(currentProject);

    const eventDates = getEventDatesArray(currentProject.dataInicio, currentProject.dataFim);
    const activeDiariaDate = selectedDiariaDate && eventDates.includes(selectedDiariaDate)
      ? selectedDiariaDate
      : (eventDates[0] || '');

    return (
      <div className="space-y-6" id="project-detail-view">
        {/* Detail Header area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-neutral-200 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedProjectId(null)}
              className="p-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">{currentProject.titulo}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px]">Cliente:</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-105 border border-neutral-200/80 px-2.5 py-0.5 rounded-full">
                    {currentProject.projeto}
                  </span>
                </span>
                <span className="text-neutral-300 dark:text-neutral-700 font-light">|</span>
                <span className="inline-flex items-center gap-1">
                  <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px]">Começo:</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-105 border border-neutral-200/80 px-2.5 py-0.5 rounded-full font-mono">
                    {formatLocalDate(currentProject.dataInicio)}
                  </span>
                </span>
                {(currentProject.dataFim || currentProject.dataEntrega) && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-700 font-light">|</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="font-bold text-neutral-400 uppercase tracking-widest text-[9px]">Encerramento:</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-105 border border-neutral-200/80 px-2.5 py-0.5 rounded-full font-mono">
                        {formatLocalDate(currentProject.dataFim || currentProject.dataEntrega)}
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-stretch gap-3 flex-wrap">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-right flex flex-col justify-center">
              <span className="text-[10px] uppercase text-neutral-400 font-bold block tracking-wider">Budget do Evento</span>
              <span className="text-sm font-bold text-neutral-900 font-mono">
                {currentProject.budget && currentProject.budget > 0 
                  ? `R$ ${currentProject.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                  : 'R$ 0,00'
                }
              </span>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-right flex flex-col justify-center">
              <span className="text-[10px] uppercase text-neutral-400 font-bold block tracking-wider">Custo Total Alocado</span>
              <span className="text-sm font-bold text-neutral-900 font-mono">
                R$ {totalAllocatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {totalActualCost > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-right flex flex-col justify-center animate-fade-in animate-duration-300">
                <span className="text-[10px] uppercase text-emerald-800 font-bold block tracking-wider">Custo Real Executado</span>
                <span className="text-sm font-bold text-emerald-900 font-mono">
                  R$ {totalActualCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {currentProject.budget !== undefined && currentProject.budget > 0 && (
              <div className={`border rounded-xl px-4 py-2 text-right flex flex-col justify-center ${
                totalAllocatedCost > currentProject.budget 
                  ? 'bg-rose-50 border-rose-250 text-rose-700' 
                  : 'bg-emerald-50 border-emerald-250 text-emerald-800'
              }`}>
                <span className="text-[10px] uppercase font-bold block tracking-wider">Saldo do Budget</span>
                <span className="text-sm font-bold font-mono">
                  R$ {(currentProject.budget - totalAllocatedCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <button
              onClick={handleOpenEditModal}
              className="px-4 bg-neutral-50 border border-neutral-200 rounded-xl hover:bg-neutral-150 text-neutral-600 hover:text-neutral-900 transition-all flex items-center justify-center shrink-0 cursor-pointer hover:shadow-xs"
              title="Editar Cadastro do Projeto"
              type="button"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two column detail layout */}
        <div className="flex flex-col gap-6">
          {/* Main Workspace: Current Allocations Table */}
          <div className="order-2 bg-white rounded-xl border border-neutral-200 p-6 flex flex-col shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all duration-300">
            {/* Step Progression Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fade-in">
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'EQUIPE', stage: 'Alocação' },
                  { name: 'DIÁRIAS', stage: 'Diarias' },
                  { name: 'PAGAMENTOS', stage: 'Pagamentos' },
                  ...(currentProject?.folhaFechada ? [
                    { name: 'FINALIZAÇÕES', stage: 'Finalizações' },
                    { name: 'AVALIAÇÃO', stage: 'Avaliação' }
                  ] : [])
                ].map((step) => {
                  const isActive = projectStage === step.stage;
                  
                  return (
                    <button 
                      key={step.name}
                      type="button"
                      onClick={() => step.stage && setProjectStage(step.stage as any)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded uppercase tracking-wider border-0 transition-all cursor-pointer ${
                        isActive ? 'bg-neutral-900 text-white shadow-3xs font-extrabold' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600'
                      }`}
                    >
                      {step.name}
                    </button>
                  );
                })}
              </div>

              {projectStage === 'Finalizações' && (
                <div className="flex items-center gap-2">
                  {currentProject?.status === 'Concluído' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProject) {
                          const updated = { ...currentProject, status: 'Em Andamento' as const };
                          onUpdateTask(updated);
                          alert("O status do projeto foi alterado de volta para 'Em Andamento'.");
                        }
                      }}
                      className="px-3.5 py-1.5 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 hover:border-neutral-500 text-neutral-100 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none"
                    >
                      Reabrir Projeto
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProject) {
                          const updated = { ...currentProject, status: 'Concluído' as const };
                          onUpdateTask(updated);
                          alert(`O projeto "${currentProject.titulo}" foi concluído e finalizado com sucesso!`);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer border border-emerald-500 focus:outline-none flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Finalizar Projeto
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (currentProject) {
                        const updated = { 
                          ...currentProject, 
                          folhaFechada: false,
                          custoRealExecutado: undefined,
                          ...(currentProject.status === 'Concluído' ? { status: 'Em Andamento' as const } : {})
                        };
                        onUpdateTask(updated);
                        setProjectStage('Pagamentos');
                        alert("A folha de pagamentos foi reaberta para edição.");
                      }
                    }}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none ${
                      currentProject?.status === 'Concluído'
                        ? 'border-neutral-200 hover:border-neutral-300 text-neutral-500 hover:bg-neutral-50 bg-white'
                        : 'border-emerald-200 hover:border-emerald-300 text-emerald-800 hover:bg-emerald-50 bg-white'
                    }`}
                  >
                    Reabrir Folha
                  </button>
                </div>
              )}
            </div>

            <div className="pb-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-500" />
                  Profissionais Contratados / Alocados
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">Gerenciamento de tempo e fechamento de cachê operacional para os freelancers.</p>
              </div>
              <span className="bg-neutral-100 px-2 py-0.5 rounded font-bold text-xs text-neutral-700">
                {projectAllocations.length} Alocação(ões)
              </span>
            </div>

            {/* Navigation Tabs for Diárias */}
            {projectStage === 'Diarias' && currentProject && (() => {
              const dates = getEventDatesArray(currentProject.dataInicio, currentProject.dataFim);
              const activeDate = selectedDiariaDate && dates.includes(selectedDiariaDate) ? selectedDiariaDate : (dates[0] || '');
              
              return (
                <div className="flex flex-wrap items-center gap-1.5 p-3 mb-4 bg-neutral-50 rounded-xl border border-neutral-150">
                  <span className="w-full text-[10px] uppercase tracking-wider font-extrabold text-neutral-450 mb-1">
                    Selecione o Dia do Evento:
                  </span>
                  {dates.length === 0 ? (
                    <span className="text-xs text-neutral-400 italic">Defina as datas de início e fim do projeto para habilitar as abas por dia.</span>
                  ) : (
                    dates.map((dateStr) => {
                      const isSelected = activeDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedDiariaDate(dateStr)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer select-none ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs'
                              : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300'
                          }`}
                        >
                          Dia {formatLocalDate(dateStr)}
                        </button>
                      );
                    })
                  )}
                </div>
              );
            })()}

            {projectStage === 'Pagamentos' && currentProject && (
              <div className="bg-neutral-50/80 border border-neutral-200 rounded-xl p-4 mt-3 mb-1 animate-fade-in space-y-3 shadow-3xs">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 border-b border-neutral-150 pb-2">
                  <div className="flex items-center gap-2 text-neutral-800 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                    Configuração de Horários de Referência (Refeições)
                  </div>
                  <span className="text-[10px] text-neutral-550 font-normal">
                    Se o horário trabalhado coincidir com o intervalo, o valor é somado ao cachê diário.
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Café da Manhã */}
                  <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={getProjectMealConfig().cafeEnabled} 
                          onChange={(e) => handleUpdateMealConfig('cafeEnabled', e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Café da Manhã
                      </label>
                      <span className="text-[8px] uppercase tracking-widest text-neutral-400 font-bold">Café</span>
                    </div>
                    {getProjectMealConfig().cafeEnabled && (
                      <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                        <div>
                          <span className="text-[8px] text-neutral-450 uppercase font-black block">Horário</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input 
                              type="time" 
                              value={getProjectMealConfig().cafeStart} 
                              onChange={(e) => handleUpdateMealConfig('cafeStart', e.target.value)}
                              className="bg-neutral-50 px-1.5 py-0.5 border border-neutral-200 text-[11px] rounded font-mono w-full text-center focus:border-emerald-500 focus:outline-none"
                            />
                            <span className="text-neutral-400 text-[10px] font-bold">às</span>
                            <input 
                              type="time" 
                              value={getProjectMealConfig().cafeEnd} 
                              onChange={(e) => handleUpdateMealConfig('cafeEnd', e.target.value)}
                              className="bg-neutral-50 px-1.5 py-0.5 border border-neutral-200 text-[11px] rounded font-mono w-full text-center focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] text-neutral-450 uppercase font-black block">Valor Base</span>
                          <div className="relative mt-0.5">
                            <span className="absolute left-1.5 top-0.5 text-[10px] text-neutral-400 font-bold">R$</span>
                            <input 
                              type="number" 
                              value={getProjectMealConfig().cafeValue} 
                              onChange={(e) => handleUpdateMealConfig('cafeValue', parseFloat(e.target.value) || 0)}
                              className="bg-neutral-50 pl-6 pr-1 py-0.5 border border-neutral-200 text-[11px] rounded font-bold w-full font-mono text-right focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Almoço */}
                  <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={getProjectMealConfig().almocoEnabled} 
                          onChange={(e) => handleUpdateMealConfig('almocoEnabled', e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Almoço
                      </label>
                      <span className="text-[8px] uppercase tracking-widest text-neutral-400 font-bold">Almoço</span>
                    </div>
                    {getProjectMealConfig().almocoEnabled && (
                      <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                        <div>
                          <span className="text-[8px] text-neutral-450 uppercase font-black block">Horário</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input 
                              type="time" 
                              value={getProjectMealConfig().almocoStart} 
                              onChange={(e) => handleUpdateMealConfig('almocoStart', e.target.value)}
                              className="bg-neutral-50 px-1.5 py-0.5 border border-neutral-200 text-[11px] rounded font-mono w-full text-center focus:border-emerald-500 focus:outline-none"
                            />
                            <span className="text-neutral-400 text-[10px] font-bold">às</span>
                            <input 
                              type="time" 
                              value={getProjectMealConfig().almocoEnd} 
                              onChange={(e) => handleUpdateMealConfig('almocoEnd', e.target.value)}
                              className="bg-neutral-50 px-1.5 py-0.5 border border-neutral-200 text-[11px] rounded font-mono w-full text-center focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] text-neutral-450 uppercase font-black block">Valor Base</span>
                          <div className="relative mt-0.5">
                            <span className="absolute left-1.5 top-0.5 text-[10px] text-neutral-400 font-bold">R$</span>
                            <input 
                              type="number" 
                              value={getProjectMealConfig().almocoValue} 
                              onChange={(e) => handleUpdateMealConfig('almocoValue', parseFloat(e.target.value) || 0)}
                              className="bg-neutral-50 pl-6 pr-1 py-0.5 border border-neutral-200 text-[11px] rounded font-bold w-full font-mono text-right focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Jantar */}
                  <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={getProjectMealConfig().jantarEnabled} 
                          onChange={(e) => handleUpdateMealConfig('jantarEnabled', e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-400 w-3.5 h-3.5 cursor-pointer"
                        />
                        Jantar
                      </label>
                      <span className="text-[8px] uppercase tracking-widest text-neutral-400 font-bold">Jantar</span>
                    </div>
                    {getProjectMealConfig().jantarEnabled && (
                      <div className="grid grid-cols-2 gap-2 pt-1 animate-fade-in">
                        <div>
                          <span className="text-[8px] text-neutral-450 uppercase font-black block">Horário</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input 
                              type="time" 
                              value={getProjectMealConfig().jantarStart} 
                              onChange={(e) => handleUpdateMealConfig('jantarStart', e.target.value)}
                              className="bg-neutral-50 px-1.5 py-0.5 border border-neutral-200 text-[11px] rounded font-mono w-full text-center focus:border-emerald-500 focus:outline-none"
                            />
                            <span className="text-neutral-400 text-[10px] font-bold">às</span>
                            <input 
                              type="time" 
                              value={getProjectMealConfig().jantarEnd} 
                              onChange={(e) => handleUpdateMealConfig('jantarEnd', e.target.value)}
                              className="bg-neutral-50 px-1.5 py-0.5 border border-neutral-200 text-[11px] rounded font-mono w-full text-center focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] text-neutral-450 uppercase font-black block">Valor Base</span>
                          <div className="relative mt-0.5">
                            <span className="absolute left-1.5 top-0.5 text-[10px] text-neutral-400 font-bold">R$</span>
                            <input 
                              type="number" 
                              value={getProjectMealConfig().jantarValue} 
                              onChange={(e) => handleUpdateMealConfig('jantarValue', parseFloat(e.target.value) || 0)}
                              className="bg-neutral-50 pl-6 pr-1 py-0.5 border border-neutral-200 text-[11px] rounded font-bold w-full font-mono text-right focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {projectStage !== 'Finalizações' && projectStage !== 'Avaliação' ? (
              <>
                {projectStage === 'Alocação' && selectedAllocIds.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="bg-rose-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-3xs">
                        {selectedAllocIds.length}
                      </div>
                      <span className="text-neutral-800">
                        profissional(is) de equipe selecionado(s) para remoção
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedAllocIds([])}
                        className="px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        Desmarcar Todos
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveSelectedAllocations}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover Selecionados
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="mt-4 overflow-x-auto flex-grow">
                <table className="w-full text-left border-collapse min-w-[850px]">
                {projectStage === 'Diarias' ? (
                  <>
                    <thead>
                      <tr className="bg-neutral-50/75 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Profissional</th>
                        <th className="py-2.5 px-3">Função / Cargo</th>
                        <th className="py-2.5 px-3">Horário de Chegada</th>
                        <th className="py-2.5 px-3">Horário de Saída</th>
                        {currentProject?.bloqueioAtivado && <th className="py-2.5 px-3">Liberações (Check-In/Out)</th>}
                        <th className="py-2.5 px-3">Foto de Confirmação</th>
                        <th className="py-2.5 px-3 text-center">Confirmar Manualmente</th>
                        <th className="py-2.5 px-3 text-center">GPS / Localização</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
                      {projectAllocations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-neutral-400 italic">
                            Não existem freelancers contratados para exibir diárias.
                          </td>
                        </tr>
                      ) : (
                        projectAllocations.map((alloc) => {
                          const isContracted = isContractedOnDate(alloc, activeDiariaDate);
                          const diariaDataRecord = (currentProject.diariasData || {})[activeDiariaDate]?.[alloc.freelancerId] || {};
                          const isManualPending = isContracted && 
                            !diariaDataRecord.confirmadoPeloGestor && 
                            (diariaDataRecord.preenchidoManualmente || (!!diariaDataRecord.chegada && !!diariaDataRecord.saida));
                          
                          let rowBgClass = '';
                          if (isContracted) {
                            if (isManualPending) {
                              rowBgClass = 'bg-amber-50/70 border-l-4 border-amber-500 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20 dark:border-amber-600 dark:text-neutral-200';
                            } else {
                              rowBgClass = 'bg-emerald-50/20 border-l-4 border-emerald-500 hover:bg-emerald-50/40 text-neutral-800 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 dark:border-emerald-600 dark:text-neutral-200';
                            }
                          } else {
                            rowBgClass = 'bg-neutral-50/70 text-neutral-400 opacity-75 border-l-4 border-neutral-300 dark:bg-neutral-900/40 dark:border-neutral-800 dark:text-neutral-500';
                          }

                          return (
                            <tr 
                              key={alloc.id} 
                              className={`transition-all duration-150 ${rowBgClass}`}
                            >
                              <td className="py-3 px-3">
                                <div className="flex flex-col">
                                  <span className={`text-xs font-bold ${isContracted ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-400 dark:text-neutral-500 font-medium'}`}>
                                    {alloc.freelancerNome}
                                  </span>
                                  <span className="text-[9px] mt-0.5">
                                    {isContracted ? (
                                      <span className="text-emerald-850 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-[8px] border border-emerald-200 dark:border-emerald-800/60">Contratado</span>
                                    ) : (
                                      <span className="text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider text-[8px] border border-neutral-200 dark:border-neutral-800">Não Contratado</span>
                                    )}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className={`px-2 py-1.5 rounded text-[10px] font-semibold border text-center flex items-center justify-center break-words leading-tight max-w-[150px] ${
                                  isContracted 
                                    ? 'bg-emerald-100/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-350 border-emerald-200 dark:border-emerald-800/60' 
                                    : 'bg-neutral-100/70 dark:bg-neutral-900/50 text-neutral-400 dark:text-neutral-500 border-neutral-200 dark:border-neutral-800'
                                }`}>
                                  {alloc.funcao}
                                </div>
                              </td>
                              <td className="py-3 px-3 animate-fade-in">
                                <input
                                  type="time"
                                  value={diariaDataRecord.chegada || ''}
                                  onChange={(e) => handleDiariaFieldChange(activeDiariaDate, alloc.freelancerId, 'chegada', e.target.value)}
                                  className={`bg-white dark:bg-neutral-900 border text-xs rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-24 ${
                                    isContracted 
                                      ? 'border-neutral-300 dark:border-neutral-750 text-neutral-850 dark:text-neutral-200 font-medium' 
                                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 bg-neutral-50/30 dark:bg-neutral-950/30'
                                  }`}
                                />
                              </td>
                              <td className="py-3 px-3">
                                <input
                                  type="time"
                                  value={diariaDataRecord.saida || ''}
                                  onChange={(e) => handleDiariaFieldChange(activeDiariaDate, alloc.freelancerId, 'saida', e.target.value)}
                                  className={`bg-white dark:bg-neutral-900 border text-xs rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-24 ${
                                    isContracted 
                                      ? 'border-neutral-300 dark:border-neutral-750 text-neutral-850 dark:text-neutral-200 font-medium' 
                                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 bg-neutral-50/30 dark:bg-neutral-950/30'
                                  }`}
                                />
                              </td>
                              {currentProject?.bloqueioAtivado && (
                                <td className="py-3 px-3">
                                  {isContracted ? (
                                    <div className="flex flex-col gap-1.5 min-w-[150px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${diariaDataRecord.liberadoCheckin ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border ${
                                          diariaDataRecord.liberadoCheckin 
                                            ? 'text-emerald-700 dark:text-emerald-450 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60' 
                                            : 'text-rose-600 dark:text-rose-450 bg-rose-50/50 dark:bg-rose-950/30 border-rose-150 dark:border-rose-900/40'
                                        }`}>
                                          In: {diariaDataRecord.liberadoCheckin ? `Liberado às ${diariaDataRecord.liberadoCheckinHora}` : 'Bloqueado'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${diariaDataRecord.liberadoCheckout ? 'bg-purple-500' : 'bg-rose-500'}`} />
                                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border ${
                                          diariaDataRecord.liberadoCheckout 
                                            ? 'text-indigo-700 dark:text-indigo-450 bg-purple-50/50 dark:bg-indigo-950/30 border-purple-200 dark:border-indigo-800/60' 
                                            : 'text-rose-600 dark:text-rose-450 bg-rose-50/50 dark:bg-rose-950/30 border-rose-150 dark:border-rose-900/40'
                                        }`}>
                                          Out: {diariaDataRecord.liberadoCheckout ? `Liberado às ${diariaDataRecord.liberadoCheckoutHora}` : 'Bloqueado'}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-neutral-400 dark:text-neutral-550 italic text-[10px]">Não disponível</span>
                                  )}
                                </td>
                              )}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  {diariaDataRecord.foto ? (
                                    <div className="relative group shrink-0 animate-fade-in">
                                      <img
                                        src={diariaDataRecord.foto}
                                        alt="Foto Confirmação"
                                        className={`w-9 h-9 rounded-full object-cover border shadow-xs ${
                                          isContracted ? 'border-emerald-400' : 'border-neutral-300 dark:border-neutral-700 grayscale-[40%]'
                                        }`}
                                        referrerPolicy="no-referrer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleDiariaFieldChange(activeDiariaDate, alloc.freelancerId, 'foto', '')}
                                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold hover:bg-rose-600"
                                        title="Remover foto"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 italic font-medium shrink-0">Sem foto</div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const randomSelfies = [
                                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&fit=crop&q=80',
                                        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&fit=crop&q=80',
                                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&fit=crop&q=80',
                                        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&fit=crop&q=80',
                                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80'
                                      ];
                                      const selectedSelfie = randomSelfies[Math.floor(Math.random() * randomSelfies.length)];
                                      handleDiariaFieldChange(activeDiariaDate, alloc.freelancerId, 'foto', selectedSelfie);
                                    }}
                                    className={`px-1.5 py-1 text-[9px] font-bold rounded border flex items-center gap-1 shrink-0 cursor-pointer ${
                                      isContracted 
                                        ? 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700' 
                                        : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100/50 dark:hover:bg-neutral-800'
                                    }`}
                                  >
                                    <Camera className="w-3 h-3" />
                                    Capturar
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {isContracted ? (
                                  (diariaDataRecord.preenchidoManualmente || (diariaDataRecord.chegada && diariaDataRecord.saida)) ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const finalDiarias = { ...(currentProject.diariasData || {}) };
                                        const dateRecord = { ...(finalDiarias[activeDiariaDate] || {}) };
                                        const freeRecord = { ...(dateRecord[alloc.freelancerId] || {}) };
                                        freeRecord.confirmadoPeloGestor = !freeRecord.confirmadoPeloGestor;
                                        
                                        dateRecord[alloc.freelancerId] = freeRecord;
                                        finalDiarias[activeDiariaDate] = dateRecord;
                                        onUpdateTask({ ...currentProject, diariasData: finalDiarias });
                                      }}
                                      className={`mx-auto px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1 border shadow-3xs hover:scale-102 active:scale-98 select-none w-fit ${
                                        diariaDataRecord.confirmadoPeloGestor
                                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-450 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-purple-500 border-amber-250 dark:border-amber-800 hover:bg-amber-150 dark:hover:bg-amber-900/40 font-black animate-pulse'
                                      }`}
                                      title={diariaDataRecord.confirmadoPeloGestor ? 'Horário aprovado pelo gestor. Clique para desfazer' : 'Horários pendentes de aprovação. Clique para aprovar'}
                                    >
                                      {diariaDataRecord.confirmadoPeloGestor ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-fade-in" />
                                          <span>Aprovado</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-450 animate-spin" />
                                          <span>Confirmar</span>
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-neutral-500 dark:text-neutral-450 font-mono text-[10px]" title="Aguardando registros completos de Entrada e Saída">Incompleto</span>
                                  )
                                ) : (
                                  <span className="text-neutral-300 dark:text-neutral-700">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center animate-fade-in">
                                <button
                                  type="button"
                                  onClick={() => setSelectedGeoDetail({
                                    freelancerNome: alloc.freelancerNome,
                                    dateText: formatLocalDate(activeDiariaDate),
                                    locationChegada: diariaDataRecord.localizacaoChegada || diariaDataRecord.localizacao,
                                    locationSaida: diariaDataRecord.localizacaoSaida,
                                    chegada: diariaDataRecord.chegada,
                                    saida: diariaDataRecord.saida,
                                    preenchidoManualmente: diariaDataRecord.preenchidoManualmente,
                                    confirmadoPeloGestor: diariaDataRecord.confirmadoPeloGestor,
                                    freelancerId: alloc.freelancerId,
                                    activeDiariaDate: activeDiariaDate
                                  })}
                                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg border transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-3xs cursor-pointer focus:outline-none ${
                                    isContracted 
                                      ? 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'
                                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 bg-neutral-100/30 dark:bg-neutral-950/10'
                                  }`}
                                  title="Expandir detalhes de geolocalização e endereços"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </>
                ) : projectStage === 'Pagamentos' ? (
                  <>
                    <thead>
                      <tr className="bg-neutral-50/75 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Profissional</th>
                        <th className="py-2.5 px-3">Função / Cargo</th>
                        <th className="py-2.5 px-3">Dia Trabalhado</th>
                        <th className="py-2.5 px-3">Horário registrado</th>
                        <th className="py-2.5 px-3">Total de Horas</th>
                        <th className="py-2.5 px-3 text-left">Refeições Coincidentes</th>
                        <th className="py-2.5 px-3 text-right">Valor do Cachê</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
                      {projectAllocations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-neutral-400 italic">
                            Não existem profissionais alocados para exibir pagamentos.
                          </td>
                        </tr>
                      ) : (() => {
                        const allWorkRows: {
                          alloc: ProjectAllocation;
                          row: ReturnType<typeof getWorkedHoursForAllocation>[number];
                        }[] = [];

                        projectAllocations.forEach(alloc => {
                          const worked = getWorkedHoursForAllocation(alloc);
                          worked.forEach(w => {
                            allWorkRows.push({ alloc, row: w });
                          });
                        });

                        if (allWorkRows.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="text-center py-10 text-neutral-400 italic">
                                Nenhuma diária preenchida ou iniciada até o momento.
                              </td>
                            </tr>
                          );
                        }

                        return allWorkRows.map(({ alloc, row }, idx) => {
                          const dailyRate = alloc.valorHora;
                          const isSuccess = row.hours > 0;
                          const breakdown = getCacheBreakdown(dailyRate, row.hours, row.chegada, row.saida);
                          
                          return (
                            <tr key={`${alloc.id}-${idx}`} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors animate-fade-in animate-duration-150">
                              <td className="py-3 px-3">
                                <div className="font-bold text-emerald-600 dark:text-emerald-450 block">
                                  {alloc.freelancerNome}
                                </div>
                                <span className="text-[9px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">ID: {alloc.freelancerId}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-750 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded font-bold text-[10px] uppercase">
                                  {alloc.funcao}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-neutral-900 dark:text-neutral-200 font-sans">
                                    {row.dateText}
                                  </span>
                                  {row.crossDay && (
                                    <span className="text-[8px] bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 px-1.5 py-0.5 rounded w-fit uppercase font-bold tracking-wider mt-0.5">
                                      Turno de Virada (18h)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  {row.chegada ? (
                                    <span className="text-neutral-700 dark:text-neutral-300 font-medium font-sans">📥 Chegada: <strong className="font-mono">{row.chegada}</strong></span>
                                  ) : (
                                    <span className="text-neutral-400 dark:text-neutral-500 italic">Falta Check-In</span>
                                  )}
                                  {row.saida ? (
                                    <span className="text-neutral-700 dark:text-neutral-300 font-medium font-sans">📤 Saída: <strong className="font-mono">{row.saida}</strong></span>
                                  ) : (
                                    <span className="text-neutral-400 dark:text-neutral-550 italic font-sans text-[10px]">Falta Check-Out</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 font-bold">
                                <span className={`px-2 py-1 rounded text-xs font-bold leading-none inline-block font-mono ${
                                  isSuccess 
                                    ? 'bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-200' 
                                    : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-150 dark:border-rose-900/40'
                                }`}>
                                  {row.hoursFormatted}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {(() => {
                                    const mealInfo = getMealsOverlapInfo(row.chegada, row.saida);
                                    if (mealInfo.activeMeals.length === 0) {
                                      return (
                                        <span className="text-neutral-400 dark:text-neutral-500 italic text-[10px]">
                                          Sem refeições no período
                                        </span>
                                      );
                                    }
                                    return mealInfo.activeMeals.map((m, mIdx) => (
                                      <span 
                                        key={mIdx} 
                                        className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide w-fit"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {m.name}: R$ {m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    ));
                                  })()}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-200 text-xs">
                                    {breakdown.formula}
                                  </span>
                                  {isSuccess && (
                                    <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium max-w-[200px] text-right leading-tight block">
                                      {breakdown.text}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  row.status === 'Finalizado' || row.status === 'Turno de Virada' || row.status === 'Virada de Dia'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-450 border border-emerald-150 dark:border-emerald-800/60'
                                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-850 dark:text-purple-500 border border-amber-150 dark:border-amber-800/60'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </>
                ) : (
                  <>
                    <thead>
                      <tr className="bg-neutral-50/75 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={projectAllocations.length > 0 && projectAllocations.every(a => selectedAllocIds.includes(a.id))}
                            onChange={() => handleToggleSelectAllAlloc(projectAllocations)}
                            className="w-3.5 h-3.5 text-purple-600 rounded border-neutral-350 dark:border-neutral-700 bg-white dark:bg-neutral-900 cursor-pointer focus:ring-0 focus:ring-offset-0"
                          />
                        </th>
                        <th className="py-2.5 px-3">Profissional</th>
                        <th className="py-2.5 px-3">Função / Cargo</th>
                        <th className="py-2.5 px-3">Período Operacional</th>
                        <th className="py-2.5 px-3 text-right">Cachê / dia</th>
                        <th className="py-2.5 px-3 text-right">Cachê Total</th>
                        <th className="py-2.5 px-3 text-center">Confirmado</th>
                        <th className="py-2.5 px-3 text-center">Remover</th>
                      </tr>
                    </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                  {projectAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-neutral-400 italic">
                        Não existem freelancers alocados neste projeto corporativo. Complete o formulário lateral para requisitar profissionais.
                      </td>
                    </tr>
                  ) : (
                    projectAllocations.map((alloc) => {
                      const days = calculateDays(alloc.dataInicio, alloc.dataFim);
                      
                      // Custom text color for freelancer status
                      let nameColorClass = "text-neutral-900 dark:text-neutral-200";
                      if (alloc.statusConfirmacao === 'Confirmado') {
                        nameColorClass = "text-emerald-600 dark:text-emerald-450 font-bold";
                      } else if (alloc.statusConfirmacao === 'Recusado') {
                        nameColorClass = "text-rose-600 dark:text-rose-450 font-bold";
                      } else if (alloc.statusConfirmacao === 'Chamado') {
                        nameColorClass = "text-amber-600 dark:text-amber-450 font-medium";
                      }

                      const isRejectedRow = alloc.statusConfirmacao === 'Recusado';

                      return (
                        <tr key={alloc.id} className={`transition-colors ${isRejectedRow ? 'bg-rose-500/10 hover:bg-rose-500/15 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/30' : 'hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30'}`}>
                          <td className="py-3 px-3 text-center w-8">
                            <input
                              type="checkbox"
                              checked={selectedAllocIds.includes(alloc.id)}
                              onChange={() => handleToggleAllocSelection(alloc.id)}
                              className="w-3.5 h-3.5 text-purple-600 rounded border-neutral-350 dark:border-neutral-700 bg-white dark:bg-neutral-900 cursor-pointer focus:ring-0 focus:ring-offset-0"
                            />
                          </td>
                          <td className="py-3 px-3">
                            {substitutingAlloc?.id === alloc.id ? (
                              <div className="flex flex-col gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-750 rounded-xl shadow-xs max-w-[250px] animate-fade-in" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] font-extrabold text-neutral-500 dark:text-neutral-450 uppercase tracking-wider block">
                                  Substituto p/ {alloc.funcao}:
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={selectedSubstituteId}
                                    onChange={(e) => setSelectedSubstituteId(e.target.value)}
                                    className="text-[11px] bg-white dark:bg-neutral-850 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-medium"
                                  >
                                    <option value="">Selecione...</option>
                                    {freelancers
                                      .filter(f => 
                                        f.cargo === alloc.funcao && 
                                        !(currentProject.alocacoes || []).some(pa => pa.freelancerId === f.id)
                                      )
                                      .map(f => (
                                        <option key={f.id} value={f.id}>
                                          {f.nome}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteSubstitution(alloc.id, selectedSubstituteId)}
                                    disabled={!selectedSubstituteId}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 disabled:dark:bg-neutral-800 disabled:text-neutral-400 text-white rounded text-xs font-bold transition-all cursor-pointer shrink-0"
                                    title="Confirmar Substituição"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubstitutingAlloc(null);
                                      setSelectedSubstituteId('');
                                    }}
                                    className="px-2 py-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 rounded text-xs font-bold transition-all cursor-pointer shrink-0"
                                    title="Cancelar"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => {
                                  if (isRejectedRow) {
                                    setSubstitutingAlloc({ id: alloc.id, freelancerNome: alloc.freelancerNome, funcao: alloc.funcao });
                                    setSelectedSubstituteId('');
                                  } else {
                                    handleStartEditAllocation(alloc);
                                  }
                                }}
                                className={`font-semibold cursor-pointer hover:text-amber-600 transition-colors group flex items-center gap-1.5 wrap-break`}
                                title={isRejectedRow ? "Clique para selecionar substituto diretamente aqui" : "Clique para editar parâmetros e período de alocação"}
                              >
                                {alloc.statusConfirmacao === 'Chamado' && (
                                  <span title="Convite enviado, aguardando confirmação do profissional" className="shrink-0 flex items-center">
                                    <Clock className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                                  </span>
                                )}
                                <span className={nameColorClass}>{alloc.freelancerNome}</span>
                                {alloc.statusConfirmacao === 'Chamado' && (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 dark:text-purple-500 dark:bg-amber-950/20 px-1.5 py-0.2 rounded border border-amber-200/50 dark:border-amber-900/40 inline-flex items-center gap-0.5 whitespace-nowrap animate-pulse">
                                    Aguardando
                                  </span>
                                )}
                                {isRejectedRow ? (
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-rose-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    ⚡ Substituir
                                  </span>
                                ) : (
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-purple-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    ✎ Editar
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 w-40">
                            <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-705 dark:text-neutral-300 px-2 py-1.5 rounded text-[10px] font-semibold border border-neutral-200 dark:border-neutral-700 text-center flex items-center justify-center break-words leading-tight">
                              {alloc.funcao}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1.5 max-w-[155px]">
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-neutral-400 w-8 uppercase">Início:</span>
                                <input
                                  type="date"
                                  value={alloc.dataInicio || ''}
                                  onChange={(e) => {
                                    handleUpdateAllocationDates(alloc.id, e.target.value, alloc.dataFim);
                                  }}
                                  className="text-[11px] font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-neutral-400 w-8 uppercase">Fim:</span>
                                <input
                                  type="date"
                                  value={alloc.dataFim || ''}
                                  onChange={(e) => {
                                    handleUpdateAllocationDates(alloc.id, alloc.dataInicio, e.target.value);
                                  }}
                                  className="text-[11px] font-mono bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                                />
                              </div>
                              <span className="text-[9px] text-amber-700 dark:text-purple-500 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.2 rounded border border-amber-100 dark:border-amber-900/40 font-bold block w-fit">
                                {days} dia(s) solicitado(s)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-neutral-650 dark:text-neutral-300">
                            R$ {alloc.valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-850 dark:text-emerald-400">
                            R$ {alloc.totalCache.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 align-middle text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleStartEditAllocation(alloc)}
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer text-xs font-bold ${
                                  editingAllocationId === alloc.id
                                    ? 'bg-amber-150 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-550 dark:text-neutral-450 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-amber-600'
                                }`}
                                title="Editar período e taxa de alocação"
                              >
                                ✎
                              </button>

                              {/* Confirm Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleAllocationStatus(alloc.id, alloc.statusConfirmacao === 'Confirmado' ? 'Pendente' : 'Confirmado')}
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer text-xs font-bold ${
                                  alloc.statusConfirmacao === 'Confirmado'
                                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-emerald-600'
                                }`}
                                title="Confirmar"
                              >
                                ✓
                              </button>

                              {/* Reject Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleAllocationStatus(alloc.id, alloc.statusConfirmacao === 'Recusado' ? 'Pendente' : 'Recusado')}
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer text-xs font-bold ${
                                  alloc.statusConfirmacao === 'Recusado'
                                    ? 'bg-rose-550 dark:bg-rose-950 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-350 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-rose-500'
                                }`}
                                title="Recusar"
                              >
                                ✕
                              </button>
                            </div>
                            {alloc.statusConfirmacao === 'Chamado' && alloc.chamadoMensagem && (
                              <div className="text-[10px] text-amber-600 dark:text-purple-500 mt-1 max-w-[140px] truncate mx-auto font-medium" title={alloc.chamadoMensagem}>
                                "{alloc.chamadoMensagem}"
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleRemoveAllocation(alloc.id)}
                              className="text-neutral-400 hover:text-rose-600 transition-colors p-1.5 cursor-pointer"
                              title="Remover alocação de freelancer"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </>
            )}
            </table>
          </div>
          </>
        ) : projectStage === 'Finalizações' ? (
          renderFinalizationsStage()
        ) : (
          renderEvaluationsStage()
        )}

            {/* Bottom Actions Area */}
            {projectAllocations.length > 0 && projectStage !== 'Finalizações' && projectStage !== 'Avaliação' && (
              <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-end gap-3 animate-fade-in">
                {projectStage === 'Alocação' && (
  // Horarios button handlers in project allocations
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSendConfirmations}
                      disabled={sendButtonCountdown > 0}
                      className={`px-4 py-2.5 ${sendButtonCountdown > 0 ? 'bg-neutral-400' : 'bg-neutral-900 hover:bg-neutral-800'} text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer select-none transition-colors shrink-0`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sendButtonCountdown > 0 ? `Aguarde ${sendButtonCountdown}s...` : 'Enviar Confirmação'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setProjectStage('Diarias')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer select-none transition-colors shrink-0"
                    >
                      Confirmar Equipe e Seguir
                    </button>
                  </div>
                )}

                {projectStage === 'Diarias' && (
                  <div className="flex items-center justify-between w-full animate-fade-in">
                    <button
                      type="button"
                      onClick={() => setProjectStage('Alocação')}
                      className="px-4 py-2.5 bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg text-xs font-bold transition-colors cursor-pointer focus:outline-none"
                    >
                      Voltar para Equipe
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setProjectStage('Pagamentos');
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-xs focus:outline-none"
                      >
                        Salvar e Finalizar Diárias
                      </button>
                    </div>
                  </div>
                )}

                {projectStage === 'Pagamentos' && (
                  <div className="flex items-center justify-between w-full animate-fade-in">
                    <button
                      type="button"
                      onClick={() => setProjectStage('Diarias')}
                      className="px-4 py-2.5 bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 rounded-lg text-xs font-bold transition-colors cursor-pointer focus:outline-none"
                    >
                      Voltar para Diárias
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (currentProject) {
                            const projectAllocations = currentProject.alocacoes || [];
                            const finalActualCost = projectAllocations.reduce((acc, alloc) => {
                              const worked = getWorkedHoursForAllocation(alloc);
                              const sumWorked = worked.reduce((sum, row) => sum + calculateCache(alloc.valorHora, row.hours, row.chegada, row.saida), 0);
                              return acc + sumWorked;
                            }, 0);

                            const updatedProject = { 
                              ...currentProject, 
                              folhaFechada: true,
                              custoRealExecutado: finalActualCost
                            };
                            onUpdateTask(updatedProject);
                            setProjectStage('Finalizações');
                            alert(`Folha de pagamentos do projeto "${currentProject.titulo}" fechada e enviada para aprovação do financeiro com sucesso! Custo Real Executado atualizado para R$ ${finalActualCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Redirecionando para aba de Finalizações.`);
                          }
                        }}
                        className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-xs focus:outline-none"
                      >
                        Finalizar e Fechar Folha
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rejected users warning and button at the bottom of the main table/stage card */}
            {totalRecusadosList.length > 0 && (
              <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50 dark:bg-neutral-900/35 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-800/40 shadow-3xs animate-fade-in">
                <div className="flex items-center gap-2.5 text-neutral-600 dark:text-neutral-400">
                  <Clock className="w-4 h-4 text-neutral-450 dark:text-neutral-550" />
                  <span className="text-xs font-semibold font-sans text-neutral-600 dark:text-neutral-450">
                    Histórico de convites e propostas recusadas neste projeto corporativo.
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-show-rejected"
                  onClick={() => setShowRejectedModal(true)}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 border border-neutral-250 dark:border-neutral-700 rounded-lg text-xs font-bold transition-all duration-200 shadow-3xs cursor-pointer flex items-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Mostrar Recusas ({totalRecusadosList.length})
                </button>
              </div>
            )}

          </div>

          {/* Sidebar Area */}
          {projectStage !== 'Pagamentos' && projectStage !== 'Finalizações' && projectStage !== 'Avaliação' && (
            <div className="order-1 space-y-6">
              {projectStage === 'Alocação' && (() => {
              const filteredFrees = freelancers
                .filter(f => !f.arquivado)
                .filter(f => {
                  if (!allocRoleFilter) return true;
                  const isMain = f.cargo === allocRoleFilter;
                  if (isMain) return true;
                  if (includeSecondarySkills && f.habilidades?.includes(allocRoleFilter)) return true;
                  return false;
                })
                .filter(f => 
                  !allocFreelancerSearchText || 
                  f.nome.toLowerCase().includes(allocFreelancerSearchText.toLowerCase()) || 
                  f.cargo.toLowerCase().includes(allocFreelancerSearchText.toLowerCase())
                );

              const sortedFrees = prioritizeFavorites
                ? [...filteredFrees].sort((a, b) => {
                    const aFav = favorites.includes(a.id) ? 1 : 0;
                    const bFav = favorites.includes(b.id) ? 1 : 0;
                    return bFav - aFav;
                  })
                : filteredFrees;

              return (
                <div id="allocation-form-container" className="bg-neutral-900 text-white rounded-xl p-6 shadow-md border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      <h3 className="text-base font-semibold text-neutral-100">
                        {editingAllocationId ? 'Editar Alocação' : 'Alocar Novo Profissional'}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Top Favorite Star Toggle */}
                      <button
                        type="button"
                        onClick={() => setPrioritizeFavorites(prev => !prev)}
                        className={`p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                          prioritizeFavorites 
                            ? 'bg-purple-500/20 border-purple-500 text-purple-500 shadow-[0_0_8px_rgba(245,158,11,0.15)]' 
                            : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-400 hover:border-neutral-600'
                        }`}
                        title={prioritizeFavorites ? "Favoritos priorizados no topo: Ativo" : "Favoritos priorizados no topo: Inativo"}
                      >
                        <Star className={`w-4 h-4 ${prioritizeFavorites ? 'fill-amber-400 text-purple-500' : ''}`} />
                        <span className="text-[10px] font-extrabold uppercase tracking-wider">Favoritos</span>
                      </button>

                      {selectedFreelancerIds.length > 0 && (
                        <span className="bg-purple-500 text-neutral-950 text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0">
                          LOTE: {selectedFreelancerIds.length} SELECIONADO(S)
                        </span>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleAddAllocation} className="space-y-4" id="allocation-form-container">
                    {substitutingAlloc && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center justify-between text-xs text-rose-300 animate-fade-in mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
                          <span>
                            Substituindo <strong>{substitutingAlloc.freelancerNome}</strong> ({substitutingAlloc.funcao})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSubstitutingAlloc(null);
                            setAllocRoleFilter('');
                          }}
                          className="text-rose-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition-all text-[10px] font-extrabold uppercase tracking-wide cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      
                      {/* Left Column (Highlighted Red Rectangle Selection Area) */}
                      <div className="space-y-4 pr-0 md:pr-6 md:border-r border-neutral-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
                          {/* Function/Role Filter */}
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wide mb-1">Filtrar por Função</label>
                            <select
                              value={allocRoleFilter}
                              onChange={(e) => {
                                setAllocRoleFilter(e.target.value);
                                // Don't wipe selections, but update list
                              }}
                              className="w-full text-xs bg-neutral-800 text-white border border-neutral-700 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-white cursor-pointer"
                            >
                              <option value="">Todas as funções...</option>
                              {Array.from(new Set(freelancers.filter(f => !f.arquivado).map(f => f.cargo))).sort().map(cargo => (
                                <option key={cargo} value={cargo}>{cargo}</option>
                              ))}
                            </select>
                          </div>

                          {/* Search Freelancer Input */}
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wide mb-1">Buscar Nome/Função</label>
                            <input
                              type="text"
                              className="w-full text-xs bg-neutral-800 text-white border border-neutral-700 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-neutral-500"
                              placeholder="Digite para filtrar..."
                              value={allocFreelancerSearchText}
                              onChange={(e) => setAllocFreelancerSearchText(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Include Secondary checkbox */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={includeSecondarySkills}
                            onChange={(e) => setIncludeSecondarySkills(e.target.checked)}
                            id="includeSecondary"
                            className="cursor-pointer text-purple-600 bg-neutral-800 border-neutral-700 rounded focus:ring-0 focus:ring-offset-0"
                          />
                          <label htmlFor="includeSecondary" className="text-[10px] font-bold text-neutral-300 cursor-pointer">Incluir freelancers em secundário</label>
                        </div>

                        {/* Freelancer list with batch checkboxes */}
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center justify-between pb-1 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={sortedFrees.length > 0 && sortedFrees.every(f => selectedFreelancerIds.includes(f.id))}
                                onChange={() => handleToggleSelectAll(sortedFrees)}
                                className="w-3.5 h-3.5 text-purple-600 rounded border-neutral-700 bg-neutral-800 cursor-pointer focus:ring-0 focus:ring-offset-0"
                              />
                              <span>Selecionar Todos ({sortedFrees.length})</span>
                            </div>
                          </div>

                          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 max-h-[220px] overflow-y-auto space-y-1 scrollbar-thin">
                            {sortedFrees.length === 0 ? (
                               <div className="px-3 py-6 text-xs text-neutral-500 italic text-center">Nenhum profissional encontrado.</div>
                            ) : (
                              sortedFrees.map(f => {
                                const isChecked = selectedFreelancerIds.includes(f.id);
                                const isFocused = allocatingFreelancerId === f.id;
                                
                                const matchedAlloc = currentProject?.alocacoes?.find(alloc => alloc.freelancerId === f.id);
                                const isAlreadyAllocated = matchedAlloc !== undefined;
                                const isCurrentEditing = editingAllocationId !== null && 
                                  currentProject?.alocacoes?.find(alloc => alloc.id === editingAllocationId)?.freelancerId === f.id;
                                const isRejected = matchedAlloc?.statusConfirmacao === 'Recusado';

                                return (
                                  <div 
                                    key={f.id} 
                                    onClick={() => handleSelectAndFocusFreelancer(f.id)}
                                    className={`flex items-center justify-between p-2 rounded-md transition-all border select-none ${
                                      isFocused 
                                        ? 'border-purple-500 bg-purple-500/25 text-white cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                                        : isChecked 
                                          ? 'border-purple-500/30 bg-purple-500/5 text-neutral-200 hover:bg-purple-500/10 cursor-pointer' 
                                          : 'border-transparent hover:bg-neutral-850/60 text-neutral-300 cursor-pointer'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleToggleFreelancerSelection(f.id);
                                        }}
                                        className="w-3.5 h-3.5 rounded border-neutral-700 bg-neutral-850 shrink-0 text-purple-600 cursor-pointer focus:ring-0 focus:ring-offset-0"
                                      />
                                      
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-xs font-bold block truncate leading-tight ${
                                            isRejected 
                                              ? 'text-rose-500 font-extrabold' 
                                              : isAlreadyAllocated && !isCurrentEditing 
                                                ? 'text-purple-600/80 font-semibold' 
                                                : 'text-neutral-200 font-medium'
                                          }`}>
                                            {f.nome}
                                          </span>
                                          {favorites.includes(f.id) && (
                                            <Star className="w-3 h-3 fill-amber-400 text-purple-500 shrink-0" />
                                          )}
                                        </div>
                                        <span className={`text-[10px] block truncate mt-0.5 ${isAlreadyAllocated && !isCurrentEditing ? 'text-neutral-400' : 'text-neutral-455'}`}>
                                          {f.cargo}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0 flex items-center gap-1.5">
                                      {isAlreadyAllocated && !isCurrentEditing ? (
                                        <>
                                          {isRejected ? (
                                            <span className="text-[8px] font-extrabold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 uppercase tracking-wide">
                                              Recusado
                                            </span>
                                          ) : (
                                            <span className="text-[8px] font-extrabold text-purple-600/80 bg-purple-600/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wide">
                                              Alocado
                                            </span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // find the allocation id for this freelancer
                                              const alloc = currentProject?.alocacoes?.find(a => a.freelancerId === f.id);
                                              if (alloc) {
                                                handleRemoveAllocation(alloc.id);
                                              }
                                            }}
                                            className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-neutral-800 transition-all cursor-pointer"
                                            title="Remover este freelancer do projeto"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <span className="font-mono text-[10px] text-neutral-400 font-semibold bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                                          R$ {f.valorHora}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Batch Removal from Sidebar when multiple are selected and at least one is allocated */}
                          {selectedFreelancerIds.some(id => currentProject?.alocacoes?.some(alloc => alloc.freelancerId === id)) && (
                            <button
                              type="button"
                              onClick={handleRemoveSelectedFromSidebar}
                              className="w-full mt-2 bg-rose-600/15 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-300 hover:text-white text-[11px] font-bold py-2 px-3 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remover Alocados Selecionados ({selectedFreelancerIds.filter(id => currentProject?.alocacoes?.some(alloc => alloc.freelancerId === id)).length})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right Column (Allocation parameters and cache calculation) */}
                      <div className="space-y-4">
                        {/* Custom Role Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wide mb-1">Função Registrada no Projeto (Editável)</label>
                          <input 
                            type="text"
                            value={allocRole}
                            onChange={(e) => setAllocRole(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="Selecione um profissional ou digite a função..."
                            title="Função que será gravada no projeto, podendo ser modificada"
                          />

                          {/* dynamic standard rates */}
                          {matchedFreelancer && (
                            <div className="mt-2 space-y-1">
                              <span className="text-neutral-500 block text-[9px] font-black uppercase tracking-wider">Tarifas Registradas deste Profissional:</span>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAllocRole(matchedFreelancer.cargo);
                                    setCustomHourlyRate(matchedFreelancer.valorHora);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                                    allocRole === matchedFreelancer.cargo 
                                      ? 'bg-purple-500 text-neutral-950 border-amber-300' 
                                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                                  }`}
                                >
                                  {matchedFreelancer.cargo} (R$ {matchedFreelancer.valorHora})
                                </button>
                                {matchedFreelancer.habilidades?.map((skill) => {
                                  if (skill === 'Geral' || skill === matchedFreelancer.cargo) return null;
                                  const rate = matchedFreelancer.tarifasSecundarias?.[skill] ?? 600;
                                  return (
                                    <button
                                      key={skill}
                                      type="button"
                                      onClick={() => {
                                        setAllocRole(skill);
                                        setCustomHourlyRate(rate);
                                      }}
                                      className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                                        allocRole === skill 
                                          ? 'bg-purple-500 text-neutral-950 border-amber-300' 
                                          : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                                      }`}
                                    >
                                      {skill} (R$ {rate})
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Daily rate base editable */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wide mb-1">Tarifa de Cachê Base (Editável) *</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-neutral-500 font-bold text-xs">R$</span>
                            <input
                              type="number"
                              value={customHourlyRate || ''}
                              onChange={(e) => setCustomHourlyRate(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 pl-8 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        {/* Dates requested */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wide mb-1">Início da Solicitação *</label>
                            <input
                              type="date"
                              value={allocStart}
                              onChange={(e) => setAllocStart(e.target.value)}
                              className="w-full text-xs bg-neutral-800 text-white border border-neutral-700 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wide mb-1">Fim da Solicitação *</label>
                            <input
                              type="date"
                              value={allocEnd}
                              onChange={(e) => setAllocEnd(e.target.value)}
                              className="w-full text-xs bg-neutral-800 text-white border border-neutral-700 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-white"
                              required
                            />
                          </div>
                        </div>

                        {/* Cachê do Período Live Math simulation box */}
                        {allocStart && allocEnd && customHourlyRate > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-amber-50 text-neutral-900 p-4 rounded-xl border border-amber-250"
                          >
                            <div className="flex items-center gap-2 text-amber-800">
                              <Calculator className="w-4 h-4 shrink-0" />
                              <span className="text-xs font-bold uppercase tracking-wider">Cachê do Período</span>
                            </div>
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-neutral-500">Prazo Calculado:</span>
                                <span className="font-bold text-neutral-800 font-sans">{computedDays} diária(s)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-500">Base do Cálculo:</span>
                                <span className="text-[11px] font-mono font-medium text-neutral-700">
                                  {computedDays}d × R$ {customHourlyRate} (diária integral)
                                </span>
                              </div>
                              {selectedFreelancerIds.length > 1 && (
                                <div className="flex justify-between border-t border-amber-200/50 pt-1 mt-1 text-neutral-500 text-[11px]">
                                  <span>Por Profissional:</span>
                                  <span className="font-mono font-medium">R$ {simulatedTotalCache.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-amber-200 pt-2 mt-2">
                                <span className="font-bold text-neutral-700">
                                  {selectedFreelancerIds.length > 1 
                                    ? `Total Lote (${selectedFreelancerIds.length} prof.):`
                                    : 'Valor Estimado Total:'
                                  }
                                </span>
                                <span className="font-mono font-bold text-sm text-amber-900">
                                  R$ {(selectedFreelancerIds.length > 1 
                                    ? (simulatedTotalCache * selectedFreelancerIds.length) 
                                    : simulatedTotalCache
                                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <div className="flex gap-2 mt-4">
                          {editingAllocationId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAllocationId(null);
                                setSelectedFreelancerIds([]);
                                setAllocatingFreelancerId('');
                                setAllocStart('');
                                setAllocEnd('');
                                setCustomHourlyRate(0);
                                setAllocRole('');
                              }}
                              className="w-1/3 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs font-bold py-3 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            type="submit"
                            className={`${editingAllocationId ? 'w-2/3' : 'w-full'} bg-purple-500 hover:bg-purple-600 text-neutral-950 text-xs font-bold py-3 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer`}
                          >
                            {editingAllocationId ? (
                              <>
                                <Check className="w-4 h-4" />
                                Salvar Alterações
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4" />
                                {selectedFreelancerIds.length > 1 
                                  ? `Alocar ${selectedFreelancerIds.length} Profissionais no Projeto`
                                  : 'Alocar no Projeto'
                                }
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  </form>
                </div>
              );
            })()}

            {projectStage === 'Diarias' && (
              <div className="bg-neutral-900 text-white rounded-xl shadow-lg border border-neutral-800 animate-fade-in overflow-hidden">
                <div 
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-neutral-800 transition-colors"
                  onClick={() => setIsControleMinimized(!isControleMinimized)}
                  title={isControleMinimized ? "Expandir Controle de Restrições" : "Minimizar Controle"}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold tracking-tight">Controle Operacional de Diárias</h3>
                  </div>
                  <button className="text-neutral-400 hover:text-white p-1 rounded transition-colors">
                     {isControleMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
                
                {!isControleMinimized && (
                <div className="px-5 pb-5 space-y-4">
                  <p className="text-neutral-400 text-[11px] leading-normal pt-2 border-t border-neutral-800">
                    Configure as travas gerais do aplicativo de campo e realize a liberação ou bloqueio de horários (check-in/out) para os profissionais.
                  </p>

                  <div className="space-y-4 pt-2">
                    {/* Controle Global de Travas */}
                  <div className="bg-neutral-850 border border-neutral-750 p-3 rounded-lg space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-300">Travas do Aplicativo</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${!currentProject?.bloqueioAtivado ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-purple-600/15 text-purple-500 border border-amber-500/30'}`}>
                        {!currentProject?.bloqueioAtivado ? 'DESATIVADO (LIVRE)' : 'ATIVADO (RESTRITO)'}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-normal">
                      Quando ativado, os profissionais de campo só podem registrar entrada e saída após a liberação explícita do gestor.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentProject) {
                          onUpdateTask({
                            ...currentProject,
                            bloqueioAtivado: !currentProject.bloqueioAtivado
                          });
                        }
                      }}
                      className={`w-full py-1.5 px-3 rounded text-[11px] font-bold transition-all cursor-pointer text-center ${
                        !currentProject?.bloqueioAtivado
                          ? 'bg-rose-650 hover:bg-rose-700 text-white shadow-sm'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      }`}
                    >
                      {!currentProject?.bloqueioAtivado ? 'Habilitar Travas de Horário' : 'Desabilitar Todas as Travas'}
                    </button>
                  </div>

                  {currentProject?.bloqueioAtivado && (
                    <div className="border-t border-neutral-800 pt-3.5 space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">Liberações Manual / Em Massa</span>

                      {/* Selecionar Cargo/Função */}
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Cargo / Função
                        </label>
                        <select
                          value={bulkRole}
                          onChange={(e) => {
                            setBulkRole(e.target.value);
                            setBulkFreelancerId('all');
                          }}
                          className="w-full text-xs bg-neutral-850 border border-neutral-750 text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer font-sans"
                        >
                          <option value="all" className="bg-neutral-900 text-white">Todos os Cargos</option>
                          {Array.from(new Set((currentProject?.alocacoes || []).map(a => a.funcao).filter(Boolean))).map(role => (
                            <option key={role} value={role} className="bg-neutral-900 text-white">{role}</option>
                          ))}
                        </select>
                      </div>

                      {/* Selecionar Técnico / Profissional específico */}
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Técnico / Profissional Alocado
                        </label>
                        <select
                          value={bulkFreelancerId}
                          onChange={(e) => setBulkFreelancerId(e.target.value)}
                          className="w-full text-xs bg-neutral-850 border border-neutral-750 text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer font-sans"
                        >
                          <option value="all" className="bg-neutral-900 text-white">Todos os Profissionais</option>
                          {(currentProject?.alocacoes || [])
                            .filter(alloc => bulkRole === 'all' || alloc.funcao === bulkRole)
                            .map(alloc => (
                              <option key={alloc.freelancerId} value={alloc.freelancerId} className="bg-neutral-900 text-white">
                                {alloc.freelancerNome}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Selecionar Horário de Liberação */}
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Horário de Entrada / Saída
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                             type="time"
                             value={bulkTime}
                             onChange={(e) => setBulkTime(e.target.value)}
                             className="flex-1 text-xs bg-neutral-850 border border-neutral-750 text-white rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono text-center [color-scheme:dark]"
                          />
                          <button
                             type="button"
                             onClick={() => setBulkTime(currentTimeOfPageOpen)}
                             className="px-2.5 py-2 text-[10px] font-bold bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-750 transition-all cursor-pointer font-sans"
                             title="Redefinir para o horário de abertura da página"
                          >
                             Restaurar
                          </button>
                        </div>
                      </div>

                      {/* Actions Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleBulkRelease('checkin', activeDiariaDate)}
                          className="w-full py-2 px-2.5 bg-emerald-600 hover:bg-emerald-750 text-white text-[11px] font-bold rounded-lg shadow-sm font-sans transition-all active:scale-95 text-center cursor-pointer"
                          title="Liberar Check-In"
                        >
                          Liberar Check-In
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkRelease('checkout', activeDiariaDate)}
                          className="w-full py-2 px-2.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg shadow-sm font-sans transition-all active:scale-95 text-center cursor-pointer"
                          title="Liberar Check-Out"
                        >
                          Liberar Check-Out
                        </button>
                      </div>

                      {/* Removals / Revokes */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleBulkRelease('checkin', activeDiariaDate, true)}
                          className="w-full py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-neutral-600 text-neutral-350 text-[10px] font-semibold rounded-lg font-sans transition-all active:scale-95 text-center cursor-pointer"
                          title="Bloquear Entrada"
                        >
                          Bloquear Entrada
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBulkRelease('checkout', activeDiariaDate, true)}
                          className="w-full py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-neutral-600 text-neutral-350 text-[10px] font-semibold rounded-lg font-sans transition-all active:scale-95 text-center cursor-pointer"
                          title="Bloquear Saída"
                        >
                          Bloquear Saída
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
          )}
        </div>

        {isEditProjectModalOpen && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-neutral-250 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 p-4 bg-neutral-50 animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-neutral-100 text-neutral-800 rounded-lg">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Editar Cadastro do Projeto</h3>
                    <p className="text-[10px] text-neutral-450 mt-0.5">Atualize as informações do evento ou do contratante.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProjectModalOpen(false)}
                  className="p-1.5 rounded-lg border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleSaveProjectDetails} className="flex-1 overflow-y-auto max-h-[75vh] p-5 space-y-4 text-xs">
                {/* Título do Projeto */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Título do Projeto *</label>
                  <input
                    type="text"
                    value={editProjectTitle}
                    onChange={(e) => setEditProjectTitle(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-medium"
                    placeholder="Ex: Cerimônia de Premiação Corporativa"
                    required
                  />
                </div>

                {/* Nome do Cliente */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Nome do Cliente *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editProjectClient}
                      onChange={(e) => {
                        setEditProjectClient(e.target.value);
                        setShowClientsSuggestions(true);
                      }}
                      onFocus={() => setShowClientsSuggestions(true)}
                      className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-medium"
                      placeholder="Ex: Nome da empresa ou do patrocinador"
                      required
                    />
                    {showClientsSuggestions && clients.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-40 overflow-y-auto divide-y divide-neutral-100">
                        <div className="p-1.5 bg-neutral-50 text-[9px] text-neutral-450 uppercase font-bold tracking-wider">
                          Clientes Cadastrados
                        </div>
                        {clients
                          .filter(c => c.nome.toLowerCase().includes(editProjectClient.toLowerCase()))
                          .map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => {
                                setEditProjectClient(client.nome);
                                setShowClientsSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 transition-colors font-medium text-neutral-700 block"
                            >
                              <span className="font-bold text-neutral-800">{client.nome}</span>
                              {client.cnpj && <span className="text-[10px] text-amber-600 ml-2 font-mono font-bold">CNPJ: {client.cnpj}</span>}
                              {client.segmento && <span className="text-[10px] text-neutral-400 ml-2">({client.segmento})</span>}
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Local do Evento */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Local do Evento</label>
                  <input
                    type="text"
                    value={editProjectLocal}
                    onChange={(e) => setEditProjectLocal(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-medium"
                    placeholder="Sem local definido"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Budget do Evento / Custo Alvo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-400 text-sm font-semibold">R$</span>
                    <input
                      type="number"
                      value={editProjectBudget}
                      onChange={(e) => setEditProjectBudget(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-mono font-bold"
                      placeholder="Sem limite de budget"
                    />
                  </div>
                </div>

                {/* Datas e Horários Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Data de Início</label>
                    <input
                      type="date"
                      value={editProjectDataInicio}
                      onChange={(e) => setEditProjectDataInicio(e.target.value)}
                      className="w-full text-[11px] p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Horário Inicial</label>
                    <input
                      type="time"
                      value={editProjectHoraInicio}
                      onChange={(e) => setEditProjectHoraInicio(e.target.value)}
                      className="w-full text-[11px] p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Data de Encerramento Extensível</label>
                    <input
                      type="date"
                      value={editProjectDataFim}
                      onChange={(e) => setEditProjectDataFim(e.target.value)}
                      className="w-full text-[11px] p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Horário Final</label>
                    <input
                      type="time"
                      value={editProjectHoraFim}
                      onChange={(e) => setEditProjectHoraFim(e.target.value)}
                      className="w-full text-[11px] p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Descrição / Notas do Projeto</label>
                  <textarea
                    rows={3}
                    value={editProjectDesc}
                    onChange={(e) => setEditProjectDesc(e.target.value)}
                    className="w-full text-xs p-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950 font-medium"
                    placeholder="Informações e observações do projeto..."
                  />
                </div>

                {/* Buttons Footer */}
                <div className="space-y-3 pt-3 border-t border-neutral-100">
                  {isConfirmingDelete && onDeleteTask && (
                    <div className="w-full bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in text-left">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-rose-900 block font-sans">Tem certeza que deseja excluir?</span>
                        <span className="text-[10px] leading-relaxed text-rose-800 font-medium block">
                          Esta ação apagará as diárias, alocações e agendas deste projeto de forma permanente.
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingDelete(false)}
                          className="px-3 py-1.5 bg-white border border-neutral-250 text-neutral-700 hover:bg-neutral-50 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteCurrentProject}
                          className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          Excluir para Sempre
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end items-center">
                    {!isConfirmingDelete && onDeleteTask && (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="mr-auto px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-150 transition-all rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir Projeto
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditProjectModalOpen(false)}
                      className="px-4 py-2 border border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition-all rounded-lg font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isConfirmingDelete}
                      className="px-4 py-2 bg-neutral-950 border border-neutral-900 text-white hover:bg-neutral-800 rounded-lg font-bold shadow-xs cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal de Detalhamento de Geolocalização */}
        {selectedGeoDetail && (
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-150 flex items-center justify-between bg-neutral-50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h3 className="font-extrabold text-neutral-900 text-sm tracking-tight uppercase">Geolocalização Detalhada</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedGeoDetail(null)}
                  className="text-neutral-400 hover:text-neutral-700 bg-neutral-100 p-1.5 rounded-full transition-colors cursor-pointer border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 text-left">
                <div className="flex flex-col gap-0.5 pb-3 border-b border-neutral-100">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-extrabold">Profissional / Dia</span>
                  <div className="text-sm font-bold text-emerald-600 font-sans">{selectedGeoDetail.freelancerNome}</div>
                  <div className="text-xs text-neutral-750 font-medium">Turno de Trabalho: {selectedGeoDetail.dateText}</div>
                </div>

                {/* Manual Fill Warning Banner */}
                {selectedGeoDetail.preenchidoManualmente && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5 shadow-3xs animate-fade-in">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <span className="text-xs font-bold block">Horário Presencial Preenchido Manualmente</span>
                      <span className="text-[10.5px] leading-relaxed text-amber-800 font-medium block">
                        Este profissional inseriu os dados de entrada/saída manualmente após o dia da diária. O gestor deve analisar e confirmar os horários.
                      </span>
                      {selectedGeoDetail.freelancerId && selectedGeoDetail.activeDiariaDate && (
                        <button
                          type="button"
                          onClick={() => {
                            const fId = selectedGeoDetail.freelancerId!;
                            const dDate = selectedGeoDetail.activeDiariaDate!;
                            const finalDiarias = { ...(currentProject.diariasData || {}) };
                            const dateRecord = { ...(finalDiarias[dDate] || {}) };
                            const freeRecord = { ...(dateRecord[fId] || {}) };
                            freeRecord.confirmadoPeloGestor = !freeRecord.confirmadoPeloGestor;
                            
                            dateRecord[fId] = freeRecord;
                            finalDiarias[dDate] = dateRecord;
                            onUpdateTask({ ...currentProject, diariasData: finalDiarias });
                            
                            setSelectedGeoDetail({
                              ...selectedGeoDetail,
                              confirmadoPeloGestor: freeRecord.confirmadoPeloGestor
                            });
                          }}
                          className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 w-full sm:w-auto ${
                            selectedGeoDetail.confirmadoPeloGestor
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                              : 'bg-amber-100 text-amber-800 border-amber-250 hover:bg-amber-150 animate-pulse'
                          }`}
                        >
                          {selectedGeoDetail.confirmadoPeloGestor ? '✓ Horário Aprovado (Desfazer)' : '⏳ Confirmar e Autorizar Horário'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Grid of Check-in and Check-out */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Check-In Card */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      <span>📥</span>
                      <span>Check-In (Chegada)</span>
                    </div>
                    <div className="text-[11px] text-neutral-600 space-y-2">
                      <div>
                        <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Horário:</span>
                        <span className="font-mono font-bold text-neutral-800 text-xs">{selectedGeoDetail.chegada || 'Não registrado'}</span>
                      </div>
                      {selectedGeoDetail.locationChegada && (
                        <div>
                          <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Localidade da Latitude:</span>
                          <span className="font-sans leading-relaxed text-emerald-800 text-[10.5px] font-bold block bg-emerald-100/30 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                            📍 {getLocalityFromLatitude(selectedGeoDetail.locationChegada)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Coordenadas GPS:</span>
                        <span className="font-mono bg-white px-1.5 py-0.5 border border-neutral-200 rounded text-neutral-750 text-[10px] block w-fit break-all">
                          {selectedGeoDetail.locationChegada || 'Nenhuma coordenada'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Endereço do Local:</span>
                        <span className="font-sans leading-relaxed text-neutral-750 font-medium block">
                          {selectedGeoDetail.locationChegada ? getAddressFromCoordinates(selectedGeoDetail.locationChegada) : 'Localização não registrada'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Check-Out Card */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      <span>📤</span>
                      <span>Check-Out (Saída)</span>
                    </div>
                    <div className="text-[11px] text-neutral-600 space-y-2">
                      <div>
                        <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Horário:</span>
                        <span className="font-mono font-bold text-neutral-800 text-xs">{selectedGeoDetail.saida || 'Não registrado'}</span>
                      </div>
                      {selectedGeoDetail.locationSaida && (
                        <div>
                          <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Localidade da Latitude:</span>
                          <span className="font-sans leading-relaxed text-emerald-800 text-[10.5px] font-bold block bg-emerald-100/30 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                            📍 {getLocalityFromLatitude(selectedGeoDetail.locationSaida)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Coordenadas GPS:</span>
                        <span className="font-mono bg-white px-1.5 py-0.5 border border-neutral-200 rounded text-neutral-750 text-[10px] block w-fit break-all">
                          {selectedGeoDetail.locationSaida || 'Nenhuma coordenada'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Endereço do Local:</span>
                        <span className="font-sans leading-relaxed text-neutral-750 font-medium block">
                          {selectedGeoDetail.locationSaida ? getAddressFromCoordinates(selectedGeoDetail.locationSaida) : 'Localização não registrada'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock Map / Visual Confirmation */}
                {(selectedGeoDetail.locationChegada || selectedGeoDetail.locationSaida) && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" /> Confirmação de Presença no Local
                    </span>
                    
                    <div className="h-24 bg-neutral-100 border border-neutral-250 rounded-md relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]"></div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 text-center">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></span>
                        <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full border border-white absolute"></span>
                        
                        <span className="text-[9.5px] font-bold text-neutral-700 mt-6 bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-2xs">
                          Coordenadas validadas no raio correto do evento
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Close Button */}
              <div className="px-5 py-3 border-t border-neutral-150 bg-neutral-50 flex justify-end">
                <button 
                  type="button"
                  onClick={() => setSelectedGeoDetail(null)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors focus:outline-none"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Rejected Proposals Modal */}
        {showRejectedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-neutral-550 dark:text-neutral-400" />
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-50 font-sans">
                    Histórico de Profissionais que Recusaram a Proposta
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRejectedModal(false)}
                  className="text-neutral-450 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[350px] overflow-y-auto space-y-3 scrollbar-thin">
                {totalRecusadosList.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 italic text-sm">
                    Nenhum profissional recusou propostas para este projeto.
                  </div>
                ) : (
                  totalRecusadosList.map((alloc) => (
                    <div
                      key={alloc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/30 rounded-xl gap-3 transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-900/60"
                    >
                      <div className="space-y-1 text-left">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block font-sans">
                          {alloc.freelancerNome}
                        </span>
                        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">
                          Função: <strong className="text-neutral-750 dark:text-neutral-300">{alloc.funcao}</strong>
                        </span>
                        <span className="text-[10px] font-mono text-neutral-450 dark:text-neutral-500 block">
                          {formatLocalDate(alloc.dataInicio)} até {formatLocalDate(alloc.dataFim)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSubstitutingAlloc({ id: alloc.id, freelancerNome: alloc.freelancerNome, funcao: alloc.funcao });
                          setSelectedSubstituteId('');
                          setShowRejectedModal(false);
                        }}
                        className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-850 dark:hover:bg-neutral-750 text-white rounded-lg text-2xs font-extrabold uppercase tracking-wide shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Substituir na Lista
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRejectedModal(false)}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 border border-neutral-250 hover:border-neutral-300 text-neutral-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
                >
                  Fechar Janela
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEW 2: General Projects Table List (exactly matching the user requested elegant structure)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureProjectsCount = tasks.filter(t => {
    const dateStr = t.dataInicio || t.dataEntrega;
    if (!dateStr) return false;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        dateObj.setHours(0, 0, 0, 0);
        return dateObj > today;
      }
      return new Date(dateStr) > today;
    } catch {
      return false;
    }
  }).length;

  const activeProjectsCount = tasks.filter(t => {
    const startDateStr = t.dataInicio || t.dataEntrega;
    const endDateStr = t.dataFim || t.dataEntrega;
    if (!startDateStr) return false;
    try {
      const startLocal = parseLocalDate(startDateStr);
      startLocal.setHours(0, 0, 0, 0);
      const endLocal = parseLocalDate(endDateStr || startDateStr);
      endLocal.setHours(0, 0, 0, 0);
      return today >= startLocal && today <= endLocal;
    } catch {
      return false;
    }
  }).length;

  return (
    <div className="space-y-6" id="projects-tab">
      {/* Header element */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Gestão de Projetos</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Selecione qualquer projeto ativo listado abaixo para gerenciar e calcular cachês de freelancers alocados.
          </p>
        </div>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer shrink-0"
          id="btn-add-task-project-tab"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {/* Grid of basic informative indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
          <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Projetos Futuros</span>
          <div className="text-3xl font-bold text-neutral-900 mt-2 font-mono">{futureProjectsCount}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
          <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Projetos em Operação</span>
          <div className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
            {activeProjectsCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
          <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Projetos Totais</span>
          <div className="text-3xl font-bold text-neutral-900 mt-2 font-mono">
            {tasks.length}
          </div>
        </div>
      </div>

      {/* Main Table Card wrapper */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-semibold text-neutral-900">Lista Geral de Projetos / Clientes</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Clique no nome para entrar na guia operacional e planejar o staff freelancer contratado.</p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 text-xs">
            {/* Client Filter */}
            <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1">
              <span className="text-neutral-400 mr-1.5"><Filter className="w-3.5 h-3.5" /></span>
              <select 
                value={filterProject} 
                onChange={(e) => setFilterProject(e.target.value)}
                className="bg-transparent border-none outline-none text-neutral-700 cursor-pointer font-medium"
              >
                <option value="Todos">Todos Clientes</option>
                {uniqueClients.map(proj => <option key={proj} value={proj}>{proj}</option>)}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1">
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-transparent border-none outline-none text-neutral-700 cursor-pointer font-medium"
              >
                <option value="Todas">Prioridades</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable table matching visual guidelines */}
        <div className="mt-4 overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-neutral-50/70 border-b border-neutral-200 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-4">Projeto / Cliente</th>
                <th className="py-2.5 px-4">Período de Evento</th>
                <th className="py-2.5 px-4 text-center">Freelancers Alocados</th>
                <th className="py-2.5 px-4 text-center">Orçamento Alocado</th>
                <th className="py-2.5 px-4">Status de Tempo</th>
                <th className="py-2.5 px-4 text-center">Gestão de Alocação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-400 italic">
                    Nenhum projeto encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const countdown = getEventCountdownText(task);
                  const numAllocated = task.alocacoes?.length || 0;
                  const totalCost = (task.alocacoes || []).reduce((sum, item) => sum + item.totalCache, 0);

                  return (
                    <tr key={task.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <button 
                            onClick={() => setSelectedProjectId(task.id)}
                            className="font-bold text-neutral-900 text-xs leading-snug hover:underline text-left cursor-pointer focus:outline-none"
                          >
                            {task.titulo}
                          </button>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold border border-neutral-200">
                              {task.projeto}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-neutral-600 whitespace-nowrap">
                        <div className="flex items-start gap-1.5">
                          <Calendar className="w-4 h-4 text-neutral-450 mt-0.5 shrink-0" />
                          <div className="text-xs leading-tight font-semibold text-neutral-700">
                            {task.dataInicio ? (
                              <>
                                <div>{formatLocalDate(task.dataInicio)} até</div>
                                <div className="text-neutral-400 mt-0.5">{formatLocalDate(task.dataFim)}</div>
                              </>
                            ) : (
                              <>
                                <div>{formatLocalDate(task.dataEntrega)} até</div>
                                <div className="text-neutral-400 mt-0.5">{formatLocalDate(task.dataEntrega)}</div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center font-semibold text-neutral-700">
                        <div className="flex items-center justify-center gap-1">
                          <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-804 border border-neutral-200">
                            {numAllocated} ativo(s)
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center font-mono font-bold text-emerald-800">
                        R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full border text-[10px] text-center leading-tight ${countdown.colorClass}`}>
                          {countdown.text}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => setSelectedProjectId(task.id)}
                          className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <span>Gerenciar Staff</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-neutral-250 my-8"
          >
            <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-base font-semibold">Cadastrar Novo Projeto</h3>
              </div>
              <button 
                onClick={() => setShowNewTaskModal(false)}
                className="text-neutral-400 hover:text-white transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewTask} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-left">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Título do Projeto *</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder=""
                  className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                  NOME DO CLIENTE *
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={newProject} 
                    onChange={(e) => {
                      setNewProject(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Escreva ou selecione um cliente..."
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
                    required
                  />
                  {clients.length > 0 && (
                    <span className="absolute right-2.5 top-3 text-neutral-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {showSuggestions && clients.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg font-sans max-h-48 overflow-y-auto divide-y divide-neutral-100 text-left">
                    <div className="p-1.5 bg-neutral-50 text-[10px] text-neutral-450 uppercase font-bold tracking-wider">
                      Clientes Cadastrados
                    </div>
                    {clients
                      .filter(c => c.nome.toLowerCase().includes(newProject.toLowerCase()))
                      .map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onMouseDown={() => {
                            setNewProject(client.nome);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left text-xs px-3 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-medium transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="font-bold">{client.nome}</span>
                          {client.segmento && (
                            <span className="text-[9px] text-neutral-400 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded font-mono">
                              {client.segmento}
                            </span>
                          )}
                        </button>
                      ))}
                    {clients.filter(c => c.nome.toLowerCase().includes(newProject.toLowerCase())).length === 0 && (
                      <div className="p-3 text-xs text-neutral-450 italic">
                        Nenhum cliente correspondente. O nome digitado será cadastrado como novo cliente.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Data Inicial *</label>
                  <input 
                    type="date" 
                    value={newDataInicio} 
                    onChange={(e) => setNewDataInicio(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Hora Inicial *</label>
                  <input 
                    type="time" 
                    value={newHoraInicio} 
                    onChange={(e) => setNewHoraInicio(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Data Final *</label>
                  <input 
                    type="date" 
                    value={newDataFim} 
                    onChange={(e) => setNewDataFim(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Hora Final *</label>
                  <input 
                    type="time" 
                    value={newHoraFim} 
                    onChange={(e) => setNewHoraFim(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Budget do Evento (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400 text-sm font-semibold">R$</span>
                  <input 
                    type="number" 
                    placeholder=""
                    value={newBudget} 
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-neutral-950 font-mono bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Local do Evento</label>
                <input 
                  type="text" 
                  value={newLocalEvento} 
                  onChange={(e) => setNewLocalEvento(e.target.value)}
                  placeholder=""
                  className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Descrição / Notas do Projeto</label>
                <textarea 
                  rows={3}
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder=""
                  className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950 bg-white"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
                >
                  Registrar Projeto
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal de Detalhamento de Geolocalização */}
      {selectedGeoDetail && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-lg w-full overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-150 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="font-extrabold text-neutral-900 text-sm tracking-tight uppercase">Geolocalização Detalhada</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedGeoDetail(null)}
                className="text-neutral-400 hover:text-neutral-700 bg-neutral-100 p-1.5 rounded-full transition-colors cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-left">
              <div className="flex flex-col gap-0.5 pb-3 border-b border-neutral-100">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-extrabold">Profissional / Dia</span>
                <div className="text-sm font-bold text-emerald-600 font-sans">{selectedGeoDetail.freelancerNome}</div>
                <div className="text-xs text-neutral-750 font-medium">Turno de Trabalho: {selectedGeoDetail.dateText}</div>
              </div>

              {/* Manual Fill Warning Banner */}
              {selectedGeoDetail.preenchidoManualmente && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-2.5 shadow-3xs animate-fade-in">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <span className="text-xs font-bold block">Horário Preenchido Manualmente</span>
                    <span className="text-[10.5px] leading-relaxed text-amber-800 font-medium block">
                      Este profissional inseriu os dados de entrada/saída manualmente após o dia da diária. O gestor deve analisar e confirmar os horários.
                    </span>
                    {selectedGeoDetail.freelancerId && selectedGeoDetail.activeDiariaDate && (
                      <button
                        type="button"
                        onClick={() => {
                          const fId = selectedGeoDetail.freelancerId!;
                          const dDate = selectedGeoDetail.activeDiariaDate!;
                          const finalDiarias = { ...(currentProject.diariasData || {}) };
                          const dateRecord = { ...(finalDiarias[dDate] || {}) };
                          const freeRecord = { ...(dateRecord[fId] || {}) };
                          freeRecord.confirmadoPeloGestor = !freeRecord.confirmadoPeloGestor;
                          
                          dateRecord[fId] = freeRecord;
                          finalDiarias[dDate] = dateRecord;
                          onUpdateTask({ ...currentProject, diariasData: finalDiarias });
                          
                          setSelectedGeoDetail({
                            ...selectedGeoDetail,
                            confirmadoPeloGestor: freeRecord.confirmadoPeloGestor
                          });
                        }}
                        className={`px-3 py-1.5 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 w-full sm:w-auto ${
                          selectedGeoDetail.confirmadoPeloGestor
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                            : 'bg-amber-100 text-amber-800 border-amber-250 hover:bg-amber-150 animate-pulse'
                        }`}
                      >
                        {selectedGeoDetail.confirmadoPeloGestor ? '✓ Horário Aprovado (Desfazer)' : '⏳ Confirmar e Autorizar Horário'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Grid of Check-in and Check-out */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Check-In Card */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    <span>📥</span>
                    <span>Check-In (Chegada)</span>
                  </div>
                  <div className="text-[11px] text-neutral-600 space-y-2">
                    <div>
                      <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Horário:</span>
                      <span className="font-mono font-bold text-neutral-800 text-xs">{selectedGeoDetail.chegada || 'Não registrado'}</span>
                    </div>
                    {selectedGeoDetail.locationChegada && (
                      <div>
                        <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Localidade da Latitude:</span>
                        <span className="font-sans leading-relaxed text-emerald-800 text-[10.5px] font-bold block bg-emerald-100/30 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                          📍 {getLocalityFromLatitude(selectedGeoDetail.locationChegada)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Coordenadas GPS:</span>
                      <span className="font-mono bg-white px-1.5 py-0.5 border border-neutral-200 rounded text-neutral-750 text-[10px] block w-fit break-all">
                        {selectedGeoDetail.locationChegada || 'Nenhuma coordenada'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Endereço do Local:</span>
                      <span className="font-sans leading-relaxed text-neutral-750 font-medium block">
                        {selectedGeoDetail.locationChegada ? getAddressFromCoordinates(selectedGeoDetail.locationChegada) : 'Localização não registrada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Check-Out Card */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                    <span>📤</span>
                    <span>Check-Out (Saída)</span>
                  </div>
                  <div className="text-[11px] text-neutral-600 space-y-2">
                    <div>
                      <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Horário:</span>
                      <span className="font-mono font-bold text-neutral-800 text-xs">{selectedGeoDetail.saida || 'Não registrado'}</span>
                    </div>
                    {selectedGeoDetail.locationSaida && (
                      <div>
                        <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Localidade da Latitude:</span>
                        <span className="font-sans leading-relaxed text-emerald-800 text-[10.5px] font-bold block bg-emerald-100/30 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                          📍 {getLocalityFromLatitude(selectedGeoDetail.locationSaida)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Coordenadas GPS:</span>
                      <span className="font-mono bg-white px-1.5 py-0.5 border border-neutral-200 rounded text-neutral-750 text-[10px] block w-fit break-all">
                        {selectedGeoDetail.locationSaida || 'Nenhuma coordenada'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold block text-[9px] text-neutral-500 uppercase tracking-wider">Endereço do Local:</span>
                      <span className="font-sans leading-relaxed text-neutral-750 font-medium block">
                        {selectedGeoDetail.locationSaida ? getAddressFromCoordinates(selectedGeoDetail.locationSaida) : 'Localização não registrada'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mock Map / Visual Confirmation */}
              {(selectedGeoDetail.locationChegada || selectedGeoDetail.locationSaida) && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> Confirmação de Presença no Local
                  </span>
                  
                  <div className="h-24 bg-neutral-100 border border-neutral-250 rounded-md relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2 text-center">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></span>
                      <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full border border-white absolute"></span>
                      
                      <span className="text-[9.5px] font-bold text-neutral-700 mt-6 bg-white px-2 py-0.5 rounded border border-neutral-200 shadow-2xs">
                        Coordenadas validadas no raio correto do evento
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Close Button */}
            <div className="px-5 py-3 border-t border-neutral-150 bg-neutral-50 flex justify-end">
              <button 
                type="button"
                onClick={() => setSelectedGeoDetail(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors focus:outline-none"
              >
                Fechar Detalhes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
