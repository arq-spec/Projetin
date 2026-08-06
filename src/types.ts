export interface PerformanceReview {
  id: string;
  projetoNome: string;
  cliente: string;
  nota: number; // 1 a 5
  comentario: string;
  data: string;
}

export interface ProjectHistory {
  id: string;
  nome: string;
  cliente: string;
  dataInicio: string;
  dataFim: string;
  status: 'Concluído' | 'Em Andamento' | 'Cancelado';
  cargo: string;
  valorRecebido?: number;
}

export interface FreelancerAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // stored base64 or similar for local mock download
}

export interface FreelancerCertification {
  id: string;
  nome: string;
  dataValidade: string;
  anexo?: FreelancerAttachment;
}

export interface Freelancer {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  cidade: string;
  habilidades: string[];
  disponibilidade?: 'Disponível' | 'Indisponível' | 'Parcial';
  bio: string;
  valorHora: number;
  outrasFuncoes?: string[];
  tarifasSecundarias?: Record<string, number>;
  fotoPerfil?: string;
  cpfCif?: string;
  cnpj?: string;
  enderecoCompleto?: string;
  avaliacoes: PerformanceReview[];
  historicoProjetos: ProjectHistory[];
  certificacoes?: FreelancerCertification[];
  arquivado?: boolean;
  motivoArquivamento?: string;
  arquivadoPor?: string;
  dataArquivamento?: string;
  anexos?: FreelancerAttachment[];
  celular?: string;
  identidadeRg?: string;
  dataNascimento?: string;
  sexo?: string;
  funcaoPrincipal?: string;
  chavePix?: string;
  enderecoCep?: string;
  endereco?: string;
  enderecoNumero?: string;
  enderecoComplemento?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoUf?: string;
  fotoAtiva?: string;
  cacheSugerido?: number;
  rating?: string;
  recomendacoes?: number;
  dataCadastro?: string;
  historicoTrabalhos?: any[];
  instagram?: string;
  siteReferencia?: string;
  statusAprovacao?: 'Pendente' | 'Aprovado' | 'Rejeitado';
}

export interface CalendarEvent {
  id: string;
  freelancerId: string;
  data: string; // YYYY-MM-DD
  tipo: 'Disponível' | 'Ocupado' | 'Indisponível';
  titulo: string;
}

export interface ProjectAllocation {
  id: string;
  freelancerId: string;
  freelancerNome: string;
  funcao: string;
  dataInicio: string;
  dataFim: string;
  valorHora: number;
  totalCache: number;
  statusConfirmacao?: 'Pendente' | 'Confirmado' | 'Recusado' | 'Chamado';
  chamadoMensagem?: string;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  projeto: string;
  freelancerId?: string;
  freelancerNome?: string;
  progresso: number; // 0 a 100
  status: 'Pendente' | 'Em Andamento' | 'Em Revisão' | 'Concluído';
  prioridade: 'Baixa' | 'Média' | 'Alta';
  localEvento?: string;
  dataEntrega?: string;
  dataInicio?: string;
  horaInicio?: string;
  dataFim?: string;
  horaFim?: string;
  budget?: number;
  alocacoes?: ProjectAllocation[];
  historicoRecusas?: ProjectAllocation[];
  diariasData?: Record<string, Record<string, { chegada?: string; saida?: string; localizacao?: string; localizacaoChegada?: string; localizacaoSaida?: string; foto?: string; preenchidoManualmente?: boolean; confirmadoPeloGestor?: boolean; liberadoCheckin?: boolean; liberadoCheckinHora?: string; liberadoCheckout?: boolean; liberadoCheckoutHora?: string }>>;
  mealConfig?: MealConfig;
  folhaFechada?: boolean;
  bloqueioAtivado?: boolean;
  notasFiscais?: Record<string, { base64: string; name: string; date: string; status?: 'Pendente' | 'Aprovado' | 'Rejeitado' }>;
  custoRealExecutado?: number;
}

export interface MealConfig {
  cafeStart?: string;
  cafeEnd?: string;
  cafeValue?: number;
  cafeEnabled?: boolean;

