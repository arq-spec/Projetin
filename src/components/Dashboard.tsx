import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Task, Freelancer, Client, UserProfile } from '../types';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Plus, 
  Filter, 
  User, 
  Calendar, 
  Award,
  Sparkles,
  Building2,
  ChevronDown,
  Megaphone,
  DollarSign,
  Check,
  X,
  Briefcase,
  MapPin,
  Camera,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Send,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

import { compressImage } from '../utils/imageUtils';

export const getLocalityFromLatitude = (coords?: string): string => {
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

export const parseTimeToMinutes = (t: string) => {
  if (!t) return 0;
  const parts = t.split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

export const formatMinutesToHours = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) {
    return h === 1 ? '1 hora' : `${h} horas`;
  }
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

export const checkMealOverlap = (workStart: string, workEnd: string, mealStart: string, mealEnd: string): boolean => {
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

  // Check overlap between intervals
  return workIntervals.some(([w1, w2]) => 
    mealIntervals.some(([m1, m2]) => Math.max(w1, m1) < Math.min(w2, m2))
  );
};

interface DashboardProps {
  tasks: Task[];
  freelancers: Freelancer[];
  clients: Client[];
  onUpdateTask: (task: Task) => void;
  onAddTask: (task: Task) => void;
  currentUser?: UserProfile;
  onNavigateToProject?: (projectId: string) => void;
}

export default function Dashboard(props: DashboardProps) {
  if (props.currentUser?.perfil === 'Freelancer') {
    return <FreelancerDashboardView {...props} currentUser={props.currentUser} />;
  }
  return <MainCompanyDashboard {...props} />;
}

function MainCompanyDashboard({ tasks, freelancers, clients, onUpdateTask, onAddTask, currentUser, onNavigateToProject }: DashboardProps) {


  const [filterProject, setFilterProject] = useState('Todos');
  const [filterFreelancer, setFilterFreelancer] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProject, setNewProject] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newLocalEvento, setNewLocalEvento] = useState('');
  const [newDueDate, setNewDueDate] = useState('2026-06-20');
  
  const [newDataInicio, setNewDataInicio] = useState('');
  const [newHoraInicio, setNewHoraInicio] = useState('00:00');
  const [newDataFim, setNewDataFim] = useState('');
  const [newHoraFim, setNewHoraFim] = useState('00:00');
  const [newBudget, setNewBudget] = useState('');

  // Stats analysis
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Concluído').length;
  const inProgressTasks = tasks.filter(t => t.status === 'Em Andamento').length;
  const reviewTasks = tasks.filter(t => t.status === 'Em Revisão').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pendente').length;
  
  const averageProgress = totalTasks > 0 
    ? Math.round(tasks.reduce((acc, current) => acc + current.progresso, 0) / totalTasks)
    : 0;

  const totalFreelancers = freelancers.length;
  const averageHourlyRate = totalFreelancers > 0 
    ? Math.round(freelancers.reduce((acc, f) => acc + f.valorHora, 0) / totalFreelancers)
    : 0;

  const uniqueProjects = Array.from(new Set(tasks.map(t => t.projeto)));

  // Filter tasks based on selected values
  const filteredTasks = tasks.filter(t => {
    const projectMatch = filterProject === 'Todos' || t.projeto === filterProject;
    const freelancerMatch = filterFreelancer === 'Todos' || t.freelancerId === filterFreelancer;
    const priorityMatch = filterPriority === 'Todas' || t.prioridade === filterPriority;
    return projectMatch && freelancerMatch && priorityMatch;
  });

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

  const updateProgress = (task: Task, progress: number) => {
    let newStatus = task.status;
    if (progress === 100) {
      newStatus = 'Concluído';
    } else if (progress > 0 && task.status === 'Pendente') {
      newStatus = 'Em Andamento';
    }
    
    onUpdateTask({
      ...task,
      progresso: progress,
      status: newStatus
    });
  };

  const updateStatus = (task: Task, status: Task['status']) => {
    let newProgress = task.progresso;
    if (status === 'Concluído') {
      newProgress = 100;
    } else if (status === 'Pendente') {
      newProgress = 0;
    }
    
    onUpdateTask({
      ...task,
      status,
      progresso: newProgress
    });
  };

  const formatLocalDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getEventCountdownText = (task: Task) => {
    const now = new Date();
    // Reset hours to midnight of current date for precise day comparisons
    now.setHours(0, 0, 0, 0);

    const startDateStr = task.dataInicio || task.dataEntrega;
    const endDateStr = task.dataFim || task.dataEntrega;

    if (!startDateStr) {
      return { text: 'Período não definido', type: 'undefined', colorClass: 'bg-neutral-100 text-neutral-500 border-neutral-200 font-medium' };
    }

    // Parse local date strictly to prevent timezone shifting
    const parseLocalDate = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return new Date(dateStr);
    };

    const startLocal = parseLocalDate(startDateStr);
    startLocal.setHours(0, 0, 0, 0);

    const endLocal = parseLocalDate(endDateStr);
    endLocal.setHours(0, 0, 0, 0);

    if (now < startLocal) {
      const diffTime = startLocal.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        return { 
          text: 'Começa amanhã', 
          type: 'countdown_start', 
          colorClass: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold text-xs' 
        };
      }
      return { 
        text: `Faltam ${diffDays} dias para o início`, 
        type: 'countdown_start', 
        colorClass: 'bg-amber-50/80 text-amber-800 border-amber-200 font-semibold text-xs' 
      };
    } else if (now >= startLocal && now <= endLocal) {
      const diffTime = endLocal.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return { 
          text: 'Termina hoje', 
          type: 'happening', 
          colorClass: 'bg-emerald-500 text-white border-emerald-600 font-bold text-xs animate-pulse' 
        };
      } else if (diffDays === 1) {
        return { 
          text: 'Último dia (termina amanhã)', 
          type: 'happening', 
          colorClass: 'bg-emerald-500 text-white border-emerald-600 font-bold text-xs animate-pulse' 
        };
      }
      return { 
        text: `Acontecendo (${diffDays} dias para acabar)`, 
        type: 'happening', 
        colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-xs' 
      };
    } else {
      return { 
        text: 'Evento encerrado', 
        type: 'finished', 
        colorClass: 'bg-neutral-100 text-neutral-400 border-neutral-250 font-medium text-xs' 
      };
    }
  };

  return (
    <div className="space-y-8" id="dashboard-tab">
      {/* Header and Quick stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Dashboard de Operações</h1>
          <p className="text-neutral-500 text-sm mt-1 font-medium text-neutral-450">Acompanhe as demandas ativas, produtividade e alocação de freelancers em tempo real.</p>
        </div>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm cursor-pointer"
          id="btn-add-task"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {/* Real-time Project Tasks Section - REPLACED WITH PROJETOS ATIVOS BOARD TABLE */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Projetos Ativos</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Visualize os projetos, prazos e tempo restante do cronograma operacional.</p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1">
                <span className="text-neutral-400 mr-1.5"><Filter className="w-3.5 h-3.5" /></span>
                <select 
                  value={filterProject} 
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="bg-transparent border-none outline-none text-neutral-700 dark:text-neutral-300 cursor-pointer font-medium"
                >
                  <option value="Todos">Todos Clientes</option>
                  {uniqueProjects.map(proj => <option key={proj} value={proj}>{proj}</option>)}
                </select>
              </div>

              <div className="flex items-center bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1">
                <select 
                  value={filterFreelancer} 
                  onChange={(e) => setFilterFreelancer(e.target.value)}
                  className="bg-transparent border-none outline-none text-neutral-700 dark:text-neutral-300 cursor-pointer font-medium"
                >
                  <option value="Todos">Todos Profissionais</option>
                  {freelancers.filter(f => !f.arquivado).map(free => <option key={free.id} value={free.id}>{free.nome}</option>)}
                </select>
              </div>

              <div className="flex items-center bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1">
                <select 
                  value={filterPriority} 
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-transparent border-none outline-none text-neutral-700 dark:text-neutral-300 cursor-pointer font-medium"
                >
                  <option value="Todas">Prioridades</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-12 text-neutral-400 italic bg-neutral-50/50 dark:bg-neutral-950/20 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                Nenhum projeto encontrado para os filtros selecionados.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const getProjectState = (task: Task) => {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);

                  const startDateStr = task.dataInicio || task.dataEntrega;
                  const endDateStr = task.dataFim || task.dataEntrega;

                  if (!startDateStr) return { label: "Agendamento Pendente", bg: "bg-neutral-50 dark:bg-neutral-850", text: "text-neutral-600 dark:text-neutral-300", border: "border-neutral-200 dark:border-neutral-750" };

                  const parseLocalDate = (dateStr: string) => {
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    }
                    return new Date(dateStr);
                  };

                  const startLocal = parseLocalDate(startDateStr);
                  startLocal.setHours(0, 0, 0, 0);

                  const endLocal = parseLocalDate(endDateStr);
                  endLocal.setHours(0, 0, 0, 0);

                  const isEquipeConfirmada = Boolean(task.alocacoes && task.alocacoes.length > 0 && task.alocacoes.every(a => a.statusConfirmacao === 'Confirmado' || a.statusConfirmacao === 'Recusado'));

                  if (now < startLocal || (now >= startLocal && now <= endLocal && !isEquipeConfirmada)) {
                    return { label: "Separação de Equipe", bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-350", border: "border-sky-200 dark:border-sky-900/40" };
                  } else if (now >= startLocal && now <= endLocal && isEquipeConfirmada) {
                    return { label: "Em Operação", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-350", border: "border-emerald-200 dark:border-emerald-900/40" };
                  } else {
                    if (task.folhaFechada) {
                      return { label: "Aguardando notas fiscais", bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-350", border: "border-purple-200 dark:border-purple-900/40" };
                    } else {
                      return { label: "Fechamento de Diárias", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-350", border: "border-amber-200 dark:border-amber-900/40" };
                    }
                  }
                };

                const state = getProjectState(task);

                return (
                  <div 
                    key={task.id} 
                    onClick={() => onNavigateToProject && onNavigateToProject(task.id)}
                    className="bg-white dark:bg-neutral-850/45 border text-left border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-neutral-900 dark:text-white text-sm leading-snug line-clamp-2">{task.titulo}</h4>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border ${state.bg} ${state.text} ${state.border}`}>
                          {state.label}
                        </span>
                      </div>
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold border border-neutral-200 dark:border-neutral-700 mb-4">
                        {task.projeto}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
                      <div className="flex items-start gap-1.5 text-neutral-600 dark:text-neutral-300">
                        <Calendar className="w-4 h-4 text-neutral-450 mt-0.5 shrink-0" />
                        <div className="text-xs leading-tight font-semibold text-neutral-700 dark:text-neutral-200">
                          {task.dataInicio ? (
                            <>
                              <div>{formatLocalDate(task.dataInicio)} até</div>
                              <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">{formatLocalDate(task.dataFim)}</div>
                            </>
                          ) : (
                            <>
                              <div>{formatLocalDate(task.dataEntrega)} até</div>
                              <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">{formatLocalDate(task.dataEntrega)}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* New task Modal */}
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

            <form onSubmit={handleAddNewTask} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Título do Projeto *</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder=""
                  className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950"
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
                      // Small delay so click event on suggestion can register
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Escreva ou selecione um cliente..."
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  />
                  {clients.length > 0 && (
                    <span className="absolute right-2.5 top-3 text-neutral-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                  )}
                </div>

                {/* Autocomplete suggestion popover based on registered clients */}
                {showSuggestions && clients.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg font-sans max-h-48 overflow-y-auto divide-y divide-neutral-100">
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
                          className="w-full text-left text-xs px-3 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 font-medium transition-colors flex items-center justify-between"
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
                      <div className="p-3 text-xs text-neutral-400 italic">
                        Nenhum cliente correspondente. O nome digitado será cadastrado como novo cliente.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Data Inicial e Hora Inicial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Data Inicial *</label>
                  <input 
                    type="date" 
                    value={newDataInicio} 
                    onChange={(e) => setNewDataInicio(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Hora Inicial *</label>
                  <input 
                    type="time" 
                    value={newHoraInicio} 
                    onChange={(e) => setNewHoraInicio(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  />
                </div>
              </div>

              {/* Data Final e Hora Final */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Data Final *</label>
                  <input 
                    type="date" 
                    value={newDataFim} 
                    onChange={(e) => setNewDataFim(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Hora Final *</label>
                  <input 
                    type="time" 
                    value={newHoraFim} 
                    onChange={(e) => setNewHoraFim(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                    required
                  />
                </div>
              </div>

              {/* Budget do Evento */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Budget do Evento (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400 text-sm font-semibold">R$</span>
                  <input 
                    type="number" 
                    placeholder=""
                    value={newBudget} 
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-neutral-950 font-mono"
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
                  className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">Descrição / Notas do Projeto</label>
                <textarea 
                  rows={3}
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder=""
                  className="w-full text-sm border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-950"
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
    </div>
  );
}

// ----------------------------------------------------------------------------
// PERSISTENT PERSONAL FREELANCER ACTIVE WORKSPACE
// ----------------------------------------------------------------------------

interface FreelancerDashboardViewProps {
  tasks: Task[];
  freelancers: Freelancer[];
  onUpdateTask: (task: Task) => void;
  currentUser: UserProfile;
}

function FreelancerDashboardView({ tasks, freelancers, onUpdateTask, currentUser }: FreelancerDashboardViewProps) {
  // Find freelancer: match either by ID or email
  const uEmail = currentUser.email?.toLowerCase();
  const relevantFreelancers = freelancers.filter(f => f.id === currentUser.freelancerId || (f.email && f.email.toLowerCase() === uEmail));
  const freelancer = relevantFreelancers.length > 0 ? relevantFreelancers[0] : undefined;
  
  // Find all allocations assigned to this freelancer
  // Robust match: using both currentUser.freelancerId and freelancer.id found above
  const possibleFreelancerIds = Array.from(new Set([
    currentUser.freelancerId, 
    ...relevantFreelancers.map(f => f.id)
  ].filter(Boolean)));
  
  const myAllocations = tasks.flatMap(t => 
    (t.alocacoes || [])
      .filter(a => 
        possibleFreelancerIds.includes(a.freelancerId) && 
        (a.statusConfirmacao === 'Chamado' || a.statusConfirmacao === 'Confirmado' || a.statusConfirmacao === 'Recusado')
      )
      .map(a => ({ ...a, task: t }))
  );

  const getAllocDatesLabel = (allocItem: any) => {
    return `${formatDate(allocItem.dataInicio)} até ${formatDate(allocItem.dataFim)}`;
  };

  // Directly assigned tasks (where the primary freelancerId matches)
  const myTasks = tasks.filter(t => t.freelancerId && possibleFreelancerIds.includes(t.freelancerId));
  
  console.log("DEBUG Dashboard: currentUser", currentUser);
  console.log("DEBUG Dashboard: possibleFreelancerIds", possibleFreelancerIds);
  
  if (myAllocations.length === 0) {
    console.log("DEBUG Dashboard: No allocations found! Checking all tasks...");
    tasks.forEach(t => {
        (t.alocacoes || []).forEach(a => {
            console.log(`DEBUG Dashboard: Task ${t.titulo} has alloc with freelancerId=${a.freelancerId} vs possibleFreelancerIds=${possibleFreelancerIds.join(',')}`);
            if (possibleFreelancerIds.includes(a.freelancerId)) {
                console.log("DEBUG Dashboard: Found match in task!", t.titulo);
            }
        });
    });
  }
  
  console.log("DEBUG Dashboard: myAllocations", myAllocations);
  console.log("DEBUG Dashboard: allTasks", tasks);

  // Editing state for updating the progress of a assigned task
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<Task['status']>('Pendente');

  const [expandedAllocId, setExpandedAllocId] = useState<string | null>(null);
  const [selectedProjectAllocId, setSelectedProjectAllocId] = useState<string | null>(null);

  const getBrasiliaTime = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const getEventDatesArray = (startStr?: string, endStr?: string) => {
    if (!startStr) return [];
    const end = endStr || startStr;
    const dates: string[] = [];
    
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

  // Key metrics calculation
  const totalDiarias = myAllocations.length;
  const confirmedDiarias = myAllocations.filter(a => a.statusConfirmacao === 'Confirmado');
  const pendingDiarias = myAllocations.filter(a => a.statusConfirmacao !== 'Confirmado' && a.statusConfirmacao !== 'Recusado');

  const getTodayDateStr = () => {
    const todayObj = new Date();
    const yyyy = todayObj.getFullYear();
    const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
    const dd = String(todayObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const todayStr = getTodayDateStr();

  // Meus Projetos: ALL confirmed minus approved
  const myCurrentProjects = confirmedDiarias.filter(a => {
    const isApproved = a.task?.notasFiscais?.[a.freelancerId]?.status === 'Aprovado';
    return !isApproved;
  });

  // Projetos Finalizados: approved invoice
  const myFinalizedProjects = confirmedDiarias.filter(a => {
    const isApproved = a.task?.notasFiscais?.[a.freelancerId]?.status === 'Aprovado';
    return isApproved;
  });

  const totalEarningsConfirmed = confirmedDiarias.reduce((sum, a) => sum + (a.totalCache || 0), 0);
  const totalEarningsPending = pendingDiarias.reduce((sum, a) => sum + (a.totalCache || 0), 0);
  const finalizedProjectsCount = new Set(myFinalizedProjects.map(a => a.task?.id).filter(Boolean)).size;

  // Next upcoming gig
  const upcomingGigs = myAllocations
    .filter(a => a.statusConfirmacao === 'Confirmado' && a.task.dataInicio)
    .sort((a, b) => (a.task.dataInicio || '').localeCompare(b.task.dataInicio || ''));
  const nextGig = upcomingGigs.length > 0 ? upcomingGigs[0] : null;

  const handleStatusChange = (task: Task, allocId: string, status: 'Confirmado' | 'Recusated' | 'Recusado' | 'Chamado', explanation?: string) => {
    const updatedAllocations = (task.alocacoes || []).map(a => {
      if (a.id === allocId) {
        return {
          ...a,
          statusConfirmacao: status === 'Recusated' ? 'Recusado' : status,
          ...(explanation !== undefined ? { chamadoMensagem: explanation } : {})
        };
      }
      return a;
    });

    onUpdateTask({
      ...task,
      alocacoes: updatedAllocations
    });
    alert(`Solicitação atualizada com sucesso para: ${status === 'Confirmado' ? 'Confirmado' : status === 'Recusado' ? 'Recusado' : 'Chamado'}!`);
  };

  const handleUpdateTaskProgress = (task: Task) => {
    onUpdateTask({
      ...task,
      progresso: editProgress,
      status: editStatus
    });
    setEditingTaskId(null);
    alert(`Progresso e Status da tarefa "${task.titulo}" atualizados com sucesso!`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  if (selectedProjectAllocId) {
    const alloc = myAllocations.find(a => a.id === selectedProjectAllocId);
    if (alloc) {
      return (
        <ProjectWorkView 
          alloc={alloc} 
          currentUser={currentUser} 
          onUpdateTask={onUpdateTask} 
          onBack={() => setSelectedProjectAllocId(null)}
          formatDate={formatDate}
          getBrasiliaTime={getBrasiliaTime}
          getEventDatesArray={getEventDatesArray}
        />
      );
    }
  }

  return (
    <div className="space-y-8 animate-fade-in" id="freelancer-portal-dashboard">
      
      {/* Personalized Welcome Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:justify-between gap-6 border border-neutral-850 shadow-md">
        <div className="space-y-2 text-center sm:text-left">
          <span className="p-1 px-2.5 rounded bg-emerald-500 text-neutral-950 text-[10px] uppercase font-mono font-bold tracking-wider">
            Portal do Talento
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, <span className="text-purple-500">{freelancer?.nome || currentUser.nome}</span>!
          </h1>
          <p className="text-neutral-450 text-xs max-w-xl font-medium">
            Seja bem-vindo ao seu painel integrado de trabalho. Aqui você pode gerenciar suas diárias solicitadas, responder a convites operacionais e atualizar o progresso de suas entregas.
          </p>
        </div>

        <div className="flex gap-3 justify-center text-xs">
          <div className="bg-neutral-805/50 border border-neutral-700/50 p-3 rounded-xl text-center min-w-[100px]">
            <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-mono">Status da Base</span>
            <span className="text-emerald-400 font-bold mt-1 block">● ATIVO</span>
          </div>
          <div className="bg-neutral-805/50 border border-neutral-700/50 p-3 rounded-xl text-center min-w-[100px]">
            <span className="text-neutral-400 block text-[9px] uppercase tracking-wider font-mono">Especialidade</span>
            <span className="text-purple-500 font-bold mt-1 block truncate max-w-[110px]" title={freelancer?.cargo}>
              {freelancer?.cargo || 'Especialista'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Finished Projects */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs font-bold tracking-wider uppercase">Projetos Finalizados</span>
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-neutral-900 font-mono">
              {finalizedProjectsCount}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">
              projeto(s)
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 font-medium">
            Projetos com folha de pagamento enviada e liberada para recebimento.
          </p>
        </div>

        {/* Metric 2: Estimated Earnings */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs font-bold tracking-wider uppercase">Propostas Pendentes</span>
            <div className="bg-amber-50 text-amber-700 p-2 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-neutral-900 font-mono">
              R$ {totalEarningsPending.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 font-medium">
            Diárias reservadas aguardando seu aceite.
          </p>
        </div>

        {/* Metric 3: Total Gigs Count */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs font-bold tracking-wider uppercase">Total de Convites</span>
            <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900">{totalDiarias}</span>
            <span className="text-[11px] text-neutral-400 font-medium">
              ({confirmedDiarias.length} confirmados)
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 font-medium">
            Volume de convocações operacionais registradas.
          </p>
        </div>

        {/* Metric 4: Next Gig Date */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 text-xs font-bold tracking-wider uppercase">Próximo Evento</span>
            <div className="bg-purple-50 text-purple-700 p-2 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {nextGig ? (
              <div>
                <span className="text-sm font-bold text-purple-900 block truncate">
                  {nextGig.task.titulo}
                </span>
                <span className="text-xs text-neutral-500 font-mono font-medium block mt-1">
                  Atuar em: {formatDate(nextGig.task.dataInicio)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-neutral-400 font-medium italic mt-2 block">
                Nenhum evento futuro confirmado.
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side (8 cols): Invitations and My Projects */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          
          {/* Section A: Active Requests & Invitations */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-600" />
                Convites Operacionais de Diárias ({myAllocations.filter(a => a.statusConfirmacao !== 'Confirmado' && a.statusConfirmacao !== 'Recusado').length})
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {myAllocations.filter(a => a.statusConfirmacao !== 'Confirmado' && a.statusConfirmacao !== 'Recusado').length === 0 ? (
                <div className="text-center py-8 text-neutral-400 italic text-xs">
                  Você não possui novos convites operacionais no momento.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {myAllocations.filter(a => a.statusConfirmacao !== 'Confirmado' && a.statusConfirmacao !== 'Recusado').map(alloc => {
                    const isDecided = alloc.statusConfirmacao === 'Confirmado' || alloc.statusConfirmacao === 'Recusado';
                    
                    return (
                      <div key={alloc.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-neutral-950 text-xs text-neutral-900">
                                {alloc.task?.projeto} / {alloc.task?.titulo}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 font-mono">
                                Função: {alloc.funcao}
                              </span>
                              
                              {/* Status Badge */}
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                alloc.statusConfirmacao === 'Chamado'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-neutral-50 text-neutral-550 border-neutral-250 animate-pulse'
                              }`}>
                                {alloc.statusConfirmacao || 'Pendente'}
                              </span>
                            </div>

                            <p className="text-xs text-neutral-500 font-medium font-sans">
                              {alloc.task?.descricao || 'Sem descrição ou notas operacionais fornecidas pelo produtor.'}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-semibold text-neutral-500 pt-2 border-t border-neutral-50/50 mt-2 font-mono">
                              <div>
                                <span className="text-neutral-400 block text-[8px] uppercase">Data de Início</span>
                                <span className="text-neutral-800 font-bold">{formatDate(alloc.dataInicio)}</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 block text-[8px] uppercase">Data Final</span>
                                <span className="text-neutral-800 font-bold">{formatDate(alloc.dataFim)}</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 block text-[8px] uppercase font-bold">Valor da Hora</span>
                                <span className="text-amber-600 font-bold">R$ {((alloc.valorHora || 0) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h</span>
                              </div>
                              <div>
                                <span className="text-neutral-400 block text-[8px] uppercase font-bold text-neutral-900">Cachê Diário</span>
                                <span className="text-emerald-750 font-extrabold text-[11px]">R$ {(alloc.valorHora || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>

                            {alloc.chamadoMensagem && (
                              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-900 mt-2 italic font-medium font-sans">
                                <span className="font-bold uppercase not-italic block text-[8px] tracking-wider text-amber-600">Sua Mensagem/Chamado Técnico:</span>
                                "{alloc.chamadoMensagem}"
                              </div>
                            )}

                          </div>

                          {/* Decision Buttons for Freelancer */}
                          {!isDecided && (
                            <div className="flex sm:flex-col gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(alloc.task, alloc.id, 'Confirmado')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold tracking-wider transition-all cursor-pointer flex-1"
                              >
                                ✓ CONFIRMAR
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(alloc.task, alloc.id, 'Recusated')}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold tracking-wider transition-all cursor-pointer flex-1"
                              >
                                ✕ RECUSAR
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const explanation = prompt('Digite mensagem ou contraproposta para enviar ao produtor:');
                                  if (explanation !== null) {
                                    handleStatusChange(alloc.task, alloc.id, 'Chamado', explanation);
                                  }
                                }}
                                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 rounded-lg text-[10px] font-bold tracking-wider transition-colors cursor-pointer flex-1"
                              >
                                ✉ CHAMADO
                              </button>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section B1: Meus Projetos (Confirmados) */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Meus Projetos Confirmados ({myCurrentProjects.length})
              </h3>
            </div>

            <div className="p-5 space-y-4">
              {myCurrentProjects.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 italic text-xs font-medium">
                  Nenhum projeto atual ou diária futura confirmada no momento.
                </div>
              ) : (
                <div className="space-y-4">
                  {myCurrentProjects.map(alloc => {
                    const nfStatus = alloc.task?.notasFiscais?.[alloc.freelancerId]?.status;
                    const isTodayOrPast = (alloc.task?.dataInicio || alloc.dataInicio || '') <= todayStr;
                    return (
                      <div key={alloc.id} className={`p-4 border rounded-xl transition-all duration-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isTodayOrPast ? 'border-amber-200 bg-amber-50/10 hover:border-amber-300' : 'border-neutral-200 bg-white hover:border-emerald-250'}`}>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-neutral-900 text-sm truncate">
                              {alloc.task?.projeto} / {alloc.task?.titulo}
                            </span>
                            {isTodayOrPast ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[9px] font-bold uppercase tracking-wider border border-amber-150 shrink-0">
                                Em Andamento
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-bold uppercase tracking-wider border border-emerald-100 shrink-0">
                                Agendado / Confirmado
                              </span>
                            )}
                            {nfStatus && (
                              <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[9px] font-bold uppercase border border-neutral-200">
                                NF: {nfStatus === 'Pendente' ? '⏳ Em Análise' : '❌ Rejeitada'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 font-mono font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                              {getAllocDatesLabel(alloc)}
                            </span>
                            <span>•</span>
                            <span>Função: {alloc.funcao}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-[9px] text-neutral-400 block font-mono uppercase font-bold">Cachê Diário</span>
                            <span className="text-xs font-black text-emerald-600 font-mono block">R$ {alloc.valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedProjectAllocId(alloc.id)}
                            className={`px-4 py-2 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-sans shadow-xs whitespace-nowrap active:scale-95 ${isTodayOrPast ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            title="Abre a ficha operacional em aba dedicada para check-in, check-out e envio de Nota Fiscal"
                          >
                            <span>Acessar Diária</span>
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section B3: Projetos Finalizados */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Projetos Finalizados ({myFinalizedProjects.length})
              </h3>
            </div>

            <div className="p-5 space-y-4">
              {myFinalizedProjects.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 italic text-xs font-medium">
                  Nenhum projeto finalizado e pago ainda. Envie suas notas fiscais após o encerramento do expediente no projeto correspondente.
                </div>
              ) : (
                <div className="space-y-4">
                  {myFinalizedProjects.map(alloc => {
                    return (
                      <div key={alloc.id} className="p-4 border rounded-xl border-neutral-150 bg-neutral-50/40 hover:border-neutral-200 transition-all duration-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-neutral-800 text-sm truncate">
                              {alloc.task?.projeto} / {alloc.task?.titulo}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[9px] font-bold uppercase tracking-wider border border-emerald-200 shrink-0">
                              Pago & Homologado
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 font-mono font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                              {getAllocDatesLabel(alloc)}
                            </span>
                            <span>•</span>
                            <span>Função: {alloc.funcao}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-[9px] text-neutral-400 block font-mono uppercase font-bold">Cachê Recebido</span>
                            <span className="text-xs font-extrabold text-neutral-500 font-mono block">R$ {alloc.valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedProjectAllocId(alloc.id)}
                            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-sans shadow-xs whitespace-nowrap"
                            title="Abre a ficha operacional para visualizar demonstrativo histórico de pagamentos"
                          >
                            <span>Demonstrativo</span>
                            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side (4 cols): User bio detail, availability and contact */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-xs uppercase text-neutral-900 border-b border-neutral-100 pb-2">Meu Cadastro de Profissional</h3>
            
            <div className="space-y-4 text-xs font-semibold text-neutral-700">
              
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-mono">Apelido Técnico</span>
                <span className="text-neutral-900 text-sm font-bold block pt-0.5">{freelancer?.nome || currentUser.nome}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block font-mono">Contato Primário</span>
                <span className="text-neutral-900 block font-mono pt-0.5">{freelancer?.email || currentUser.email}</span>
                <span className="text-neutral-550 block font-mono">{freelancer?.telefone || 'Nenhum telefone registrado'}</span>
              </div>

              {freelancer?.habilidades && freelancer.habilidades.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block font-mono mb-1.5">Habilidades Mapeadas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {freelancer.habilidades.map(hab => (
                      <span key={hab} className="px-2 py-0.5 bg-neutral-100 border text-[10px] rounded-lg text-neutral-700">
                        {hab}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

interface ProjectWorkViewProps {
  alloc: any;
  currentUser: any;
  onUpdateTask: (task: Task) => void;
  onBack: () => void;
  formatDate: (dateStr?: string) => string;
  getBrasiliaTime: () => string;
  getEventDatesArray: (startStr?: string, endStr?: string) => string[];
}

function ProjectWorkView({
  alloc,
  currentUser,
  onUpdateTask,
  onBack,
  formatDate,
  getBrasiliaTime,
  getEventDatesArray
}: ProjectWorkViewProps) {
  const eventDates = getEventDatesArray(alloc.dataInicio, alloc.dataFim);
  const [isDragging, setIsDragging] = useState(false);

  const getFreelancerTotals = () => {
    const fid = alloc.freelancerId;
    if (!fid) return null;

    const currentAllocations = (alloc.task?.alocacoes || []).filter((a: any) => a.freelancerId === fid);
    if (currentAllocations.length === 0) return null;

    const totals = {
      freelancerId: fid,
      freelancerNome: currentAllocations[0].freelancerNome,
      funcao: currentAllocations[0].funcao,
      email: currentUser.email || '',
      telefone: currentUser.telefone || '',
      cpfCif: currentUser.cpfCif || '',
      cnpj: currentUser.cnpj || '',
      totalDays: 0,
      totalHours: 0,
      baseCache: 0,
      mealAddon: 0,
      totalGeral: 0,
      details: [] as any[]
    };

    const dates = getEventDatesArray(alloc.task?.dataInicio, alloc.task?.dataFim);

    dates.forEach(dateStr => {
      const dbRecord = (alloc.task?.diariasData || {})[dateStr]?.[fid] || {};
      
      let hours = 0;
      if (dbRecord.chegada && dbRecord.saida) {
        const arrivalMins = parseTimeToMinutes(dbRecord.chegada);
        const departureMins = parseTimeToMinutes(dbRecord.saida);
        let diff = departureMins - arrivalMins;
        if (diff < 0) diff += 1440;
        hours = diff / 60;
      }

      if (hours > 0) {
        const dailyRate = currentAllocations[0].valorHora;
        const coreCache = hours >= 18 ? dailyRate * 2 : (hours > 12 ? dailyRate + (hours - 12) * (dailyRate / 12) : dailyRate);
        
        // Meal config overlap
        const config = alloc.task?.mealConfig || {};
        const getProjMealConfig = {
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

        const meals = [
          { id: 'cafe', name: 'Café', start: getProjMealConfig.cafeStart, end: getProjMealConfig.cafeEnd, val: getProjMealConfig.cafeValue, enabled: getProjMealConfig.cafeEnabled },
          { id: 'almoco', name: 'Almoço', start: getProjMealConfig.almocoStart, end: getProjMealConfig.almocoEnd, val: getProjMealConfig.almocoValue, enabled: getProjMealConfig.almocoEnabled },
          { id: 'jantar', name: 'Jantar', start: getProjMealConfig.jantarStart, end: getProjMealConfig.jantarEnd, val: getProjMealConfig.jantarValue, enabled: getProjMealConfig.jantarEnabled },
        ];

        let mealAddon = 0;
        const mealDetails: string[] = [];
        meals.forEach(m => {
          if (m.enabled && checkMealOverlap(dbRecord.chegada || '', dbRecord.saida || '', m.start, m.end)) {
            mealDetails.push(`${m.name} (+R$ ${m.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
            mealAddon += m.val;
          }
        });

        const totalDia = coreCache + mealAddon;
        const hoursFormatted = formatMinutesToHours(hours * 60);

        totals.totalDays += 1;
        totals.totalHours += hours;
        totals.baseCache += coreCache;
        totals.mealAddon += mealAddon;
        totals.totalGeral += totalDia;

        totals.details.push({
          dateText: formatDate(dateStr),
          chegada: dbRecord.chegada,
          saida: dbRecord.saida,
          hours,
          hoursFormatted,
          dailyRate,
          coreCache,
          mealAddon,
          mealDetails,
          totalDia
        });
      }
    });

    return totals;
  };

  const handleExportPDF = (freelancerData: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color Palette
    doc.setFillColor(15, 23, 42); // slate-900 background banner
    doc.rect(0, 0, 210, 38, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('COMPROVANTE DE PRESTACAO DE SERVICOS', 15, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 15, 22);
    doc.text(`Projeto: ${alloc.task?.titulo || 'N/A'} | Cliente: ${alloc.task?.projeto || 'N/A'}`, 15, 27);

    // Subheader banner (Emerald line)
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.rect(0, 38, 210, 3, 'F');

    // Let's add details
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DADOS DO PROFISSIONAL', 15, 52);

    // Divider
    doc.setDrawColor(226, 232, 240); // src-200
    doc.line(15, 55, 195, 55);

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

    // Signatures spaces
    doc.line(20, currentY + 58, 90, currentY + 58);
    doc.text('Assinatura do Gestor Responsavel', 30, currentY + 62);

    doc.line(120, currentY + 58, 190, currentY + 58);
    doc.text('Assinatura do Prestador (Freelancer)', 128, currentY + 62);

    // Underneath metadata
    doc.setFontSize(6.5);
    doc.text('Este documento e um demonstrativo gerado eletronicamente e possui validade operacional interna de cache.', 15, currentY + 75);

    // Save the PDF
    const filename = `Comprovante_Cache_${freelancerData.freelancerNome.replace(/\s+/g, '_')}_${(alloc.task?.titulo || 'Projeto').replace(/\s+/g, '_')}.pdf`;
    doc.save(filename);
  };

  const handleUploadNotaFiscal = (base64: string, filename: string) => {
    const fid = alloc.freelancerId;
    if (!fid) return;

    const currentNotas = alloc.task?.notasFiscais || {};
    const updatedNotas = {
      ...currentNotas,
      [fid]: {
        base64,
        name: filename,
        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
        status: 'Pendente' as const
      }
    };

    onUpdateTask({
      ...(alloc.task || {} as any),
      notasFiscais: updatedNotas
    });

    alert('Nota fiscal anexada com sucesso! Aguarde a aprovação do financeiro.');
  };

  const isFolhaFechada = !!alloc.task?.folhaFechada;
  const freelancerTotals = getFreelancerTotals();

  if (isFolhaFechada && freelancerTotals) {
    const userNotaFiscal = alloc.task?.notasFiscais?.[alloc.freelancerId];

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    };

    const processFile = (file: File) => {
      // Limit attachment size for PDF/invoices strictly to Database limits
      if (file.size > 300 * 1024) {
        alert('Limite de 300KB excedido. Documentos muito grandes não podem ser salvos no banco de dados. Comprima sua Nota Fiscal (PDF) e tente novamente.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUploadNotaFiscal(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="space-y-6 animate-fade-in" id="project-finalized-workspace">
        {/* Top Navigation Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-800 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer shadow-3xs active:scale-95 self-start"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-550" />
            <span>Voltar ao Meu Painel</span>
          </button>

          <div className="flex items-center gap-2 self-start font-mono text-[10px] text-neutral-450 font-bold uppercase tracking-wider">
            <span>Portal do Talento</span>
            <span className="text-neutral-300">/</span>
            <span className="text-emerald-600">Fechamento Finalizado</span>
          </div>
        </div>

        {/* Project info card */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-6 sm:p-8 bg-neutral-900 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[9px] uppercase font-mono font-bold tracking-wider">
                  EVENTO CONCLUÍDO
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[9px] uppercase font-mono font-bold tracking-wider">
                  FOLHA FECHADA
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
                 {alloc.task?.projeto} — {alloc.task?.titulo}
              </h1>
              <p className="text-neutral-400 text-xs font-semibold max-w-2xl leading-relaxed">
                As diárias e o cachê deste projeto foram fechados e auditados pela gestão.
              </p>
            </div>
          </div>
        </div>

        {/* Valor Finalizado prominente */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block font-mono">
                  Seu Valor Finalizado a Receber
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono tracking-tight">
                  R$ {freelancerTotals.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed max-w-xl">
                  Este valor total foi calculado com base em <strong>{freelancerTotals.totalDays} diárias confirmadas</strong> ({freelancerTotals.totalHours.toFixed(1)}h totais de prestação) incluindo os adicionais de alimentação: R$ {freelancerTotals.mealAddon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0 col-span-1">
                <button
                  type="button"
                  onClick={() => handleExportPDF(freelancerTotals)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Baixar Comprovante (PDF)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seção da Nota Fiscal */}
          <div className="lg:col-span-12">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-neutral-900 tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  Anexar Nota Fiscal (NF) para Recebimento
                </h3>
                <p className="text-neutral-500 text-xs leading-relaxed max-w-3xl">
                  Para que a coordenação financeira programe seu repasse no valor de <strong>R$ {freelancerTotals.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, por favor emita a Nota Fiscal de Prestação de Serviços contra o tomador e anexe o arquivo (PDF ou Imagem) abaixo.
                </p>
              </div>

              {userNotaFiscal ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-neutral-800 text-xs block truncate max-w-[200px] sm:max-w-sm">
                          {userNotaFiscal.name}
                        </span>
                        <span className="text-[10px] text-neutral-550 block font-mono">
                          Enviado em: {userNotaFiscal.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-medium">Status da Análise:</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        userNotaFiscal.status === 'Aprovado'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : userNotaFiscal.status === 'Rejeitado'
                          ? 'bg-rose-55 text-rose-800 border border-rose-220'
                          : 'bg-amber-50 text-amber-850 border border-amber-200'
                      }`}>
                        {userNotaFiscal.status === 'Aprovado' ? '✅ Aprovada' : userNotaFiscal.status === 'Rejeitado' ? '❌ Rejeitada' : '⏳ Em Análise'}
                      </span>
                    </div>
                  </div>

                  {userNotaFiscal.status === 'Rejeitado' && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 font-medium leading-relaxed">
                      ⚠️ <strong>Nota rejeitada pelo financeiro:</strong> Por favor revise os dados de faturamento e o valor de faturamento indicado de R$ {freelancerTotals.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, depois faça o reenvio de um novo documento de forma revisada.
                    </div>
                  )}

                  {userNotaFiscal.status === 'Aprovado' && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 font-medium leading-relaxed">
                      🎉 <strong>Nota Fiscal Aprovada!</strong> Sua solicitação foi homologada com sucesso e agendada para repasse.
                    </div>
                  )}

                  {/* Option to replace / re-upload if rejected or edit is desired */}
                  {(userNotaFiscal.status === 'Rejeitado' || userNotaFiscal.status === 'Pendente') && (
                    <div className="pt-2 border-t border-neutral-250 flex justify-end">
                      <label className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        Substituir Nota Fiscal
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                      : 'border-neutral-300 bg-neutral-50/40 hover:bg-neutral-50/80 hover:border-neutral-400'
                  }`}
                >
                  <div className="max-w-sm mx-auto space-y-4">
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-600">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-neutral-800">
                        Arraste e solte o arquivo da Nota Fiscal aqui
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        ou toque para selecionar do seu dispositivo (PDF, JPG, PNG)
                      </p>
                    </div>
                    <label className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-neutral-800 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all cursor-pointer shadow-3xs">
                      <span>Procurar arquivo</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="project-dedicated-workspace">
      {/* Top Navigation Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-neutral-800 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer shadow-3xs active:scale-95 self-start"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-550" />
          <span>Voltar ao Meu Painel</span>
        </button>

        <div className="flex items-center gap-2 self-start font-mono text-[10px] text-neutral-450 font-bold uppercase tracking-wider">
          <span>Portal do Talento</span>
          <span className="text-neutral-300">/</span>
          <span className="text-emerald-600">Registro Diário</span>
        </div>
      </div>

      {/* Project info card */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 bg-neutral-900 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[9px] uppercase font-mono font-bold tracking-wider">
                PROJETO CONFIRMADO
              </span>
              <span className="text-neutral-400 font-mono text-[11px] font-semibold">
                Cachê: R$ {alloc.valorHora.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / diária
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
               {alloc.task?.projeto} — {alloc.task?.titulo}
            </h1>
            <p className="text-neutral-400 text-xs font-semibold max-w-2xl leading-relaxed">
              {alloc.task?.descricao || 'Sem descrição complementar disponível para este projeto.'}
            </p>
          </div>
         </div>

        {/* Operational info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 border-t border-neutral-200 bg-neutral-50/60">
          <div className="p-5 space-y-1">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block font-mono">📍 Local do Evento</span>
            <span className="text-xs font-bold text-neutral-800 leading-snug block">
              {alloc.task?.localEvento || 'Local Central (A ser instruído pelo produtor)'}
            </span>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block font-mono">⏰ Horário Programado</span>
            <span className="text-xs font-bold text-neutral-800 block">
              {(alloc.task?.horaInicio || alloc.task?.horaFim) ? `${alloc.task?.horaInicio || '00:00'} às ${alloc.task?.horaFim || '20:00'}` : 'Instruções pendentes'}
            </span>
          </div>

          <div className="p-5 space-y-1">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block font-mono">💼 Sua Função no Projeto</span>
            <span className="text-xs font-black text-emerald-700 uppercase block tracking-wider font-mono">
              {alloc.funcao}
            </span>
          </div>
        </div>
      </div>

      {/* Main Checklist / Daily record log */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Check-In / Check-Out de Diárias (Controle Geomarcado)
          </h3>
          <span className="text-[10px] text-neutral-450 font-mono font-bold">Fuso Brasília (GMT-3)</span>
        </div>

        <div className="p-5 space-y-6 divide-y divide-neutral-200">
          {eventDates.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 italic text-xs">
              Nenhuma data operacional ativa mapeada para este projeto.
            </div>
          ) : (
            eventDates.map((dateStr, idx) => {
              const key = dateStr;
              const todayStr = (() => {
                const d = new Date();
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              })();
              const isToday = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              const isFuture = dateStr > todayStr;
              const dbRecord = (alloc.task?.diariasData || {})[key]?.[alloc.freelancerId] || {};

              const isTimeReached = (releaseTime?: string) => {
                if (!releaseTime) return true;
                const nowStr = getBrasiliaTime();
                return nowStr >= releaseTime;
              };

              const isCheckinTimeNotReached = !!dbRecord.liberadoCheckin && !!dbRecord.liberadoCheckinHora && isToday && !isTimeReached(dbRecord.liberadoCheckinHora);
              const isCheckoutTimeNotReached = !!dbRecord.liberadoCheckout && !!dbRecord.liberadoCheckoutHora && isToday && !isTimeReached(dbRecord.liberadoCheckoutHora);

              const isCheckinReleased = !alloc.task?.bloqueioAtivado || (!!dbRecord.liberadoCheckin && !isCheckinTimeNotReached);
              const isCheckoutReleased = !alloc.task?.bloqueioAtivado || (!!dbRecord.liberadoCheckout && !isCheckoutTimeNotReached);

              const handleLogDiariaField = (field: 'chegada' | 'saida' | 'localizacao' | 'foto', val: string) => {
                if (isFuture) return;
                if (isPast && dbRecord.confirmadoPeloGestor) return;

                const currentDiarias = alloc.task?.diariasData || {};
                const dateRecord = currentDiarias[key] || {};
                const fid = alloc.freelancerId;
                if (!fid) return;
                const freelancerRecord = dateRecord[fid] || {};

                let updatedRecord = {
                  ...freelancerRecord,
                  [field]: val
                };

                if (isPast) {
                  updatedRecord.preenchidoManualmente = false;
                  updatedRecord.confirmadoPeloGestor = false;
                }

                // Coordinates capture logic
                if (field === 'chegada' && val) {
                  if (!updatedRecord.localizacaoChegada) {
                    let latSim, lngSim;
                    if (updatedRecord.localizacaoSaida) {
                      const parts = updatedRecord.localizacaoSaida.split(',');
                      if (parts.length === 2) {
                        latSim = parts[0].trim();
                        lngSim = parts[1].trim();
                      }
                    }
                    if (!latSim || !lngSim) {
                      latSim = (-23.55 + (Math.random() - 0.5) * 0.05).toFixed(4);
                      lngSim = (-46.63 + (Math.random() - 0.5) * 0.05).toFixed(4);
                    }
                    updatedRecord.localizacaoChegada = `${latSim}, ${lngSim}`;
                    updatedRecord.localizacao = `${latSim}, ${lngSim}`; // Backwards compatibility

                    if (typeof navigator !== 'undefined' && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          let realLat = position.coords.latitude.toFixed(6);
                          let realLng = position.coords.longitude.toFixed(6);

                          const freshDiarias = alloc.task?.diariasData || {};
                          const freshDateRec = freshDiarias[key] || {};
                          const freshFreeRec = freshDateRec[fid] || {};

                          // If checkout coordinates already exist, check if we are in the same relative area
                          if (freshFreeRec.localizacaoSaida) {
                            const parts = freshFreeRec.localizacaoSaida.split(',');
                            if (parts.length === 2) {
                              const sLat = parseFloat(parts[0]);
                              const sLng = parseFloat(parts[1]);
                              const rLatNum = parseFloat(realLat);
                              const rLngNum = parseFloat(realLng);
                              if (!isNaN(sLat) && !isNaN(sLng) && !isNaN(rLatNum) && !isNaN(rLngNum)) {
                                if (Math.abs(rLatNum - sLat) < 0.003 && Math.abs(rLngNum - sLng) < 0.003) {
                                  realLat = sLat.toFixed(6);
                                  realLng = sLng.toFixed(6);
                                }
                              }
                            }
                          }

                          if (freshFreeRec.chegada === val) {
                            const finalFreeRec = { 
                              ...freshFreeRec, 
                              localizacaoChegada: `${realLat}, ${realLng}`,
                              localizacao: `${realLat}, ${realLng}`,
                              ...(isPast ? { preenchidoManualmente: false, confirmadoPeloGestor: false } : {})
                            };
                            const finalDateRec = { ...freshDateRec, [fid]: finalFreeRec };
                            const finalDiarias = { ...freshDiarias, [key]: finalDateRec };
                            onUpdateTask({ ...(alloc.task || {} as any), diariasData: finalDiarias });
                          }
                        },
                        (error) => {
                          console.log("GPS sim fallback preserved:", error.message);
                        },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                      );
                    }
                  }
                }

                if (field === 'saida' && val) {
                  if (!updatedRecord.localizacaoSaida) {
                    let latSim, lngSim;
                    const baseChegadaCoords = updatedRecord.localizacaoChegada || updatedRecord.localizacao;
                    if (baseChegadaCoords) {
                      const parts = baseChegadaCoords.split(',');
                      if (parts.length === 2) {
                        latSim = parts[0].trim();
                        lngSim = parts[1].trim();
                      }
                    }
                    if (!latSim || !lngSim) {
                      latSim = (-23.55 + (Math.random() - 0.5) * 0.05).toFixed(4);
                      lngSim = (-46.63 + (Math.random() - 0.5) * 0.05).toFixed(4);
                    }
                    updatedRecord.localizacaoSaida = `${latSim}, ${lngSim}`;

                    if (typeof navigator !== 'undefined' && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          let realLat = position.coords.latitude.toFixed(6);
                          let realLng = position.coords.longitude.toFixed(6);

                          const freshDiarias = alloc.task?.diariasData || {};
                          const freshDateRec = freshDiarias[key] || {};
                          const freshFreeRec = freshDateRec[fid] || {};

                          // If check-in coordinates already exist, check if we are in the same relative area
                          const existChegada = freshFreeRec.localizacaoChegada || freshFreeRec.localizacao;
                          if (existChegada) {
                            const parts = existChegada.split(',');
                            if (parts.length === 2) {
                              const cLat = parseFloat(parts[0]);
                              const cLng = parseFloat(parts[1]);
                              const rLatNum = parseFloat(realLat);
                              const rLngNum = parseFloat(realLng);
                              if (!isNaN(cLat) && !isNaN(cLng) && !isNaN(rLatNum) && !isNaN(rLngNum)) {
                                if (Math.abs(rLatNum - cLat) < 0.003 && Math.abs(rLngNum - cLng) < 0.003) {
                                  realLat = cLat.toFixed(6);
                                  realLng = cLng.toFixed(6);
                                }
                              }
                            }
                          }

                          if (freshFreeRec.saida === val) {
                            const finalFreeRec = { 
                              ...freshFreeRec, 
                              localizacaoSaida: `${realLat}, ${realLng}`,
                              ...(isPast ? { preenchidoManualmente: false, confirmadoPeloGestor: false } : {})
                            };
                            const finalDateRec = { ...freshDateRec, [fid]: finalFreeRec };
                            const finalDiarias = { ...freshDiarias, [key]: finalDateRec };
                            onUpdateTask({ ...(alloc.task || {} as any), diariasData: finalDiarias });
                          }
                        },
                        (error) => {
                          console.log("GPS sim fallback preserved:", error.message);
                        },
                        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                      );
                    }
                  }
                }

                const updatedDateRecord = {
                  ...dateRecord,
                  [fid]: updatedRecord
                };

                const updatedDateData = {
                  ...currentDiarias,
                  [key]: updatedDateRecord
                };

                onUpdateTask({
                  ...(alloc.task || {} as any),
                  diariasData: updatedDateData
                });
              };

              return (
                <div key={dateStr} className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${idx > 0 ? 'pt-6' : ''}`}>
                  {/* Left block: Date and Registered checks */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="font-extrabold text-neutral-900 text-sm flex items-center gap-2 font-mono">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Data da Diária: {formatDate(dateStr)}
                      {dbRecord.preenchidoManualmente && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold font-sans px-2 py-0.5 rounded-full">
                          Preenchido Manualmente
                        </span>
                      )}
                      {dbRecord.confirmadoPeloGestor && (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold font-sans px-2 py-0.5 rounded-full">
                          Confirmado pelo Gestor
                        </span>
                      )}
                    </div>

                    <div className="flex flex-row flex-wrap items-center gap-4 pt-1 font-sans">
                      {/* Check-In */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">
                          Horário de Entrada: {
                            isCheckinReleased ? (
                              <span className="text-emerald-600 font-extrabold">{!alloc.task?.bloqueioAtivado ? '(Sem Travas)' : `(Liberado ${dbRecord.liberadoCheckinHora ? `às ${dbRecord.liberadoCheckinHora}` : ''})`}</span>
                            ) : isCheckinTimeNotReached ? (
                              <span className="text-amber-600 font-bold">(Bloqueado até {dbRecord.liberadoCheckinHora})</span>
                            ) : (
                              <span className="text-rose-500 font-medium">(Bloqueado)</span>
                            )
                          }
                        </span>
                        {((isPast || isToday) && !dbRecord.confirmadoPeloGestor && isPast) ? (
                          <input 
                            type="time" 
                            disabled={!isCheckinReleased}
                            value={dbRecord.chegada || ''} 
                            onChange={(e) => handleLogDiariaField('chegada', e.target.value)}
                            className="bg-white border border-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-emerald-800 disabled:opacity-50"
                          />
                        ) : dbRecord.chegada ? (
                          <div className="bg-neutral-50 border border-neutral-200 text-xs rounded-lg px-2.5 py-1.5 font-mono font-bold text-emerald-800 flex items-center gap-1.5 shadow-3xs" title="Check-In automático gravado via aplicativo">
                            <span>🚪 {dbRecord.chegada}</span>
                            {(dbRecord.localizacaoChegada || dbRecord.localizacao) && (
                              <span 
                                className="text-emerald-600 flex items-center" 
                                title={`GPS Check-In: ${dbRecord.localizacaoChegada || dbRecord.localizacao} ${getLocalityFromLatitude(dbRecord.localizacaoChegada || dbRecord.localizacao) ? `(${getLocalityFromLatitude(dbRecord.localizacaoChegada || dbRecord.localizacao)})` : ''}`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-450 border border-neutral-200 text-[10px] font-semibold font-mono">
                            {isFuture ? 'Bloqueado (Data Futura)' : 'Nenhum Check-In registrado'}
                          </span>
                        )}
                      </div>

                      {/* Check-Out */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold block">
                          Horário de Saída: {
                            isCheckoutReleased ? (
                              <span className="text-indigo-650 font-extrabold">{!alloc.task?.bloqueioAtivado ? '(Sem Travas)' : `(Liberado ${dbRecord.liberadoCheckoutHora ? `às ${dbRecord.liberadoCheckoutHora}` : ''})`}</span>
                            ) : isCheckoutTimeNotReached ? (
                              <span className="text-amber-600 font-bold">(Bloqueado até {dbRecord.liberadoCheckoutHora})</span>
                            ) : (
                              <span className="text-rose-500 font-medium">(Bloqueado)</span>
                            )
                          }
                        </span>
                        {(isPast && !dbRecord.confirmadoPeloGestor) ? (
                          <input 
                            type="time" 
                            disabled={!isCheckoutReleased}
                            value={dbRecord.saida || ''} 
                            onChange={(e) => handleLogDiariaField('saida', e.target.value)}
                            className="bg-white border border-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-emerald-800 disabled:opacity-50"
                          />
                        ) : dbRecord.saida ? (
                          <div className="bg-neutral-50 border border-neutral-200 text-xs rounded-lg px-2.5 py-1.5 font-mono font-bold text-emerald-800 flex items-center gap-1.5 shadow-3xs" title="Check-Out automático gravado via aplicativo">
                            <span>🚪 {dbRecord.saida}</span>
                            {dbRecord.localizacaoSaida && (
                              <span 
                                className="text-emerald-600 flex items-center" 
                                title={`GPS Check-Out: ${dbRecord.localizacaoSaida} ${getLocalityFromLatitude(dbRecord.localizacaoSaida) ? `(${getLocalityFromLatitude(dbRecord.localizacaoSaida)})` : ''}`}
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-neutral-450 border border-neutral-200 text-[10px] font-semibold font-mono">
                            {isFuture ? 'Bloqueado (Data Futura)' : 'Nenhum Check-Out registrado'}
                          </span>
                        )}
                      </div>

                      {isPast && !dbRecord.confirmadoPeloGestor && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-850 border border-amber-200 text-[10px] font-bold font-sans flex items-center gap-1 animate-pulse">
                          ⚠️ Período expirado: preencha manualmente acima para confirmação do gestor.
                        </span>
                      )}
                      {isFuture && (
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-50 text-neutral-500 border border-neutral-200 text-[10px] font-bold font-sans flex items-center gap-1">
                          📅 Data futura: aguarde o dia programado para realizar o check-in.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle block: Pure photo validation (No URL manually inputs, works with both camera and library picker) */}
                  <div className="flex items-center gap-4 shrink-0 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                    <div className="relative">
                      {dbRecord.foto ? (
                        <div className="relative shrink-0">
                          <img
                            src={dbRecord.foto}
                            alt="Foto de Validação"
                            className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow-md"
                            referrerPolicy="no-referrer"
                          />
                          {(!dbRecord.confirmadoPeloGestor) && (
                            <button
                              type="button"
                              onClick={() => handleLogDiariaField('foto', '')}
                              className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                              title="Remover foto"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-neutral-100 border border-neutral-250 border-dashed rounded-xl flex flex-col items-center justify-center text-center text-neutral-400">
                          <ImageIcon className="w-5 h-5 text-neutral-350" />
                          <span className="text-[7.5px] font-semibold block mt-1 leading-none text-neutral-400">Sem Foto</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-mono font-black block leading-none">Foto de Validação</span>
                      
                      {isFuture ? (
                        <span className="px-3.5 py-2 text-[10px] font-bold text-neutral-450 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center gap-1.5 cursor-not-allowed">
                          <Camera className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Bloqueado (Data Futura)</span>
                        </span>
                      ) : (!isToday && dbRecord.confirmadoPeloGestor) ? (
                        <span className="px-3.5 py-2 text-[10px] font-bold text-neutral-450 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center gap-1.5 cursor-not-allowed">
                          <Camera className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Envio Bloqueado</span>
                        </span>
                      ) : (
                        <label className="cursor-pointer px-3.5 py-2 text-[10px] font-extrabold text-neutral-800 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg flex items-center gap-2 transition-all shadow-3xs hover:border-neutral-400 active:scale-95 inline-flex">
                          <Camera className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Tirar Foto (Câmera) ou Escolher da Biblioteca</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                 try {
                                   const compressed = await compressImage(file, 0.8, 400);
                                   handleLogDiariaField('foto', compressed);
                                 } catch (err) {
                                   console.warn("Could not compress photo", err);
                                 }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Right block: Action triggers */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isToday ? (
                      <div className="flex flex-col gap-2 items-end">
                        {!(dbRecord.chegada && dbRecord.saida) ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              disabled={!!dbRecord.chegada || !isCheckinReleased}
                              onClick={() => {
                                const bTime = getBrasiliaTime();
                                handleLogDiariaField('chegada', bTime);
                              }}
                              className={`px-4 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm min-h-[44px] ${
                                dbRecord.chegada
                                  ? 'bg-neutral-200 text-neutral-450 border border-neutral-300 cursor-not-allowed opacity-80'
                                  : !isCheckinReleased
                                  ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-75'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                              }`}
                              title={
                                dbRecord.chegada 
                                  ? `Check-in realizado às ${dbRecord.chegada}` 
                                  : isCheckinTimeNotReached
                                  ? `Check-in bloqueado até as ${dbRecord.liberadoCheckinHora}`
                                  : !isCheckinReleased 
                                  ? 'Check-in bloqueado (aguardando liberação do gestor)' 
                                  : "Registrar horário atual de chegada com geolocalização automática"
                              }
                            >
                              {!dbRecord.chegada && !isCheckinReleased ? (
                                <>
                                  <span>🔒 CHECK-IN BLOQUEADO</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className={`w-4 h-4 ${dbRecord.chegada ? 'text-neutral-400' : ''}`} />
                                  <span>{dbRecord.chegada ? `CHECK-IN (Às ${dbRecord.chegada})` : 'CHECK-IN (Chegada)'}</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={!!dbRecord.saida || !isCheckoutReleased}
                              onClick={() => {
                                const bTime = getBrasiliaTime();
                                handleLogDiariaField('saida', bTime);
                              }}
                              className={`px-4 py-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm min-h-[44px] ${
                                dbRecord.saida
                                  ? 'bg-neutral-200 text-neutral-450 border border-neutral-300 cursor-not-allowed opacity-80'
                                  : !isCheckoutReleased
                                  ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-75'
                                  : 'bg-neutral-900 hover:bg-neutral-850 text-white cursor-pointer active:scale-95'
                              }`}
                              title={
                                dbRecord.saida 
                                  ? `Check-out realizado às ${dbRecord.saida}` 
                                  : isCheckoutTimeNotReached
                                  ? `Check-out bloqueado até as ${dbRecord.liberadoCheckoutHora}`
                                  : !isCheckoutReleased 
                                  ? 'Check-out bloqueado (aguardando liberação do gestor)' 
                                  : "Registrar horário atual de saída com geolocalização automática"
                              }
                            >
                              {!dbRecord.saida && !isCheckoutReleased ? (
                                <>
                                  <span>🔒 CHECK-OUT BLOQUEADO</span>
                                </>
                              ) : (
                                <span>{dbRecord.saida ? `CHECK-OUT (Às ${dbRecord.saida})` : 'CHECK-OUT (Saída)'}</span>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="animate-fade-in mt-0.5">
                            {dbRecord.confirmadoPeloGestor ? (
                              <span className="px-3.5 py-2 text-[10px] font-bold text-emerald-850 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1 shadow-3xs uppercase tracking-wide">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Confirmado pelo Gestor
                              </span>
                            ) : (
                              <span className="px-3.5 py-2 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-1 shadow-3xs uppercase tracking-wide animate-pulse">
                                <Clock className="w-3.5 h-3.5 text-purple-600 animate-spin" /> Em Aprovação
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 items-end">
                        {dbRecord.confirmadoPeloGestor ? (
                          <span className="px-3.5 py-2 text-[10px] font-bold text-emerald-850 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1 shadow-3xs uppercase tracking-wide">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Confirmado
                          </span>
                        ) : dbRecord.preenchidoManualmente ? (
                          <span className="px-3.5 py-2 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-1 shadow-3xs uppercase tracking-wide animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-purple-600 animate-spin" /> Em Aprovação
                          </span>
                        ) : (dbRecord.chegada || dbRecord.saida) ? (
                          <div className="flex flex-col gap-1 items-end animate-fade-in">
                            <button
                              type="button"
                              onClick={() => {
                                const currentDiarias = alloc.task?.diariasData || {};
                                const dateRecord = currentDiarias[key] || {};
                                const fid = alloc.freelancerId;
                                if (fid) {
                                  const freelancerRecord = dateRecord[fid] || {};
                                  const finalFreeRec = {
                                    ...freelancerRecord,
                                    preenchidoManualmente: true,
                                    confirmadoPeloGestor: false
                                  };
                                  const finalDateRec = { ...dateRecord, [fid]: finalFreeRec };
                                  const finalDiarias = { ...currentDiarias, [key]: finalDateRec };
                                  onUpdateTask({ ...(alloc.task || {} as any), diariasData: finalDiarias });
                                }
                              }}
                              className="px-4 py-2.5 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:scale-102 active:scale-98 transition-all duration-155 flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer select-none"
                              title="Clique para enviar os horários preenchidos ao gestor para aprovação"
                            >
                              <Send className="w-3.5 h-3.5 text-white" />
                              <span>Enviar para Aprovação</span>
                            </button>
                            <span className="text-[9px] text-amber-600/80 font-bold font-sans">
                              ⚠️ Horário preenchido mas não enviado
                            </span>
                          </div>
                        ) : (
                          <span className="px-3.5 py-2 text-[10px] font-bold text-neutral-450 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center gap-1">
                            Pendente
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

