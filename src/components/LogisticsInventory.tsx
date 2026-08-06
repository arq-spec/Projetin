import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, DimensionDetails, UserProfile } from '../types';
import { loadFromDatabase, saveToDatabase } from '../database';
import { 
  Boxes, 
  Plus, 
  Search, 
  Filter, 
  Scale, 
  Package, 
  Edit3, 
  Trash2, 
  Copy, 
  Tag, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  Maximize2,
  ListFilter,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  Forklift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogisticsInventoryProps {
  currentUser: UserProfile | null;
}

// Beautiful initial assets for typical high-end audiovisual, event, stage production corporate inventory
const initialInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    descricao: 'Caixa de Som Line Array Ativa com Falante de Neodímio',
    descricaoComercial: 'L-Acoustics K2 Line Array',
    modelo: 'K2',
    categoria: 'Sonorização',
    familia: 'Caixas de Som',
    fabricante: 'L-Acoustics',
    quantidade: 24,
    status: 'Disponível',
    dimensoesComCase: {
      peso: '124', // kg (Duas unidades no case)
      altura: '85', // cm
      largura: '140', // cm
      profundidade: '65' // cm
    },
    dimensoesSemCase: {
      peso: '56', // kg (Unidade individual)
      altura: '43.7', // cm
      largura: '133.8', // cm
      profundidade: '40' // cm
    },
    observacoes: 'Ideal para grandes concertos outdoor e arenas fechadas. Sempre verificar a pesagem no motor rigging antes de montar.'
  },
  {
    id: 'inv-2',
    descricao: 'Console Digital de Mixagem Profissional 72 Canais',
    descricaoComercial: 'Mesa de Som Yamaha Rivage PM7',
    modelo: 'Rivage PM7',
    categoria: 'Sonorização',
    familia: 'Consoles',
    fabricante: 'Yamaha',
    quantidade: 2,
    status: 'Em Uso',
    dimensoesComCase: {
      peso: '115', // kg
      altura: '110', // cm
      largura: '175', // cm
      profundidade: '75' // cm
    },
    dimensoesSemCase: {
      peso: '52', // kg
      altura: '41.7', // cm
      largura: '154.9', // cm
      profundidade: '64.3' // cm
    },
    observacoes: 'Acompanha switch de rede de alta velocidade Cisco redundante montado sob o doghouse do case.'
  },
  {
    id: 'inv-3',
    descricao: 'Moving Light Spot de Alta Potência 1700W LED',
    descricaoComercial: 'Robe BMFL Blade',
    modelo: 'BMFL Blade',
    categoria: 'Iluminação',
    familia: 'Moving Lights',
    fabricante: 'Robe Lighting',
    quantidade: 36,
    status: 'Disponível',
    dimensoesComCase: {
      peso: '98', // kg (Case duplo)
      altura: '96', // cm
      largura: '120', // cm
      profundidade: '60' // cm
    },
    dimensoesSemCase: {
      peso: '37.9', // kg
      altura: '81.3', // cm
      largura: '48.3', // cm
      profundidade: '33.5' // cm
    },
    observacoes: 'Sempre testar o reset de pan/tilt e as lâmpadas de descarga antes de encasar de ponta cabeça.'
  },
  {
    id: 'inv-4',
    descricao: 'Painel de LED de Alta Resolução Pixel Pitch 2.6mm Outdoor',
    descricaoComercial: 'Painel de LED Absen PL2.6 Lite',
    modelo: 'PL2.6 Pro',
    categoria: 'Vídeo',
    familia: 'Painéis de LED',
    fabricante: 'Absen',
    quantidade: 250,
    status: 'Disponível',
    dimensoesComCase: {
      peso: '86', // kg (8 módulos por case de voo)
      altura: '75', // cm
      largura: '115', // cm
      profundidade: '62' // cm
    },
    dimensoesSemCase: {
      peso: '7.8', // kg por placa
      altura: '50', // cm
      largura: '50', // cm
      profundidade: '8' // cm
    },
    observacoes: 'Módulos ultra-leves e magnéticos. Manusear as bordas de plástico contra colisão nas quinas externas dos pixels para não arrancar diodos.'
  },
  {
    id: 'inv-5',
    descricao: 'Processadora de Vídeo Multidisplay 4K Eventos Corporativos',
    descricaoComercial: 'Barco Event Master E2 Gen 2',
    modelo: 'E2 Gen 2',
    categoria: 'Vídeo',
    familia: 'Processadores',
    fabricante: 'Barco',
    quantidade: 4,
    status: 'Manutenção',
    dimensoesComCase: {
      peso: '45', // kg
      altura: '52', // cm
      largura: '68', // cm
      profundidade: '65' // cm
    },
    dimensoesSemCase: {
      peso: '21.5', // kg
      altura: '22', // cm (5 RU)
      largura: '48.2', // cm (Padrão Rack 19 polegadas)
      profundidade: '56.3' // cm
    },
    observacoes: 'Enviado para reparo do cartão flexível de entrada HDMI 2.0 número 3. Conexão Ethernet travando.'
  }
];

