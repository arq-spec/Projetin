import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { loadFromDatabase, saveToDatabase } from '../database';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Users, 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  Tag, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Filter, 
  MoreHorizontal, 
  Folder,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  UserPlus,
  Compass,
  AlertTriangle,
  Settings,
  Maximize2,
  FileText,
  Image as ImageIcon,
  Upload,
  Eye,
  BookOpen
} from 'lucide-react';
import Markdown from 'react-markdown';
import { 
  Freelancer, 
  UserProfile, 
  WorkstationWorkspace, 
  KanbanColumn, 
  KanbanCard, 
  KanbanChecklistItem, 
  KanbanComment,
  Notification
} from '../types';

interface WorkstationProps {
  freelancers: Freelancer[];
  currentUser: UserProfile | null;
  onAddNotification?: (notification: Notification) => void;
  notifications?: Notification[];
  onMarkNotificationAsRead?: (id: string) => void;
  highlightCardId?: string | null;
  onClearHighlight?: () => void;
}

// Fixed theme colors for workspaces
const WORKSPACE_COLORS = [
  { name: 'Slate', class: 'bg-slate-500 border-slate-600 shadow-slate-100', hex: '#64748b' },
  { name: 'Indigo', class: 'bg-purple-500 border-purple-600 shadow-indigo-100', hex: '#6366f1' },
  { name: 'Amber', class: 'bg-purple-600 border-amber-600 shadow-amber-100', hex: '#f59e0b' },
  { name: 'Emerald', class: 'bg-emerald-500 border-emerald-600 shadow-emerald-100', hex: '#10b981' },
  { name: 'Rose', class: 'bg-rose-500 border-rose-600 shadow-rose-100', hex: '#f43f5e' },
  { name: 'Cyan', class: 'bg-cyan-500 border-cyan-600 shadow-cyan-100', hex: '#06b6d4' },
];

const DEFAULT_CARD_LABELS = [
  { name: 'Urgente', color: 'bg-rose-500 text-white dark:bg-rose-600' },
  { name: 'Atrasado', color: 'bg-red-500 text-white dark:bg-red-650' },
  { name: 'Importante', color: 'bg-purple-600 text-neutral-900 dark:bg-amber-600 dark:text-neutral-50' },
  { name: 'Planejamento', color: 'bg-blue-500 text-white dark:bg-blue-600' },
  { name: 'Técnico', color: 'bg-purple-500 text-white dark:bg-purple-600' },
  { name: 'Equipamento', color: 'bg-purple-500 text-white dark:bg-purple-600' },
  { name: 'Design / Palco', color: 'bg-pink-500 text-white dark:bg-pink-600' },
  { name: 'Finalizado', color: 'bg-emerald-500 text-white dark:bg-emerald-600' },
];

const TAG_COLOR_OPTIONS = [
  { name: 'Vermelho Crítico', class: 'bg-red-500 text-white dark:bg-red-600' },
  { name: 'Rosa Vibrante', class: 'bg-rose-500 text-white dark:bg-rose-600' },
  { name: 'Laranja Energético', class: 'bg-orange-500 text-white' },
  { name: 'Amarelo Alerta', class: 'bg-purple-600 text-neutral-900 dark:bg-amber-605 dark:text-neutral-50' },
  { name: 'Amarelo Suave', class: 'bg-yellow-400 text-neutral-900 dark:bg-yellow-500 dark:text-neutral-950' },
  { name: 'Verde Sucesso', class: 'bg-emerald-500 text-white dark:bg-emerald-600' },
  { name: 'Verde Folha', class: 'bg-green-550 text-white' },
  { name: 'Ciano Claro', class: 'bg-cyan-500 text-white dark:bg-cyan-600' },
  { name: 'Azul Celeste', class: 'bg-blue-500 text-white dark:bg-blue-600' },
  { name: 'Indigo Corporativo', class: 'bg-purple-600 text-white' },
  { name: 'Roxo Criativo', class: 'bg-purple-500 text-white dark:bg-purple-600' },
  { name: 'Pink Moderno', class: 'bg-pink-500 text-white dark:bg-pink-600' },
  { name: 'Cinza Neutro', class: 'bg-slate-500 text-white dark:bg-slate-600' },
  { name: 'Preto Profundo', class: 'bg-neutral-950 text-white dark:bg-neutral-800' }
];

const renderers = {
  h1: ({ children }: any) => <h1 className="text-sm font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 my-2 pb-1 border-b border-neutral-150/50 dark:border-neutral-800/50 font-sans uppercase">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xs font-bold tracking-tight text-neutral-850 dark:text-neutral-100 my-2 font-sans">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-[11px] font-bold text-neutral-855 dark:text-neutral-200 my-1.5 font-sans">{children}</h3>,
  p: ({ children }: any) => <p className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-relaxed my-1.5 whitespace-pre-wrap font-sans">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-4 my-1.5 space-y-1 text-[11px] text-neutral-700 dark:text-neutral-300 font-sans">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-4 my-1.5 space-y-1 text-[11px] text-neutral-700 dark:text-neutral-300 font-sans">{children}</ol>,
  li: ({ children }: any) => <li className="text-[11px] text-neutral-700 dark:text-neutral-300 font-sans">{children}</li>,
  blockquote: ({ children }: any) => <blockquote className="border-l-3 border-amber-500 pl-2 py-0.5 my-2 bg-neutral-50 dark:bg-neutral-950/40 rounded-r-lg text-[11px] italic text-neutral-600 dark:text-neutral-400 font-sans">{children}</blockquote>,
  code: ({ node, inline, className, children, ...props }: any) => {
    return (
      <code className="bg-neutral-100 dark:bg-neutral-950 px-1 py-0.5 rounded font-mono text-[10px] text-amber-600 dark:text-purple-500" {...props}>
        {children}
      </code>
    );
  },
  img: ({ node, ...props }: any) => (
    <img 
      {...props} 
      className="max-w-full h-auto rounded-xl my-2.5 shadow-3xs border border-neutral-200/80 dark:border-neutral-800/80 mx-auto max-h-[300px] object-contain" 
      referrerPolicy="no-referrer"
    />
  ),
  a: ({ children, href }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-purple-600 dark:text-purple-400 underline font-medium hover:text-indigo-700 font-sans"
    >
      {children}
    </a>
  )
};