  almocoStart?: string;
  almocoEnd?: string;
  almocoValue?: number;
  almocoEnabled?: boolean;

  jantarStart?: string;
  jantarEnd?: string;
  jantarValue?: number;
  jantarEnabled?: boolean;
}

export interface Notification {
  id: string;
  freelancerId: string;
  freelancerNome: string;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  tipo: 'Demanda' | 'Info' | 'Urgente';
  isConfirmacaoRequest?: boolean;
  projetoId?: string;
  cardId?: string;
  alocacaoId?: string;
}

export interface Client {
  id: string;
  nome: string; // Client's name / corporate name
  cnpj?: string;
  segmento?: string; // e.g. Eventos, Tecnologia
  email?: string;
  telefone?: string;
  dataCadastro?: string;
}

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Produtor' | 'Gestor' | 'Freelancer';
  freelancerId?: string; // linked talent ID from the talent registry
  username?: string;
  cpf?: string;
  password?: string;
  statusAprovacao?: 'Pendente' | 'Aprovado' | 'Rejeitado';
}

export interface RegistrationRequest {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string;
  whatsapp: string;
  cargo: string;
  instagram?: string;
  siteReferencia?: string;
  dataSolicitacao: string;
}

export interface SystemUser {
  id: string;
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Produtor' | 'Gestor' | 'Freelancer';
  freelancerId?: string;
  username: string;
  cpf: string;
  password?: string; // Empty means first login
  isMasterAdmin?: boolean;
  statusAprovacao?: 'Pendente' | 'Aprovado' | 'Rejeitado';
}

export interface ProfilePermissions {
  perfil: 'Administrador' | 'Produtor' | 'Gestor' | 'Freelancer';
  canViewDashboard: boolean;
  canManageProjects: boolean;
  canViewRegistry: boolean;
  canEditRegistry: boolean;
  canViewCalendarAll: boolean;
  canViewAdminPanel: boolean;
  canConfigurePermissions: boolean;
}

export interface DimensionDetails {
  peso: number | string;
  altura: number | string;
  largura: number | string;
  profundidade: number | string;
}

export interface InventoryItem {
  id: string;
  descricao: string;
  descricaoComercial: string;
  modelo: string;
  categoria: string;
  familia: string;
  fabricante: string;
  dimensoesComCase: DimensionDetails;
  dimensoesSemCase: DimensionDetails;
  quantidade: number;
  status: 'Disponível' | 'Em Uso' | 'Manutenção' | 'Esgotado';
  observacoes?: string;
  hasMaintenanceHistory?: boolean;
}

export interface KanbanChecklistItem {
  id: string;
  text: string;
  done: boolean;
  comments?: KanbanComment[];
}

export interface KanbanComment {
  id: string;
  memberId?: string;
  memberName: string;
  text: string;
  date: string;
}

export interface KanbanCard {
  id: string;
  columnId: string;
  workspaceId: string;
  title: string;
  description: string;
  dueDate?: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  labels: string[]; // ['Vermelho', 'Laranja', 'Amarelo', 'Verde', 'Azul', 'Roxo']
  members: string[]; // Freelancer IDs assigned to card
  checklist: KanbanChecklistItem[];
  comments: KanbanComment[];
}

export interface KanbanColumn {
  id: string;
  workspaceId: string;
  title: string;
  order: number;
}

export interface WorkstationWorkspace {
  id: string;
  name: string;
  description: string;
  teamMemberIds: string[]; // Freelancer IDs assigned to workspace
  createdAt: string;
  colorHex?: string; // background indicator
  bgImage?: string; // background image (URL or Base64 data)
  visibilityType?: 'all' | 'restricted' | string; // who has visualization rights
  allowedUserIds?: string[]; // user IDs allowed to view
}

export interface PdfTheme {
  bannerColor: string;
  titleColor: string;
  subtitleColor: string;
  highlightColor: string;
  logoSize?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  companyName?: string;
  companyCnpj?: string;
}