export default function LogisticsInventory({ currentUser }: LogisticsInventoryProps) {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('freelance_management_inventory_v1');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [dbLoaded, setDbLoaded] = useState(false);
  const isLoadedRef = useRef(false);
  const lastDbValueRef = useRef<InventoryItem[] | null>((() => {
    const saved = localStorage.getItem('freelance_management_inventory_v1');
    return saved ? JSON.parse(saved) : initialInventory;
  })());

  // Sync initial state from Database on mount
  useEffect(() => {
    async function loadInventory() {
      try {
        const dbItems = await loadFromDatabase('inventory');
        if (dbItems !== null) {
          setItems(dbItems);
          lastDbValueRef.current = dbItems;
        }
        isLoadedRef.current = true;
      } catch (err) {
        console.warn("Failed to load inventory from Database", err);
      } finally {
        setDbLoaded(true);
      }
    }
    loadInventory();
  }, []);

  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'inventory' | 'maintenance'>('inventory');
  
  // Custom View Controls
  const [showQuickPreview, setShowQuickPreview] = useState<boolean>(() => {
    const saved = localStorage.getItem('logistics_show_quick_preview');
    return saved ? JSON.parse(saved) : false; // Default false as requested
  });
  const [activeDetailItem, setActiveDetailItem] = useState<InventoryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const toggleQuickPreview = () => {
    setShowQuickPreview(prev => {
      const next = !prev;
      localStorage.setItem('logistics_show_quick_preview', JSON.stringify(next));
      return next;
    });
  };
  
  // Create / Edit modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [descricao, setDescricao] = useState('');
  const [descricaoComercial, setDescricaoComercial] = useState('');
  const [modelo, setModelo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [familia, setFamilia] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [status, setStatus] = useState<InventoryItem['status']>('Disponível');
  const [observacoes, setObservacoes] = useState('');
  
  // Dimensions Case fields
  const [ccPeso, setCcPeso] = useState<string>('');
  const [ccAltura, setCcAltura] = useState<string>('');
  const [ccLargura, setCcLargura] = useState<string>('');
  const [ccProfundidade, setCcProfundidade] = useState<string>('');
  
  // Dimensions No-Case fields
  const [scPeso, setScPeso] = useState<string>('');
  const [scAltura, setScAltura] = useState<string>('');
  const [scLargura, setScLargura] = useState<string>('');
  const [scProfundidade, setScProfundidade] = useState<string>('');

  // Persists whenever updated
  useEffect(() => {
    if (!dbLoaded || !isLoadedRef.current) return;
    localStorage.setItem('freelance_management_inventory_v1', JSON.stringify(items));
    if (JSON.stringify(items) !== JSON.stringify(lastDbValueRef.current)) {
      lastDbValueRef.current = items;
      saveToDatabase('inventory', items);
    }
  }, [items, dbLoaded]);

  // Extract list of all unique categories and families for filtering
  const categoriesList = useMemo(() => {
    const cats = items.map(item => item.categoria.trim()).filter(Boolean);
    return Array.from(new Set(cats));
  }, [items]);

  // Families mapping based on categories
  const familiesByCategoryMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    items.forEach(item => {
      const cat = item.categoria.trim();
      const fam = item.familia.trim();
      if (cat && fam) {
        if (!map[cat]) {
          map[cat] = [];
        }
        if (!map[cat].includes(fam)) {
          map[cat].push(fam);
        }
      }
    });
    return map;
  }, [items]);

  // Families for the currently selected category filter context
  const currentFamiliesFilteredList = useMemo(() => {
    if (selectedCategory === 'all') {
      const allFams = items.map(item => item.familia.trim()).filter(Boolean);
      return Array.from(new Set(allFams));
    }
    return familiesByCategoryMap[selectedCategory] || [];
  }, [selectedCategory, familiesByCategoryMap, items]);

  // Fast suggestions for form creation
  const formFamiliesSuggestions = useMemo(() => {
    if (!categoria) return [];
    return familiesByCategoryMap[categoria] || [];
  }, [categoria, familiesByCategoryMap]);

  // Reset selected family if category filter changes under normal conditions
  useEffect(() => {
    setSelectedFamily('all');
  }, [selectedCategory]);

  // Filtered Inventory List
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Tab filter
      const isMaintenanceView = activeViewTab === 'maintenance';
      if (isMaintenanceView && item.status !== 'Manutenção' && !item.hasMaintenanceHistory) {
        return false;
      }
      if (!isMaintenanceView && item.status === 'Manutenção') {
        return false;
      }

      const matchesSearch = 
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricaoComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fabricante.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'all' || item.categoria === selectedCategory;
      const matchesFam = selectedFamily === 'all' || item.familia === selectedFamily;

      return matchesSearch && matchesCat && matchesFam;
    });
  }, [items, searchTerm, selectedCategory, selectedFamily, activeViewTab]);

  // Counters
  const totalItemCount = useMemo(() => {
    return items.reduce((acc, current) => acc + (Number(current.quantidade) || 0), 0);
  }, [items]);

  const uniqueItemCount = items.length;

  const countByStatus = (st: InventoryItem['status']) => {
    return items.filter(i => i.status === st).length;
  };

  const handleOpenCreateForm = () => {
    setFormMode('create');
    setEditingId(null);
    setDescricao('');
    setDescricaoComercial('');
    setModelo('');
    setCategoria(categoriesList[0] || 'Sonorização');
    setFamilia('');
    setFabricante('');
    setQuantidade(1);
    setStatus('Disponível');
    setObservacoes('');
    
    // reset case dimensions
    setCcPeso('');
    setCcAltura('');
    setCcLargura('');
    setCcProfundidade('');

    // reset no case dimensions
    setScPeso('');
    setScAltura('');
    setScLargura('');
    setScProfundidade('');
    
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode('edit');
    setEditingId(item.id);
    setDescricao(item.descricao);
    setDescricaoComercial(item.descricaoComercial);
    setModelo(item.modelo);
    setCategoria(item.categoria);
    setFamilia(item.familia);
    setFabricante(item.fabricante);
    setQuantidade(item.quantidade);
    setStatus(item.status);
    setObservacoes(item.observacoes || '');
    
    setCcPeso(String(item.dimensoesComCase.peso));
    setCcAltura(String(item.dimensoesComCase.altura));
    setCcLargura(String(item.dimensoesComCase.largura));
    setCcProfundidade(String(item.dimensoesComCase.profundidade));

    setScPeso(String(item.dimensoesSemCase.peso));
    setScAltura(String(item.dimensoesSemCase.altura));
    setScLargura(String(item.dimensoesSemCase.largura));
    setScProfundidade(String(item.dimensoesSemCase.profundidade));
    
    setIsFormOpen(true);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza de que deseja excluir este item do inventário?')) {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const handleDuplicateItem = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      descricaoComercial: `${item.descricaoComercial} (Cópia)`,
      quantidade: 1, // Reset duplication to standard starter quantity
      status: 'Disponível'
    };
    setItems(prev => [duplicated, ...prev]);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !descricaoComercial || !modelo || !categoria || !familia) {
      alert('Por favor, preencha todos os campos obrigatórios (Descrição, Comercial, Modelo, Categoria e Família).');
      return;
    }

    let hasMaintenanceHistory = status === 'Manutenção';
    if (formMode === 'edit' && editingId) {
      const existing = items.find(i => i.id === editingId);
      if (existing?.hasMaintenanceHistory) {
        hasMaintenanceHistory = true;
      }
    }

    const newItemPayload: InventoryItem = {
      id: formMode === 'create' ? `inv-${Date.now()}` : (editingId || `inv-${Date.now()}`),
      descricao,
      descricaoComercial,
      modelo,
      categoria,
      familia,
      fabricante,
      quantidade: Number(quantidade) || 1,
      status,
      observacoes,
      hasMaintenanceHistory,
      dimensoesComCase: {
        peso: ccPeso || '0',
        altura: ccAltura || '0',
        largura: ccLargura || '0',
        profundidade: ccProfundidade || '0'
      },
      dimensoesSemCase: {
        peso: scPeso || '0',
        altura: scAltura || '0',
        largura: scLargura || '0',
        profundidade: scProfundidade || '0'
      }
    };

    if (formMode === 'create') {
      setItems(prev => [newItemPayload, ...prev]);
    } else {
      setItems(prev => prev.map(i => i.id === editingId ? newItemPayload : i));
      if (selectedItem?.id === editingId) {
        setSelectedItem(newItemPayload);
      }
      if (activeDetailItem?.id === editingId) {
        setActiveDetailItem(newItemPayload);
      }
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-1">
      
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-5 rounded-2xl shadow-3xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-600 rounded-lg text-neutral-950 flex items-center justify-center shadow-inner">
              <Forklift className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Logística de Eventos
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Módulo de Inventariado
                </span>
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Gerencie todos os equipamentos físicos de sonorização, iluminação e vídeo instalados e embalados em Cases de transporte de altíssima resistência.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Toggle Quick Preview */}
          <button
            type="button"
            onClick={toggleQuickPreview}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border flex items-center justify-center gap-2 font-mono uppercase tracking-wider cursor-pointer select-none ${
              showQuickPreview
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 dark:text-neutral-300 dark:border-neutral-700'
            }`}
            title={showQuickPreview ? "Ocultar painel de visualização lateral" : "Exibir painel de visualização lateral"}
          >
            {showQuickPreview ? (
              <>
                <Eye className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Painel Lateral: ON</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Painel Lateral: OFF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="px-4 py-2 bg-purple-600 hover:bg-amber-600 font-extrabold text-neutral-950 active:bg-amber-700 text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 font-mono uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" /> Cadastrar Novo Item
          </button>
        </div>
      </div>

      {/* Top statistics overview panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex flex-col justify-between shadow-3xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Total em Unidade</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">{totalItemCount}</span>
            <span className="text-[9px] text-neutral-400 font-medium">unids</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex flex-col justify-between shadow-3xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tipos de Equipamento</span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">{uniqueItemCount}</span>
            <span className="text-[9px] text-neutral-400 font-medium">modelos</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex flex-col justify-between shadow-3xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Disponível</span>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-black text-emerald-600">{countByStatus('Disponível')}</span>
            <span className="text-[9px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.2 rounded font-bold uppercase">Ativo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl flex flex-col justify-between shadow-3xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Alocados / Em Uso</span>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-black text-blue-600">{countByStatus('Em Uso')}</span>
            <span className="text-[9px] text-blue-700 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.2 rounded font-bold uppercase">Trabalho</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl col-span-2 md:col-span-1 flex flex-col justify-between shadow-3xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Em Manutenção</span>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-black text-purple-600">{countByStatus('Manutenção')}</span>
            <span className="text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.2 rounded font-bold uppercase">Lab</span>
          </div>
        </div>
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Dynamic Inventory List & Filter controls */}
        <div className={`${
          showQuickPreview && selectedItem ? 'lg:col-span-8' : 'lg:col-span-12'
        } space-y-4`}>

          {/* View Tabs */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800/50 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveViewTab('inventory')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeViewTab === 'inventory' 
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Inventário Geral
            </button>
            <button
              onClick={() => setActiveViewTab('maintenance')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeViewTab === 'maintenance' 
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              Histórico de Manutenção
            </button>
          </div>
          
          {/* Controls Bar */}
          <div className="bg-white dark:bg-neutral-900 p-4 border border-neutral-100 dark:border-neutral-800 rounded-2xl shadow-3xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              
              {/* Text Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por descrição, modelo, comercial ou fabricante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50/50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder-neutral-400 font-medium"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 min-w-[160px]">
                <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="all">Todas Categorias</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sub-filter Family based on selected Category */}
              <div className="flex items-center gap-1.5 min-w-[160px]">
                <ListFilter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <select
                  value={selectedFamily}
                  onChange={(e) => setSelectedFamily(e.target.value)}
                  className="w-full text-xs font-semibold py-2 px-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  disabled={selectedCategory !== 'all' && currentFamiliesFilteredList.length === 0}
                >
                  <option value="all">
                    {selectedCategory === 'all' ? 'Família (Sub-filtro)' : 'Todas Famílias'}
                  </option>
                  {currentFamiliesFilteredList.map(fam => (
                    <option key={fam} value={fam}>{fam}</option>
                  ))}
                </select>
              </div>

            </div>

            {(selectedCategory !== 'all' || selectedFamily !== 'all' || searchTerm) && (
              <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-100 dark:border-neutral-850">
                <span className="text-[10px] text-neutral-500 font-medium font-mono">
                  Mostrando {filteredItems.length} de {items.length} itens encontrados para os critérios aplicados.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedFamily('all');
                  }}
                  className="text-[10px] text-amber-600 hover:text-amber-700 font-extrabold uppercase font-mono cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className={`grid gap-4 ${
            showQuickPreview && selectedItem 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {filteredItems.length === 0 ? (
              <div className="col-span-full py-12 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
                <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Nenhum item localizado</h4>
                <p className="text-xs text-neutral-400 max-w-sm mt-1">
                  Não pudemos encontrar equipamentos no inventário com as palavras-chave ou filtros selecionados para {selectedCategory !== 'all' ? `a categoria "${selectedCategory}"` : 'todas as categorias'}.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="mt-4 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 text-neutral-700 text-[11px] font-bold rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Adicionar Item de Teste
                </button>
              </div>
            ) : (
              filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      if (!showQuickPreview) {
                        setActiveDetailItem(item);
                      }
                    }}
                    className={`p-4 bg-white dark:bg-neutral-900 border rounded-2xl shadow-3xs cursor-pointer transition-all flex flex-col justify-between min-h-[190px] relative hover:shadow-xs select-none ${
                      isSelected 
                        ? 'ring-2 ring-amber-500 border-transparent shadow-xs bg-amber-50/5 dark:bg-neutral-900/90' 
                        : 'border-neutral-100 dark:border-neutral-800'
                    }`}
                  >
                    <div>
                      {/* Category and status pill */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                            {item.categoria}
                          </span>
                          <span className="text-[9px] font-medium text-neutral-400">
                            {item.familia}
                          </span>
                        </div>
                        
                        <span className={`text-[8.5px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          item.status === 'Disponível' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' 
                            : item.status === 'Em Uso'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20'
                            : item.status === 'Manutenção'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      {/* Main Titles */}
                      <div className="mt-3">
                        <h3 className="font-extrabold text-neutral-900 dark:text-white text-sm leading-tight truncate">
                          {item.descricaoComercial}
                        </h3>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 line-clamp-1 italic">
                          {item.descricao}
                        </p>
                      </div>

                      {/* Quick Meta details */}
                      <div className="grid grid-cols-2 gap-2 mt-3.5 border-t border-neutral-50 dark:border-neutral-850 pt-2 text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                        <div>
                          <span className="block text-[8px] text-neutral-400 font-bold uppercase">Fabricante</span>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate block">{item.fabricante || 'Estágio Próprio'}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-neutral-400 font-bold uppercase">Modelo</span>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate block">{item.modelo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between border-t border-neutral-50 dark:border-neutral-850 pt-2.5 mt-2.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-neutral-400 font-medium">Qtd:</span>
                        <span className="text-xs font-black text-neutral-900 dark:text-white font-mono">{item.quantidade}</span>
                      </div>

                      {/* Utility Action Buttons */}
                      <div className="flex items-center gap-1.5 opacity-95 hover:opacity-100">
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-50/90 dark:bg-rose-950/20 p-0.5 px-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 animate-fade-in">
                            <span className="text-[8px] text-rose-500 font-bold uppercase tracking-tight mr-1">Excluir?</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = items.filter(i => i.id !== item.id);
                                setItems(updated);
                                if (selectedItem?.id === item.id) {
                                  setSelectedItem(null);
                                }
                                if (activeDetailItem?.id === item.id) {
                                  setActiveDetailItem(null);
                                }
                                setDeleteConfirmId(null);
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[8px] rounded-md transition-colors cursor-pointer uppercase font-mono"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-[8px] rounded-md transition-colors cursor-pointer uppercase font-mono"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDetailItem(item);
                              }}
                              title="Visualizar Ficha Técnica (Página Completa do Item)"
                              className="p-1 px-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 text-amber-600 hover:text-amber-700 dark:text-amber-300 rounded transition-all cursor-pointer flex items-center gap-1 font-mono uppercase text-[8px] font-black border border-amber-200/40"
                            >
                              <Maximize2 className="w-2.5 h-2.5" />
                              <span>Ficha</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDuplicateItem(item, e)}
                              title="Duplicar Item"
                              className="p-1 px-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditForm(item, e)}
                              title="Editar Equipamento"
                              className="p-1 px-1.5 text-neutral-400 hover:text-amber-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(item.id);
                              }}
                              title="Excluir Equipamento"
                              className="p-1 px-1.5 text-neutral-400 hover:text-rose-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

               {/* Right Side: Magnified Product Detail Panel (Logistics Dimension Comparison) */}
        {showQuickPreview && (
          <div className="lg:col-span-4 bg-white dark:bg-neutral-900 border border-neutral-105 dark:border-neutral-800 rounded-2xl shadow-3xs p-4 space-y-4">
            
            {selectedItem ? (
              <div className="space-y-4 animate-fade-in">
                
                {/* Header card info */}
                <div className="pb-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 uppercase font-mono block">Detalhamento Logístico</span>
                    <h2 className="text-base font-extrabold text-neutral-900 dark:text-white mt-1 leading-tight">
                      {selectedItem.descricaoComercial}
                    </h2>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      ID único de controle: <code className="font-mono bg-neutral-50 dark:bg-neutral-950 px-1 py-0.2 rounded text-[9px]">{selectedItem.id}</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status details segment and description */}
                <div className="space-y-2 bg-neutral-50/50 dark:bg-neutral-950 p-3 rounded-xl border border-neutral-100 dark:border-neutral-850">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Descrição Detalhada do Ativo</span>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-3">
                    {selectedItem.descricao}
                  </p>
                  
                  {selectedItem.observacoes && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/60 mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 space-y-0.5">
                      <span className="font-semibold text-neutral-600 dark:text-neutral-300 block">💡 Nota de Transporte/Operação:</span>
                      <span className="block italic">"{selectedItem.observacoes}"</span>
                    </div>
                  )}
                </div>

                {/* TWO SEPARATE FIELDS AS EXPLICITLY REQUESTED */}
                {/* Separated fields for dimensions with Case and without Case */}
                <div className="space-y-4">
                  
                  {/* DIMENSÕES COM CASE (Peso, Altura, Largura, Profundidade) */}
                  <div className="border border-purple-500/20 bg-amber-50/10 dark:bg-amber-950/10 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-600 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                        <Boxes className="w-4 h-4 text-purple-600" /> Dimensões COM Case
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white/80 dark:bg-neutral-900 p-2 rounded-lg border border-amber-105 dark:border-neutral-800 font-mono">
                        <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Peso</span>
                        <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedItem.dimensoesComCase.peso || '0'}<span className="text-[9px] text-neutral-405 font-medium">kg</span>
                        </strong>
                      </div>
                      
                      <div className="bg-white/80 dark:bg-neutral-900 p-2 rounded-lg border border-amber-105 dark:border-neutral-800 font-mono">
                        <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold block">Altura</span>
                        <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedItem.dimensoesComCase.altura || '0'}<span className="text-[9px] text-neutral-405 font-medium">cm</span>
                        </strong>
                      </div>

                      <div className="bg-white/80 dark:bg-neutral-900 p-2 rounded-lg border border-amber-105 dark:border-neutral-800 font-mono">
                        <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold block">Largura</span>
                        <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedItem.dimensoesComCase.largura || '0'}<span className="text-[9px] text-neutral-405 font-medium">cm</span>
                        </strong>
                      </div>

                      <div className="bg-white/80 dark:bg-neutral-900 p-2 rounded-lg border border-amber-105 dark:border-neutral-800 font-mono">
                        <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold block block">Profund.</span>
                        <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedItem.dimensoesComCase.profundidade || '0'}<span className="text-[9px] text-neutral-455 font-medium">cm</span>
                        </strong>
                      </div>
                    </div>

                    {/* Volume Cubic calculation for cargo spaces */}
                    {selectedItem.dimensoesComCase.altura && selectedItem.dimensoesComCase.largura && selectedItem.dimensoesComCase.profundidade && (
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 flex justify-between px-1">
                        <span>Cubicagem Estimada em Case:</span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono">
                          {(
                            (Number(selectedItem.dimensoesComCase.altura) * 
                             Number(selectedItem.dimensoesComCase.largura) * 
                             Number(selectedItem.dimensoesComCase.profundidade)) / 1000000
                          ).toFixed(3)} m³
                        </span>
                      </div>
                    )}
                  </div>

                  {/* DIMENSÕES SEM CASE (Peso, Altura, Largura, Profundidade) */}
                  <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/20 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 uppercase font-mono tracking-wider animate-pulse">
                        <Package className="w-4 h-4 text-neutral-500" /> Dimensões SEM Case
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono">
                        <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Peso</span>
                        <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedItem.dimensoesSemCase.peso || '0'}<span className="text-[9px] text-neutral-400 font-medium">kg</span>
                        </strong>
                      </div>

                      <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono">
                        <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Altura</span>
                        <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedItem.dimensoesSemCase.altura || '0'}<span className="text-[9px] text-neutral-400 font-medium font-mono">cm</span>
                        </strong>
                      </div>

                      <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono">
                        <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Largura</span>
                        <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedItem.dimensoesSemCase.largura || '0'}<span className="text-[9px] text-neutral-400 font-medium">cm</span>
                        </strong>
                      </div>

                      <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 font-mono">
                        <span className="block text-[8px] text-neutral-400 dark:text-neutral-500 uppercase font-bold">Profund.</span>
                        <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5 font-mono">
                          {selectedItem.dimensoesSemCase.profundidade || '0'}<span className="text-[9px] text-neutral-400 font-medium font-mono">cm</span>
                        </strong>
                      </div>
                    </div>

                    {/* Volume cubic calculation */}
                    {selectedItem.dimensoesSemCase.altura && selectedItem.dimensoesSemCase.largura && selectedItem.dimensoesSemCase.profundidade && (
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 flex justify-between px-1">
                        <span>Cubicagem Estimada de Uso:</span>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono">
                          {(
                            (Number(selectedItem.dimensoesSemCase.altura) * 
                             Number(selectedItem.dimensoesSemCase.largura) * 
                             Number(selectedItem.dimensoesSemCase.profundidade)) / 1000000
                          ).toFixed(3)} m³
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Key action helper triggers */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDetailItem(selectedItem)}
                    className="w-full py-2.5 bg-purple-600 hover:bg-amber-600 text-neutral-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer font-mono uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Ver Página do Ativo</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditForm(selectedItem, e)}
                      className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer font-mono uppercase tracking-wider text-center"
                    >
                      Editar Registro
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDuplicateItem(selectedItem, e)}
                      className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center animate-pulse"
                      title="Duplicar Item"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-20 text-center space-y-3">
                <Boxes className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-750 dark:text-neutral-200">Nenhum Ativo Selecionado</h3>
                  <p className="text-xs text-neutral-400 px-4 max-w-xs mx-auto">
                    Clique em qualquer item do inventário do lado esquerdo para analisar o comparativo de dimensões com e sem case e gerenciar os dados operacionais.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Modal Slideover / Popup Form for Create & Edit */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/60 backdrop-blur-xs flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 200 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-xl min-h-screen p-6 shadow-2xl flex flex-col justify-between border-l border-neutral-150 dark:border-neutral-800 [color-scheme:light-dark]"
            >
              <form onSubmit={handleSubmitForm} className="space-y-5 flex-1 pb-12">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <div>
                    <h3 className="text-base font-bold text-neutral-950 dark:text-white font-sans">
                      {formMode === 'create' ? '📋 Cadastrar Ativo no Inventário' : '📝 Editar Detalhes do Ativo'}
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      As dimensões auxiliam no planejamento de fretes e montagem do rigging.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="p-1 px-2.5 rounded-lg border border-neutral-200 text-neutral-405 hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Core content fields */}
                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                  
                  {/* Descricao Comercial */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                      Nome Comercial / Título do Aparelho <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: L-Acoustics K2 Line Array ou Console Digital Yamaha Rivage PM7..."
                      value={descricaoComercial}
                      onChange={(e) => setDescricaoComercial(e.target.value)}
                      className="w-full text-xs font-semibold py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Descricao Completa */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                      Descrição Detalhada / Técnica <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Descreva o propósito principal do item, conexões ou acessórios de fábrica inclusos..."
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Two column layout: Modelo and Fabricante */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        Modelo Técnico <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: K2 ou Rivage PM7"
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                        className="w-full text-xs font-semibold py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        Fabricante / Marca <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: L-Acoustics, Robe, Yamaha..."
                        value={fabricante}
                        onChange={(e) => setFabricante(e.target.value)}
                        className="w-full text-xs font-semibold py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Two column: Categoria and Familia (Sub-filtro) */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        Categoria Principal <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="w-full text-xs font-bold py-2 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Sonorização">Sonorização</option>
                        <option value="Iluminação">Iluminação</option>
                        <option value="Vídeo">Vídeo</option>
                        <option value="Estrutura e Palco">Estrutura e Palco</option>
                        <option value="Cabos e Conectores">Cabos e Conectores</option>
                        <option value="Câmeras e Estúdio">Câmeras e Estúdio</option>
                        <option value="Informática e Rede">Informática e Rede</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        Família (Sub-filtro) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Caixas de Som, Moving Lights, Consoles..."
                        value={familia}
                        list="families-suggestions"
                        onChange={(e) => setFamilia(e.target.value)}
                        className="w-full text-xs font-semibold py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <datalist id="families-suggestions">
                        {formFamiliesSuggestions.map(fam => (
                          <option key={fam} value={fam} />
                        ))}
                        <option value="Caixas de Som" />
                        <option value="Consoles" />
                        <option value="Microfones" />
                        <option value="Moving Lights" />
                        <option value="Refletores" />
                        <option value="Painéis de LED" />
                        <option value="Processadores" />
                        <option value="Periféricos" />
                      </datalist>
                    </div>

                  </div>

                  {/* Quantity and Status */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        Quantidade em Estoque
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={quantidade}
                        onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-xs font-bold py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                        Status Atual do Ativo
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as InventoryItem['status'])}
                        className="w-full text-xs font-semibold py-2 px-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Disponível">Disponível em Estoque</option>
                        <option value="Em Uso">Alocado em Uso (Operando)</option>
                        <option value="Manutenção">Em Manutenção Técnica / Lab</option>
                        <option value="Esgotado">Esgotado / Sinistro</option>
                      </select>
                    </div>
                  </div>

                  {/* SEPARATED DIMENSION BLOCKS */}
                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-4">
                    <h4 className="text-xs font-extrabold text-neutral-850 dark:text-neutral-200 uppercase tracking-wider font-sans">
                      📐 Informações de Dimensões e Logística
                    </h4>

                    {/* BLOCK 1: DIMENSÕES COM CASE */}
                    <div className="bg-purple-600/5 border border-amber-500/10 p-4 rounded-xl space-y-3">
                      <span className="text-[11px] font-extrabold text-amber-600 block uppercase font-mono tracking-wider">
                        📦 Dimensões COM Case (Proteção de Viagem)
                      </span>
                      
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-0.5">
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase">Peso (kg)</label>
                          <input
                            type="text"
                            placeholder="Ex: 124"
                            value={ccPeso}
                            onChange={(e) => setCcPeso(e.target.value)}
                            className="w-full text-xs font-bold py-1.5 px-2 text-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase">Altura (cm)</label>
                          <input
                            type="text"
                            placeholder="Ex: 85"
                            value={ccAltura}
                            onChange={(e) => setCcAltura(e.target.value)}
                            className="w-full text-xs font-bold py-1.5 px-2 text-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase">Largura (cm)</label>
                          <input
                            type="text"
                            placeholder="Ex: 140"
                            value={ccLargura}
                            onChange={(e) => setCcLargura(e.target.value)}
                            className="w-full text-xs font-bold py-1.5 px-2 text-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase">Profund. (cm)</label>
                          <input
                            type="text"
                            placeholder="Ex: 65"
                            value={ccProfundidade}
                            onChange={(e) => setCcProfundidade(e.target.value)}
                            className="w-full text-xs font-bold py-1.5 px-2 text-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* BLOCK 2: DIMENSÕES SEM CASE */}
                    <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-105 dark:border-neutral-850 p-4 rounded-xl space-y-3">
                      <span className="text-[11px] font-extrabold text-neutral-700 dark:text-neutral-400 block uppercase font-mono tracking-wider">
                        ⚙️ Dimensões SEM Case (Apenas o Aparelho)
                      </span>
                      
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-0.5">
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase">Peso (kg)</label>
                          <input
                            type="text"
                            placeholder="Ex: 56"
                            value={scPeso}
                            onChange={(e) => setScPeso(e.target.value)}
                            className="w-full text-xs font-bold py-1.5 px-2 text-center bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase">Altura (cm)</label>
                          <input
                            type="text"
                            placeholder="Ex: 43"
                            value={scAltura}
                            onChange={(e) => setScAltura(e.target.value)}
                            className="w-full text-xs font-bold py-1.5 px-2 text-center bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase">Largura (cm)</label>
                          <input
                            type="text"
                            placeholder="Ex: 133"
                            value={scLargura}
                            onChange={(e) => setScLargura(e.target.value)}
                            className="w-full text-xs font-bold py-1.5 px-2 text-center bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase">Profund. (cm)</label>
                          <input
                            type="text"
                            placeholder="Ex: 40"
                            value={scProfundidade}
                            onChange={(e) => setScProfundidade(e.target.value)}
                            className="w-full text-xs font-bold py-1.5 px-2 text-center bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Observacoes Adicionais */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                      Observações Logísticas / Instruções de Manuseio
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Cabos triaxiais inclusos no fundo do rack. Sempre necessita de rampa ou empilhadeira para manusear no caminhão..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full text-xs py-2 px-3 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                </div>

                {/* Submit row */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-neutral-500 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-150 text-xs font-extrabold rounded-xl transition-all cursor-pointer font-mono uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-950 hover:bg-neutral-850 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer font-mono uppercase tracking-wider"
                  >
                    {formMode === 'create' ? 'Salvar Equipamento' : 'Salvar Alterações'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ficha Técnica Completa */}
      <AnimatePresence>
        {activeDetailItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/60 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 200 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-2xl min-h-screen sm:min-h-0 sm:rounded-2xl p-6 shadow-2xl flex flex-col justify-between border-l sm:border border-neutral-150 dark:border-neutral-850 overflow-y-auto max-h-screen [color-scheme:light-dark]"
            >
              <div className="space-y-6 flex-1 pb-10">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest font-mono">
                        {activeDetailItem.categoria} • {activeDetailItem.familia}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        activeDetailItem.status === 'Disponível' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300' 
                          : activeDetailItem.status === 'Em Uso'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300'
                          : activeDetailItem.status === 'Manutenção'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300'
                      }`}>
                        {activeDetailItem.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white leading-tight">
                      {activeDetailItem.descricaoComercial}
                    </h2>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      Código único de patrimônio: <code className="bg-neutral-50 dark:bg-neutral-950 px-1 py-0.5 rounded text-[9px]">{activeDetailItem.id}</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDetailItem(null)}
                    className="p-1 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-850 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Technical Description */}
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-neutral-850 dark:text-neutral-200 uppercase tracking-wider block">
                    📝 Descrição Técnica / Resumo do Ativo
                  </h3>
                  <div className="bg-neutral-50 dark:bg-neutral-950/50 p-4 border border-neutral-100 dark:border-neutral-850 rounded-xl">
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                      {activeDetailItem.descricao}
                    </p>
                  </div>
                </div>

                {/* General data fields */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-neutral-50/50 dark:bg-neutral-950/25 p-3 rounded-xl border border-neutral-100 dark:border-neutral-850">
                    <span className="block text-[8px] text-neutral-400 font-extrabold uppercase block">Modelo do Equipamento</span>
                    <strong className="block text-xs font-bold text-neutral-800 dark:text-neutral-250 mt-1 truncate">{activeDetailItem.modelo}</strong>
                  </div>
                  <div className="bg-neutral-50/50 dark:bg-neutral-950/25 p-3 rounded-xl border border-neutral-100 dark:border-neutral-850">
                    <span className="block text-[8px] text-neutral-400 font-extrabold uppercase block">Fabricante / Marca</span>
                    <strong className="block text-xs font-bold text-neutral-800 dark:text-neutral-250 mt-1 truncate">{activeDetailItem.fabricante || 'Estágio Próprio'}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-purple-600/5 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-500/10 font-mono">
                    <span className="block text-[8px] text-amber-600 dark:text-purple-500 font-extrabold uppercase block">Estoque Disponível</span>
                    <strong className="block text-xs font-black text-neutral-900 dark:text-neutral-100 mt-1">{activeDetailItem.quantidade} unidades</strong>
                  </div>
                </div>

                {/* Operations & Transportation Alert */}
                {activeDetailItem.observacoes && (
                  <div className="p-4 bg-purple-600/5 dark:bg-purple-600/5 border border-amber-500/15 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-purple-500 uppercase tracking-wider flex items-center gap-1.5">
                      💡 Instruções de Operação e Transporte
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 italic leading-relaxed">
                      "{activeDetailItem.observacoes}"
                    </p>
                  </div>
                )}

                {/* Grid Comparison: With Case vs Without Case */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold text-neutral-850 dark:text-neutral-200 uppercase tracking-wider font-sans block">
                    📐 Comparativo de Dimensionalidade Logística
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DIMENSÕES COM CASE */}
                    <div className="border border-amber-300/30 bg-purple-600/5 p-4 rounded-xl space-y-3 shadow-3xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-600 dark:text-purple-500 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                          <Boxes className="w-4 h-4 text-amber-550" /> COM Case de Viagem
                        </span>
                        <span className="text-[8px] bg-amber-200/50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-black font-mono">
                          LOGÍSTICA
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                        <div className="bg-white/80 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
                          <span className="block text-[8px] text-neutral-400 uppercase">Peso</span>
                          <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                            {activeDetailItem.dimensoesComCase.peso || '0'}<span className="text-[8px] font-medium text-neutral-400">kg</span>
                          </strong>
                        </div>
                        <div className="bg-white/80 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
                          <span className="block text-[8px] text-neutral-400">Alt</span>
                          <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                            {activeDetailItem.dimensoesComCase.altura || '0'}<span className="text-[8px] font-medium text-neutral-400">cm</span>
                          </strong>
                        </div>
                        <div className="bg-white/80 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
                          <span className="block text-[8px] text-neutral-400">Larg</span>
                          <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                            {activeDetailItem.dimensoesComCase.largura || '0'}<span className="text-[8px] font-medium text-neutral-400">cm</span>
                          </strong>
                        </div>
                        <div className="bg-white/80 dark:bg-neutral-900/60 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">
                          <span className="block text-[8px] text-neutral-400">Prof</span>
                          <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                            {activeDetailItem.dimensoesComCase.profundidade || '0'}<span className="text-[8px] font-medium text-neutral-400">cm</span>
                          </strong>
                        </div>
                      </div>

                      {/* Cubic volume estimation */}
                      {activeDetailItem.dimensoesComCase.altura && activeDetailItem.dimensoesComCase.largura && activeDetailItem.dimensoesComCase.profundidade && (
                        <div className="text-[10px] bg-white/40 dark:bg-neutral-950/40 p-2 rounded-lg border border-neutral-100/50 dark:border-neutral-850 flex justify-between items-center px-2.5">
                          <span className="text-neutral-550">Cubicagem em Case:</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                            {(
                              (Number(activeDetailItem.dimensoesComCase.altura) * 
                               Number(activeDetailItem.dimensoesComCase.largura) * 
                               Number(activeDetailItem.dimensoesComCase.profundidade)) / 1000000
                            ).toFixed(3)} m³
                          </span>
                        </div>
                      )}
                    </div>

                    {/* DIMENSÕES SEM CASE */}
                    <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/65 p-4 rounded-xl space-y-3 shadow-3xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                          <Package className="w-4 h-4 text-neutral-500" /> SEM Case (No Palco)
                        </span>
                        <span className="text-[8px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.2 rounded font-black font-mono">
                          OPERAÇÃO
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                        <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono">
                          <span className="block text-[8px] text-neutral-400 uppercase font-bold">Peso</span>
                          <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                            {activeDetailItem.dimensoesSemCase.peso || '0'}<span className="text-[8px] font-medium text-neutral-400">kg</span>
                          </strong>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono">
                          <span className="block text-[8px] text-neutral-400 uppercase font-bold">Alt</span>
                          <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                            {activeDetailItem.dimensoesSemCase.altura || '0'}<span className="text-[8px] font-medium text-neutral-400 font-mono">cm</span>
                          </strong>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono">
                          <span className="block text-[8px] text-neutral-400 uppercase font-bold">Larg</span>
                          <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                            {activeDetailItem.dimensoesSemCase.largura || '0'}<span className="text-[8px] font-medium text-neutral-400">cm</span>
                          </strong>
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono">
                          <span className="block text-[8px] text-neutral-400 uppercase font-bold">Prof</span>
                          <strong className="block text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                            {activeDetailItem.dimensoesSemCase.profundidade || '0'}<span className="text-[8px] font-medium text-neutral-400">cm</span>
                          </strong>
                        </div>
                      </div>

                      {/* Cubic volume estimation */}
                      {activeDetailItem.dimensoesSemCase.altura && activeDetailItem.dimensoesSemCase.largura && activeDetailItem.dimensoesSemCase.profundidade && (
                        <div className="text-[10px] bg-white/40 dark:bg-neutral-950/40 p-2 rounded-lg border border-neutral-150/50 dark:border-neutral-850 flex justify-between items-center px-2.5">
                          <span className="text-neutral-500 font-sans">Cubicagem de Uso:</span>
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                            {(
                              (Number(activeDetailItem.dimensoesSemCase.altura) * 
                               Number(activeDetailItem.dimensoesSemCase.largura) * 
                               Number(activeDetailItem.dimensoesSemCase.profundidade)) / 1000000
                            ).toFixed(3)} m³
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveDetailItem(null)}
                    className="flex-1 py-1.5 sm:py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer font-mono uppercase tracking-wider text-center"
                  >
                    Fechar Ficha
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleOpenEditForm(activeDetailItem, e);
                      setActiveDetailItem(null);
                    }}
                    className="flex-1 py-1.5 sm:py-2.5 bg-purple-600 hover:bg-amber-600 text-neutral-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer font-mono uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 animate-pulse" />
                    <span>Editar Registro</span>
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-850 pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleDuplicateItem(activeDetailItem, e);
                      setActiveDetailItem(null);
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicar Equipamento</span>
                  </button>

                  {deleteConfirmId === activeDetailItem.id ? (
                    <div className="flex items-center gap-1.5 animate-fade-in bg-rose-50/90 dark:bg-rose-950/20 p-1 px-2.5 rounded-lg border border-rose-100 dark:border-rose-900/40">
                      <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-tight">Excluir permanente?</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = items.filter(i => i.id !== activeDetailItem.id);
                          setItems(updated);
                          if (selectedItem?.id === activeDetailItem.id) {
                            setSelectedItem(null);
                          }
                          setActiveDetailItem(null);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-1 bg-rose-650 hover:bg-rose-700 text-white font-extrabold text-[9px] rounded-md transition-colors cursor-pointer uppercase font-mono"
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-850 hover:bg-neutral-300 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 font-bold text-[9px] rounded-md transition-colors cursor-pointer uppercase font-mono"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(activeDetailItem.id);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir Ativo</span>
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
