import React, { useState, useEffect } from 'react';
import { Banner } from '../types';
import { ChevronLeft, ChevronRight, Plus, X, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { compressImage } from '../utils';

interface PromotionBannerProps {
  banners: Banner[];
  onAddBanner: (banner: Omit<Banner, 'id'>) => void;
  onUpdateBanner?: (id: string, updates: Partial<Banner>) => void;
  onDeleteBanner?: (id: string) => void;
  isAdmin: boolean;
  onFilterByCategory: (cat: 'todos' | 'masculino' | 'feminino' | 'promocoes' | 'esportivo') => void;
}

export const PromotionBanner: React.FC<PromotionBannerProps> = ({
  banners,
  onAddBanner,
  onUpdateBanner,
  onDeleteBanner,
  isAdmin,
  onFilterByCategory
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // New Banner attributes
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newTag, setNewTag] = useState('PROMOÇÃO ESPECIAL');
  const [newBtnText, setNewBtnText] = useState('Ver Coleção');
  const [newCategory, setNewCategory] = useState('promocoes');

  // Edit Banner attributes
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editBtnText, setEditBtnText] = useState('');
  const [editCategory, setEditCategory] = useState('promocoes');

  // Device image upload and Drag-and-Drop state managers
  const [newImageMode, setNewImageMode] = useState<'upload' | 'url'>('upload');
  const [editImageMode, setEditImageMode] = useState<'upload' | 'url'>('upload');
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);

  // Auto-slideshow state with pause-on-hover / infinite looping
  const [isPaused, setIsPaused] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setConfirmDeleteId(null);
  }, [activeIndex]);

  // Reset activeIndex to 0 if out of bounds (can happen when category filters change and banners count decreases)
  useEffect(() => {
    if (activeIndex >= banners.length) {
      setActiveIndex(0);
    }
  }, [banners.length, activeIndex]);

  const handleFileLoad = (file: File, callback: (url: string) => void) => {
    if (!file.type.startsWith('image/')) return;
    compressImage(file, 1200, 600, 0.75)
      .then(callback)
      .catch((err) => {
        console.error("Compression failed, falling back to original load:", err);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            callback(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      });
  };

  const handleDragOver = (e: React.DragEvent, setDragging: (d: boolean) => void) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent, setDragging: (d: boolean) => void) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent, setDragging: (d: boolean) => void, callback: (url: string) => void) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileLoad(file, callback);
    }
  };

  // Prevent background body scrolling when modal overlays are active
  useEffect(() => {
    if (showAddForm || showEditForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddForm, showEditForm]);

  // Auto-slideshow loop: moves to the next banner every 5 seconds (5000ms), repeats in an infinite loop
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length, isPaused, activeIndex]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const submitBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSubtitle || !newImage) return;

    onAddBanner({
      title: newTitle,
      subtitle: newSubtitle,
      image: newImage,
      tag: newTag,
      buttonText: newBtnText,
      linkToCategory: newCategory
    });

    // Reset fields
    setNewTitle('');
    setNewSubtitle('');
    setNewImage('');
    setNewTag('PROMOÇÃO ESPECIAL');
    setShowAddForm(false);
    setActiveIndex(banners.length); // switch to the newly created banner!
  };

  const submitEditBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editTitle || !editSubtitle || !editImage) return;

    onUpdateBanner?.(editingId, {
      title: editTitle,
      subtitle: editSubtitle,
      image: editImage,
      tag: editTag,
      buttonText: editBtnText,
      linkToCategory: editCategory
    });

    setShowEditForm(false);
    setEditingId(null);
  };

  if (banners.length === 0) {
    if (isAdmin) {
      return (
        <div className={`relative w-full rounded-2xl border border-dashed py-12 px-6 flex flex-col items-center justify-center text-center gap-3 transition-all ${
          isDraggingNew ? 'border-red-650 bg-red-50/10' : 'border-zinc-300 bg-zinc-50/40 text-slate-800'
        }`}>
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight">Crie seu Carrossel de Banners</h3>
          <p className="text-xs text-zinc-500 max-w-sm">Você está no Modo Administrador! Clique abaixo para publicar seu primeiro banner promocional de destaque.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-650 hover:bg-red-700 text-white text-[10px] uppercase font-mono font-black px-6 py-2.5 rounded-full transition-all cursor-pointer"
          >
            Adicionar Primeiro Banner
          </button>
          
          {showAddForm && (
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-4 z-50 cursor-pointer text-slate-900"
              onClick={() => setShowAddForm(false)}
            >
              <div 
                className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 my-8 relative shadow-2xl cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-black cursor-pointer p-1 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h3 className="text-lg font-black tracking-tight mb-1 uppercase text-left">Novo Banner Promocional</h3>
                <p className="text-xs text-zinc-500 mb-4 text-left font-sans">Adicione uma oferta rotativa em destaque no topo da loja.</p>
                
                <form onSubmit={submitBanner} className="space-y-3.5 text-xs text-left">
                  <div>
                    <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Título da Promoção</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: CASACOS E DIAS DE DIVERSÃO"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-650 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Texto de Descrição</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Encontre vestidos lindos, macacões de soft quentinhos e muito mais..."
                      value={newSubtitle}
                      onChange={(e) => setNewSubtitle(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-650 font-sans"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 font-sans">
                      <label className="block text-zinc-500 uppercase font-mono text-[10px] font-bold">Imagem do Banner</label>
                      <div className="flex bg-zinc-100 p-0.5 rounded border border-zinc-200">
                        <button
                          type="button"
                          onClick={() => setNewImageMode('upload')}
                          className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono transition-all cursor-pointer ${
                            newImageMode === 'upload' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                          }`}
                        >
                          Dispositivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewImageMode('url')}
                          className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono transition-all cursor-pointer ${
                            newImageMode === 'url' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                          }`}
                        >
                          Link da Web
                        </button>
                      </div>
                    </div>

                    {newImageMode === 'upload' ? (
                      <div
                        onDragOver={(e) => handleDragOver(e, setIsDraggingNew)}
                        onDragLeave={(e) => handleDragLeave(e, setIsDraggingNew)}
                        onDrop={(e) => handleDrop(e, setIsDraggingNew, setNewImage)}
                        className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] ${
                          isDraggingNew
                            ? 'border-red-650 bg-red-50/50 shadow-inner'
                            : newImage
                            ? 'border-emerald-600/40 bg-zinc-50'
                            : 'border-zinc-300 hover:border-red-650/50 hover:bg-zinc-50/50'
                        }`}
                        onClick={() => document.getElementById('empty-banner-file-input')?.click()}
                      >
                        <input
                          id="empty-banner-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileLoad(file, setNewImage);
                          }}
                        />
                        
                        {newImage ? (
                          <div className="flex items-center gap-3 w-full text-left">
                            <img 
                              src={newImage} 
                              alt="Prévia" 
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 rounded object-cover shadow-sm bg-stone-100 flex-shrink-0 border border-zinc-200"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate">Imagem do Dispositivo</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5 truncate">Salva em Base64 localmente</p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewImage('');
                                }}
                                className="text-red-600 font-mono text-[9px] font-bold uppercase tracking-wider hover:underline mt-1 cursor-pointer block"
                              >
                                Remover Imagem
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
                            <span className="text-[11px] text-zinc-700 font-bold block">Clique para escolher ou arraste</span>
                            <span className="text-[9px] text-zinc-400 mt-0.5 font-sans">Suporta imagens do dispositivo</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          required
                          placeholder="https://images.unsplash.com/..."
                          value={newImage}
                          onChange={(e) => setNewImage(e.target.value)}
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-650 font-sans"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Tag do Topo</label>
                      <input
                        type="text"
                        required
                        placeholder="PROMOÇÃO EXCLUSIVA"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-650 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Texto do Botão</label>
                      <input
                        type="text"
                        required
                        placeholder="Explorar Coleção"
                        value={newBtnText}
                        onChange={(e) => setNewBtnText(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-650 font-sans font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Categoria Destino</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-650 font-sans font-bold"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="esportivo">Esportivo</option>
                      <option value="promocoes">Promoções (Outlet)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-black uppercase tracking-widest rounded transition-colors cursor-pointer font-sans"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded transition-colors cursor-pointer font-sans"
                    >
                      Publicar Banner
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="relative w-full rounded-2xl border py-12 px-6 flex flex-col items-center justify-center text-center gap-3 bg-zinc-900 border-red-950 text-white select-none shadow-sm">
        <div className="p-3 bg-red-950/40 border border-red-900/30 rounded-full text-red-500">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black uppercase tracking-wider font-sans">Bem-vindo à Mini Kids</h3>
        <p className="text-zinc-400 text-xs font-sans max-w-sm">
          A loja está sendo configurada pelo Administrador. Marque esta página nos seus favoritos e volte em breve para conferir os lookinhos infantis e promoções exclusivas!
        </p>
      </div>
    );
  }

  const currentBanner = banners[activeIndex] || banners[0];

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-white rounded-2xl border border-zinc-200/80 select-none"
    >
      {/* Visual Backdrop Frame with dynamic animations */}
      <div className="relative h-[340px] sm:h-[400px] md:h-[450px] w-full flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />
        <img
          src={currentBanner.image}
          alt={currentBanner.title}
          className="absolute inset-0 w-full h-full object-cover opacity-75 transition-all duration-1000 transform scale-102"
        />

        {/* Banner Content Panel */}
        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 w-full flex flex-col items-start gap-4">
          {currentBanner.tag && (
            <span className="bg-red-600 text-white text-[10px] font-mono font-black uppercase tracking-widest px-3 py-1 rounded">
              {currentBanner.tag}
            </span>
          )}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none max-w-xl text-white uppercase">
            {currentBanner.title}
          </h1>
          <p className="text-sm sm:text-lg text-zinc-300 max-w-lg font-sans leading-relaxed">
            {currentBanner.subtitle}
          </p>
          <button
            onClick={() => onFilterByCategory(currentBanner.linkToCategory as any || 'todos')}
            className="mt-2 bg-white hover:bg-red-600 hover:text-white text-black text-xs font-black uppercase tracking-widest px-8 py-3.5 rounded-full transition-all duration-300 transform active:scale-95 shadow-lg cursor-pointer"
          >
            {currentBanner.buttonText}
          </button>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-4 z-30 p-2 text-white hover:text-red-500 bg-black/40 hover:bg-black/80 rounded-full border border-white/10 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 z-30 p-2 text-white hover:text-red-500 bg-black/40 hover:bg-black/80 rounded-full border border-white/10 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Bottom Carousel Dots indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeIndex === idx ? 'w-6 bg-red-600' : 'w-2 bg-gray-500 hover:bg-white'
              }`}
            />
          ))}
        </div>

        {/* Admin Plus overlay to register additional banners as requested */}
        {isAdmin && (
          <div className="absolute top-6 right-6 z-30 flex flex-wrap gap-2 justify-end max-w-[90vw]">
            <button
              onClick={() => {
                setEditingId(currentBanner.id);
                setEditTitle(currentBanner.title);
                setEditSubtitle(currentBanner.subtitle);
                setEditImage(currentBanner.image);
                setEditTag(currentBanner.tag || 'PROMOÇÃO ESPECIAL');
                setEditBtnText(currentBanner.buttonText || 'Ver Coleção');
                setEditCategory(currentBanner.linkToCategory || 'promocoes');
                setShowEditForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 text-white border border-white/20 font-mono text-xs font-bold uppercase rounded shadow-lg active:scale-95 hover:bg-black transition-all cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Editar
            </button>
            {onDeleteBanner && (
              confirmDeleteId === currentBanner.id ? (
                <div className="flex items-center gap-1 bg-zinc-900 border border-red-500 rounded px-1.5 py-1 shadow-lg">
                  <span className="text-[10px] text-white font-mono font-bold uppercase tracking-wide px-1">Excluir?</span>
                  <button
                    onClick={() => {
                      onDeleteBanner(currentBanner.id);
                      setConfirmDeleteId(null);
                      setActiveIndex((prev) => Math.max(0, prev - 1));
                    }}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-1 bg-zinc-700 hover:bg-zinc-650 text-white font-mono text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(currentBanner.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase rounded shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              )
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 font-mono text-xs font-bold uppercase rounded shadow-lg active:scale-95 hover:bg-red-700 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Novo
            </button>
          </div>
        )}
      </div>

      {/* Admin Insertion Modal popup overlay */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 z-50 cursor-pointer"
          onClick={() => setShowAddForm(false)}
        >
          <div 
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 my-8 relative text-slate-900 shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black cursor-pointer p-1 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-black tracking-tight text-slate-900 mb-1 uppercase">Novo Banner Promocional</h3>
            <p className="text-xs text-zinc-500 mb-4">Adicione uma oferta rotativa em destaque no topo da loja.</p>
            
            <form onSubmit={submitBanner} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Título da Promoção</label>
                <input
                  type="text"
                  required
                  placeholder="ex: CASACOS E DIAS DE DIVERSÃO"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Texto de Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Encontre vestidos lindos, macacões de soft quentinhos e muito mais..."
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-zinc-500 uppercase font-mono text-[10px] font-bold">Imagem do Banner</label>
                  <div className="flex bg-zinc-100 p-0.5 rounded border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setNewImageMode('upload')}
                      className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono transition-all cursor-pointer ${
                        newImageMode === 'upload' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Dispositivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewImageMode('url')}
                      className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono transition-all cursor-pointer ${
                        newImageMode === 'url' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Link da Web
                    </button>
                  </div>
                </div>

                {newImageMode === 'upload' ? (
                  <div
                    onDragOver={(e) => handleDragOver(e, setIsDraggingNew)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingNew)}
                    onDrop={(e) => handleDrop(e, setIsDraggingNew, setNewImage)}
                    className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] ${
                      isDraggingNew
                        ? 'border-red-600 bg-red-50/50 shadow-inner'
                        : newImage
                        ? 'border-emerald-600/40 bg-zinc-50'
                        : 'border-zinc-300 hover:border-red-600/50 hover:bg-zinc-50/50'
                    }`}
                    onClick={() => document.getElementById('new-banner-file-input')?.click()}
                  >
                    <input
                      id="new-banner-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileLoad(file, setNewImage);
                      }}
                    />
                    
                    {newImage ? (
                      <div className="flex items-center gap-3 w-full text-left">
                        <img 
                          src={newImage} 
                          alt="Prévia" 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded object-cover shadow-sm bg-stone-100 flex-shrink-0 border border-zinc-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">Imagem do Dispositivo</p>
                          <p className="text-[9px] text-zinc-400 mt-0.5 truncate">Salva em Base64 localmente</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewImage('');
                            }}
                            className="text-red-600 font-mono text-[9px] font-bold uppercase tracking-wider hover:underline mt-1 cursor-pointer block"
                          >
                            Remover Imagem
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
                        <span className="text-[11px] text-zinc-700 font-bold block">Clique para escolher ou arraste</span>
                        <span className="text-[9px] text-zinc-400 mt-0.5">Suporta imagens do dispositivo</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                    />
                    <button
                      type="button"
                      onClick={() => setNewImage('https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?w=1600&auto=format&fit=crop&q=80')}
                      className="p-2 bg-zinc-100 text-zinc-500 hover:text-black rounded cursor-pointer transition-colors"
                      title="Preencher com imagem padrão"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Tag do Topo</label>
                  <input
                    type="text"
                    required
                    placeholder="PROMOÇÃO EXCLUSIVA"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Texto do Botão</label>
                  <input
                    type="text"
                    required
                    placeholder="Explorar Coleção"
                    value={newBtnText}
                    onChange={(e) => setNewBtnText(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Categoria Destino</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600"
                >
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="esportivo">Esportivo</option>
                  <option value="promocoes">Promoções (Outlet)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-black uppercase tracking-widest rounded transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded transition-colors cursor-pointer"
                >
                  Publicar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Edition Modal popup overlay */}
      {showEditForm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 z-50 animate-fade-in cursor-pointer"
          onClick={() => {
            setShowEditForm(false);
            setEditingId(null);
          }}
        >
          <div 
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 my-8 relative text-slate-900 shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowEditForm(false);
                setEditingId(null);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-black cursor-pointer p-1 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-black tracking-tight text-slate-900 mb-1 uppercase">Ajustar Banner Existente</h3>
            <p className="text-xs text-zinc-500 mb-4 font-sans">Modifique os textos, imagens ou links deste carrossel em destaque.</p>
            
            <form onSubmit={submitEditBanner} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Título da Promoção</label>
                <input
                  type="text"
                  required
                  placeholder="ex: CASACOS E DIAS DE DIVERSÃO"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Texto de Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Recorde os melhores lances do futebol..."
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600 font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-zinc-500 uppercase font-mono text-[10px] font-bold">Imagem do Banner</label>
                  <div className="flex bg-zinc-100 p-0.5 rounded border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setEditImageMode('upload')}
                      className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono transition-all cursor-pointer ${
                        editImageMode === 'upload' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Dispositivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditImageMode('url')}
                      className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono transition-all cursor-pointer ${
                        editImageMode === 'url' ? 'bg-white text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Link da Web
                    </button>
                  </div>
                </div>

                {editImageMode === 'upload' ? (
                  <div
                    onDragOver={(e) => handleDragOver(e, setIsDraggingEdit)}
                    onDragLeave={(e) => handleDragLeave(e, setIsDraggingEdit)}
                    onDrop={(e) => handleDrop(e, setIsDraggingEdit, setEditImage)}
                    className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px] ${
                      isDraggingEdit
                        ? 'border-red-600 bg-red-50/50 shadow-inner'
                        : editImage
                        ? 'border-emerald-600/40 bg-zinc-50'
                        : 'border-zinc-300 hover:border-red-600/50 hover:bg-zinc-50/50'
                    }`}
                    onClick={() => document.getElementById('edit-banner-file-input')?.click()}
                  >
                    <input
                      id="edit-banner-file-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileLoad(file, setEditImage);
                      }}
                    />
                    
                    {editImage ? (
                      <div className="flex items-center gap-3 w-full text-left">
                        <img 
                          src={editImage} 
                          alt="Prévia" 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded object-cover shadow-sm bg-stone-100 flex-shrink-0 border border-zinc-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 truncate">Imagem do Dispositivo</p>
                          <p className="text-[9px] text-zinc-400 mt-0.5 truncate">Salva em Base64 localmente</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditImage('');
                            }}
                            className="text-red-600 font-mono text-[9px] font-bold uppercase tracking-wider hover:underline mt-1 cursor-pointer block"
                          >
                            Remover Imagem
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
                        <span className="text-[11px] text-zinc-700 font-bold block">Clique para escolher ou arraste</span>
                        <span className="text-[9px] text-zinc-400 mt-0.5">Suporta imagens do dispositivo</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600 font-sans"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Tag do Topo</label>
                  <input
                    type="text"
                    required
                    placeholder="PROMOÇÃO EXCLUSIVA"
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600 font-sans font-black"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Texto do Botão</label>
                  <input
                    type="text"
                    required
                    placeholder="Explorar Coleção"
                    value={editBtnText}
                    onChange={(e) => setEditBtnText(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600 font-sans font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 uppercase font-mono mb-1 text-[10px]">Categoria Destino</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-3 py-2 text-slate-900 focus:outline-none focus:border-red-600 font-sans"
                >
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="esportivo">Esportivo</option>
                  <option value="promocoes">Promoções (Outlet)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-black uppercase tracking-widest rounded transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-zinc-950 hover:bg-red-600 hover:text-white text-white text-xs font-black uppercase tracking-widest rounded transition-colors cursor-pointer"
                >
                  Salvar Ajustes do Banner
                </button>
              </div>

              {onDeleteBanner && editingId && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteBanner(editingId);
                    setShowEditForm(false);
                    setEditingId(null);
                    setActiveIndex((prev) => Math.max(0, prev - 1));
                  }}
                  className="w-full mt-2 py-3 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-250 border-red-200/60 text-xs font-black uppercase tracking-widest rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Excluir Este Banner do Site
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
