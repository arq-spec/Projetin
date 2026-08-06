import React, { useState, useMemo } from 'react';
import { Freelancer, CalendarEvent, Task, UserProfile } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Plus, 
  Info,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  PlusCircle,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';

interface FreelancerCalendarViewProps {
  freelancers: Freelancer[];
  tasks?: Task[];
  currentUser?: UserProfile | null;
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onNavigateToProject?: (projectId: string) => void;
}

const PROJECT_COLUMNS_COLORS = [
  { bg: 'bg-purple-600', text: 'text-purple-800', lightBg: 'bg-purple-50 border-purple-200' },
  { bg: 'bg-pink-600', text: 'text-pink-800', lightBg: 'bg-pink-50 border-pink-200' },
  { bg: 'bg-sky-600', text: 'text-sky-800', lightBg: 'bg-sky-50 border-sky-200' },
  { bg: 'bg-amber-600', text: 'text-amber-800', lightBg: 'bg-amber-50 border-amber-200' },
  { bg: 'bg-emerald-600', text: 'text-emerald-800', lightBg: 'bg-emerald-50 border-emerald-250' },
  { bg: 'bg-purple-600', text: 'text-purple-800', lightBg: 'bg-purple-50 border-purple-200' },
  { bg: 'bg-rose-600', text: 'text-rose-800', lightBg: 'bg-rose-50 border-rose-200' },
  { bg: 'bg-violet-600', text: 'text-violet-800', lightBg: 'bg-violet-50 border-violet-200' },
  { bg: 'bg-teal-600', text: 'text-teal-800', lightBg: 'bg-teal-50 border-teal-200' },
  { bg: 'bg-orange-600', text: 'text-orange-850', lightBg: 'bg-orange-50 border-orange-200' },
];

