import React, { useState } from 'react';
import { Freelancer, Notification, Task, UserProfile } from '../types';
import { 
  Bell, 
  Send, 
  Trash2, 
  CheckCheck, 
  AlertTriangle, 
  Megaphone,
  User,
  Filter,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  freelancers: Freelancer[];
  notifications: Notification[];
  onAddNotification: (notification: Notification) => void;
  onMarkNotificationAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  onNavigateToKanbanCard?: (cardId: string) => void;
  tasks?: Task[];
  onUpdateTask?: (task: Task) => void;
  currentUser?: UserProfile | null;
}

export default function NotificationCenter({
  freelancers,
  notifications,
  onAddNotification,
  onMarkNotificationAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  onNavigateToKanbanCard,
  tasks = [],
  onUpdateTask,
  currentUser
}: NotificationCenterProps) {
  
  // States
  const [filterFreelancerId, setFilterFreelancerId] = useState('Todos');
  const [newTargetId, setNewTargetId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newMensagem, setNewMensagem] = useState('');
  const [newTipo, setNewTipo] = useState<'Demanda' | 'Info' | 'Urgente'>('Demanda');

  const isFreelancer = currentUser?.perfil === 'Freelancer';

  // Filter logs list
  const rawFilteredNotifications = notifications.filter(n => {
    if (isFreelancer) {
      const uEmail = currentUser.email?.toLowerCase();
      const relevantFreelancers = freelancers.filter(f => f.id === currentUser?.freelancerId || (f.email && f.email.toLowerCase() === uEmail));
      const possibleFreelancerIds = [currentUser?.freelancerId, ...relevantFreelancers.map(f => f.id), 'all'].filter(Boolean);
      return possibleFreelancerIds.includes(n.freelancerId) || !n.freelancerId;
    }
    return filterFreelancerId === 'Todos' || n.freelancerId === filterFreelancerId;
  });

  // Deduplicate by ID to guarantee unique React keys
  const filteredNotifications = (() => {
    const seen = new Set<string>();
    return rawFilteredNotifications.filter(n => {
      if (!n || !n.id) return false;
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  })();

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMensagem) {
      alert('Preencha o título e o corpo da mensagem.');
      return;
    }

    const linkedFree = freelancers.find(f => f.id === newTargetId);

    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      freelancerId: newTargetId || 'all',
      freelancerNome: linkedFree ? linkedFree.nome : 'Todos os Profissionais',
      titulo: newTitle,
      mensagem: newMensagem,
      data: new Date().toISOString(),
      lida: false,
      tipo: newTipo
    };

    onAddNotification(newNotif);

    // Reset Form
    setNewTitle('');
    setNewMensagem('');
    setNewTipo('Demanda');
    setNewTargetId('');
  };

  const handleConfirmAction = (notif: Notification, status: 'Confirmado' | 'Recusado' | 'Chamado', msg?: string) => {
    if (!tasks || !onUpdateTask) {
      alert('Acesso ao módulo de projetos não está disponível.');
      return;
    }

    let currentProject = tasks.find(t => t.id === notif.projetoId);
    
    // Fallback if projetoId is missing (legacy notifications) or ID changed
    if (!currentProject && notif.titulo.startsWith('Convite de Serviço: ')) {
      const extractedTitle = notif.titulo.replace('Convite de Serviço: ', '').trim();
      currentProject = tasks.find(t => t.titulo.trim() === extractedTitle);
    }

    if (!currentProject) {
      alert(`O projeto não foi identificado. Procurado: ${notif.projetoId}, Total tarefas: ${tasks?.length || 0}. A notificação será removida.`);
      if (notif.id && onDeleteNotification) {
        onDeleteNotification(notif.id);
      }
      return;
    }

    // Now we need the allocation ID. If we don't have it, try to match by freelancerId
    const targetAlocacaoId = notif.alocacaoId;

    let updatedAlloc = (currentProject.alocacoes || []);
    let foundAlloc = false;

    updatedAlloc = updatedAlloc.map(a => {
      // Prioritize checking by alocacaoId, fallback to freelancerId
      if ((targetAlocacaoId && a.id === targetAlocacaoId) || (!targetAlocacaoId && a.freelancerId === notif.freelancerId)) {
        foundAlloc = true;
        return {
          ...a,
          statusConfirmacao: status,
          ...(msg !== undefined ? { chamadoMensagem: msg } : {})
        };
      }
      return a;
    });

    if (!foundAlloc) {
        // If allocation wasn't found, still remove notification to unblock user
        alert(`Sua alocação não foi encontrada no projeto "${currentProject.titulo}". O gestor pode tê-la removido. Esta notificação será descartada.`);
        if (notif.id && onDeleteNotification) {
          onDeleteNotification(notif.id);
        }
        return;
    }

    const updatedTask = {
      ...currentProject,
      alocacoes: updatedAlloc
    };

    onUpdateTask(updatedTask);
    
    // Auto remove notification
    if (notif.id && onDeleteNotification) {
        onDeleteNotification(notif.id);
    }
    
    alert(`Status atualizado com sucesso na alocação operacional para: ${status === 'Recusado' ? 'Recusado (✕)' : status === 'Confirmado' ? 'Confirmado (✓)' : 'Chamado (✉)'}!`);
  };

  const getNotificationBadge = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'Urgente':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">
            <AlertTriangle className="w-3 h-3" />
            Urgente
          </span>
        );
      case 'Demanda':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
            <Megaphone className="w-3 h-3" />
            Nova Demanda
          </span>
        );
      case 'Info':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded border border-neutral-200">
            <Info className="w-3 h-3 text-neutral-500" />
            Sistemas
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="notifications-tab">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">Notificações e Demandas</h1>
        <p className="text-neutral-500 text-sm mt-1">Dispare convites, alertas prioritários de alteração de escopo, ou e-mails de cobrança centralizados.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Disparador de Alertas panel */}
        {!isFreelancer && (
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs lg:col-span-2 space-y-4 h-fit animate-fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <span className="bg-sky-50 text-sky-700 p-2 rounded-lg">
                <Send className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-neutral-900">Disparador de Alertas</h3>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wide mb-1">Destinatário</label>
                <select 
                  value={newTargetId} 
                  onChange={(e) => setNewTargetId(e.target.value)}
                  className="w-full text-xs border border-neutral-220 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-neutral-50/50 cursor-pointer font-medium"
                >
                  <option value="">Todos os Freelancers (Canais de Broadcast)</option>
                  {freelancers.filter(f => !f.arquivado).map(f => (
                    <option key={f.id} value={f.id}>{f.nome} ({f.cargo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wide mb-1">Categoria de Notificação</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-lg">
                  {(['Demanda', 'Urgente', 'Info'] as const).map(tp => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setNewTipo(tp)}
                      className={`py-1.5 rounded-md font-bold text-center transition-all cursor-pointer ${
                        newTipo === tp 
                          ? tp === 'Urgente'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : tp === 'Demanda'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-neutral-800 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-800'
                      }`}
                    >
                      {tp === 'Demanda' ? 'Demanda' : tp === 'Urgente' ? 'Urgência' : 'Informativo'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wide mb-1">Título da Notificação *</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Urgente: Alteração no escopo do Layout" 
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wide mb-1">Corpo da Mensagem *</label>
                <textarea 
                  rows={4}
                  value={newMensagem} 
                  onChange={(e) => setNewMensagem(e.target.value)}
                  placeholder="Descreva sobre a alteração, o escopo de reuniões, ou links dos materiais necessários para que o freelancer leia instantaneamente..." 
                  className="w-full text-xs border border-neutral-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar Notificação
              </button>
            </form>
          </div>
        )}

        {/* Central de Recebíveis / Histórico do log panel */}
        <div className={`bg-white rounded-xl border border-neutral-200 p-5 shadow-xs ${isFreelancer ? 'lg:col-span-5' : 'lg:col-span-3'} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="bg-neutral-50 text-neutral-600 p-2 rounded-lg">
                <Bell className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-neutral-900">Diário de Notificações</h3>
            </div>

            {/* Quick Actions and logs target filtering */}
            {!isFreelancer && (
              <div className="flex flex-wrap gap-2 text-xs animate-fade-in animate-duration-150">
                <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1">
                  <span className="text-neutral-400 mr-1.5"><Filter className="w-3.5 h-3.5" /></span>
                  <select 
                    value={filterFreelancerId} 
                    onChange={(e) => setFilterFreelancerId(e.target.value)}
                    className="bg-transparent border-none outline-none text-neutral-700 cursor-pointer font-medium"
                  >
                    <option value="Todos">Exibir Todos Destinatários</option>
                    <option value="all">Canais Globais (Todos)</option>
                    {freelancers.filter(f => !f.arquivado).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>

                {notifications.length > 0 && (
                  <button
                    onClick={onClearAllNotifications}
                    className="px-3 py-1 border border-neutral-200 text-neutral-600 hover:text-black rounded-lg bg-white transition-all text-xs font-medium cursor-pointer"
                  >
                    Limpar Historico
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List of alerts */}
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-16 text-neutral-400 italic text-xs">
                  Nenhuma notificação registrada para esta visualização.
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onClick={() => {
                      onMarkNotificationAsRead(notif.id);
                      if (notif.cardId && onNavigateToKanbanCard) {
                        onNavigateToKanbanCard(notif.cardId);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-3 relative justify-between group ${
                      notif.lida 
                        ? 'bg-neutral-50/50 border-neutral-200 text-neutral-600' 
                        : 'bg-neutral-50/20 border-sky-200 text-neutral-850 font-medium hover:border-sky-300'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Left blue unread circle */}
                      {!notif.lida && (
                        <span className="absolute left-1.5 top-1.5 w-2 h-2 rounded-full bg-sky-500" title="Mensagem não lida"></span>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getNotificationBadge(notif.tipo)}
                          <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Target: <span className="font-semibold text-neutral-700">{notif.freelancerNome}</span>
                          </span>
                        </div>
                        
                        <h4 className="text-xs font-bold text-neutral-900 leading-tight pt-1">{notif.titulo}</h4>
                        <p className="text-xs text-neutral-605 leading-relaxed pr-8 whitespace-pre-line bg-neutral-100/50 p-2.5 rounded-lg border border-neutral-150 mt-1 font-medium">{notif.mensagem}</p>
                        
                        {notif.isConfirmacaoRequest && notif.projetoId && notif.alocacaoId && (
                          <div className="mt-3 flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmAction(notif, 'Confirmado');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              ✓ CONFIRMAR
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmAction(notif, 'Recusado');
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              ✕ RECUSAR
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const msg = prompt('Por gentileza, insira a mensagem/detalhe do chamado que deseja enviar:');
                                if (msg !== null) {
                                  handleConfirmAction(notif, 'Chamado', msg);
                                }
                              }}
                              className="px-3 py-1.5 bg-amber-50 border border-amber-305 text-amber-800 hover:bg-amber-100 rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              ✉ ENVIAR UM CHAMADO
                            </button>
                          </div>
                        )}
                        
                        <span className="text-[10px] text-neutral-400 block pt-1.5 font-mono">
                          {new Date(notif.data).toLocaleDateString()} {new Date(notif.data).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-end gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(notif.id);
                        }}
                        className="text-neutral-400 hover:text-rose-600 p-1.5 hover:bg-neutral-100 rounded-lg transition-all"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {!notif.lida && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkNotificationAsRead(notif.id);
                          }}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 p-1 rounded-md text-[10px] font-bold border border-sky-100 flex items-center gap-1 transition-all"
                          title="Marcar como lido"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Lido?
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

    </div>
  );
}