export default function Workstation({ freelancers, currentUser, onAddNotification, notifications = [], onMarkNotificationAsRead, highlightCardId, onClearHighlight }: WorkstationProps) {
  // --- STATE ---
  const [workspaces, setWorkspaces] = useState<WorkstationWorkspace[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [cards, setCards] = useState<KanbanCard[]>([]);
  
  // Custom Editable Labels State
  const [cardLabels, setCardLabels] = useState<{ name: string; color: string }[]>(() => {
    const saved = localStorage.getItem('workstation_custom_labels_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_CARD_LABELS;
  });

  const [isManagingLabels, setIsManagingLabels] = useState(false);
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);
  const [labelFormName, setLabelFormName] = useState('');
  const [labelFormColor, setLabelFormColor] = useState('bg-purple-600 text-white');

  // Load/save custom labels list
  useEffect(() => {
    localStorage.setItem('workstation_custom_labels_v2', JSON.stringify(cardLabels));
  }, [cardLabels]);

  // Label handlers
  const handleAddLabel = (name: string, color: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (cardLabels.some(l => l.name.toLowerCase() === trimmed.toLowerCase())) return;
    const newLabels = [...cardLabels, { name: trimmed, color }];
    setCardLabels(newLabels);
  };

  const handleUpdateLabel = (index: number, newName: string, newColor: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const oldName = cardLabels[index].name;
    const updated = [...cardLabels];
    updated[index] = { name: trimmed, color: newColor };
    setCardLabels(updated);

    if (oldName !== trimmed) {
      setEditCardLabels(prev => prev.map(lbl => lbl === oldName ? trimmed : lbl));
      setCards(prev => {
        const nextCards = prev.map(c => ({
          ...c,
          labels: c.labels.map(lbl => lbl === oldName ? trimmed : lbl)
        }));
        persist(workspaces, columns, nextCards);
        return nextCards;
      });
    }
  };

  const handleDeleteLabel = (index: number) => {
    const labelToDelete = cardLabels[index].name;
    const updated = cardLabels.filter((_, i) => i !== index);
    setCardLabels(updated);

    setEditCardLabels(prev => prev.filter(lbl => lbl !== labelToDelete));
    setCards(prev => {
      const nextCards = prev.map(c => ({
        ...c,
        labels: c.labels.filter(lbl => lbl !== labelToDelete)
      }));
      persist(workspaces, columns, nextCards);
      return nextCards;
    });
  };
  
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  
  // UI Panels
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [isWorkspaceSettingsOpen, setIsWorkspaceSettingsOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cardDescViewMode, setCardDescViewMode] = useState<'view' | 'edit'>('view');
  const [modalWidth, setModalWidth] = useState<number>(() => {
    const saved = localStorage.getItem('frello_workstation_card_modal_width');
    return saved ? parseInt(saved, 10) : 850;
  });
  const [isResizable, setIsResizable] = useState(false);
  const [showCardLabelSelector, setShowCardLabelSelector] = useState(false);
  const [showCardMemberSelector, setShowCardMemberSelector] = useState(false);
  const [showCardDateSelector, setShowCardDateSelector] = useState(false);
  const [inlineEditingLabelIndex, setInlineEditingLabelIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('frello_workstation_card_modal_width', modalWidth.toString());
  }, [modalWidth]);

  // Custom Workspace Selector and Config States
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkstationWorkspace | null>(null);
  const [editWsName, setEditWsName] = useState('');
  const [editWsVisibility, setEditWsVisibility] = useState<'all' | 'restricted'>('all');
  const [editWsBgImage, setEditWsBgImage] = useState('');
  
  // Quick Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  
  // Forms & Temp Inputs
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsColor, setNewWsColor] = useState('#6366f1');
  const [newWsTeam, setNewWsTeam] = useState<string[]>([]);
  
  const [newColTitle, setNewColTitle] = useState<Record<string, string>>({}); // track input per column or next col form
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColFormTitle, setNewColFormTitle] = useState('');
  
  const [newCardTitle, setNewCardTitle] = useState<Record<string, string>>({}); // inline new card title input
  const [activeNewCardColId, setActiveNewCardColId] = useState<string | null>(null); // column showing card composer
  
  // Editing card states inside modal
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDesc, setEditCardDesc] = useState('');
  const [editCardPriority, setEditCardPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [editCardDueDate, setEditCardDueDate] = useState('');
  const [editCardLabels, setEditCardLabels] = useState<string[]>([]);
  const [editCardMembers, setEditCardMembers] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [expandedChecklistItemId, setExpandedChecklistItemId] = useState<string | null>(null);
  const [checklistCommentText, setChecklistCommentText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [boardAddRoleFilter, setBoardAddRoleFilter] = useState<string>('');
  const [boardAddFreelancerId, setBoardAddFreelancerId] = useState<string>('');
  
  // Mentions State
  const [mentionSearchText, setMentionSearchText] = useState<string | null>(null);
  const [mentionType, setMentionType] = useState<'main' | 'checklist' | null>(null);
  const [mentionCursor, setMentionCursor] = useState<number>(0);

  const [dbLoaded, setDbLoaded] = useState(false);
  
  const isLoadedRef = useRef({
    workspaces: false,
    columns: false,
    cards: false,
  });

  // --- INITIAL LOAD & SYNC ---
  useEffect(() => {
    async function loadWorkstationData() {
      try {
        const [dbWS, dbCols, dbCards] = await Promise.all([
          loadFromDatabase('workstation_workspaces').catch(err => { console.warn('[Database] failed workstation workspaces load', err); return null; }),
          loadFromDatabase('workstation_columns').catch(err => { console.warn('[Database] failed workstation columns load', err); return null; }),
          loadFromDatabase('workstation_cards').catch(err => { console.warn('[Database] failed workstation cards load', err); return null; })
        ]);

        if (dbWS !== null && dbCols !== null && dbCards !== null) {
          setWorkspaces(dbWS);
          setColumns(dbCols);
          setCards(dbCards);
          if (dbWS.length > 0) {
            setSelectedWorkspaceId(dbWS[0].id);
          }
          isLoadedRef.current.workspaces = true;
          isLoadedRef.current.columns = true;
          isLoadedRef.current.cards = true;
          setDbLoaded(true);
          return;
        }
      } catch (err) {
        console.warn("Failed to load workstation data from Database", err);
      }

      // Fallback
      const savedWS = localStorage.getItem('frello_workstation_workspaces');
      const savedCols = localStorage.getItem('frello_workstation_columns');
      const savedCards = localStorage.getItem('frello_workstation_cards');
      
      if (savedWS && savedCols && savedCards) {
        const parsedWS = JSON.parse(savedWS) as WorkstationWorkspace[];
        setWorkspaces(parsedWS);
        setColumns(JSON.parse(savedCols));
        setCards(JSON.parse(savedCards));
        if (parsedWS.length > 0) {
          setSelectedWorkspaceId(parsedWS[0].id);
        }
      } else {
        // PRE-POPULATE BEAUTIFUL DEMO DATA FOR BOTH TEAMS
        const demoWS: WorkstationWorkspace[] = [
          {
            id: 'ws-audiovisual',
            name: 'Produção Audiovisual & Mapping 3D',
            description: 'Equipe dedicada à produção de conteúdos projetados, painéis de LED de alta definição e sistemas de lasers integrados para festivais.',
            teamMemberIds: freelancers.slice(0, 4).map(f => f.id),
            createdAt: new Date().toISOString(),
            colorHex: '#6366f1'
          },
          {
            id: 'ws-logistica-som',
            name: 'Equipe de Logística, RF & Som P.A.',
            description: 'Área de montagem, controle e mapeamento de frequências de microfones, RF, e dimensionamento do sistema de alto-falantes principal.',
            teamMemberIds: freelancers.slice(2, 6).map(f => f.id),
            createdAt: new Date().toISOString(),
            colorHex: '#10b981'
          }
        ];

        const demoCols: KanbanColumn[] = [
          // Audiovisual
          { id: 'col-av-backlog', workspaceId: 'ws-audiovisual', title: 'Ideias / Briefing', order: 0 },
          { id: 'col-av-todo', workspaceId: 'ws-audiovisual', title: 'A Fazer (Pendente)', order: 1 },
          { id: 'col-av-progress', workspaceId: 'ws-audiovisual', title: 'Em Execução ⚡', order: 2 },
          { id: 'col-av-done', workspaceId: 'ws-audiovisual', title: 'Entregue / Pronto ✨', order: 3 },

          // Logística e Som
          { id: 'col-ls-todo', workspaceId: 'ws-logistica-som', title: 'Backlog Operacional', order: 0 },
          { id: 'col-ls-progress', workspaceId: 'ws-logistica-som', title: 'Montagem Ativa', order: 1 },
          { id: 'col-ls-done', workspaceId: 'ws-logistica-som', title: 'Concluído no Palco', order: 2 }
        ];

        const demoCards: KanbanCard[] = [
          // Audiovisual cards
          {
            id: 'card-av-briefing',
            columnId: 'col-av-backlog',
            workspaceId: 'ws-audiovisual',
            title: 'Briefing Criativo de Iluminação & Mapping',
            description: 'Estudo do alinhamento geométrico de projeção mapeada para a fachada do palco principal. Necessário coletar plantas CAD e conversar com o arquiteto do projeto.',
            priority: 'Baixa',
            labels: ['Planejamento', 'Design / Palco'],
            members: [freelancers[0]?.id || 'f1'],
            dueDate: '2026-07-10',
            checklist: [
              { id: 'ch-1', text: 'Obter plantas do auditório em DWG', done: true },
              { id: 'ch-2', text: 'Marcar reunião com fornecedor do projetor Christie Roadster 20k', done: false }
            ],
            comments: [
              { id: 'co-1', memberName: 'Coordenação Técnica', text: 'Lembrete: os projetores precisam de bases firmes livres de vibração.', date: '2026-06-13 10:15:00' }
            ]
          },
          {
            id: 'card-av-led',
            columnId: 'col-av-todo',
            workspaceId: 'ws-audiovisual',
            title: 'Alinhamento de Frequência do Painel de LED P2',
            description: 'Configuração do pitch de pixel de 2.5mm e da taxa de atualização do Painel de LED para evitar distorções nas camas de broadcast (flickering).',
            priority: 'Alta',
            labels: ['Urgente', 'Técnico'],
            members: [freelancers[1]?.id || 'f2', freelancers[2]?.id || 'f3'],
            dueDate: '2026-06-25',
            checklist: [
              { id: 'ch-3', text: 'Configurar controladora NovaStar MCTRL4K', done: false },
              { id: 'ch-4', text: 'Testar cabo HDMI de fibra óptica 50m', done: true }
            ],
            comments: []
          },
          {
            id: 'card-av-render',
            columnId: 'col-av-progress',
            workspaceId: 'ws-audiovisual',
            title: 'Renderização dos Clipes de Transição',
            description: 'Exportação das animações em ProRes 422 para garantir o playback suave no Resolume Arena durante a introdução de cada artista.',
            priority: 'Média',
            labels: ['Design / Palco', 'Equipamento'],
            members: [freelancers[3]?.id || 'f4'],
            dueDate: '2526-06-18', // Future date
            checklist: [
              { id: 'ch-5', text: 'Compor loop do fundo infinito em 60fps', done: true },
              { id: 'ch-6', text: 'Exportar clipe alfa transparente', done: true },
              { id: 'ch-7', text: 'Passar codecs DXV3 no compressor do Resolume', done: false },
              { id: 'ch-8', text: 'Instalar SSD reserva de alta velocidade na máquina switcher', done: false }
            ],
            comments: [
              { id: 'co-2', memberName: 'Fabio Castro', text: 'Processador está em 98% de carga, o primeiro pacote já foi exportado.', date: '2026-06-13 13:40:00' }
            ]
          },
          {
            id: 'card-av-cronograma',
            columnId: 'col-av-done',
            workspaceId: 'ws-audiovisual',
            title: 'Validação de Mapeador Art-Net DMX',
            description: 'Terminado o upload de fixture profiles para as cabeças móveis do palco secundário via rede Ethernet cabeada Cat6.',
            priority: 'Baixa',
            labels: ['Técnico', 'Finalizado'],
            members: [freelancers[0]?.id || 'f1'],
            dueDate: '2026-06-12',
            checklist: [
              { id: 'ch-9', text: 'Atribuição dos Universos DMX no software Chamsys MagicQ', done: true }
            ],
            comments: []
          },

          // Logística e Som cards
          {
            id: 'card-ls-coord',
            columnId: 'col-ls-todo',
            workspaceId: 'ws-logistica-som',
            title: 'Mapeamento de Espectro RF de Microfones Shure Axient',
            description: 'Efetuar varredura de radiofrequências local utilizando o software Shure Wireless Workbench para evitar interferências de canais de TV locais.',
            priority: 'Alta',
            labels: ['Urgente', 'Técnico'],
            members: [freelancers[2]?.id || 'f3'],
            dueDate: '2026-06-15',
            checklist: [
              { id: 'ch-10', text: 'Configurar antenas direcionais externas Shure UA874', done: false },
              { id: 'ch-11', text: 'Cadastrar 12 frequências sobressalentes', done: false }
            ],
            comments: []
          },
          {
            id: 'card-ls-line',
            columnId: 'col-ls-progress',
            workspaceId: 'ws-logistica-som',
            title: 'Alinhamento Temportal do Line Array dBTechnologies',
            description: 'Cálculo de delay utilizando Smaart v9 para os subs instalados em gradiente na seção frontal do palco, mitigando cancelamentos de subgrave.',
            priority: 'Média',
            labels: ['Planejamento', 'Equipamento'],
            members: [freelancers[4]?.id || 'f5', freelancers[5]?.id || 'f6'],
            dueDate: '2026-06-14',
            checklist: [
              { id: 'ch-12', text: 'Fixar posições dos microfones de medição no gramado', done: true },
              { id: 'ch-13', text: 'Ajustar DSP nos amplificadores via rede RDNet', done: false }
            ],
            comments: []
          }
        ];

        setWorkspaces(demoWS);
        setColumns(demoCols);
        setCards(demoCards);
        setSelectedWorkspaceId(demoWS[0].id);
        
        isLoadedRef.current.workspaces = true;
        isLoadedRef.current.columns = true;
        isLoadedRef.current.cards = true;

        // Save
        localStorage.setItem('frello_workstation_workspaces', JSON.stringify(demoWS));
        localStorage.setItem('frello_workstation_columns', JSON.stringify(demoCols));
        localStorage.setItem('frello_workstation_cards', JSON.stringify(demoCards));
      }
      setDbLoaded(true);
    }

    loadWorkstationData();
  }, [freelancers]);

  useEffect(() => {
    if (dbLoaded && highlightCardId && cards.length > 0) {
      const targetCard = cards.find(c => c.id === highlightCardId);
      if (targetCard) {
        const targetCol = columns.find(c => c.id === targetCard.columnId);
        if (targetCol && targetCol.workspaceId !== selectedWorkspaceId) {
          setSelectedWorkspaceId(targetCol.workspaceId);
        }
        handleOpenCardModal(targetCard);
        if (onClearHighlight) {
          onClearHighlight();
        }
      }
    }
  }, [dbLoaded, highlightCardId, cards, columns, selectedWorkspaceId, onClearHighlight]);

  // Persist State Helper
  const persist = (updatedWS: WorkstationWorkspace[], updatedCols: KanbanColumn[], updatedCards: KanbanCard[]) => {
    setWorkspaces(updatedWS);
    setColumns(updatedCols);
    setCards(updatedCards);
    localStorage.setItem('frello_workstation_workspaces', JSON.stringify(updatedWS));
    localStorage.setItem('frello_workstation_columns', JSON.stringify(updatedCols));
    localStorage.setItem('frello_workstation_cards', JSON.stringify(updatedCards));
    if (dbLoaded && isLoadedRef.current.workspaces && isLoadedRef.current.columns && isLoadedRef.current.cards) {
      saveToDatabase('workstation_workspaces', updatedWS).catch(e => console.warn('WStation sync write workspaces failed', e));
      saveToDatabase('workstation_columns', updatedCols).catch(e => console.warn('WStation sync write columns failed', e));
      saveToDatabase('workstation_cards', updatedCards).catch(e => console.warn('WStation sync write cards failed', e));
    }
  };

  const activeWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const activeWorkspaceCols = columns.filter(c => c.workspaceId === selectedWorkspaceId).sort((a,b) => a.order - b.order);

  // --- ACTIONS: WORKSPACE ---
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    
    const newId = `ws-${Date.now()}`;
    const newWS: WorkstationWorkspace = {
      id: newId,
      name: newWsName,
      description: newWsDesc,
      teamMemberIds: newWsTeam,
      createdAt: new Date().toISOString(),
      colorHex: newWsColor
    };

    // Default basic columns like Trello
    const defCols: KanbanColumn[] = [
      { id: `col-${newId}-todo`, workspaceId: newId, title: 'A Fazer 📋', order: 0 },
      { id: `col-${newId}-doing`, workspaceId: newId, title: 'Em Execução ⚡', order: 1 },
      { id: `col-${newId}-done`, workspaceId: newId, title: 'Concluído ✅', order: 2 }
    ];

    const updatedWS = [...workspaces, newWS];
    const updatedCols = [...columns, ...defCols];
    
    persist(updatedWS, updatedCols, cards);
    setSelectedWorkspaceId(newId);
    
    // reset form
    setNewWsName('');
    setNewWsDesc('');
    setNewWsColor('#6366f1');
    setNewWsTeam([]);
    setIsNewWorkspaceModalOpen(false);
  };

  const handleUpdateWorkspaceTeam = (memberId: string) => {
    if (!activeWorkspace) return;
    const currentTeam = activeWorkspace.teamMemberIds;
    const isMember = currentTeam.includes(memberId);
    
    const updatedTeam = isMember 
      ? currentTeam.filter(id => id !== memberId)
      : [...currentTeam, memberId];
      
    const updatedWS = workspaces.map(w => {
      if (w.id === activeWorkspace.id) {
        return { ...w, teamMemberIds: updatedTeam };
      }
      return w;
    });
    
    persist(updatedWS, columns, cards);
  };

  const handleDeleteWorkspace = (wsId: string) => {
    if (confirm('Deseja realmente excluir esta Área de Trabalho de equipe? Todas as colunas e cartões serão eliminados.')) {
      const remainingWS = workspaces.filter(w => w.id !== wsId);
      const remainingCols = columns.filter(c => c.workspaceId !== wsId);
      const remainingCards = cards.filter(c => c.workspaceId !== wsId);
      
      persist(remainingWS, remainingCols, remainingCards);
      
      if (selectedWorkspaceId === wsId && remainingWS.length > 0) {
        setSelectedWorkspaceId(remainingWS[0].id);
      } else if (remainingWS.length === 0) {
        setSelectedWorkspaceId('');
      }
      setIsWorkspaceSettingsOpen(false);
    }
  };

  const handleUpdateWorkspaceDetails = (wsId: string, name: string, visibility: 'all' | 'restricted', bgImage: string) => {
    const updated = workspaces.map(w => {
      if (w.id === wsId) {
        return {
          ...w,
          name,
          visibilityType: visibility,
          bgImage
        };
      }
      return w;
    });
    persist(updated, columns, cards);
    if (editingWorkspace && editingWorkspace.id === wsId) {
      setEditingWorkspace({
        ...editingWorkspace,
        name,
        visibilityType: visibility,
        bgImage
      });
    }
  };

  // --- ACTIONS: COLUMNS ---
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColFormTitle.trim() || !selectedWorkspaceId) return;

    const newCol: KanbanColumn = {
      id: `col-${Date.now()}`,
      workspaceId: selectedWorkspaceId,
      title: newColFormTitle.trim(),
      order: activeWorkspaceCols.length
    };

    persist(workspaces, [...columns, newCol], cards);
    setNewColFormTitle('');
    setIsAddingColumn(false);
  };

  const handleRenameColumn = (colId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updatedCols = columns.map(c => c.id === colId ? { ...c, title: newTitle } : c);
    persist(workspaces, updatedCols, cards);
  };

  const handleDeleteColumn = (colId: string) => {
    if (confirm('Remover esta coluna e transferir os cartões para o limbo?')) {
      const remainingCols = columns.filter(c => c.id !== colId);
      const remainingCards = cards.filter(c => c.columnId !== colId); // or edit to remove
      persist(workspaces, remainingCols, remainingCards);
    }
  };

  // --- ACTIONS: CARDS ---
  const handleAddCard = (colId: string) => {
    const title = newCardTitle[colId]?.trim();
    if (!title) return;

    const newCard: KanbanCard = {
      id: `card-${Date.now()}`,
      columnId: colId,
      workspaceId: selectedWorkspaceId,
      title,
      description: 'Nenhuma descrição técnica informada ainda.',
      priority: 'Média',
      labels: [],
      members: [],
      checklist: [],
      comments: []
    };

    persist(workspaces, columns, [...cards, newCard]);
    setNewCardTitle(prev => ({ ...prev, [colId]: '' }));
    setActiveNewCardColId(null);
  };

  const handleOpenCardModal = (card: KanbanCard) => {
    setSelectedCardId(card.id);
    setEditCardTitle(card.title);
    setEditCardDesc(card.description);
    setEditCardPriority(card.priority);
    setEditCardDueDate(card.dueDate || '');
    setEditCardLabels(card.labels);
    setEditCardMembers(card.members);
    setIsCardModalOpen(true);
    setCardDescViewMode('view');
    
    // Mark any unread notifications for this card as read for the current user
    if (onMarkNotificationAsRead && currentUser) {
      notifications.forEach(n => {
        if ((n.freelancerId === currentUser.id || (currentUser.freelancerId && n.freelancerId === currentUser.freelancerId)) && n.cardId === card.id && !n.lida) {
          onMarkNotificationAsRead(n.id);
        }
      });
    }
  };

  const handleSaveCardDetails = () => {
    if (!selectedCardId) return;

    const updatedCards = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          title: editCardTitle,
          description: editCardDesc,
          priority: editCardPriority,
          dueDate: editCardDueDate || undefined,
          labels: editCardLabels,
          members: editCardMembers
        };
      }
      return c;
    });

    persist(workspaces, columns, updatedCards);
    setIsCardModalOpen(false);
    setSelectedCardId(null);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Tem certeza de que deseja expurgar este cartão permanentemente?')) {
      persist(workspaces, columns, cards.filter(c => c.id !== cardId));
      setIsCardModalOpen(false);
      setSelectedCardId(null);
    }
  };

  // Checklists manipulation inside Card
  const toggleChecklistItem = (cardId: string, itemId: string) => {
    const updatedCards = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          checklist: c.checklist.map(item => item.id === itemId ? { ...item, done: !item.done } : item)
        };
      }
      return c;
    });
    persist(workspaces, columns, updatedCards);
  };

  const addChecklistItem = () => {
    if (!selectedCardId || !newChecklistText.trim()) return;
    
    const updatedCards = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          checklist: [...c.checklist, { id: `item-${Date.now()}`, text: newChecklistText.trim(), done: false }]
        };
      }
      return c;
    });
    persist(workspaces, columns, updatedCards);
    setNewChecklistText('');
  };

  const deleteChecklistItem = (cardId: string, itemId: string) => {
    const updatedCards = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          checklist: c.checklist.filter(item => item.id !== itemId)
        };
      }
      return c;
    });
    persist(workspaces, columns, updatedCards);
  };

  const pushMentionsNotifications = (text: string, cardId: string) => {
    if (!onAddNotification) return;
    const mentions = text.match(/@([\wÀ-ÿ]+)/g);
    if (!mentions) return;

    const authorName = currentUser?.nome || 'Operador Local';
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const notifiedMemIds = new Set<string>();
    
    // Normalize text to remove accents and make lowercase
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    mentions.forEach(mention => {
      const rawName = normalize(mention.substring(1));
      
      // Search across all freelancers, not just card members
      freelancers.forEach(profile => {
        if (notifiedMemIds.has(profile.id)) return;
        
        const fname = normalize(profile.nome.split(' ')[0]);
        if (fname === rawName) {
           onAddNotification({
             id: `notify-kanban-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
             freelancerId: profile.id,
             freelancerNome: profile.nome,
             tipo: 'Demanda',
             titulo: `Menção no Kanban: ${card.title.length > 20 ? card.title.substring(0, 20) + '...' : card.title}`,
             mensagem: `${authorName} mencionou você em um comentário:\n"${text}"`,
             data: new Date().toISOString().substring(0, 10),
             lida: false,
             cardId: cardId
           });
           notifiedMemIds.add(profile.id);
        }
      });
    });
  };

  const handleAddChecklistComment = (cardId: string, itemId: string) => {
    if (!checklistCommentText.trim()) return;
    const authorName = currentUser?.nome || 'Operador Local';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const newComment: KanbanComment = {
      id: `chk-com-${Date.now()}`,
      memberName: authorName,
      text: checklistCommentText.trim(),
      date: timestamp
    };

    const updatedCards = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          checklist: c.checklist.map(item => {
            if (item.id === itemId) {
              return { ...item, comments: [...(item.comments || []), newComment] };
            }
            return item;
          })
        };
      }
      return c;
    });
    persist(workspaces, columns, updatedCards);
    pushMentionsNotifications(newComment.text, cardId);
    setChecklistCommentText('');
  };

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    type: 'main' | 'checklist'
  ) => {
    const val = e.target.value;
    if (type === 'main') setNewCommentText(val);
    else setChecklistCommentText(val);

    const cursorP = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorP);
    
    // Look for "@" followed by word characters up to the cursor
    const match = textBeforeCursor.match(/@([\wÀ-ÿ]*)$/);
    if (match) {
      setMentionSearchText(match[1].toLowerCase());
      setMentionType(type);
      setMentionCursor(cursorP);
    } else {
      setMentionSearchText(null);
      setMentionType(null);
    }
  };

  const handleMentionSelect = (freelancerName: string) => {
    if (!mentionType) return;
    
    const fname = freelancerName.split(' ')[0];
    const val = mentionType === 'main' ? newCommentText : checklistCommentText;
    const currentCursor = mentionCursor;
    
    const textBeforeMentionEnd = val.substring(0, currentCursor);
    const textAfterMentionEnd = val.substring(currentCursor);
    
    const match = textBeforeMentionEnd.match(/@([\wÀ-ÿ]*)$/);
    if (!match) return;
    
    const startIndex = match.index;
    const newText = val.substring(0, startIndex) + `@${fname} ` + textAfterMentionEnd;
    
    if (mentionType === 'main') {
      setNewCommentText(newText);
    } else {
      setChecklistCommentText(newText);
    }
    
    setMentionSearchText(null);
    setMentionType(null);
  };

  // Comments manipulation
  const appendComment = () => {
    if (!selectedCardId || !newCommentText.trim()) return;

    const authorName = currentUser?.nome || 'Operador Local';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newComment: KanbanComment = {
      id: `comment-${Date.now()}`,
      memberName: authorName,
      text: newCommentText.trim(),
      date: timestamp
    };

    const updatedCards = cards.map(c => {
      if (c.id === selectedCardId) {
        return {
          ...c,
          comments: [newComment, ...c.comments]
        };
      }
      return c;
    });

    persist(workspaces, columns, updatedCards);
    pushMentionsNotifications(newComment.text, selectedCardId);
    setNewCommentText('');
  };

  const deleteComment = (cardId: string, commentId: string) => {
    const updatedCards = cards.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          comments: c.comments.filter(item => item.id !== commentId)
        };
      }
      return c;
    });
    persist(workspaces, columns, updatedCards);
  };

  // Toggle labels in Card config
  const toggleLabel = (labelName: string) => {
    const isLabel = editCardLabels.includes(labelName);
    const newLabels = isLabel 
      ? editCardLabels.filter(l => l !== labelName)
      : [...editCardLabels, labelName];
      
    setEditCardLabels(newLabels);
    
    if (selectedCardId) {
      const updatedCards = cards.map(c => c.id === selectedCardId ? { ...c, labels: newLabels } : c);
      persist(workspaces, columns, updatedCards);
    }
  };

  // Toggle assigned card members
  const toggleCardMember = (memberId: string) => {
    const isMember = editCardMembers.includes(memberId);
    const newMembers = isMember 
      ? editCardMembers.filter(m => m !== memberId)
      : [...editCardMembers, memberId];
      
    setEditCardMembers(newMembers);
    
    if (selectedCardId) {
      const updatedCards = cards.map(c => c.id === selectedCardId ? { ...c, members: newMembers } : c);
      persist(workspaces, columns, updatedCards);
    }
  };

  // Drag and Drop Handler
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    
    const cardToMove = cards.find(c => c.id === draggableId);
    if (!cardToMove) return;

    let newCards = [...cards];
    newCards = newCards.filter(c => c.id !== draggableId);

    const destCards = newCards.filter(c => c.columnId === destColId);
    
    if (destCards.length === 0) {
      newCards.push({ ...cardToMove, columnId: destColId });
    } else {
      if (destination.index >= destCards.length) {
        const lastCard = destCards[destCards.length - 1];
        const lastCardIndex = newCards.findIndex(c => c.id === lastCard.id);
        newCards.splice(lastCardIndex + 1, 0, { ...cardToMove, columnId: destColId });
      } else {
        const referenceCard = destCards[destination.index];
        const referenceCardIndex = newCards.findIndex(c => c.id === referenceCard.id);
        newCards.splice(referenceCardIndex, 0, { ...cardToMove, columnId: destColId });
      }
    }

    persist(workspaces, columns, newCards);
  };

  // Move manual card across columns (Arrow Action)
  const shiftCardColumn = (cardId: string, targetColId: string) => {
    const updatedCards = cards.map(c => c.id === cardId ? { ...c, columnId: targetColId } : c);
    persist(workspaces, columns, updatedCards);
  };

  // --- FILTERS & SEARCH LABELS ---
  const activeCard = cards.find(c => c.id === selectedCardId);
  const allMentionableMembers = Array.from(new Set([...(activeWorkspace?.teamMemberIds || []), ...(activeCard?.members || [])]));
  const isDragDisabled = searchQuery.trim() !== '' || filterPriority !== 'all' || filterMemberId !== 'all';

  const filteredCardsInColumn = (colId: string) => {
    return cards
      .filter(c => c.columnId === colId)
      .filter(c => {
        // Search filter
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query);
      })
      .filter(c => {
        // Priority filter
        if (filterPriority === 'all') return true;
        return c.priority === filterPriority;
      })
      .filter(c => {
        // Assigned member filter
        if (filterMemberId === 'all') return true;
        return c.members.includes(filterMemberId);
      });
  };

  // --- RENDERING HELPERS ---
  const getInitials = (id: string) => {
    const activeF = freelancers.find(f => f.id === id);
    if (!activeF) return 'OP';
    const split = activeF.nome.trim().split(' ');
    if (split.length > 1) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return split[0].substring(0, 2).toUpperCase();
  };

  const getMemberDetails = (id: string) => {
    return freelancers.find(f => f.id === id);
  };

  // Count metrics for header overview
  const totalCardsInWs = cards.filter(c => c.workspaceId === selectedWorkspaceId).length;
  const completedChecklistCount = (card: KanbanCard) => card.checklist.filter(i => i.done).length;
  const totalChecklistCount = (card: KanbanCard) => card.checklist.length;

  return (
    <div className="space-y-6 font-sans text-neutral-850 dark:text-neutral-200 [color-scheme:light-dark]" id="workstation-dashboard-component">
      
      {/* 2. WORKSPACE NAVIGATOR BAR */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-neutral-100/60 dark:bg-neutral-950/30 p-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/40">
        
        {/* Workspace selector - Folder icon only plus retracted active text context */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsWorkspaceSelectorOpen(true)}
            className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs transition-all flex items-center justify-center cursor-pointer group"
            title="Selecionar / Configurar Quadro"
          >
            <Folder className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-450 block leading-none">
              Quadro Ativo
            </span>
            <span className="text-sm font-extrabold text-neutral-800 dark:text-white leading-tight">
              {activeWorkspace ? activeWorkspace.name : 'Nenhum Quadro Selecionado'}
            </span>
          </div>
        </div>

        {/* Management Actions */}
        <div className="flex items-center gap-2">
          {activeWorkspace && (
            <button
              type="button"
              onClick={() => {
                setIsManagingLabels(false);
                setIsWorkspaceSettingsOpen(true);
              }}
              className="p-2 py-1.5 px-3 bg-white hover:bg-neutral-150 dark:bg-neutral-900 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-600 dark:text-neutral-300 font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span>Configurações</span>
            </button>
          )}
          
          <button
            onClick={() => setIsNewWorkspaceModalOpen(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Quadro</span>
          </button>
        </div>
      </div>

      {activeWorkspace ? (
        <div className="space-y-4">
          
          {/* 3. QUICK SEARCH & ADVANCED KANBAN FILTERS */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-850 p-4 rounded-2xl flex flex-col lg:flex-row gap-3 items-center justify-between shadow-3xs">
            <div className="w-full lg:w-1/3 relative">
              <input
                type="text"
                placeholder="🔍 Pesquisar cartão..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 p-2.5 pl-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs focus:ring-1 focus:ring-purple-500 font-sans outline-hidden"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="w-full lg:w-auto flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-neutral-400 block font-mono">Pessoa Designada:</span>
                <select
                  value={filterMemberId}
                  onChange={(e) => setFilterMemberId(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-950 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-bold font-sans cursor-pointer focus:ring-1 focus:ring-purple-500 outline-hidden max-w-[170px]"
                >
                  <option value="all">Todos os Membros</option>
                  {activeWorkspace.teamMemberIds.map(memId => {
                    const profile = getMemberDetails(memId);
                    return (
                      <option key={memId} value={memId}>
                        {profile ? profile.nome : `ID: ${memId}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {(searchQuery || filterPriority !== 'all' || filterMemberId !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterPriority('all');
                    setFilterMemberId('all');
                  }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-extrabold flex items-center gap-1 bg-rose-500/5 p-1 px-2.5 rounded-lg border border-rose-500/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>
          </div>


          {/* Removed workspace description citation below search filters */}

          {/* 4. TRELLO BOARD AREA (HORIZONTAL CONTAINER) */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto pb-6 pt-2 flex items-start gap-5 select-none min-h-[650px]" id="trello-board-columns-container">
            {activeWorkspaceCols.map(column => {
              const colCards = filteredCardsInColumn(column.id);

              return (
                <div
                  key={column.id}
                  className="bg-neutral-200/60 dark:bg-neutral-950 shrink-0 w-[280px] rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-850 flex flex-col max-h-[82vh] overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 overflow-hidden w-full mr-2">
                      <input
                        type="text"
                        value={column.title}
                        onChange={(e) => handleRenameColumn(column.id, e.target.value)}
                        className="bg-transparent hover:bg-neutral-200 focus:bg-white focus:dark:bg-neutral-900 border-none font-extrabold text-xs text-neutral-900 dark:text-white px-1.5 py-0.5 rounded-lg w-full font-sans cursor-pointer focus:cursor-text select-text outline-hidden"
                        title="Dê duplo clique para editar o título"
                      />
                      <span className="bg-neutral-200 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-400 font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full select-none shrink-0">
                        {colCards.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteColumn(column.id)}
                      className="text-neutral-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Excluir Coluna"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cards stack list */}
                  <Droppable droppableId={column.id} isDropDisabled={isDragDisabled}>
                    {(provided, snapshot) => (
                      <div 
                        className={`flex-1 space-y-2.5 overflow-y-auto mb-3 pr-0.5 min-h-[50px] ${snapshot.isDraggingOver ? 'bg-purple-50/50 dark:bg-indigo-900/10 rounded-xl' : ''}`}
                        id={`col-stack-${column.id}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {colCards.length === 0 && !snapshot.isDraggingOver ? (
                          <div className="py-8 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center p-3">
                            <Compass className="w-4 h-4 text-neutral-300 dark:text-neutral-700 animate-spin-slow mb-1" />
                            <p className="text-[10px] text-neutral-400">Arraste ou crie cartões aqui.</p>
                          </div>
                        ) : (
                          colCards.map((card, index) => {
                        const hasChecklist = card.checklist.length > 0;
                        const hasComments = card.comments.length > 0;
                        const completedItems = completedChecklistCount(card);
                        const totalItems = totalChecklistCount(card);
                        const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && completedItems !== totalItems;
                        const hasUnreadMention = notifications.some(n => 
                          (n.freelancerId === currentUser?.id || (currentUser?.freelancerId && n.freelancerId === currentUser?.freelancerId)) && 
                          n.cardId === card.id && 
                          !n.lida
                        );

                        return (
                          <Draggable key={card.id} draggableId={card.id} index={index} isDragDisabled={isDragDisabled}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{ ...dragProvided.draggableProps.style }}
                              >
                                <div
                                  onClick={() => handleOpenCardModal(card)}
                                  className={`bg-white dark:bg-neutral-900 rounded-2xl p-4 border shadow-sm transition-colors duration-200 cursor-pointer space-y-3 relative select-none ${
                                    hasUnreadMention 
                                      ? 'border-yellow-400 dark:border-yellow-500 animate-blink-card' 
                                      : 'border-neutral-200 dark:border-neutral-800 hover:border-indigo-400/50 dark:hover:border-indigo-450/40 hover:shadow-md'
                                  } ${dragSnapshot.isDragging ? 'shadow-xl ring-2 ring-purple-500/50 z-50' : ''}`}
                                >
                              {/* Labels */}
                              {card.labels.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {card.labels.slice(0, 3).map(lbl => {
                                    const matchingLabel = cardLabels.find(cl => cl.name === lbl);
                                    return (
                                      <span
                                        key={lbl}
                                        className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                                          matchingLabel ? matchingLabel.color : 'bg-neutral-200'
                                        }`}
                                      >
                                        {lbl}
                                      </span>
                                    );
                                  })}
                                  {card.labels.length > 3 && (
                                    <span className="text-[8.5px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                      +{card.labels.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Title */}
                              <h4 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 leading-snug">
                                {card.title}
                              </h4>

                              {/* Footer Info Badge Controls */}
                              <div className="flex items-center justify-between gap-2 border-t border-neutral-100/50 dark:border-neutral-850/45 pt-2">
                                
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Shift controls inside card (left-right quick swap arrows) */}
                                  <div className="flex items-center bg-neutral-50 dark:bg-neutral-950 p-0.5 rounded border border-neutral-200/40 dark:border-neutral-850">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = activeWorkspaceCols.findIndex(c => c.id === column.id);
                                        if (currentIndex > 0) {
                                          shiftCardColumn(card.id, activeWorkspaceCols[currentIndex - 1].id);
                                        }
                                      }}
                                      className="p-0.5 hover:text-indigo-500 cursor-pointer disabled:opacity-30"
                                      title="Mover para esquerda"
                                      disabled={activeWorkspaceCols.findIndex(c => c.id === column.id) === 0}
                                    >
                                      <ArrowLeft className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const currentIndex = activeWorkspaceCols.findIndex(c => c.id === column.id);
                                        if (currentIndex < activeWorkspaceCols.length - 1) {
                                          shiftCardColumn(card.id, activeWorkspaceCols[currentIndex + 1].id);
                                        }
                                      }}
                                      className="p-0.5 hover:text-indigo-500 cursor-pointer disabled:opacity-30"
                                      title="Mover para direita"
                                      disabled={activeWorkspaceCols.findIndex(c => c.id === column.id) === activeWorkspaceCols.length - 1}
                                    >
                                      <ArrowRight className="w-2.5 h-2.5" />
                                    </button>
                                  </div>

                                  {/* Due Date Indicator */}
                                  {card.dueDate && (
                                    <div className={`flex items-center gap-0.5 text-[8.5px] font-mono font-bold rounded px-1 ${
                                      isOverdue 
                                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                        : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-400'
                                    }`}>
                                      <Calendar className="w-2.5 h-2.5" />
                                      <span>{card.dueDate.substring(8, 10)}/{card.dueDate.substring(5, 7)}</span>
                                    </div>
                                  )}

                                  {/* Checklist Counter */}
                                  {hasChecklist && (
                                    <div className={`flex items-center gap-0.5 text-[8.5px] font-mono font-bold rounded px-1 ${
                                      completedItems === totalItems 
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-550/20' 
                                        : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-400'
                                    }`}>
                                      <CheckSquare className="w-2.5 h-2.5" />
                                      <span>{completedItems}/{totalItems}</span>
                                    </div>
                                  )}

                                  {/* Comments Counter */}
                                  {hasComments && (
                                    <div className="flex items-center gap-0.5 text-[8.5px] font-mono font-bold text-neutral-400 bg-neutral-50 dark:bg-neutral-950 rounded px-1">
                                      <MessageSquare className="w-2.5 h-2.5" />
                                      <span>{card.comments.length}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Assigned Members Avatar Stack */}
                                {card.members.length > 0 && (
                                  <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                                    {card.members.map(mId => (
                                      <div
                                        key={mId}
                                        title={getMemberDetails(mId)?.nome || `ID: ${mId}`}
                                        className="w-4.5 h-4.5 rounded-full bg-purple-500 text-white font-extrabold text-[7.5px] flex items-center justify-center border border-white dark:border-neutral-900 shadow-inner block uppercase"
                                      >
                                        {getInitials(mId)}
                                      </div>
                                    ))}
                                  </div>
                                )}

                              </div>
                            </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                    {provided.placeholder}
                  </div>
                  )}
                  </Droppable>

                  {/* Inline Composer Block */}
                  {activeNewCardColId === column.id ? (
                    <div className="space-y-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-2.5 rounded-xl">
                      <input
                        type="text"
                        placeholder="Nome do cartão..."
                        value={newCardTitle[column.id] || ''}
                        onChange={(e) => setNewCardTitle(prev => ({ ...prev, [column.id]: e.target.value }))}
                        className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-250 dark:border-neutral-800 rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-550 focus:bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCard(column.id);
                        }}
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleAddCard(column.id)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer block"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveNewCardColId(null)}
                          className="text-neutral-400 hover:text-neutral-600 text-[10px] font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveNewCardColId(column.id);
                        setNewCardTitle(prev => ({ ...prev, [column.id]: '' }));
                      }}
                      className="p-2 w-full text-left font-bold text-[11px] text-indigo-650 hover:text-indigo-700 hover:bg-neutral-200 dark:hover:bg-neutral-900 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar cartão</span>
                    </button>
                  )}
                </div>
              );
            })}

            {/* "+ Adicionar outra lista/coluna" element */}
            <div className="shrink-0 w-72 bg-neutral-100/60 dark:bg-neutral-950/40 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 p-3 self-start">
              {isAddingColumn ? (
                <form onSubmit={handleAddColumn} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Título da lista (ex: 'Revisão RF')"
                    value={newColFormTitle}
                    onChange={(e) => setNewColFormTitle(e.target.value)}
                    className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-xl outline-hidden focus:ring-1 focus:ring-purple-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Criar Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingColumn(false)}
                      className="text-neutral-400 hover:text-neutral-600 font-bold text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full text-center py-3 font-extrabold text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span>Adicionar nova coluna</span>
                </button>
              )}
            </div>
          </div>
          </DragDropContext>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-3xs">
          <AlertTriangle className="w-8 h-8 text-neutral-400 animate-bounce" />
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-800">Nenhuma Área de Trabalho Encontrada</h3>
          <p className="text-xs text-neutral-400 max-w-sm">Você precisa criar uma área de trabalho e designar membros para começar o gerenciamento operacional das equipes!</p>
          <button
            onClick={() => setIsNewWorkspaceModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-purple-700"
          >
            Criar Minha Primeira Área
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* ==================== POPUPS / MODALS ==================== */}
      {/* ========================================================= */}

      {/* MODAL: WORKSPACE SELECTOR & EDITING */}
      <AnimatePresence>
        {isWorkspaceSelectorOpen && (
          <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3.5 mb-5">
                <div>
                  <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <Folder className="w-5 h-5 text-indigo-500" />
                    Selecione ou Configure seu Quadro
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Selecione um retângulo para editar as informações, mudar visibilidade ou configurar imagem de fundo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceSelectorOpen(false);
                    setEditingWorkspace(null);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-250 cursor-pointer rounded-lg bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Workspaces Grid Column (Left) */}
                <div className={`${editingWorkspace ? 'lg:col-span-12 xl:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {workspaces.map(ws => {
                      const hasBg = !!ws.bgImage;
                      const isSelected = selectedWorkspaceId === ws.id;

                      return (
                        <div
                          key={ws.id}
                          onClick={() => {
                            setEditingWorkspace(ws);
                            setEditWsName(ws.name);
                            setEditWsVisibility(ws.visibilityType === 'restricted' ? 'restricted' : 'all');
                            setEditWsBgImage(ws.bgImage || '');
                          }}
                          className={`group relative h-28 rounded-xl border overflow-hidden p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${
                            isSelected 
                              ? 'border-purple-600 ring-2 ring-purple-500/20' 
                              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                          }`}
                          style={{
                            backgroundImage: hasBg ? `url(${ws.bgImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: hasBg ? 'transparent' : ws.colorHex || '#6366f1'
                          }}
                        >
                          {/* Overlay to ensure readability */}
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-0" />

                          {/* Top Tag & Selection Indicator */}
                          <div className="relative z-10 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white/90 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md">
                              {ws.visibilityType === 'restricted' ? '🔒 Restrito' : '🌐 Público'}
                            </span>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-purple-505 text-white flex items-center justify-center font-bold text-[10px]" style={{ backgroundColor: '#4f46e5' }}>
                                ✓
                              </span>
                            )}
                          </div>

                          {/* Name text */}
                          <div className="relative z-10 text-left">
                            <h4 className="text-xs font-black text-white truncate drop-shadow-sm leading-tight max-w-[150px]">
                              {ws.name}
                            </h4>
                            <p className="text-[9px] text-neutral-300 truncate drop-shadow-sm leading-none mt-0.5">
                              Clique para ajustar / abrir
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* New workspace rectangle selector */}
                    <div
                      onClick={() => {
                        setIsWorkspaceSelectorOpen(false);
                        setIsNewWorkspaceModalOpen(true);
                      }}
                      className="h-28 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-neutral-50/50 dark:bg-neutral-950/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group p-4"
                    >
                      <Plus className="w-5 h-5 text-neutral-400 group-hover:text-indigo-550 transition-colors" />
                      <span className="text-[11px] font-bold text-neutral-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Adicionar Novo Quadro
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Form Sidebar Column (Right) */}
                {editingWorkspace && (
                  <div className="lg:col-span-12 xl:col-span-5 bg-neutral-50 dark:bg-neutral-950/40 p-4 rounded-xl border border-neutral-150 dark:border-neutral-850 space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        Configurações Gerais
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingWorkspace(null)}
                        className="text-[10px] text-neutral-400 hover:text-neutral-600"
                      >
                        Fechar Painel
                      </button>
                    </div>

                    {/* Name input */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        Nome do Quadro
                      </label>
                      <input
                        type="text"
                        value={editWsName}
                        onChange={(e) => setEditWsName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg outline-hidden focus:ring-1 focus:ring-purple-500 text-neutral-800 dark:text-neutral-200"
                      />
                    </div>

                    {/* Visibility input ("como quem consegue visualizar") */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        Quem consegue visualizar
                      </label>
                      <select
                        value={editWsVisibility}
                        onChange={(e: any) => setEditWsVisibility(e.target.value)}
                        className="w-full text-xs p-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer font-bold text-neutral-800 dark:text-neutral-200"
                      >
                        <option value="all">🌐 Qualquer profissional cadastrado (Livre)</option>
                        <option value="restricted">🔒 Apenas membros habilitados na equipe do quadro</option>
                      </select>
                    </div>

                    {/* Background image selection button */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider">
                        Imagem de fundo do Retângulo
                      </label>
                      
                      {/* Image Source Picker (upload or preset) */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1b4b" /><stop offset="100%" stop-color="%23311042" /></linearGradient></defs><rect width="300" height="150" fill="url(%23g)" /></svg>',
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f766e" /><stop offset="100%" stop-color="%231d4ed8" /></linearGradient></defs><rect width="300" height="150" fill="url(%23g)" /></svg>',
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237c2d12" /><stop offset="100%" stop-color="%23be123c" /></linearGradient></defs><rect width="300" height="150" fill="url(%23g)" /></svg>',
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23064e3b" /><stop offset="100%" stop-color="%23047857" /></linearGradient></defs><rect width="300" height="150" fill="url(%23g)" /></svg>'
                        ].map((preset, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setEditWsBgImage(preset)}
                            className={`h-9 rounded-md border overflow-hidden relative transition-all hover:scale-105 ${
                              editWsBgImage === preset ? 'border-purple-600 ring-2 ring-purple-500/20' : 'border-neutral-200'
                            }`}
                          >
                            <div 
                              className="w-full h-full"
                              style={{ backgroundImage: `url('${preset}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                            />
                          </button>
                        ))}
                      </div>

                      {/* File Upload Button */}
                      <input
                        type="file"
                        id="ws-bg-uploader"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) {
                                setEditWsBgImage(evt.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="ws-bg-uploader"
                        className="w-full h-9 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 bg-white dark:bg-neutral-900/65 flex items-center justify-center gap-1.5 text-[10px] font-bold text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
                      >
                        📁 Enviar Imagem Personalizada
                      </label>

                      {editWsBgImage && (
                        <div className="flex items-center justify-between bg-neutral-200/50 dark:bg-neutral-800 p-1.5 px-2.5 rounded-lg text-[9px] font-bold text-neutral-600 dark:text-neutral-300">
                          <span>Imagem de fundo selecionada</span>
                          <button
                            type="button"
                            onClick={() => setEditWsBgImage('')}
                            className="text-rose-500 hover:text-rose-600"
                          >
                            Remover fundo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Quick Selection and Save Panel Action Row */}
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateWorkspaceDetails(editingWorkspace.id, editWsName, editWsVisibility, editWsBgImage);
                          setSelectedWorkspaceId(editingWorkspace.id);
                          setFilterMemberId('all');
                          setFilterPriority('all');
                          setIsWorkspaceSelectorOpen(false);
                          setEditingWorkspace(null);
                        }}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-lg transition-all cursor-pointer shadow-3xs text-center"
                      >
                        Abrir e Ativar este Quadro
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateWorkspaceDetails(editingWorkspace.id, editWsName, editWsVisibility, editWsBgImage);
                            setEditingWorkspace(null);
                          }}
                          className="flex-1 py-1.5 bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 text-white font-bold text-[10px] rounded-lg text-center cursor-pointer"
                        >
                          Salvar Estilo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWorkspace(null);
                          }}
                          className="flex-1 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300 font-bold text-[10px] rounded-lg text-center cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom footer bar */}
              <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceSelectorOpen(false);
                    setEditingWorkspace(null);
                  }}
                  className="px-4 py-1.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* ========================================================= */}
      {/* ==================== POPUPS / MODALS ==================== */}
      {/* ========================================================= */}

      {/* MODAL: NEW WORKSPACE CREATOR */}
      <AnimatePresence>
        {isNewWorkspaceModalOpen && (
          <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
                <span className="text-xs font-black uppercase text-purple-600 font-mono flex items-center gap-1">
                  <Sparkles className="w-4 h-4 fill-indigo-100" /> Nova Área de Trabalho
                </span>
                <button
                  onClick={() => setIsNewWorkspaceModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1">
                    Nome da Área / Equipe
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Equipe de Projeção & Mapping"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1">
                    Descrição do Objetivo
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Qual a atribuição principal deste time e deste quadro operacional?"
                    value={newWsDesc}
                    onChange={(e) => setNewWsDesc(e.target.value)}
                    className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1">
                    Cor Visual do Quadro
                  </label>
                  <div className="flex gap-2">
                    {WORKSPACE_COLORS.map(color => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setNewWsColor(color.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                          newWsColor === color.hex ? 'border-neutral-950 dark:border-white scale-110 shadow-xs' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Initial Team members */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-neutral-500 tracking-wider mb-1 flex items-center justify-between">
                    <span>Designar Talentos Iniciais ({newWsTeam.length})</span>
                    <span className="text-[8px] text-neutral-400 font-mono font-bold">cadastro interno</span>
                  </label>
                  <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 max-h-36 overflow-y-auto space-y-1.5">
                    {freelancers.filter(f => !f.arquivado).map(f => {
                      const isSelected = newWsTeam.includes(f.id);
                      return (
                        <label
                          key={f.id}
                          className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                            isSelected 
                              ? 'bg-purple-500/10 border-indigo-550/30 font-bold text-indigo-700 dark:text-indigo-300' 
                              : 'bg-white dark:bg-neutral-900 border-neutral-150 dark:border-neutral-850 hover:bg-neutral-100'
                          }`}
                        >
                          <span>{f.nome} <span className="text-[10px] text-neutral-400 font-normal">({f.cargo})</span></span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setNewWsTeam(prev => 
                                isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id]
                              );
                            }}
                            className="rounded text-indigo-500 focus:ring-indigo-400 cursor-pointer accent-indigo-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsNewWorkspaceModalOpen(false)}
                    className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-xs rounded-xl cursor-pointer text-center"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer text-center"
                  >
                    Salvar Quadro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: WORKSPACE MEMBERS & TEAM SETTINGS */}
      <AnimatePresence>
        {isWorkspaceSettingsOpen && activeWorkspace && (
          <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-orange-500 font-mono">Configurações da Área</span>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white truncate">
                    {activeWorkspace.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWorkspaceSettingsOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <button
                  type="button"
                  onClick={() => setIsManagingLabels(false)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${!isManagingLabels ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                >
                  👥 Equipe
                </button>
                <button
                  type="button"
                  onClick={() => setIsManagingLabels(true)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${isManagingLabels ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                >
                  🎨 Etiquetas
                </button>
              </div>

              <div className="space-y-4">
                {!isManagingLabels ? (
                  <>
                    <p className="text-xs text-neutral-500">
                      Adicione ou remova profissionais qualificados a este quadro operacional. Membros designados serão selecionáveis para os cartões Kanban deste workspace.
                    </p>

                    {/* Team member selection checkbox check */}
                    <div>
                      <span className="block text-[10px] font-black uppercase text-neutral-450 tracking-wider mb-2">
                        Profissionais Habilitados nesta Área ({activeWorkspace.teamMemberIds.length})
                      </span>

                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {freelancers.filter(f => !f.arquivado).map(f => {
                          const isAssigned = activeWorkspace.teamMemberIds.includes(f.id);
                          return (
                            <div
                              key={f.id}
                              onClick={() => handleUpdateWorkspaceTeam(f.id)}
                              className={`flex items-center justify-between p-1.5 px-2.5 rounded-xl border cursor-pointer select-none transition-colors ${
                                isAssigned
                                  ? 'bg-neutral-900 border-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-bold'
                                  : 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5.5 h-5.5 rounded-full bg-purple-500 text-white font-extrabold text-[8.5px] uppercase flex items-center justify-center">
                                  {getInitials(f.id)}
                                </div>
                                <div className="text-left">
                                  <p className="text-[11px] leading-tight font-extrabold">{f.nome}</p>
                                  <p className="text-[9px] text-neutral-445 font-medium leading-none mt-0.5">{f.cargo}</p>
                                </div>
                              </div>

                              <div className={`p-0.5 rounded-full border ${isAssigned ? 'bg-purple-500 text-neutral-950' : 'bg-transparent text-transparent'}`}>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-500">
                      Crie e gerencie as etiquetas disponíveis para todos os cartões do seu quadro operacional.
                    </p>

                    <div className="bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-250 dark:border-neutral-800 rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">
                          {editingLabelIndex !== null ? '✏️ Editar Etiqueta' : '➕ Nova Etiqueta'}
                        </span>
                        {editingLabelIndex !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLabelIndex(null);
                              setLabelFormName('');
                            }}
                            className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer bg-transparent border-none"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Nome da etiqueta..."
                          value={labelFormName}
                          onChange={(e) => setLabelFormName(e.target.value)}
                          className="w-full text-xs p-1.5 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 rounded-lg outline-hidden"
                        />

                        <div className="grid grid-cols-7 gap-1.5 py-1">
                          {TAG_COLOR_OPTIONS.map((opt) => (
                            <button
                              key={opt.class}
                              type="button"
                              title={opt.name}
                              onClick={() => setLabelFormColor(opt.class)}
                              className={`w-5 h-5 rounded-full border transition-transform ${opt.class} ${
                                labelFormColor === opt.class ? 'scale-125 border-neutral-950 dark:border-white ring-2 ring-purple-500/20' : 'border-transparent hover:scale-110'
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!labelFormName.trim()) return;
                            if (editingLabelIndex !== null) {
                              handleUpdateLabel(editingLabelIndex, labelFormName, labelFormColor);
                              setEditingLabelIndex(null);
                            } else {
                              handleAddLabel(labelFormName, labelFormColor);
                            }
                            setLabelFormName('');
                          }}
                          className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] rounded-lg transition-colors cursor-pointer text-center uppercase"
                        >
                          {editingLabelIndex !== null ? 'Salvar Alterações' : 'Adicionar Etiqueta'}
                        </button>
                      </div>

                      <div className="pt-2 border-t border-neutral-250 dark:border-neutral-800 space-y-1.5 max-h-40 overflow-y-auto">
                        {cardLabels.map((lbl, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white dark:bg-neutral-905 p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                            <span className={`text-[8.5px] font-black uppercase tracking-tight px-2 py-0.5 rounded ${lbl.color}`}>
                              {lbl.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLabelIndex(idx);
                                  setLabelFormName(lbl.name);
                                  setLabelFormColor(lbl.color);
                                }}
                                className="text-[9px] text-indigo-650 dark:text-purple-400 hover:underline font-bold cursor-pointer bg-transparent border-none"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLabel(idx)}
                                className="text-[9px] text-rose-500 hover:underline font-bold cursor-pointer bg-transparent border-none"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkspace(activeWorkspace.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Apagar Quadro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWorkspaceSettingsOpen(false)}
                    className="px-4 py-1.5 bg-neutral-900 dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    Ok, Pronto
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DETAILED TRELLO-STYLE CARD POPUP */}
      <AnimatePresence>
        {isCardModalOpen && selectedCardId && activeCard && (
          <div 
            className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-0 sm:p-6 md:p-10"
            onClick={() => {
              setIsCardModalOpen(false);
              setSelectedCardId(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-white dark:bg-neutral-900 w-full min-h-screen sm:min-h-0 sm:rounded-2xl shadow-2xl flex flex-col border border-neutral-150 dark:border-neutral-850 mt-0 sm:mt-10 sm:mb-10 relative`}
              style={{ 
                width: `${modalWidth}px`, 
                maxWidth: '95vw',
                transition: 'none'
              }}
            >
              {/* Lateral Resize Handles */}
              {isResizable && (
                <>
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-purple-500/20 active:bg-purple-500/40 rounded-l-2xl"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startWidth = modalWidth;
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        setModalWidth(Math.max(400, startWidth - deltaX * 2));
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50 hover:bg-purple-500/20 active:bg-purple-500/40 rounded-r-2xl"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startWidth = modalWidth;
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        setModalWidth(Math.max(400, startWidth + deltaX * 2));
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />
                </>
              )}
              
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800 space-y-3 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 w-11/12 mr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Quadro: <strong className="text-neutral-700 dark:text-neutral-250 font-bold">{activeWorkspace?.name}</strong>
                      </span>
                    </div>
                    {/* Editable Title */}
                    <input
                      type="text"
                      value={editCardTitle}
                      onChange={(e) => setEditCardTitle(e.target.value)}
                      className="text-xl font-black text-neutral-900 dark:text-white leading-tight bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-950 focus:bg-white focus:dark:bg-neutral-950 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 p-1 px-2 rounded-xl w-full select-text outline-hidden"
                      title="Clique para renomear"
                    />

                    {/* Meta Controls: Members & Due Date */}
                    <div className="flex flex-wrap items-center gap-3 mt-1 pl-2">
                      {/* Members Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCardMemberSelector(!showCardMemberSelector)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-[10px] font-bold text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Membros</span>
                        </button>
                        {showCardMemberSelector && (
                          <div className="absolute z-50 mt-1 left-0 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-3 max-h-96 overflow-y-auto space-y-3">
                            <div>
                              <span className="block text-[9px] font-black uppercase text-neutral-450 tracking-wider font-mono mb-2 px-1">
                                👥 Membros do Quadro
                              </span>
                              <div className="space-y-1">
                                {activeWorkspace.teamMemberIds.map(memId => {
                                  const profile = getMemberDetails(memId);
                                  const isCardMem = editCardMembers.includes(memId);
                                  return (
                                    <div
                                      key={memId}
                                      className={`flex items-center justify-between p-1.5 px-2 rounded-lg border text-[11px] transition-colors ${
                                        isCardMem
                                          ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-indigo-500/30 text-indigo-700 dark:text-purple-400 font-bold'
                                          : 'bg-transparent border-transparent text-neutral-600 dark:text-neutral-350 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                      }`}
                                    >
                                      <div className="flex-1 cursor-pointer flex items-center justify-between" onClick={() => toggleCardMember(memId)}>
                                        <span className="truncate">{profile ? profile.nome : `Membro: ${memId}`}</span>
                                        {isCardMem && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 mr-1.5" />}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateWorkspaceTeam(memId);
                                          if (isCardMem) {
                                            toggleCardMember(memId);
                                          }
                                        }}
                                        className="text-neutral-400 hover:text-rose-500 p-1 ml-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                                        title="Remover do Quadro"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                })}
                                {activeWorkspace.teamMemberIds.length === 0 && (
                                  <p className="text-[10px] text-neutral-400 p-2 text-center italic">Quadro sem equipe credenciada.</p>
                                )}
                              </div>
                            </div>

                            {/* Add Freelancer to Workspace with role/function filter */}
                            <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                              <span className="block text-[9px] font-black uppercase text-neutral-450 tracking-wider font-mono px-1">
                                ➕ Adicionar ao Quadro
                              </span>
                              <select
                                value={boardAddRoleFilter}
                                onChange={(e) => setBoardAddRoleFilter(e.target.value)}
                                className="w-full text-[10px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded p-1.5 focus:ring-1 focus:ring-purple-500 outline-none cursor-pointer"
                              >
                                <option value="">Filtrar por cargo...</option>
                                {Array.from(new Set(freelancers.filter(f => !f.arquivado).map(f => f.cargo))).sort().map(cargo => (
                                  <option key={cargo} value={cargo}>{cargo}</option>
                                ))}
                              </select>
                              <div className="flex gap-1.5">
                                <select
                                  value={boardAddFreelancerId}
                                  onChange={(e) => setBoardAddFreelancerId(e.target.value)}
                                  className="flex-1 text-[10px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded p-1.5 focus:ring-1 focus:ring-purple-500 outline-none cursor-pointer"
                                >
                                  <option value="">Selecionar...</option>
                                  {freelancers
                                    .filter(f => !f.arquivado)
                                    .filter(f => !boardAddRoleFilter || f.cargo === boardAddRoleFilter)
                                    .filter(f => !activeWorkspace.teamMemberIds.includes(f.id))
                                    .map(f => (
                                      <option key={f.id} value={f.id}>{f.nome}</option>
                                    ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (boardAddFreelancerId) {
                                      handleUpdateWorkspaceTeam(boardAddFreelancerId);
                                      setBoardAddFreelancerId('');
                                    }
                                  }}
                                  disabled={!boardAddFreelancerId}
                                  className="p-1.5 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded cursor-pointer transition-colors"
                                  title="Adicionar ao quadro"
                                >
                                  <Plus className="w-3.5 h-3.5 shrink-0" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Due Date Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCardDateSelector(!showCardDateSelector)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            editCardDueDate 
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-purple-500'
                              : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{editCardDueDate ? new Date(editCardDueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Definir Data'}</span>
                        </button>
                        {showCardDateSelector && (
                          <div className="absolute z-50 mt-1 left-0 p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl w-48">
                            <span className="block text-[9px] font-black uppercase text-neutral-450 tracking-wider font-mono mb-2 px-1">
                              📅 Data Limite
                            </span>
                            <input
                              type="date"
                              value={editCardDueDate}
                              onChange={(e) => {
                                setEditCardDueDate(e.target.value);
                                setShowCardDateSelector(false);
                              }}
                              className="w-full text-xs p-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
                            />
                            {editCardDueDate && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditCardDueDate('');
                                  setShowCardDateSelector(false);
                                }}
                                className="w-full mt-2 text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 text-center py-1 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors cursor-pointer"
                              >
                                Remover Data
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsResizable(!isResizable)}
                      className={`p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors ${isResizable ? 'text-indigo-500 bg-purple-50 dark:bg-purple-500/10' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-indigo-500'}`}
                      title={isResizable ? "Bloquear tamanho" : "Ajustar tamanho"}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCardModalOpen(false);
                        setSelectedCardId(null);
                      }}
                      className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-purple-600 cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Columns body: Left side details, Right side sidebar configuration controls */}
              <div className="p-5 sm:p-6 pb-10">
                
                {/* LEFT SIDE DETAILS: DESCRIPTION, CHECKLIST, COMMENTS FEED */}
                <div className="space-y-6">
                  
                  {/* Dynamic Color Labels */}
                  <div className="space-y-1.5 relative">
                    <span className="block text-[10px] font-black uppercase text-neutral-450 tracking-wider font-mono">
                      🏷️ Etiquetas
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {editCardLabels.map(lbl => {
                        const match = cardLabels.find(cl => cl.name === lbl);
                        return (
                          <span 
                            key={lbl} 
                            className={`text-[9px] font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 cursor-pointer hover:opacity-85 ${match ? match.color : 'bg-neutral-200'}`}
                            onClick={() => toggleLabel(lbl)}
                          >
                            <span>{lbl}</span>
                            <span className="text-[10px]">✕</span>
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowCardLabelSelector(!showCardLabelSelector)}
                        className="w-5 h-5 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 flex items-center justify-center text-neutral-500 transition-colors"
                        title="Adicionar etiqueta"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {showCardLabelSelector && (
                      <div className="absolute z-10 mt-1 left-0 w-64 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-2 max-h-48 overflow-y-auto">
                        <div className="flex flex-col gap-1">
                          {cardLabels.map((lbl, idx) => {
                            const isSelected = editCardLabels.includes(lbl.name);
                            if (inlineEditingLabelIndex === idx) {
                              return (
                                <div key={lbl.name} className="p-2 border border-purple-200 dark:border-indigo-800/50 rounded-lg bg-purple-50/50 dark:bg-indigo-900/10 space-y-2" onClick={e => e.stopPropagation()}>
                                  <input 
                                    type="text" 
                                    value={labelFormName} 
                                    onChange={(e) => setLabelFormName(e.target.value)}
                                    className="w-full text-xs p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg outline-hidden focus:border-indigo-500"
                                    placeholder="Nome da etiqueta..."
                                  />
                                  <div className="grid grid-cols-7 gap-1 py-1">
                                    {TAG_COLOR_OPTIONS.map((opt) => (
                                      <button
                                        key={opt.class}
                                        type="button"
                                        title={opt.name}
                                        onClick={() => setLabelFormColor(opt.class)}
                                        className={`w-5 h-5 rounded-full border transition-transform ${opt.class} ${
                                          labelFormColor === opt.class ? 'scale-125 border-neutral-950 dark:border-white ring-2 ring-purple-500/20' : 'border-transparent hover:scale-110'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (labelFormName.trim()) {
                                          handleUpdateLabel(idx, labelFormName, labelFormColor);
                                          setInlineEditingLabelIndex(null);
                                        }
                                      }}
                                      className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition-colors"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setInlineEditingLabelIndex(null)}
                                      className="flex-1 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-[10px] rounded-lg transition-colors"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={lbl.name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLabel(lbl.name);
                                }}
                                className={`cursor-pointer text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${
                                  isSelected 
                                    ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${lbl.color}`} />
                                  <span>{lbl.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInlineEditingLabelIndex(idx);
                                      setLabelFormName(lbl.name);
                                      setLabelFormColor(lbl.color);
                                    }}
                                    className="text-neutral-400 hover:text-indigo-500 p-0.5 rounded transition-colors"
                                    title="Editar"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {isSelected && (
                                    <span className="text-neutral-400 hover:text-rose-500 p-0.5" title="Remover">
                                      <X className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {cardLabels.length === 0 && (
                            <p className="text-xs text-neutral-500 text-center py-2">Nenhuma etiqueta criada.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-black uppercase text-neutral-450 tracking-wider font-mono">
                        📝 Técnico / Detalhes da Nota
                      </span>
                      <div className="flex items-center bg-neutral-100 dark:bg-neutral-950 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-850">
                        <button
                          type="button"
                          onClick={() => setCardDescViewMode('view')}
                          className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                            cardDescViewMode === 'view'
                              ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-3xs'
                              : 'text-neutral-450 hover:text-neutral-600 dark:hover:text-neutral-300'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          Visualizar
                        </button>
                        <button
                          type="button"
                          onClick={() => setCardDescViewMode('edit')}
                          className={`px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                            cardDescViewMode === 'edit'
                              ? 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-white shadow-3xs'
                              : 'text-neutral-450 hover:text-neutral-600 dark:hover:text-neutral-300'
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                          Editar
                        </button>
                      </div>
                    </div>
                    
                    {cardDescViewMode === 'view' ? (
                      <div className="w-full text-xs p-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-2xl min-h-[120px] max-h-[350px] overflow-y-auto leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {editCardDesc.trim() ? (
                          <div className="markdown-body">
                            <Markdown components={renderers}>{editCardDesc}</Markdown>
                          </div>
                        ) : (
                          <p className="text-neutral-450 italic text-2xs text-center py-6">Nenhuma descrição ou nota adicionada.</p>
                        )}
                      </div>
                    ) : (
                      <textarea
                        rows={6}
                        value={editCardDesc}
                        onChange={(e) => setEditCardDesc(e.target.value)}
                        placeholder="Diga detalhadamente as regras de negócio ou passos de infraestrutura. Aceita Markdown e imagens inline..."
                        className="w-full text-xs p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-2xl outline-hidden focus:ring-1 focus:ring-indigo-550 leading-relaxed font-mono"
                      />
                    )}
                  </div>

                  {/* Checklist Sub-Engine */}
                  <div className="space-y-3.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <span className="block text-[10px] font-black uppercase text-neutral-450 tracking-wider font-mono flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-emerald-500" /> Checklist
                      </span>
                      
                      {/* Count percentage */}
                      {activeCard.checklist.length > 0 && (
                        <span className="font-mono text-[9px] font-extrabold text-neutral-450">
                          {completedChecklistCount(activeCard)} de {totalChecklistCount(activeCard)} ({Math.round((completedChecklistCount(activeCard)/totalChecklistCount(activeCard))*100)}%)
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {activeCard.checklist.length > 0 && (
                      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-950 rounded-full overflow-hidden border border-neutral-200/40">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${(completedChecklistCount(activeCard) / totalChecklistCount(activeCard)) * 100}%` }}
                        />
                      </div>
                    )}

                    {/* Custom Checklist items list */}
                    <div className="space-y-1.5">
                      {activeCard.checklist.map(item => (
                        <div key={item.id} className="flex flex-col gap-1.5 p-2 rounded-xl bg-neutral-50/50 dark:bg-neutral-950/20 border border-neutral-150/40 dark:border-neutral-850/40 text-xs">
                          <div className="flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded p-1">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => toggleChecklistItem(activeCard.id, item.id)}
                                className="rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer accent-emerald-500 w-4 h-4 shrink-0"
                              />
                              <span className={`text-neutral-800 dark:text-neutral-250 ${item.done ? 'line-through text-neutral-400 dark:text-neutral-550' : 'font-semibold'}`}>
                                {item.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setExpandedChecklistItemId(expandedChecklistItemId === item.id ? null : item.id)}
                                className="text-indigo-500 hover:bg-purple-50 dark:hover:bg-indigo-900/30 p-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                title="Bate-papo deste item"
                              >
                                <span className="font-bold text-[10px]">{item.comments?.length || 0}</span>
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteChecklistItem(activeCard.id, item.id)}
                                className="text-neutral-400 hover:text-rose-500 p-1 rounded-lg"
                                title="Remover item"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Expanded Chat for this Checklist Item */}
                          {expandedChecklistItemId === item.id && (
                            <div className="mt-2 pl-6 pr-2 pb-2 space-y-3 border-l-2 border-indigo-100 dark:border-indigo-900/50">
                              {/* Comments List */}
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                {!item.comments || item.comments.length === 0 ? (
                                  <p className="text-[10px] text-neutral-400 italic">Nenhum comentário neste item ainda.</p>
                                ) : (
                                  item.comments.map(c => (
                                    <div key={c.id} className="bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-800 shadow-3xs flex flex-col gap-1 text-[11px]">
                                      <div className="flex items-center justify-between text-[10px]">
                                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{c.memberName}</span>
                                        <span className="text-neutral-400">{c.date.substring(11, 16)}</span>
                                      </div>
                                      <p className="text-neutral-700 dark:text-neutral-300">
                                        {/* Highlight mentions like @Nome */}
                                        {c.text.split(/(@[\wÀ-ÿ]+)/g).map((part, i) => {
                                          if (part.startsWith('@')) {
                                            const rawName = part.substring(1).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                            const isMention = freelancers.some(f => f.nome.split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === rawName);
                                            return isMention ? <span key={i} className="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-indigo-900/30 px-1 rounded">{part}</span> : part;
                                          }
                                          return part;
                                        })}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>
                              {/* Add Comment Input */}
                              <div className="space-y-2 relative">
                                <div className="relative w-full border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900 focus-within:ring-1 focus-within:ring-purple-500 min-h-[40px]">
                                  <div 
                                    className="absolute inset-0 p-2 text-xs whitespace-pre-wrap break-words pointer-events-none text-neutral-800 dark:text-neutral-200 overflow-hidden font-sans"
                                    aria-hidden="true"
                                  >
                                    {checklistCommentText ? checklistCommentText.split(/(@[\wÀ-ÿ]+)/g).map((part, i) => {
                                      if (part.startsWith('@')) {
                                        const rawName = part.substring(1).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                        const isMention = freelancers.some(f => f.nome.split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === rawName);
                                        return isMention ? <span key={i} className="text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-indigo-900/40 px-0.5 rounded">{part}</span> : part;
                                      }
                                      return part;
                                    }) : (
                                      <span className="text-neutral-400">Use @ para marcar alguém. Ex: @João está pronto.</span>
                                    )}
                                    {checklistCommentText.endsWith('\n') ? '\n' : ''}
                                  </div>
                                  <textarea
                                    rows={1}
                                    value={checklistCommentText}
                                    onChange={(e) => {
                                      handleTextareaChange(e, 'checklist');
                                      const backdrop = e.target.previousElementSibling as HTMLElement;
                                      if (backdrop) backdrop.scrollTop = e.target.scrollTop;
                                    }}
                                    onScroll={(e) => {
                                      const backdrop = e.currentTarget.previousElementSibling as HTMLElement;
                                      if (backdrop) backdrop.scrollTop = e.currentTarget.scrollTop;
                                    }}
                                    className="relative block w-full h-full min-h-[40px] text-xs p-2 bg-transparent text-transparent caret-indigo-600 dark:caret-indigo-400 resize-none outline-hidden border-none m-0 appearance-none font-sans"
                                  />
                                </div>
                                {/* Mention Dropdown for Checklist */}
                                {mentionSearchText !== null && mentionType === 'checklist' && (
                                  <div className="absolute z-10 w-full max-h-32 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded shadow-lg bottom-full mb-1">
                                    {allMentionableMembers.filter(memId => {
                                      const profile = getMemberDetails(memId);
                                      if (!profile) return false;
                                      return profile.nome.toLowerCase().includes(mentionSearchText.toLowerCase());
                                    }).length > 0 ? (
                                      allMentionableMembers.filter(memId => {
                                        const profile = getMemberDetails(memId);
                                        if (!profile) return false;
                                        return profile.nome.toLowerCase().includes(mentionSearchText.toLowerCase());
                                      }).map(memId => {
                                        const profile = getMemberDetails(memId)!;
                                        return (
                                          <div
                                            key={memId}
                                            onClick={() => handleMentionSelect(profile.nome)}
                                            className="px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-indigo-900/30 cursor-pointer text-neutral-800 dark:text-neutral-200"
                                          >
                                            {profile.nome} <span className="text-[10px] text-neutral-400">({profile.cargo})</span>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="px-3 py-2 text-xs text-neutral-400 italic">Nenhum membro encontrado...</div>
                                    )}
                                  </div>
                                )}
                                <div className="flex justify-end items-center text-[10px] mt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleAddChecklistComment(activeCard.id, item.id)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1 rounded transition-colors shrink-0 cursor-pointer"
                                  >
                                    Enviar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Checklist element form inline */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Adicionar novo item de verificação..."
                          value={newChecklistText}
                          onChange={(e) => setNewChecklistText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addChecklistItem();
                          }}
                          className="flex-1 text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-hidden focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={addChecklistItem}
                          className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-950 font-bold text-xs rounded-xl cursor-pointer shrink-0"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* COMMENTS FEED ENGINE */}
                  <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="block text-[10px] font-black uppercase text-neutral-450 tracking-wider font-mono flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-500 animate-pulse" /> Comentários ({activeCard.comments.length})
                    </span>

                    {/* New Comment Text Box */}
                    <div className="space-y-2 relative">
                      <div className="relative w-full border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-950 focus-within:ring-1 focus-within:ring-purple-500">
                        <div 
                          className="absolute inset-0 p-2.5 text-xs whitespace-pre-wrap break-words pointer-events-none text-neutral-800 dark:text-neutral-200 overflow-hidden font-sans"
                          aria-hidden="true"
                        >
                          {newCommentText ? newCommentText.split(/(@[\wÀ-ÿ]+)/g).map((part, i) => {
                            if (part.startsWith('@')) {
                              const rawName = part.substring(1).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                              const isMention = freelancers.some(f => f.nome.split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === rawName);
                              return isMention ? <span key={i} className="text-purple-600 dark:text-purple-400 font-bold bg-purple-100 dark:bg-indigo-900/40 px-0.5 rounded">{part}</span> : part;
                            }
                            return part;
                          }) : (
                            <span className="text-neutral-400">Escreva uma ata, alteração ou informe andamento...</span>
                          )}
                          {newCommentText.endsWith('\n') ? '\n' : ''}
                        </div>
                        <textarea
                          rows={2}
                          value={newCommentText}
                          onChange={(e) => {
                            handleTextareaChange(e, 'main');
                            const backdrop = e.target.previousElementSibling as HTMLElement;
                            if (backdrop) backdrop.scrollTop = e.target.scrollTop;
                          }}
                          onScroll={(e) => {
                            const backdrop = e.currentTarget.previousElementSibling as HTMLElement;
                            if (backdrop) backdrop.scrollTop = e.currentTarget.scrollTop;
                          }}
                          className="relative block w-full text-xs p-2.5 bg-transparent text-transparent caret-indigo-600 dark:caret-indigo-400 resize-none outline-hidden border-none m-0 appearance-none font-sans"
                        />
                      </div>
                      {/* Mention Dropdown for Main Comment */}
                      {mentionSearchText !== null && mentionType === 'main' && (
                        <div className="absolute z-10 w-full max-h-36 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg bottom-full mb-2">
                          {allMentionableMembers.filter(memId => {
                            const profile = getMemberDetails(memId);
                            if (!profile) return false;
                            return profile.nome.toLowerCase().includes(mentionSearchText.toLowerCase());
                          }).length > 0 ? (
                            allMentionableMembers.filter(memId => {
                              const profile = getMemberDetails(memId);
                              if (!profile) return false;
                              return profile.nome.toLowerCase().includes(mentionSearchText.toLowerCase());
                            }).map(memId => {
                              const profile = getMemberDetails(memId)!;
                              return (
                                <div
                                  key={memId}
                                  onClick={() => handleMentionSelect(profile.nome)}
                                  className="px-3 py-2 text-xs hover:bg-purple-50 dark:hover:bg-indigo-900/30 cursor-pointer text-neutral-800 dark:text-neutral-200 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                                >
                                  {profile.nome} <span className="text-[10px] text-neutral-400">({profile.cargo})</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-xs text-neutral-400 italic">Nenhum membro encontrado...</div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px] text-neutral-400 pt-1 mt-1">
                        <span>Gravando como: <strong className="text-neutral-600 dark:text-neutral-300 font-bold">{currentUser?.nome}</strong></span>
                        <button
                          type="button"
                          onClick={appendComment}
                          className="px-3.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-lg cursor-pointer"
                        >
                          Enviar Comentário
                        </button>
                      </div>
                    </div>

                    {/* Feed Output */}
                    <div className="space-y-3">
                      {activeCard.comments.map(comment => (
                        <div 
                          key={comment.id}
                          className="bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-150/50 dark:border-neutral-850 p-3 rounded-2xl space-y-2 text-xs relative hover:border-neutral-250 transition-all font-sans"
                        >
                          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-850 pb-1.5 text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 block" />
                              <strong className="text-neutral-800 dark:text-neutral-150 font-extrabold">{comment.memberName}</strong>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-neutral-400 text-[9px]">{comment.date}</span>
                              <button
                                type="button"
                                onClick={() => deleteComment(activeCard.id, comment.id)}
                                className="text-neutral-400 hover:text-rose-500 transition-colors"
                                title="Deletar comentário"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                            {comment.text.split(/(@[\wÀ-ÿ]+)/g).map((part, i) => {
                              if (part.startsWith('@')) {
                                const rawName = part.substring(1).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                const isMention = freelancers.some(f => f.nome.split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === rawName);
                                return isMention ? <span key={i} className="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-indigo-900/30 px-1 rounded">{part}</span> : part;
                              }
                              return part;
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Footer Save & Delete Button row */}
              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/20 shrink-0 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteCard(activeCard.id)}
                  className="px-3.5 py-2.5 hover:bg-rose-500/5 text-rose-500 hover:text-rose-600 font-bold text-xs rounded-xl border border-transparent hover:border-rose-200/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Apagar Cartão</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCardModalOpen(false);
                      setSelectedCardId(null);
                    }}
                    className="px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-250 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCardDetails}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-3xs"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