export default function FreelancerCalendarView({ 
  freelancers, 
  tasks = [],
  currentUser,
  events, 
  onAddEvent, 
  onDeleteEvent,
  onNavigateToProject
}: FreelancerCalendarViewProps) {
  
  // Selection States
  const isFreelancer = currentUser?.perfil === 'Freelancer';
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(isFreelancer ? (currentUser?.freelancerId || freelancers[0]?.id || '') : 'all');
  
  // Year/Month states - Defaulting to Current Date
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  // Day dialog trigger
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [newEventTipo, setNewEventTipo] = useState<'Disponível' | 'Ocupado' | 'Indisponível'>('Disponível');
  const [newEventTitulo, setNewEventTitulo] = useState('');

  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const monthsBr = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const selectedFreelancer = freelancers.find(f => f.id === selectedFreelancerId);

  const projectsToShow = useMemo(() => {
    // Excluir projetos com status 'Concluído'
    const activeTasks = tasks.filter(t => t.status !== 'Concluído');

    if (selectedFreelancerId === 'all') return activeTasks;

    return activeTasks.filter(t => 
      (t.alocacoes || []).some(a => {
        if (a.freelancerId !== selectedFreelancerId) return false;
        if (isFreelancer) {
          return a.statusConfirmacao === 'Chamado' || a.statusConfirmacao === 'Confirmado';
        }
        return a.statusConfirmacao !== 'Recusado';
      })
    );
  }, [tasks, selectedFreelancerId, isFreelancer]);

  const projectColorMap = useMemo(() => {
    const map: Record<string, typeof PROJECT_COLUMNS_COLORS[0]> = {};
    tasks.forEach((t, i) => {
      map[t.id] = PROJECT_COLUMNS_COLORS[i % PROJECT_COLUMNS_COLORS.length];
    });
    return map;
  }, [tasks]);

  const getProjectStartEnd = (project: Task) => {
    if (selectedFreelancerId !== 'all') {
      const alloc = (project.alocacoes || []).find(
        a => {
          if (a.freelancerId !== selectedFreelancerId) return false;
          if (isFreelancer) {
            return a.statusConfirmacao === 'Chamado' || a.statusConfirmacao === 'Confirmado';
          }
          return a.statusConfirmacao !== 'Recusado';
        }
      );
      if (!alloc) return { start: undefined, end: undefined };
      return { start: alloc.dataInicio, end: alloc.dataFim || alloc.dataInicio };
    }
    return { 
      start: project.dataInicio || project.dataFim, 
      end: project.dataFim || project.dataInicio 
    };
  };

  const isDateCoveredByProject = (dateStr: string, project: Task) => {
    const { start, end } = getProjectStartEnd(project);
    if (!start || !end) return false;
    return dateStr >= start && dateStr <= end;
  };

  const isMonthCoveredByProject = (year: number, monthIndex: number, project: Task) => {
    const { start, end } = getProjectStartEnd(project);
    if (!start || !end) return false;
    const monthStart = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const monthEnd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return start <= monthEnd && end >= monthStart;
  };

  const hasProjectsInMonth = (year: number, monthIndex: number) => {
    return projectsToShow.some(p => isMonthCoveredByProject(year, monthIndex, p));
  };

  const sidebarProjects = useMemo(() => {
    if (!selectedDateStr) return projectsToShow;
    return projectsToShow.filter(p => isDateCoveredByProject(selectedDateStr, p));
  }, [projectsToShow, selectedDateStr, selectedFreelancerId]);

  // Helper helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Build dates representation
  const calendarDays: { dayNumber: number | null; dateString: string }[] = [];
  
  // Blank days before the 1st
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ dayNumber: null, dateString: '' });
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(i).padStart(2, '0');
    const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
    calendarDays.push({ dayNumber: i, dateString });
  }

  // Get events scoped to current freelancer
  const filterOutDeliveries = (evts: CalendarEvent[]) => evts.filter(e => !(e.id.startsWith('ev-task-') && e.titulo.startsWith('Entrega:')));
  const freelancerEvents = filterOutDeliveries(selectedFreelancerId === 'all' 
    ? events
    : events.filter(e => e.freelancerId === selectedFreelancerId));

  const handleDayClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    if (isFreelancer) {
      setShowAddEventForm(true);
      setNewEventTitulo('');
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateStr || !newEventTitulo) return;

    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      freelancerId: currentUser?.freelancerId || selectedFreelancerId,
      data: selectedDateStr,
      tipo: newEventTipo,
      titulo: newEventTitulo
    };

    onAddEvent(newEvent);
    setShowAddEventForm(false);
    setNewEventTitulo('');
  };

  const getDayElementDetails = (dateStr: string) => {
    const dayEvent = freelancerEvents.find(e => e.data === dateStr);
    if (!dayEvent) {
      return { 
        styleClass: 'bg-white text-neutral-800 hover:bg-neutral-50 border-neutral-100',
        label: 'Disponível (Padrão)',
        bgDot: 'bg-neutral-300',
        tipo: null
      };
    }

    switch (dayEvent.tipo) {
      case 'Disponível':
        return {
          styleClass: 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-50 border-emerald-250 font-medium',
          label: dayEvent.titulo,
          bgDot: 'bg-emerald-500',
          tipo: 'Disponível',
          id: dayEvent.id
        };
      case 'Ocupado':
        return {
          styleClass: 'bg-amber-50/70 text-amber-800 hover:bg-amber-50 border-amber-250 font-medium',
          label: dayEvent.titulo,
          bgDot: 'bg-purple-600',
          tipo: 'Ocupado',
          id: dayEvent.id
        };
      case 'Indisponível':
        return {
          styleClass: 'bg-rose-50/70 text-rose-800 hover:bg-rose-50 border-rose-250 font-medium',
          label: dayEvent.titulo,
          bgDot: 'bg-rose-500',
          tipo: 'Indisponível',
          id: dayEvent.id
        };
    }
  };

  return (
    <div className="space-y-6" id="calendar-tab">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Agenda de Disponibilidade</h1>
        <p className="text-neutral-500 text-sm mt-1">Monitore, edite compromissos, agende trabalhos e reserve datas na cadência de cada freelancer.</p>
      </div>

      {/* Select Freelancer bar & Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        
        {/* Freelancer profile select info card */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs lg:col-span-1 flex flex-col gap-4 overflow-hidden min-h-0 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="space-y-4 shrink-0">
            <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">Profissional em Exibição</label>
            <select
              value={selectedFreelancerId}
              onChange={(e) => {
                setSelectedFreelancerId(e.target.value);
                setShowAddEventForm(false);
              }}
              className="w-full text-sm border border-neutral-220 rounded-lg p-3 bg-neutral-50/50 font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              {!isFreelancer && <option value="all">Ver Todos os Talentos</option>}
              {freelancers.filter(f => !f.arquivado).map(f => (
                <option key={f.id} value={f.id}>
                  {f.nome} ({f.cargo})
                </option>
              ))}
            </select>

            {selectedFreelancer && (
              <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs">
                <div>
                  <span className="text-neutral-400 font-medium">Especialidade:</span>
                  <span className="block font-semibold text-neutral-800 mt-0.5">{selectedFreelancer.cargo}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium">Compromissos agendados:</span>
                  <span className="block font-semibold text-neutral-800 mt-0.5">{freelancerEvents.filter(e => e.freelancerId === selectedFreelancer.id).length} datas assinaladas</span>
                </div>
              </div>
            )}

            {/* Quick instructions and color guides */}
            <div className="pt-4 border-t border-neutral-100 space-y-2 text-xs">
              <span className="font-bold text-neutral-700 block">Legenda da Agenda:</span>
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span>Disponível / Livre</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span>
                <span>Ocupado (Em outra demanda)</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span>Bloqueado / Indisponível</span>
              </div>
            </div>
          </div>

          {/* In-Progress Projects Legend section */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col flex-1 min-h-0 text-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-neutral-700 block shrink-0">
                {selectedDateStr ? `Eventos do Dia` : 'Todos os Projetos:'}
              </span>
              {selectedDateStr && (
                <button 
                  onClick={() => setSelectedDateStr(null)}
                  className="text-[10px] text-purple-600 hover:text-purple-800 underline cursor-pointer truncate pl-2"
                >
                  Ver todos
                </button>
              )}
            </div>
            
            {sidebarProjects.length === 0 ? (
              <span className="text-[11px] text-neutral-400 italic block py-1">Nenhum projeto alocado.</span>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
                {sidebarProjects.map(proj => {
                  const colors = projectColorMap[proj.id];
                  return (
                    <div 
                      key={proj.id} 
                      onClick={() => onNavigateToProject?.(proj.id)}
                      className="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 cursor-pointer border border-neutral-200 flex flex-col gap-1 text-left transition-colors"
                      title="Clique para gerenciar este projeto"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.bg}`} />
                        <span className="font-extrabold text-neutral-900 truncate leading-tight flex-1" title={proj.titulo}>
                          {proj.titulo}
                        </span>
                      </div>
                      {proj.projeto && (
                        <span className="text-[10px] text-neutral-500 truncate" title={proj.projeto}>
                          {proj.projeto}
                        </span>
                      )}
                      <span className="text-[9px] text-neutral-400 font-mono">
                        {proj.dataInicio?.split('-').reverse().join('/')} até {proj.dataFim?.split('-').reverse().join('/') || proj.dataEntrega?.split('-').reverse().join('/') || 'A definir'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Core interface */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs lg:col-span-3">
          
          {/* Monthly header navigation */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="bg-neutral-900 text-white p-2.5 rounded-lg cursor-pointer hover:bg-neutral-800 transition-colors flex items-center justify-center"
                >
                  <Calendar className="w-5 h-5" />
                </button>
                
                {showMonthPicker && (
                  <div className="absolute top-12 left-0 w-64 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <button 
                        onClick={() => setCurrentYear(y => y - 1)}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-600 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-neutral-900">{currentYear}</span>
                      <button 
                        onClick={() => setCurrentYear(y => y + 1)}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-600 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {monthsBr.map((m, idx) => {
                        const isCurrent = currentMonth === idx;
                        const hasProjects = hasProjectsInMonth(currentYear, idx);
                        
                        let baseClass = "py-2 px-1 text-xs rounded-lg font-medium text-center transition-all cursor-pointer ";
                        if (isCurrent) {
                          baseClass += "bg-neutral-900 text-white shadow-sm";
                        } else if (hasProjects) {
                          baseClass += "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200";
                        } else {
                          baseClass += "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-transparent";
                        }
                        
                        return (
                          <div 
                            key={m}
                            onClick={() => {
                              setCurrentMonth(idx);
                              setShowMonthPicker(false);
                            }}
                            className={baseClass}
                          >
                            {m.slice(0, 3)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 tracking-tight text-lg">
                  {monthsBr[currentMonth]} {currentYear}
                </h3>
                <p className="text-xs text-neutral-550">Clique nas casas decimais e mude a disponibilidade.</p>
              </div>
            </div>

            <div className="flex gap-1 bg-neutral-50 p-1.5 rounded-lg border border-neutral-200">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 text-neutral-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 text-neutral-600 hover:text-black hover:bg-white rounded transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekly Days Header */}
          <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((item, index) => {
              if (item.dayNumber === null) {
                return <div key={`empty-${index}`} className="min-h-[110px] sm:min-h-[125px] w-full bg-neutral-50/40 rounded-lg border border-neutral-100/60" />;
              }

              const details = getDayElementDetails(item.dateString);
              // Filter active projects for this calendar day
              const activeProjectsForDay = projectsToShow.filter(p => isDateCoveredByProject(item.dateString, p));

              return (
                <div
                  key={`day-${item.dayNumber}`}
                  onClick={() => handleDayClick(item.dateString)}
                  className={`min-h-[110px] sm:min-h-[125px] w-full p-2 border rounded-xl flex flex-col justify-between transition-all cursor-pointer text-left ${details.styleClass}`}
                  title={details.label}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold font-mono">{item.dayNumber}</span>
                    <span className={`w-2 h-2 rounded-full ${details.bgDot}`} />
                  </div>

                  {/* Project Bars rendered inside the cell */}
                  {activeProjectsForDay.length > 0 && (
                    <div className="my-1.5 space-y-1 w-full text-left overflow-hidden">
                      {(activeProjectsForDay.length > 4 ? activeProjectsForDay.slice(0, 3) : activeProjectsForDay.slice(0, 4)).map(proj => {
                        const colors = projectColorMap[proj.id];
                        return (
                          <div
                            key={proj.id}
                            className={`text-[7px] font-semibold px-1 py-0.5 rounded flex items-center gap-1 leading-tight ${colors.bg} text-white shadow-sm`}
                            title={`${proj.titulo}${proj.projeto ? ` (${proj.projeto})` : ''}`}
                          >
                            <span className="line-clamp-2">{proj.titulo}</span>
                          </div>
                        );
                      })}
                      {activeProjectsForDay.length > 4 && (
                        <div className="text-[7px] font-bold px-1 py-1 rounded bg-neutral-200 text-neutral-700 text-center shadow-sm w-full truncate">
                          +{activeProjectsForDay.length - 3} Eventos
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[9px] truncate font-medium max-w-full leading-tight hidden sm:block text-neutral-500 mt-auto shrink-0">
                    {details.tipo ? details.label : 'Livre'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit availability dialog/panel below or visual slider */}
      {showAddEventForm && selectedDateStr && isFreelancer && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-50 p-5 rounded-xl border border-neutral-200 mt-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-medium text-xs">Alterando data:</span>
              <span className="bg-neutral-900 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                {selectedDateStr.split('-').reverse().join('/')}
              </span>
            </div>
            
            <button 
              onClick={() => setShowAddEventForm(false)}
              className="text-xs text-neutral-500 hover:text-black hover:underline"
            >
              Cancelar Edição
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">Classificação da Data</label>
              <div className="grid grid-cols-3 gap-1 bg-neutral-200 p-1 rounded-lg">
                {(['Disponível', 'Ocupado', 'Indisponível'] as const).map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setNewEventTipo(tipo)}
                    className={`py-1 rounded text-xs font-bold text-center transition-all ${
                      newEventTipo === tipo 
                        ? 'bg-neutral-900 text-white shadow-xs' 
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase mb-2">Descrição / Resumo do dia</label>
              <input
                type="text"
                placeholder="Ex: Folga / Atendimento Cliente Vanguard "
                value={newEventTitulo}
                onChange={(e) => setNewEventTitulo(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-950"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Salvar Status na Agenda
              </button>

              {/* Delete Event custom handler if already exists for this date */}
              {freelancerEvents.find(e => e.data === selectedDateStr) && (
                <button
                  type="button"
                  onClick={() => {
                    const foundId = freelancerEvents.find(e => e.data === selectedDateStr)?.id;
                    if (foundId) {
                      onDeleteEvent(foundId);
                      setShowAddEventForm(false);
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
                  title="Expurgar/Remover compromisso"
                >
                  Expurgar
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}

    </div>
  );
}
