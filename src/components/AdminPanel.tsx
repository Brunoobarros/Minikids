import React, { useState, useEffect } from 'react';
import { Product, Order, Banner } from '../types';
import { DollarSign, ShoppingBag, Layers, AlertCircle, Plus, Eye, Sparkles, TrendingUp, RefreshCcw, GripVertical, Upload, ArrowUp, ArrowDown, Trash2, Paintbrush, Save, RotateCcw, Type, Settings, Edit, Sliders, MessageCircle } from 'lucide-react';
import { compressImage } from '../utils';
import { SalesChart } from './SalesChart';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  banners?: Banner[];
  themeColor: string;
  setThemeColor: (color: string) => void;
  themeColorHover: string;
  setThemeColorHover: (color: string) => void;
  bgDarkColor: string;
  setBgDarkColor: (color: string) => void;
  bgLightColor: string;
  setBgLightColor: (color: string) => void;
  displayFont: string;
  setDisplayFont: (font: string) => void;
  sansFont: string;
  setSansFont: (font: string) => void;
  pixKey?: string;
  setPixKey?: (key: string) => void;
  onSaveAppearance?: (appearance: {
    primaryColor: string;
    primaryColorHover: string;
    bgDark: string;
    bgLight: string;
    displayFont: string;
    sansFont: string;
    pixKey?: string;
  }) => Promise<void>;
  onAddProduct: (product: Omit<Product, 'id' | 'ratingValue' | 'reviews'>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct?: (id: string) => void;
  onReorderProducts: (orderedIds: string[]) => void;
  onAddBanner?: (banner: Omit<Banner, 'id'>) => void;
  onUpdateBanner?: (id: string, updates: Partial<Banner>) => void;
  onReorderBanners?: (orderedIds: string[]) => void;
  onDeleteBanner?: (id: string) => void;
  onUpdateOrderStatus: (id: string, status: Order['status']) => void;
  triggerNotification: (title: string, body: string, type: 'info' | 'success' | 'alert') => void;
  onResetDatabase?: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  orders,
  banners = [],
  themeColor,
  setThemeColor,
  themeColorHover,
  setThemeColorHover,
  bgDarkColor,
  setBgDarkColor,
  bgLightColor,
  setBgLightColor,
  displayFont,
  setDisplayFont,
  sansFont,
  setSansFont,
  pixKey = 'barrosbruno.ti@gmail.com',
  setPixKey,
  onSaveAppearance,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onReorderProducts,
  onAddBanner,
  onUpdateBanner,
  onReorderBanners,
  onDeleteBanner,
  onUpdateOrderStatus,
  triggerNotification,
  onResetDatabase
}) => {
  const [activeTab, setActiveTab] = useState<'finance' | 'products' | 'orders' | 'banners' | 'appearance' | 'supabase'>('finance');

  // Local products state for drag-and-drop live reordering
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  // Sync when products prop updates
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Local banners state for drag-and-drop live reordering
  const [localBanners, setLocalBanners] = useState<Banner[]>(banners);

  // Sync when banners prop updates
  useEffect(() => {
    setLocalBanners(banners);
  }, [banners]);

  // --- Supabase Integration States ---
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    url: string;
    tables: { products: boolean; banners: boolean; orders: boolean; appearance: boolean };
    allTablesExist: boolean;
    sqlScript: string;
  } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{
    products: number;
    banners: number;
    orders: number;
    appearance: boolean;
    errors: string[];
  } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const fetchSupabaseStatus = async () => {
    try {
      const resp = await fetch("/api/config/supabase-status");
      const data = await resp.json();
      setSupabaseStatus(data);
    } catch (err) {
      console.error("[SUPABASE STATUS UI] Erro ao buscar status:", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'supabase') {
      fetchSupabaseStatus();
    }
  }, [activeTab]);

  // Drag and Drop States
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [draggedBannerIdx, setDraggedBannerIdx] = useState<number | null>(null);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const list = [...localProducts];
    const [removed] = list.splice(draggedIdx, 1);
    list.splice(targetIdx, 0, removed);

    setDraggedIdx(targetIdx);
    setLocalProducts(list);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    onReorderProducts(localProducts.map(p => p.id));
    triggerNotification("Ordem Salva", "A nova ordem de posições dos produtos foi salva e sincronizada.", "success");
  };

  // Banner drag handlers
  const handleBannerDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBannerIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleBannerDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedBannerIdx === null || draggedBannerIdx === targetIdx) return;

    const list = [...localBanners];
    const [removed] = list.splice(draggedBannerIdx, 1);
    list.splice(targetIdx, 0, removed);

    setDraggedBannerIdx(targetIdx);
    setLocalBanners(list);
  };

  const handleBannerDragEnd = () => {
    setDraggedBannerIdx(null);
    if (onReorderBanners) {
      onReorderBanners(localBanners.map(b => b.id));
    }
  };

  const handleMoveBanner = (index: number, direction: 'prev' | 'next') => {
    const targetIdx = direction === 'prev' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= localBanners.length) return;

    const list = [...localBanners];
    const [removed] = list.splice(index, 1);
    list.splice(targetIdx, 0, removed);

    setLocalBanners(list);
    if (onReorderBanners) {
      onReorderBanners(list.map(b => b.id));
    }
  };

  // Input States for New Product
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'bebe' | 'menino' | 'menina' | 'brinquedos' | 'promocoes'>('bebe');
  const [prodSizes, setProdSizes] = useState('RN, 3-6m, 1a, 2a');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDiscountPrice, setProdDiscountPrice] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodDesc, setProdDesc] = useState('');
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [prodImageMode, setProdImageMode] = useState<'upload' | 'url'>('upload');
  const [isDraggingProdImage, setIsDraggingProdImage] = useState(false);

  // Full product edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Stock adjustment states
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState('');
  const [tempPrice, setTempPrice] = useState('');
  const [tempDiscountPrice, setTempDiscountPrice] = useState('');

  // Quick Banner edit states
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editBannerTitle, setEditBannerTitle] = useState('');
  const [editBannerSubtitle, setEditBannerSubtitle] = useState('');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [editBannerTag, setEditBannerTag] = useState('');
  const [editBannerBtnText, setEditBannerBtnText] = useState('');
  const [editBannerCategory, setEditBannerCategory] = useState('promocoes');

  // New Banner creation states for Admin panel
  const [showAddBannerForm, setShowAddBannerForm] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerTag, setNewBannerTag] = useState('PROMOÇÃO ESPECIAL');
  const [newBannerBtnText, setNewBannerBtnText] = useState('Ver Coleção');
  const [newBannerCategory, setNewBannerCategory] = useState('promocoes');
  const [newBannerImageMode, setNewBannerImageMode] = useState<'upload' | 'url'>('upload');
  const [isDraggingAdminNewBanner, setIsDraggingAdminNewBanner] = useState(false);

  // Device image upload and Drag-and-Drop state managers for Admin tab
  const [editBannerImageMode, setEditBannerImageMode] = useState<'upload' | 'url'>('upload');
  const [isDraggingAdminBanner, setIsDraggingAdminBanner] = useState(false);

  const handleAdminFileLoad = (file: File, callback: (url: string) => void) => {
    if (!file.type.startsWith('image/')) return;
    compressImage(file, 1000, 800, 0.75)
      .then(callback)
      .catch((err) => {
        console.error("Compression failed inside admin panel, using original fallback:", err);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            callback(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      });
  };

  // Finance calculations
  const totalRevenue = orders.filter(o => o.status === 'pago' || o.status === 'retirado').reduce((sum, o) => sum + o.totalPrice, 0);
  const pendingReservationsRevenue = orders.filter(o => o.status === 'reservado').reduce((sum, o) => sum + o.totalPrice, 0);
  const totalSalesCount = orders.length;
  const averageTicket = totalSalesCount > 0 ? (totalRevenue / totalSalesCount) : 0;
  const criticalStockItems = products.filter(p => p.stock <= 3);

  // Gemini API copywriter trigger
  const generateAIDescription = async () => {
    if (!prodName) {
      triggerNotification("AI Copywriter", "Digite o nome da camisa primeiro para que a IA gere a descrição perfeita.", "alert");
      return;
    }
    
    setIsGeneratingDesc(true);
    triggerNotification("AI Copywriter", "Gemini está escrevendo uma descrição persuasiva de e-commerce...", "info");
    
    try {
      const response = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${prodName} da categoria ${prodCategory}` })
      });
      const data = await response.json();
      if (data.text) {
        setProdDesc(data.text);
        triggerNotification("AI Copywriter", "Descrição de luxo gerada por IA com sucesso!", "success");
      }
    } catch (err) {
      console.error(err);
      triggerNotification("AI Copywriter", "Aviso: usando descrição simulada padrão.", "alert");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const executeAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodStock) {
      triggerNotification("Erro de Cadastro", "Nome, preço e estoque inicial são obrigatórios.", "alert");
      return;
    }

    const priceNum = parseFloat(prodPrice);
    const discNum = prodDiscountPrice ? parseFloat(prodDiscountPrice) : undefined;
    const stockNum = parseInt(prodStock);

    onAddProduct({
      name: prodName,
      category: prodCategory,
      description: prodDesc || "Uma linda roupinha infantil Mini Kids, feita com muito amor e carinho, super confortável e macia.",
      price: priceNum,
      discountPrice: discNum,
      images: prodImage ? [prodImage] : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"],
      sizes: prodSizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: [
        { name: "Colorido", hex: "#ff4f79" },
        { name: "Clássico", hex: "#06b6d4" }
      ],
      stock: stockNum
    });

    triggerNotification("Produto Cadastrado", `Lookinho "${prodName}" inserido com sucesso!`, "success");

    // Clear form inputs
    setProdName('');
    setProdPrice('');
    setProdDiscountPrice('');
    setProdImage('');
    setProdStock('10');
    setProdDesc('');
    setProdSizes('RN, 3-6m, 1a, 2a');
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProdName('');
    setProdPrice('');
    setProdDiscountPrice('');
    setProdImage('');
    setProdStock('10');
    setProdDesc('');
    setProdSizes('RN, 3-6m, 1a, 2a');
  };

  const executeSaveProduct = () => {
    if (!editingProduct) return;
    if (!prodName || !prodPrice || !prodStock) {
      triggerNotification("Erro de Edição", "Nome, preço e estoque inicial são obrigatórios.", "alert");
      return;
    }

    const priceNum = parseFloat(prodPrice);
    const discNum = prodDiscountPrice ? parseFloat(prodDiscountPrice) : undefined;
    const stockNum = parseInt(prodStock);

    onUpdateProduct(editingProduct.id, {
      name: prodName,
      category: prodCategory,
      description: prodDesc || "Uma linda roupinha infantil Mini Kids, feita com muito amor e carinho, super confortável e macia.",
      price: priceNum,
      discountPrice: discNum,
      images: prodImage ? [prodImage] : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"],
      sizes: prodSizes.split(',').map(s => s.trim()).filter(Boolean),
      stock: stockNum
    });

    triggerNotification("Produto Atualizado", `Lookinho "${prodName}" atualizado com sucesso!`, "success");
    handleCancelEdit();
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      executeSaveProduct();
    } else {
      executeAddProduct(e);
    }
  };

  const handleRowSave = (id: string) => {
    const stockVal = parseInt(tempStock);
    const priceVal = parseFloat(tempPrice);
    const discountVal = tempDiscountPrice && tempDiscountPrice.trim() !== '' ? parseFloat(tempDiscountPrice) : undefined;

    if (isNaN(stockVal) || isNaN(priceVal)) {
      triggerNotification("Valores Inválidos", "Estoque e preço devem ser números válidos.", "alert");
      return;
    }

    onUpdateProduct(id, {
      stock: stockVal,
      price: priceVal,
      discountPrice: discountVal
    });
    setEditingStockId(null);
    triggerNotification("Valores Atualizados", "O estoque e os preços foram atualizados com sucesso.", "success");
  };

  const handleBannerSave = (id: string) => {
    const titleVal = editBannerTitle.trim();
    if (!titleVal) {
      triggerNotification("Aviso", "O título do banner não pode ser vazio.", "alert");
      return;
    }
    onUpdateBanner?.(id, {
      title: titleVal,
      subtitle: editBannerSubtitle,
      image: editBannerImage,
      tag: editBannerTag,
      buttonText: editBannerBtnText,
      linkToCategory: editBannerCategory
    });
    setEditingBannerId(null);
  };

  const handleBannerCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const titleVal = newBannerTitle.trim();
    if (!titleVal || !newBannerSubtitle.trim() || !newBannerImage) {
      triggerNotification("Aviso", "Preencha o título, subtítulo e imagem do novo banner.", "alert");
      return;
    }

    onAddBanner?.({
      title: titleVal,
      subtitle: newBannerSubtitle,
      image: newBannerImage,
      tag: newBannerTag,
      buttonText: newBannerBtnText,
      linkToCategory: newBannerCategory
    });

    triggerNotification("Banner Criado", `Campanha "${titleVal}" criada com sucesso!`, "success");

    // Reset fields
    setNewBannerTitle('');
    setNewBannerSubtitle('');
    setNewBannerImage('');
    setNewBannerTag('PROMOÇÃO ESPECIAL');
    setNewBannerBtnText('Ver Coleção');
    setNewBannerCategory('promocoes');
    setShowAddBannerForm(false);
  };

  return (
    <div className="bg-white border text-slate-900 p-4 sm:p-6 font-sans rounded-2xl shadow-sm border-zinc-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Upper Header Control */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-zinc-200 pb-4 mb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
              <h2 className="text-sm font-black tracking-widest uppercase text-slate-800 font-mono">
                PAINEL ADMINISTRATIVO <span className="text-xs text-red-600">// CAMISA 7</span>
              </h2>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Controle financeiro, fluxo de estoque de mantos reservados e gerenciamento de pedidos.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center w-full lg:w-auto">
            {onResetDatabase && (
              <button
                onClick={() => onResetDatabase()}
                className="flex items-center gap-1.5 bg-zinc-950 text-white font-mono font-bold text-[10px] uppercase border border-zinc-800 hover:bg-red-600 rounded px-2.5 py-1.5 transition-colors cursor-pointer"
                title="Semear e Restaurar dados padrão"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Semear Banners / Dados
              </button>
            )}

            {/* Sub Navigation */}
            <div 
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
              className="flex items-center bg-zinc-50 border border-zinc-200 p-1 rounded-lg overflow-x-auto max-w-full flex-nowrap [&::-webkit-scrollbar]:hidden w-full lg:w-auto"
            >
              <button
                onClick={() => setActiveTab('finance')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'finance' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-slate-950'
                }`}
              >
                Relatórios & Financeiro
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'products' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-slate-950'
                }`}
              >
                Produtos & Estoque
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer sm:relative shrink-0 whitespace-nowrap ${
                  activeTab === 'orders' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-slate-950'
                }`}
              >
                Pedidos ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('banners')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === 'banners' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-slate-950'
                }`}
              >
                Banners ({banners.length})
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  activeTab === 'appearance' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-slate-950'
                }`}
              >
                <Paintbrush className="w-3 h-3" /> Tema & Aparência
              </button>
              <button
                onClick={() => setActiveTab('supabase')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  activeTab === 'supabase' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-500 hover:text-slate-950'
                }`}
              >
                <Settings className="w-3 h-3" /> Integrar Supabase
              </button>
            </div>
          </div>
      </div>

        {/* TAB 1: FINANCIAL REPORTS */}
        {activeTab === 'finance' && (
          <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase font-bold">Faturamento Líquido</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono">R$ {totalRevenue.toFixed(2)}</p>
                <div className="text-[9px] text-emerald-600 mt-1 uppercase font-mono flex items-center gap-1 font-bold">
                  <TrendingUp className="w-3 h-3" /> Pedidos pagos & retirados
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase font-bold">Valores Reservados</span>
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono">R$ {pendingReservationsRevenue.toFixed(2)}</p>
                <span className="text-[9px] text-amber-600 mt-1 uppercase font-mono font-bold">
                  Aguardando retirada de mantos
                </span>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase font-bold">Vendas Registradas</span>
                  <Layers className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono">{totalSalesCount} reservas</p>
                <span className="text-[9px] text-zinc-400 mt-1 uppercase font-mono">
                  Fluxo total histórico
                </span>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                  <span className="text-[10px] font-mono tracking-wider uppercase font-bold">Ticket Médio</span>
                  <TrendingUp className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-slate-950 font-mono">R$ {averageTicket.toFixed(2)}</p>
                <span className="text-[9px] text-zinc-400 mt-1 uppercase font-mono font-bold">
                  Consumo médio por reserva
                </span>
              </div>

            </div>

            {/* Sales performance chart for the last 7 days */}
            <SalesChart orders={orders} />

            {/* Critical Alert Subpanel */}
            {criticalStockItems.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-center justify-between text-red-700 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-600 animate-bounce" />
                  <span>
                    <strong>Controle de Estoque Crítico!</strong> Há {criticalStockItems.length} camisas com menos de 3 unidades no estoque.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('products')}
                  className="bg-red-656 bg-red-600 hover:bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded shadow cursor-pointer transition-colors"
                >
                  Corrigir Agora
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCT MANAGEMENT & STOCK */}
        {activeTab === 'products' && (
          <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Cadastro de Produtos (Left Col) */}
            <div className="lg:col-span-5 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
              <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-500 mb-3 flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {editingProduct ? <Edit className="w-4 h-4 text-red-600 animate-pulse" /> : <Plus className="w-4 h-4 text-red-600" />}
                  {editingProduct ? 'EDITAR CAMISA' : 'CADASTRAR NOVA CAMISA'}
                </span>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[9px] bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-2 py-0.5 rounded font-mono uppercase font-black cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </h3>
              
              <form id="admin-product-form" onSubmit={handleSubmitProduct} className="space-y-3.5 text-xs text-left">
                <div>
                  <label className="block text-zinc-500 font-bold uppercase font-mono mb-1 text-[10px]">Nome Comercial</label>
                  <input
                    type="text"
                    required
                    placeholder="Camisa Oficial Flamengo Camisa 7 Edition"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-slate-900 placeholder-zinc-400 focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-bold uppercase font-mono mb-1 text-[10px]">Categoria</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value as any)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-slate-800 focus:outline-none focus:border-red-600"
                    >
                      <option value="bebe">Bebê</option>
                      <option value="menino">Menino</option>
                      <option value="menina">Menina</option>
                      <option value="brinquedos">Brinquedos</option>
                      <option value="promocoes">Promoções</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-500 font-bold uppercase font-mono mb-1 text-[10px]">Estoque Inicial</label>
                    <input
                      type="number"
                      required
                      placeholder="10"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-500 font-bold uppercase font-mono mb-1 text-[10px]">Preço Original (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="299.90"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 font-bold uppercase font-mono mb-1 text-[10px]">Preço com Desconto (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="239.90 (opcional)"
                      value={prodDiscountPrice}
                      onChange={(e) => setProdDiscountPrice(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                    />
                </div>

                <div>
                  <label className="block text-zinc-500 font-bold uppercase font-mono mb-1 text-[10px]">Tamanhos Disponíveis (Separados por vírgula)</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: RN, 3-6m, 1a, 2a, 3-4a"
                    value={prodSizes}
                    onChange={(e) => setProdSizes(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-slate-900 placeholder-zinc-400 focus:outline-none focus:border-red-600 mb-3"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-zinc-500 font-bold uppercase font-mono text-[10px]">Foto do Produto</label>
                    <div className="flex bg-zinc-100 p-0.5 rounded border border-zinc-250 border-zinc-200">
                      <button
                        type="button"
                        onClick={() => setProdImageMode('upload')}
                        className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono transition-all cursor-pointer ${
                          prodImageMode === 'upload' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        Dispositivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdImageMode('url')}
                        className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono transition-all cursor-pointer ${
                          prodImageMode === 'url' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                        }`}
                      >
                        Link da Web
                      </button>
                    </div>
                  </div>

                  {prodImageMode === 'upload' ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingProdImage(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingProdImage(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingProdImage(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleAdminFileLoad(file, setProdImage);
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] ${
                        isDraggingProdImage
                          ? 'border-red-600 bg-red-50/50 shadow-inner'
                          : prodImage
                          ? 'border-emerald-600/40 bg-white'
                          : 'border-zinc-300 hover:border-red-600/50 hover:bg-white/50'
                      }`}
                      onClick={() => document.getElementById('new-product-file-input')?.click()}
                    >
                      <input
                        id="new-product-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAdminFileLoad(file, setProdImage);
                        }}
                      />

                      {prodImage ? (
                        <div className="flex items-center gap-3 w-full text-left">
                          <img 
                            src={prodImage} 
                            alt="Prévia do Manto" 
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded object-cover shadow-sm bg-stone-100 flex-shrink-0 border border-zinc-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 truncate">Imagem do Dispositivo</p>
                            <p className="text-[9px] text-zinc-400 mt-0.5 truncate">Salva localmente com sucesso</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProdImage('');
                              }}
                              className="text-red-700 font-mono text-[9px] font-bold uppercase tracking-wider hover:underline mt-1 cursor-pointer block"
                            >
                              Remover Foto
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
                          <span className="text-[11px] text-zinc-700 font-bold block">Clique para escolher ou arraste</span>
                          <span className="text-[9px] text-zinc-400 mt-0.5">Clique aqui para buscar fotos no seu computador/celular</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600 placeholder-zinc-400"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-zinc-500 font-bold uppercase font-mono text-[10px]">Descrição Comercial</label>
                    <button
                      type="button"
                      onClick={generateAIDescription}
                      disabled={isGeneratingDesc}
                      className="text-red-600 font-black flex items-center gap-1 hover:text-red-700 transition-colors cursor-pointer text-[10px]"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> 
                      {isGeneratingDesc ? "Escrevendo..." : "Gerar com IA Gemini"}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Descreva detalhes como respiração premium anti-suor..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-black text-white font-black uppercase tracking-wider rounded transition-colors shadow cursor-pointer"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Camisa no Catálogo'}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-full mt-2 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-slate-800 font-black uppercase tracking-wider rounded transition-colors shadow cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                )}
              </form>
            </div>

            {/* Controle de Estoque de camisas (Right Col) */}
            <div className="lg:col-span-7 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
              <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-500 mb-3 flex items-center justify-between font-bold">
                <span>ESTOQUE ATUAL & PREÇOS (Ordenado por estoque)</span>
                <span className="text-[10px] bg-white text-slate-800 font-bold px-2 py-0.5 rounded border border-zinc-200">{products.length} itens</span>
              </h3>

              <div className="space-y-2 h-[410px] overflow-y-auto pr-1">
                {[...localProducts].sort((a, b) => a.stock - b.stock).map((p, index) => {
                  return (
                    <div
                      key={p.id}
                      className={`bg-white p-2.5 rounded-lg border flex items-center transition-all duration-150 select-none border-zinc-200/60 hover:shadow-sm hover:border-zinc-300`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {editingStockId === p.id ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full bg-zinc-50/50 p-2 rounded-lg border border-red-200 animate-fade-in">
                            <div className="grid grid-cols-3 gap-2 flex-grow">
                              <div className="flex flex-col">
                                <label className="text-[8px] uppercase font-bold text-zinc-400 font-mono">Estoque</label>
                                <input
                                  type="number"
                                  className="w-full bg-white border border-zinc-300 px-2 py-1 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-red-650"
                                  value={tempStock}
                                  onChange={(e) => setTempStock(e.target.value)}
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-[8px] uppercase font-bold text-zinc-400 font-mono">Preço</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full bg-white border border-zinc-300 px-2 py-1 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-red-650"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(e.target.value)}
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-[8px] uppercase font-bold text-zinc-400 font-mono font-black text-red-600">Promo</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Nenhum"
                                  className="w-full bg-white border border-zinc-300 px-2 py-1 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-red-650"
                                  value={tempDiscountPrice}
                                  onChange={(e) => setTempDiscountPrice(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleRowSave(p.id)}
                                className="bg-emerald-600 text-white text-[10px] px-3 py-1.5 rounded hover:bg-emerald-700 font-bold cursor-pointer transition-colors"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingStockId(null)}
                                className="bg-zinc-300 text-slate-700 text-[10px] px-3 py-1.5 rounded hover:bg-zinc-400 font-bold cursor-pointer transition-colors"
                              >
                                Sair
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Product Info (Left) */}
                            <div className="flex items-center gap-3 flex-grow min-w-0">

                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-10 h-10 rounded object-cover border border-zinc-200 pointer-events-none select-none"
                              />
                              <div className="text-left min-w-0 flex-grow">
                                <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">{p.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-[9px] bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-500 uppercase font-mono">
                                    {p.category}
                                  </span>
                                  <span className="text-[10px] text-red-600 font-bold font-mono">
                                    {p.discountPrice ? (
                                      <span className="flex items-center gap-1">
                                        <span className="line-through text-zinc-400 text-[9px]">R${p.price}</span>
                                        <span>R${p.discountPrice}</span>
                                      </span>
                                    ) : (
                                      `R$ ${p.price}`
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Product Stock & Action buttons (Right) */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex flex-col items-end">
                                <span className={`text-xs font-mono font-bold ${p.stock <= 3 ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
                                  Estoque: {p.stock} un
                                </span>
                                {p.stock === 0 && (
                                  <span className="text-[8px] uppercase tracking-widest text-red-600 font-mono font-black">Esgotado</span>
                                )}
                              </div>
                              
                              <button
                                onClick={() => {
                                  setEditingStockId(p.id);
                                  setTempStock(String(p.stock));
                                  setTempPrice(String(p.price));
                                  setTempDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
                                }}
                                className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-black rounded border border-zinc-200 cursor-pointer transition-colors"
                                title="Editar Rápido (Estoque/Preços)"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setProdName(p.name);
                                  setProdCategory(p.category as any);
                                  setProdPrice(String(p.price));
                                  setProdDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
                                  setProdImage(p.images[0] || '');
                                  setProdImageMode(p.images[0]?.startsWith('data:') ? 'upload' : 'url');
                                  setProdStock(String(p.stock));
                                  setProdDesc(p.description);
                                  setProdSizes(p.sizes?.join(', ') || 'RN, 3-6m, 1a, 2a');
                                  document.getElementById('admin-product-form')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`p-1.5 rounded border cursor-pointer transition-colors ${
                                  editingProduct?.id === p.id 
                                    ? 'bg-red-50 text-red-650 border-red-200' 
                                    : 'hover:bg-zinc-100 text-zinc-400 hover:text-black border-zinc-200'
                                }`}
                                title="Editar Detalhes do Produto"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                            {onDeleteProduct && (
                              confirmDeleteProductId === p.id ? (
                                <div className="flex items-center gap-1 border border-red-200 bg-red-50 p-1 rounded-lg">
                                  <span className="text-[9px] text-red-700 font-bold px-1 font-mono uppercase tracking-wide">Excluir?</span>
                                  <button
                                    onClick={() => {
                                      onDeleteProduct(p.id);
                                      setConfirmDeleteProductId(null);
                                    }}
                                    className="px-2 py-0.5 bg-red-650 hover:bg-red-700 text-white font-mono text-[9px] font-bold uppercase rounded-md transition-colors cursor-pointer"
                                  >
                                    Sim
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteProductId(null)}
                                    className="px-2 py-0.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 font-mono text-[9px] font-bold uppercase rounded-md transition-colors cursor-pointer"
                                  >
                                    Não
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteProductId(p.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded border border-zinc-200 cursor-pointer transition-colors"
                                  title="Excluir produto do catálogo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LOG DE PEDIDOS (RESERVAS) */}
        {activeTab === 'orders' && (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-500 flex items-center justify-between font-bold">
              <span>GERENCIAMENTO DE PEDIDOS E RESERVAS EM LOOP</span>
              <span className="text-[10px] text-red-600 font-black">{orders.length} cadastrados</span>
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-400 text-xs">
                Nenhum pedido de reserva pendente no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((o) => (
                  <div key={o.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col justify-between gap-4">
                    
                    {/* Customer Info header */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black font-mono text-slate-800 bg-white border border-zinc-200 px-2 py-0.5 rounded">
                          {o.id}
                        </span>
                        
                        <span className={`text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded border ${
                          o.status === 'reservado'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : o.status === 'pago'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-250'
                            : o.status === 'retirado'
                            ? 'bg-blue-50 text-blue-850 border-blue-200'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          {o.status}
                        </span>
                      </div>

                      <div className="space-y-0.5 text-xs text-left mb-3">
                        <p className="font-bold text-slate-900">{o.customerName}</p>
                        <p className="text-[10px] text-zinc-500">{o.customerEmail}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] text-zinc-500">{o.customerPhone}</p>
                          <a
                            href={`https://wa.me/${(() => {
                              const clean = o.customerPhone.replace(/\D/g, '');
                              return clean.startsWith('55') ? clean : `55${clean}`;
                            })()}?text=${encodeURIComponent(
                              `Olá ${o.customerName}! Aqui é da Camisa 7 Store.\n\nGostaríamos de falar sobre o seu pedido ${o.id}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-500 transition-colors inline-flex items-center"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <p className="text-[9px] font-mono text-zinc-405 mt-1">{new Date(o.date).toLocaleString('pt-BR')}</p>
                      </div>

                      {/* Purchased jerseys detail list */}
                      <div className="border-t border-zinc-200 pt-2.5 space-y-1.5 text-left">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-650 truncate max-w-[150px]">{item.productName} ({item.selectedSize})</span>
                            <span className="font-mono text-zinc-500">
                              {item.quantity}x • <span className="text-red-600 font-bold">R$ {item.price}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Action buttons with status update trigger notifications */}
                    <div className="border-t border-zinc-200 pt-3">
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="text-zinc-500 uppercase font-mono text-[9px] font-bold">Total da Reserva:</span>
                        <span className="font-bold text-slate-900 text-sm font-mono">R$ {o.totalPrice.toFixed(2)}</span>
                      </div>

                      {o.status === 'pago' && (
                        <div className="mb-3">
                          <a
                            href={`https://wa.me/${(() => {
                              const clean = o.customerPhone.replace(/\D/g, '');
                              return clean.startsWith('55') ? clean : `55${clean}`;
                            })()}?text=${encodeURIComponent(
                              `Olá ${o.customerName}! Aqui é da Camisa 7 Store.\n\n` +
                              `Confirmamos o recebimento do pagamento do seu Pedido ${o.id} no valor de R$ ${o.totalPrice.toFixed(2)}.\n\n` +
                              `Seu manto já está em processo de separação e preparação para envio! Obrigado pela preferência.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] uppercase font-bold rounded shadow-sm transition-colors cursor-pointer font-sans"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Confirmar Pagamento no Whats
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-1">
                        <button
                          onClick={() => {
                            onUpdateOrderStatus(o.id, 'reservado');
                            triggerNotification(o.id, "Status alterado para reservado", "info");
                          }}
                          className={`py-1 text-[9px] uppercase font-bold rounded cursor-pointer border ${
                            o.status === 'reservado' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-zinc-205 text-zinc-500 hover:text-black'
                          }`}
                        >
                          Reser
                        </button>
                        <button
                          onClick={() => {
                            onUpdateOrderStatus(o.id, 'pago');
                            triggerNotification(o.id, "Status alterado para pago com sucesso!", "success");
                          }}
                          className={`py-1 text-[9px] uppercase font-bold rounded cursor-pointer border ${
                            o.status === 'pago' ? 'bg-emerald-656 bg-emerald-600 text-white border-emerald-600' : 'bg-white border-zinc-205 text-zinc-500 hover:text-black'
                          }`}
                        >
                          Pago
                        </button>
                        <button
                          onClick={() => {
                            onUpdateOrderStatus(o.id, 'retirado');
                            triggerNotification(o.id, "Reserva retirada! Estoque concretizado.", "success");
                          }}
                          className={`py-1 text-[9px] uppercase font-bold rounded cursor-pointer border ${
                            o.status === 'retirado' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-zinc-205 text-zinc-500 hover:text-black'
                          }`}
                        >
                          Retir
                        </button>
                        <button
                          onClick={() => {
                            onUpdateOrderStatus(o.id, 'cancelado');
                            triggerNotification(o.id, "Reserva de camisa cancelada.", "alert");
                          }}
                          className={`py-1 text-[9px] uppercase font-bold rounded cursor-pointer border ${
                            o.status === 'cancelado' ? 'bg-zinc-700 text-white border-zinc-700' : 'bg-white border-zinc-205 text-zinc-500 hover:text-black'
                          }`}
                        >
                          Canc
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GERENCIAMENTO DE BANNERS */}
        {activeTab === 'banners' && (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-mono text-zinc-500 flex items-center justify-between font-bold">
              <span>CONTROLE DE BANNERS (CARROSSEL PRINCIPAL - ARRASTE OU USE AS SETAS)</span>
              <span className="text-[10px] bg-red-100 text-red-600 px-2.5 py-0.5 rounded border border-red-200 uppercase font-bold">{localBanners.length} banners</span>
            </h3>

            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Crie ou reorganize as campanhas rotativas</span>
              <button
                onClick={() => setShowAddBannerForm(!showAddBannerForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-black uppercase rounded shadow-sm cursor-pointer transition-all active:scale-95 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAddBannerForm ? "Ocultar Formulário" : "Novo Banner"}
              </button>
            </div>

            {showAddBannerForm && (
              <form onSubmit={handleBannerCreate} className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-4 text-xs text-left animate-fade-in">
                <h4 className="text-[10px] uppercase font-mono font-black text-red-600 border-b pb-1">Preencha os dados do Novo Banner</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Título do Banner</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: LANÇAMENTO MANTO DO CORINTHIANS"
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Subtítulo (Curta descrição)</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Garanta já o modelo de jogador oficial..."
                      value={newBannerSubtitle}
                      onChange={(e) => setNewBannerSubtitle(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[9px] uppercase font-mono text-zinc-500">Imagem do Banner</label>
                      <div className="flex bg-zinc-100 p-0.5 rounded border border-zinc-200">
                        <button
                          type="button"
                          onClick={() => setNewBannerImageMode('upload')}
                          className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold font-mono transition-all cursor-pointer ${
                            newBannerImageMode === 'upload' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                          }`}
                        >
                          Dispositivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewBannerImageMode('url')}
                          className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold font-mono transition-all cursor-pointer ${
                            newBannerImageMode === 'url' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                          }`}
                        >
                          Link URL
                        </button>
                      </div>
                    </div>

                    {newBannerImageMode === 'upload' ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingAdminNewBanner(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingAdminNewBanner(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingAdminNewBanner(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleAdminFileLoad(file, setNewBannerImage);
                        }}
                        className={`border border-dashed rounded-lg p-3 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[90px] ${
                          isDraggingAdminNewBanner
                            ? 'border-red-600 bg-red-50/50'
                            : newBannerImage
                            ? 'border-emerald-600/40 bg-zinc-105 bg-zinc-100/55'
                            : 'border-zinc-300 hover:border-red-600 hover:bg-zinc-100/55'
                        }`}
                        onClick={() => document.getElementById('admin-new-banner-file-input')?.click()}
                      >
                        <input
                          id="admin-new-banner-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAdminFileLoad(file, setNewBannerImage);
                          }}
                        />

                        {newBannerImage ? (
                          <div className="flex items-center gap-2.5 w-full text-left">
                            <img 
                              src={newBannerImage} 
                              alt="Prévia" 
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded object-cover shadow-sm bg-stone-100 flex-shrink-0 border border-zinc-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-800 truncate">Sua Imagem</p>
                              <p className="text-[8px] text-zinc-400 truncate">Device Base64 string</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewBannerImage('');
                                }}
                                className="text-red-600 font-mono text-[8px] font-bold uppercase tracking-wider hover:underline mt-0.5 cursor-pointer block"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-zinc-400 mb-1" />
                            <span className="text-[10px] text-zinc-700 font-semibold block">Escolher arquivo ou Soltar</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-mono"
                        value={newBannerImage}
                        onChange={(e) => setNewBannerImage(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Tag (Topo do card)</label>
                        <input
                          type="text"
                          required
                          value={newBannerTag}
                          onChange={(e) => setNewBannerTag(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Texto do Botão</label>
                        <input
                          type="text"
                          required
                          value={newBannerBtnText}
                          onChange={(e) => setNewBannerBtnText(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Redirecionar para Categoria</label>
                      <select
                        className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                        value={newBannerCategory}
                        onChange={(e) => setNewBannerCategory(e.target.value)}
                      >
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="esportivo">Esportivo</option>
                        <option value="promocoes">Promoções (Outlet)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1.5">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded hover:bg-red-700 transition cursor-pointer"
                  >
                    Publicar Banner no Carrossel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBannerForm(false);
                      setNewBannerTitle('');
                      setNewBannerSubtitle('');
                      setNewBannerImage('');
                    }}
                    className="px-6 py-2 bg-zinc-200 text-zinc-700 text-[10px] font-bold uppercase rounded hover:bg-zinc-300 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {localBanners.length === 0 ? (
              <div className="bg-zinc-50 border border-zinc-200 text-center py-8 rounded-xl">
                <p className="text-xs text-zinc-500 uppercase font-mono">Nenhum banner cadastrado</p>
                <p className="text-[10px] text-zinc-400 mt-1">Publique banners no topo do site para os clientes visualizarem as principais ofertas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {localBanners.map((b, index) => {
                  const isEditing = editingBannerId === b.id;
                  const isDragging = draggedBannerIdx === index;
                  return (
                    <div 
                      key={b.id} 
                      draggable={!isEditing}
                      onDragStart={(e) => handleBannerDragStart(e, index)}
                      onDragOver={(e) => handleBannerDragOver(e, index)}
                      onDragEnd={handleBannerDragEnd}
                      className={`bg-zinc-50 border p-4 rounded-xl flex flex-col justify-between text-left transition-all duration-150 relative select-none ${
                        isDragging ? 'opacity-30 border-dashed border-red-500 bg-red-50/10' : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3 text-xs w-full">
                          <h4 className="text-[10px] uppercase font-mono font-bold text-red-600">Editando Banner: {b.title}</h4>
                          
                          <div>
                            <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Título</label>
                            <input
                              type="text"
                              className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                              value={editBannerTitle}
                              onChange={(e) => setEditBannerTitle(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Subtítulo</label>
                            <input
                              type="text"
                              className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                              value={editBannerSubtitle}
                              onChange={(e) => setEditBannerSubtitle(e.target.value)}
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[9px] uppercase font-mono text-zinc-500">Imagem do Banner</label>
                              <div className="flex bg-zinc-100 p-0.5 rounded border border-zinc-200">
                                <button
                                  type="button"
                                  onClick={() => setEditBannerImageMode('upload')}
                                  className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold font-mono transition-all cursor-pointer ${
                                    editBannerImageMode === 'upload' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                                  }`}
                                >
                                  Dispositivo
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditBannerImageMode('url')}
                                  className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold font-mono transition-all cursor-pointer ${
                                    editBannerImageMode === 'url' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                                  }`}
                                >
                                  Link URL
                                </button>
                              </div>
                            </div>

                            {editBannerImageMode === 'upload' ? (
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setIsDraggingAdminBanner(true);
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  setIsDraggingAdminBanner(false);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsDraggingAdminBanner(false);
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) handleAdminFileLoad(file, setEditBannerImage);
                                }}
                                className={`border border-dashed rounded-lg p-3 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[90px] ${
                                  isDraggingAdminBanner
                                    ? 'border-red-600 bg-red-50/50'
                                    : editBannerImage
                                    ? 'border-emerald-600/40 bg-zinc-100/55'
                                    : 'border-zinc-300 hover:border-red-600 hover:bg-zinc-100/55'
                                }`}
                                onClick={() => document.getElementById('admin-edit-banner-file-input')?.click()}
                              >
                                <input
                                  id="admin-edit-banner-file-input"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleAdminFileLoad(file, setEditBannerImage);
                                  }}
                                />

                                {editBannerImage ? (
                                  <div className="flex items-center gap-2.5 w-full text-left">
                                    <img 
                                      src={editBannerImage} 
                                      alt="Prévia" 
                                      referrerPolicy="no-referrer"
                                      className="w-12 h-12 rounded object-cover shadow-sm bg-stone-100 flex-shrink-0 border border-zinc-200"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-bold text-slate-800 truncate">Sua Imagem</p>
                                      <p className="text-[8px] text-zinc-400 truncate">Device Base64 string</p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditBannerImage('');
                                        }}
                                        className="text-red-600 font-mono text-[8px] font-bold uppercase tracking-wider hover:underline mt-0.5 cursor-pointer block"
                                      >
                                        Remover
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 text-zinc-400 mb-1" />
                                    <span className="text-[10px] text-zinc-700 font-semibold block">Escolher arquivo ou Soltar</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <input
                                type="text"
                                className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-mono"
                                value={editBannerImage}
                                onChange={(e) => setEditBannerImage(e.target.value)}
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Tag (Topo do card)</label>
                              <input
                                type="text"
                                className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                                value={editBannerTag}
                                onChange={(e) => setEditBannerTag(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Texto do Botão</label>
                              <input
                                type="text"
                                className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                                value={editBannerBtnText}
                                onChange={(e) => setEditBannerBtnText(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Categoria de Redirecionamento</label>
                            <select
                              className="w-full bg-white border border-zinc-200 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 font-sans"
                              value={editBannerCategory}
                              onChange={(e) => setEditBannerCategory(e.target.value)}
                            >
                              <option value="masculino">Masculino</option>
                              <option value="feminino">Feminino</option>
                              <option value="esportivo">Esportivo</option>
                              <option value="promocoes">Promoções (Outlet)</option>
                            </select>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleBannerSave(b.id)}
                              className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded hover:bg-emerald-700 transition cursor-pointer"
                            >
                              Confirmar Ajustes
                            </button>
                            <button
                              onClick={() => setEditingBannerId(null)}
                              className="px-4 py-1.5 bg-zinc-200 text-zinc-700 text-[10px] font-bold uppercase rounded hover:bg-zinc-300 transition cursor-pointer"
                            >
                              Voltar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full flex gap-3 h-full">
                          <img
                            src={b.image}
                            alt={b.title}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-zinc-300 flex-shrink-0"
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] bg-zinc-200/80 hover:bg-zinc-200 text-zinc-700 font-mono font-black px-2 py-0.5 rounded flex items-center gap-1 cursor-grab" title="Arraste este card para o lado para alterar a sua ordem">
                                  <GripVertical className="w-2.5 h-2.5 text-zinc-500" />
                                  POSIÇÃO #{index + 1}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveBanner(index, 'prev')}
                                    disabled={index === 0}
                                    className={`p-1 rounded border transition-all ${
                                      index === 0
                                        ? 'bg-zinc-100 text-zinc-300 border-zinc-200/60 cursor-not-allowed'
                                        : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 cursor-pointer active:scale-95'
                                    }`}
                                    title="Mover para esquerda"
                                  >
                                    <ArrowUp className="w-2.5 h-2.5 -rotate-90" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveBanner(index, 'next')}
                                    disabled={index === localBanners.length - 1}
                                    className={`p-1 rounded border transition-all ${
                                      index === localBanners.length - 1
                                        ? 'bg-zinc-100 text-zinc-300 border-zinc-200/60 cursor-not-allowed'
                                        : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 cursor-pointer active:scale-95'
                                    }`}
                                    title="Mover para direita"
                                  >
                                    <ArrowUp className="w-2.5 h-2.5 rotate-90" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {b.tag && (
                                  <span className="text-[8px] bg-red-100 text-red-600 font-mono font-bold px-1.5 py-0.5 rounded">
                                    {b.tag}
                                  </span>
                                )}
                                <span className="text-[8px] bg-zinc-100 text-zinc-500 border border-zinc-200 font-mono font-bold px-1.5 py-0.5 rounded capitalize">
                                  Destino: {b.linkToCategory}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 mt-1 uppercase tracking-tight line-clamp-1">{b.title}</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{b.subtitle}</p>
                            </div>

                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-200/60 font-sans">
                              <span className="text-[9px] font-mono font-medium text-zinc-400 font-sans">Botão: "{b.buttonText}"</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingBannerId(b.id);
                                    setEditBannerTitle(b.title);
                                    setEditBannerSubtitle(b.subtitle);
                                    setEditBannerImage(b.image);
                                    setEditBannerTag(b.tag || 'PROMOÇÃO ESPECIAL');
                                    setEditBannerBtnText(b.buttonText || 'Ver Coleção');
                                    setEditBannerCategory(b.linkToCategory || 'promocoes');
                                  }}
                                  className="px-3 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded text-[9px] font-bold text-slate-800 uppercase tracking-wider transition cursor-pointer"
                                >
                                  Editar
                                </button>
                                {onDeleteBanner && (
                                  <button
                                    onClick={() => onDeleteBanner(b.id)}
                                    className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300 rounded text-[9px] font-bold uppercase tracking-wider transition cursor-pointer"
                                  >
                                    Excluir
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: THEME APPEARANCE CREATIVE CORE */}
        {activeTab === 'appearance' && (
          <div className="animate-fade-in space-y-6 text-left font-sans">
            <div className="bg-zinc-50 border border-zinc-200 p-4 sm:p-5 rounded-xl">
              <div className="flex items-center gap-2.5 mb-2 border-b border-zinc-200 pb-2">
                <Paintbrush className="w-4 h-4 text-red-650" />
                <h3 className="text-xs font-black tracking-widest uppercase text-slate-800 font-mono">
                  Gerenciador de Design da Loja (Aparência)
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-6">
                Como administrador, você pode ajustar as cores de acento, os tons de fundo da interface e a tipografia das fontes e títulos em tempo real. Os visitantes verão as mudanças instantaneamente.
              </p>

              {/* Theme presets picker */}
              <div className="mb-6">
                <span className="block text-[9px] font-black uppercase text-zinc-500 font-mono tracking-wider mb-2.5 text-zinc-400">
                  🎨 Paletas de Cores Predefinidas (Presets de Marca)
                </span>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {[
                    { name: 'Rubro-Negro Original', primary: '#d12229', hover: '#aa1a1e', dark: '#09090b', light: '#fafafa' },
                    { name: 'Elite Esmeralda', primary: '#10b981', hover: '#059669', dark: '#062c21', light: '#f0fdf4' },
                    { name: 'Canarinho Imperial', primary: '#eab308', hover: '#ca8a04', dark: '#0b1329', light: '#fefdf0' },
                    { name: 'Azul Premium Celeste', primary: '#2563eb', hover: '#1d4ed8', dark: '#091124', light: '#f8fafc' },
                    { name: 'Atlético Ouro Puro', primary: '#d97706', hover: '#b45309', dark: '#000000', light: '#fdfaf2' }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setThemeColor(preset.primary);
                        setThemeColorHover(preset.hover);
                        setBgDarkColor(preset.dark);
                        setBgLightColor(preset.light);
                        triggerNotification(
                          "Preset Carregado",
                          `Paleta '${preset.name}' aplicada temporariamente! Clique em salvar para gravar.`,
                          "info"
                        );
                      }}
                      className="p-2 border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50/50 cursor-pointer text-left transition-colors font-sans"
                    >
                      <span className="block text-[9px] font-bold text-slate-900 truncate mb-1.5">{preset.name}</span>
                      <div className="flex gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-zinc-100 shadow-sm" style={{ backgroundColor: preset.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-zinc-100 shadow-sm" style={{ backgroundColor: preset.dark }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-zinc-100 shadow-sm" style={{ backgroundColor: preset.light }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual color picker fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <span className="block text-[9px] font-black uppercase text-zinc-500 font-mono tracking-wider border-b border-zinc-200/60 pb-1 text-zinc-400">
                    🎨 Ajuste Fino de Cores (Hex)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black tracking-widest uppercase text-zinc-500 font-mono">
                        Acento Principal / Botões
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={themeColor}
                          onChange={(e) => {
                            setThemeColor(e.target.value);
                            setThemeColorHover(adjustBrightness(e.target.value, -15));
                          }}
                          className="w-8 h-8 rounded border border-zinc-300 p-0 cursor-pointer overflow-hidden"
                        />
                        <input
                          type="text"
                          value={themeColor}
                          onChange={(e) => {
                            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                              setThemeColor(e.target.value);
                              setThemeColorHover(adjustBrightness(e.target.value, -15));
                            }
                          }}
                          className="w-full text-xs font-mono px-2 border border-zinc-300 rounded focus:outline-none focus:border-red-650 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black tracking-widest uppercase text-zinc-500 font-mono">
                        Cor Principal (Hover)
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={themeColorHover}
                          onChange={(e) => setThemeColorHover(e.target.value)}
                          className="w-8 h-8 rounded border border-zinc-300 p-0 cursor-pointer overflow-hidden"
                        />
                        <input
                          type="text"
                          value={themeColorHover}
                          onChange={(e) => {
                            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                              setThemeColorHover(e.target.value);
                            }
                          }}
                          className="w-full text-xs font-mono px-2 border border-zinc-300 rounded focus:outline-none focus:border-red-650 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black tracking-widest uppercase text-zinc-500 font-mono">
                        Fundo do Tema Escuro (Dark)
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={bgDarkColor}
                          onChange={(e) => setBgDarkColor(e.target.value)}
                          className="w-8 h-8 rounded border border-zinc-300 p-0 cursor-pointer overflow-hidden"
                        />
                        <input
                          type="text"
                          value={bgDarkColor}
                          onChange={(e) => {
                            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                              setBgDarkColor(e.target.value);
                            }
                          }}
                          className="w-full text-xs font-mono px-2 border border-zinc-300 rounded focus:outline-none focus:border-red-650 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black tracking-widest uppercase text-zinc-500 font-mono">
                        Fundo do Tema Claro (Light)
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={bgLightColor}
                          onChange={(e) => setBgLightColor(e.target.value)}
                          className="w-8 h-8 rounded border border-zinc-300 p-0 cursor-pointer overflow-hidden"
                        />
                        <input
                          type="text"
                          value={bgLightColor}
                          onChange={(e) => {
                            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                              setBgLightColor(e.target.value);
                            }
                          }}
                          className="w-full text-xs font-mono px-2 border border-zinc-300 rounded focus:outline-none focus:border-red-650 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography / Font configuration */}
                <div className="space-y-4">
                  <span className="block text-[9px] font-black uppercase text-zinc-500 font-mono tracking-wider border-b border-zinc-200/60 pb-1 text-zinc-400">
                    <Type className="w-3.5 h-3.5 inline mr-1.5" /> Tipografia & Fontes de Texto
                  </span>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black tracking-widest uppercase text-zinc-500 font-mono">
                        Fonte dos Títulos / Headings
                      </label>
                      <select
                        value={displayFont}
                        onChange={(e) => setDisplayFont(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-red-650 bg-white font-medium"
                      >
                        <option value="Space Grotesk">Space Grotesk (Tech & Esportivo)</option>
                        <option value="Inter">Inter (Sólida & Suíça)</option>
                        <option value="Montserrat">Montserrat (Geométrica Premium)</option>
                        <option value="Playfair Display">Playfair Display (Editorial Clássico)</option>
                        <option value="Outfit">Outfit (Moderna & Redonda)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Console Geek)</option>
                        <option value="Cabin">Cabin (Corporativa Suave)</option>
                      </select>
                      <p className="text-[8.5px] text-zinc-400 font-sans leading-normal">
                        Usada para cabeçalhos destacados, preços, títulos de posters e banners.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black tracking-widest uppercase text-zinc-500 font-mono">
                        Fonte do Corpo / Descrições
                      </label>
                      <select
                        value={sansFont}
                        onChange={(e) => setSansFont(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-red-650 bg-white font-medium"
                      >
                        <option value="Inter">Inter (Excelente Legibilidade)</option>
                        <option value="Roboto">Roboto (Neo-grotesque neutra)</option>
                        <option value="Poppins">Poppins (Redonda e Amigável)</option>
                        <option value="Open Sans">Open Sans (Suave & Confortável)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Visual Técnico Grid)</option>
                      </select>
                      <p className="text-[8.5px] text-zinc-400 font-sans leading-normal">
                        Usada para parágrafos de texto, especificações, detalhes de produtos e formulários de checkout.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Preview Card to test in real time */}
              <div className="mb-6">
                <span className="block text-[9px] font-black uppercase text-zinc-500 font-mono tracking-wider mb-2 text-zinc-400">
                  👀 Pré-visualização do Seu Tema em Tempo Real
                </span>
                <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-150 bg-zinc-200/50 flex flex-col md:flex-row gap-5 items-center justify-around">
                  {/* Pseudo Header preview */}
                  <div className="w-full max-w-[210px] bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 text-white font-sans text-center shadow">
                    <span className="block text-[8.5px] tracking-widest uppercase text-zinc-500 font-mono mb-1.5">// Cabeçalho Mockup</span>
                    <div className="flex justify-between items-center bg-zinc-900/60 p-2 rounded border border-zinc-850">
                      <span className="text-[10px] font-bold" style={{ fontFamily: displayFont }}>CAMISA 7</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono text-white" style={{ backgroundColor: themeColor }}>R$ 150</span>
                    </div>
                  </div>

                  {/* Pseudo Card preview */}
                  <div className="w-full max-w-[200px] bg-white p-3.5 rounded-xl border border-zinc-200 text-slate-800 shadow-sm text-left">
                    <span className="block text-[8.5px] tracking-widest uppercase text-zinc-400 font-mono mb-1">// Card de Camisa</span>
                    <div className="w-full h-16 rounded bg-zinc-100 mb-2 flex items-center justify-center font-bold text-[9px] text-zinc-400 capitalize">
                      Manto Mockup
                    </div>
                    <h5 className="text-[11px] font-bold tracking-tight text-slate-900" style={{ fontFamily: displayFont }}>Manto Customizado 2026</h5>
                    <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal line-clamp-1" style={{ fontFamily: sansFont }}>Poliéster respirável e alta costura.</p>
                    <button
                      type="button"
                      disabled
                      className="w-full mt-2 py-1.5 text-[9px] font-bold uppercase rounded text-white text-center cursor-not-allowed"
                      style={{ backgroundColor: themeColor }}
                    >
                      Reservar Manto
                    </button>
                  </div>
                </div>
              </div>

              {/* Action save/reset configuration */}
              <div className="flex gap-2.5 pt-4 border-t border-zinc-200/80">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (onSaveAppearance) {
                        await onSaveAppearance({
                          primaryColor: themeColor,
                          primaryColorHover: themeColorHover,
                          bgDark: bgDarkColor,
                          bgLight: bgLightColor,
                          displayFont,
                          sansFont,
                          pixKey
                        });
                      } else {
                        // Backup/Optimistic save on localStorage
                        localStorage.setItem('camisa7_theme_color', themeColor);
                        localStorage.setItem('camisa7_theme_color_hover', themeColorHover);
                        localStorage.setItem('camisa7_bg_dark_color', bgDarkColor);
                        localStorage.setItem('camisa7_bg_light_color', bgLightColor);
                        localStorage.setItem('camisa7_display_font', displayFont);
                        localStorage.setItem('camisa7_sans_font', sansFont);
                        localStorage.setItem('camisa7_custom_pix_key', pixKey);
                        triggerNotification(
                          "Aparência Salva!",
                          "Design da loja atualizado com sucesso no navegador!",
                          "success"
                        );
                      }
                    } catch (err) {
                      triggerNotification("Erro ao Salvar", "Não foi possível gravar as preferências.", "alert");
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar Tudo e Publicar
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setThemeColor('#d12229');
                    setThemeColorHover('#aa1a1e');
                    setBgDarkColor('#09090b');
                    setBgLightColor('#fafafa');
                    setDisplayFont('Space Grotesk');
                    setSansFont('Inter');
                    if (setPixKey) setPixKey('barrosbruno.ti@gmail.com');

                    localStorage.removeItem('camisa7_theme_color');
                    localStorage.removeItem('camisa7_theme_color_hover');
                    localStorage.removeItem('camisa7_bg_dark_color');
                    localStorage.removeItem('camisa7_bg_light_color');
                    localStorage.removeItem('camisa7_display_font');
                    localStorage.removeItem('camisa7_sans_font');
                    localStorage.removeItem('camisa7_custom_pix_key');

                    if (onSaveAppearance) {
                      await onSaveAppearance({
                        primaryColor: '#d12229',
                        primaryColorHover: '#aa1a1e',
                        bgDark: '#09090b',
                        bgLight: '#fafafa',
                        displayFont: 'Space Grotesk',
                        sansFont: 'Inter',
                        pixKey: 'barrosbruno.ti@gmail.com'
                      });
                    } else {
                      triggerNotification(
                        "Layout Restaurado",
                        "Cores, fontes e chave Pix redefinidas para o padrão original!",
                        "info"
                      );
                    }
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-black font-semibold text-[11px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Excluir Customização
                </button>
              </div>
            </div>

            {/* PIX KEY CONFIGURATION SECTION */}
            <div className="bg-zinc-50 border border-zinc-200 p-4 sm:p-5 rounded-xl text-left font-sans mt-4">
              <div className="flex items-center gap-2.5 mb-2 border-b border-zinc-200 pb-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black tracking-widest uppercase text-slate-800 font-mono">
                  Configuração de Recebimento Pix (QR Code/Link)
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">
                Insira a chave Pix oficial que a sua loja utilizará para receber pagamentos diretamente de seus clientes. Essa chave será utilizada para gerar o QR Code dinâmico e o Pix Copia e Cola nos celulares de todos os clientes em tempo real, garantindo que o dinheiro caia direto na sua conta.
              </p>
              <div className="max-w-md space-y-2">
                <label className="block text-[8px] font-black tracking-widest uppercase text-zinc-500 font-mono">
                  Chave Pix Registrada
                </label>
                <input
                  type="text"
                  value={pixKey}
                  placeholder="EX: barrosbruno.ti@gmail.com"
                  onChange={(e) => {
                    if (setPixKey) setPixKey(e.target.value);
                  }}
                  className="w-full text-xs font-mono px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-red-650 bg-white"
                />
                <span className="block text-[9px] text-zinc-400 font-sans leading-normal">
                  💡 <strong>Formatos aceitos pelo Banco Central:</strong> E-mail, Telefone celular (com DDD no formato Ex: 11999999999), CPF/CNPJ ou Chave Aleatória (UUID).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SUPABASE DATABASE INTEGRATION CONTROL CENTER */}
        {activeTab === 'supabase' && (
          <div className="animate-fade-in space-y-6 text-left font-sans">
            <div className="bg-zinc-50 border border-zinc-200 p-4 sm:p-5 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 border-b border-zinc-200 pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-emerald-105 bg-zinc-950 text-emerald-400 font-bold text-xs">
                    S
                  </span>
                  <div>
                    <h3 className="text-xs font-black tracking-widest uppercase text-slate-800 font-mono">
                      Centro de Migração e Integração Supabase Postgres
                    </h3>
                  </div>
                </div>
                
                {supabaseStatus?.configured ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] uppercase tracking-wider font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Configurado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[10px] uppercase tracking-wider font-mono font-bold px-2.5 py-1 rounded-full border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Aguardando Credenciais
                  </span>
                )}
              </div>
              
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-6">
                Sincronize sua base de dados e arquivos locais permanentemente para o seu próprio banco de dados relacional relâmpago no <strong>Supabase Postgres</strong>. Isso garante sincronização instantânea em múltiplos navegadores, maior controle e confiabilidade de dados.
              </p>

              {/* Stat Cards & Key Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                
                <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 font-mono tracking-wider">
                    Passo 1: Credenciais
                  </h4>
                  {supabaseStatus?.configured ? (
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-600 font-mono break-all truncate">
                        URL: {supabaseStatus.url}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        ✓ Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY detectadas.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-650 leading-relaxed">
                        Abra o menu <strong>Settings</strong> do <strong>Google AI Studio</strong> e insira os seguintes Secrets nas variáveis de ambiente:
                      </p>
                      <div className="bg-zinc-950 p-2 text-[10px] font-mono text-zinc-300 rounded leading-normal border border-zinc-800">
                        SUPABASE_URL=sua_url_aqui<br/>
                        SUPABASE_KEY=sua_service_role_key
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 font-mono tracking-wider">
                    Passo 2: Estrutura do Banco SQL
                  </h4>
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-650 leading-relaxed">
                      Para que o Supabase funcione, as tabelas devem existir. Abra o <strong>SQL Editor</strong> do Supabase e clique em <strong>New Query</strong> para colar o script do banco.
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (supabaseStatus?.sqlScript) {
                          navigator.clipboard.writeText(supabaseStatus.sqlScript);
                          setSqlCopied(true);
                          triggerNotification("SQL Copiado", "O script DDL foi copiado para sua área de transferência!", "success");
                          setTimeout(() => setSqlCopied(false), 3000);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 w-full bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold text-[10px] uppercase py-1.5 px-3 rounded text-center transition-colors cursor-pointer"
                    >
                      {sqlCopied ? "✓ Script Copiado!" : "Copiar Script SQL (DDL)"}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 p-4 rounded-xl space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 font-mono tracking-wider">
                    Passo 3: Estado das Tabelas
                  </h4>
                  {supabaseStatus?.configured ? (
                    <div className="space-y-1.5 text-xs text-zinc-700">
                      <div className="flex items-center justify-between">
                        <span>Tabela de Produtos:</span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${supabaseStatus.tables.products ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {supabaseStatus.tables.products ? 'EXISTE' : 'FALTANDO'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tabela de Banners:</span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${supabaseStatus.tables.banners ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {supabaseStatus.tables.banners ? 'EXISTE' : 'FALTANDO'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tabela de Pedidos:</span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${supabaseStatus.tables.orders ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {supabaseStatus.tables.orders ? 'EXISTE' : 'FALTANDO'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tabela de Aparência:</span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${supabaseStatus.tables.appearance ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {supabaseStatus.tables.appearance ? 'EXISTE' : 'FALTANDO'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">
                      Configure as variáveis de ambiente acima para validar as tabelas no Supabase.
                    </p>
                  )}
                </div>

              </div>

              {/* Action Trigger Area */}
              <div className="bg-zinc-100 border border-zinc-200 p-5 rounded-xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Executar Transmissão de Dados
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Clique no botão abaixo para transferir de forma unificada os dados atuais locais de camisas, estoque, vendas (pedidos), layouts de banners e suas configurações de design diretamente para o banco relacional do Supabase. Todos os cadastros subsequentes passarão a persistir em ambos automaticamente.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    disabled={isMigrating || !supabaseStatus?.configured}
                    onClick={async () => {
                      setIsMigrating(true);
                      setMigrationProgress(null);
                      triggerNotification("Migração Iniciada", "Empacotando e exportando dados para o Supabase Postgres...", "info");
                      try {
                        const resp = await fetch("/api/config/supabase-migrate", {
                          method: "POST"
                        });
                        const data = await resp.json();
                        if (data.success) {
                          setMigrationProgress(data.results);
                          triggerNotification("Migração Concluída", "Todos os dados foram importados com sucesso para o Supabase!", "success");
                          await fetchSupabaseStatus();
                        } else {
                          throw new Error(data.error);
                        }
                      } catch (err: any) {
                        triggerNotification("Falha na Migração", err.message || "Não foi possível concluir a migração.", "alert");
                        setMigrationProgress({
                          products: 0,
                          banners: 0,
                          orders: 0,
                          appearance: false,
                          errors: [err.message || "Erro desconhecido."]
                        });
                      } finally {
                        setIsMigrating(false);
                      }
                    }}
                    className={`flex items-center justify-center gap-2 bg-red-650 hover:bg-red-700 text-white font-mono font-bold text-[11px] uppercase tracking-wider px-5 py-3 rounded-lg shadow-sm transition-colors cursor-pointer ${
                      (isMigrating || !supabaseStatus?.configured) && 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isMigrating ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        Migrando Dados...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4" />
                        Migrar todos os dados para o Supabase agora
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchSupabaseStatus()}
                    className="flex items-center justify-center gap-1.5 bg-zinc-200 hover:bg-zinc-300 text-slate-800 font-mono font-bold text-[10px] uppercase px-4 py-3 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> Atualizar Conexão
                  </button>
                </div>

                {/* Progress Results Panel */}
                {migrationProgress && (
                  <div className="bg-white border border-zinc-200 p-4 rounded-lg space-y-2.5 animate-fade-in text-xs font-mono text-left">
                    <h5 className="font-bold text-slate-900 border-b pb-1">
                      Relatório detalhado da transmissão:
                    </h5>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <span>✓</span>
                        <span>{migrationProgress.products} Produtos importados com sucesso.</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <span>✓</span>
                        <span>{migrationProgress.banners} Banners importados com sucesso.</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <span>✓</span>
                        <span>{migrationProgress.orders} Pedidos de vendas importados com sucesso.</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <span>✓</span>
                        <span>Configuração estética e paletas de cores unificadas ({migrationProgress.appearance ? 'OK' : 'Falhou'}).</span>
                      </div>
                    </div>

                    {migrationProgress.errors && migrationProgress.errors.length > 0 && (
                      <div className="pt-2 text-red-700 text-[11px] space-y-1">
                        <span className="font-bold block">Erros encontrados:</span>
                        {migrationProgress.errors.map((e, idx) => (
                          <p key={idx}>- {e}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Technical Preview of SQL Schema table creation code block */}
              {supabaseStatus?.sqlScript && (
                <div className="space-y-2">
                  <span className="block text-[8px] font-black uppercase text-zinc-500 font-mono tracking-wider">
                    Script SQL completo de criação de tabelas (PostgreSQL DDL)
                  </span>
                  <pre className="p-4 bg-zinc-950 text-zinc-300 font-mono text-[10px] leading-relaxed rounded-xl overflow-x-auto border border-zinc-800 max-h-[180px]">
                    {supabaseStatus.sqlScript}
                  </pre>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Helper inside the module to adjust hex color brightness (percentage value e.g. -15)
function adjustBrightness(hex: string, percent: number): string {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = Math.round((R * (100 + percent)) / 100);
  G = Math.round((G * (100 + percent)) / 100);
  B = Math.round((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}
