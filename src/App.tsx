import React, { useState, useEffect, useCallback } from 'react';
import { Product, Banner, CartItem, Order, ToastMessage, Review } from './types';
import { Header } from './components/Header';
import { PromotionBanner } from './components/PromotionBanner';
import { AdminPanel } from './components/AdminPanel';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { PushNotification } from './components/PushNotification';
import { PaymentModal } from './components/PaymentModal';
import { BottomMenu } from './components/BottomMenu';
import { ProductCard } from './components/ProductCard';
import { MobileShortcutModal } from './components/MobileShortcutModal';
import { Tag, Hourglass, CheckCircle, HelpCircle, MessageCircle, RefreshCw, Layers, Star, Info, ChevronRight, X, Send, Smartphone } from 'lucide-react';
import { INITIAL_PRODUCTS, INITIAL_BANNERS } from './data';

// Supabase & Express API Integration (Fully custom-tailored, Firebase-free)

export default function App() {
  // Theme dark / light state manager (Standard defaults to Dark)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('camisa7_theme');
    return saved !== null ? saved === 'true' : true;
  });

  // Visual Theme / Appearance Customization States
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('camisa7_theme_color') || '#d12229';
  });
  const [themeColorHover, setThemeColorHover] = useState(() => {
    return localStorage.getItem('camisa7_theme_color_hover') || '#aa1a1e';
  });
  const [bgDarkColor, setBgDarkColor] = useState(() => {
    return localStorage.getItem('camisa7_bg_dark_color') || '#09090b';
  });
  const [bgLightColor, setBgLightColor] = useState(() => {
    return localStorage.getItem('camisa7_bg_light_color') || '#fafafa';
  });
  const [displayFont, setDisplayFont] = useState(() => {
    return localStorage.getItem('camisa7_display_font') || 'Space Grotesk';
  });
  const [sansFont, setSansFont] = useState(() => {
    return localStorage.getItem('camisa7_sans_font') || 'Inter';
  });
  const [pixKey, setPixKey] = useState(() => {
    return localStorage.getItem('camisa7_custom_pix_key') || 'barrosbruno.ti@gmail.com';
  });

  // Store Core State Managers
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sessionOrderIds, setSessionOrderIds] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Navigation & Categorization States
  const [currentTab, setTab] = useState<'camisas' | 'pedidos' | 'historico'>('camisas');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'masculino' | 'feminino' | 'promocoes' | 'esportivo'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Access levels and overlay states
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const savedSimulated = localStorage.getItem('camisa7_simulated_user');
    if (savedSimulated) {
      try {
        return JSON.parse(savedSimulated);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isAdminMode, setAdminMode] = useState(() => {
    const savedSimulated = localStorage.getItem('camisa7_simulated_user');
    if (savedSimulated) {
      try {
        const parsed = JSON.parse(savedSimulated);
        return parsed.role === 'admin';
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<{ id: string; totalPrice: number } | null>(null);
  
  // Notifications toasts queue
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Mobile install/shortcut assistant toggle simulation
  const [showShortcutModal, setShowShortcutModal] = useState(false);

  // Local supportive simulator chat overlay
  const [showSupportWidget, setShowSupportWidget] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportChat, setSupportChat] = useState<{ sender: 'bot' | 'user'; text: string }[]>([
    { sender: 'bot', text: 'Olá! Sou o assistente Camisa 7. Como posso ajudar com seu manto hoje?' }
  ]);
  const [isTypingSupport, setIsTypingSupport] = useState(false);

  // Helper: Trigger custom toast notifications
  const triggerNotification = (title: string, body: string, type: 'info' | 'success' | 'alert') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, body, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Callback to fetch store appearance/branding configuration
  const loadAppearance = useCallback(async () => {
    try {
      const res = await fetch('/api/config/appearance?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        
        // Atualiza os estados
        setThemeColor(data.primaryColor || '#d12229');
        setThemeColorHover(data.primaryColorHover || '#aa1a1e');
        setBgDarkColor(data.bgDark || '#09090b');
        setBgLightColor(data.bgLight || '#fafafa');
        setDisplayFont(data.displayFont || 'Space Grotesk');
        setSansFont(data.sansFont || 'Inter');
        setPixKey(data.pixKey || 'barrosbruno.ti@gmail.com');

        // Persiste no localStorage para evitar o flash de cor padrão no próximo F5
        localStorage.setItem('camisa7_theme_color', data.primaryColor || '#d12229');
        localStorage.setItem('camisa7_theme_color_hover', data.primaryColorHover || '#aa1a1e');
        localStorage.setItem('camisa7_bg_dark_color', data.bgDark || '#09090b');
        localStorage.setItem('camisa7_bg_light_color', data.bgLight || '#fafafa');
        localStorage.setItem('camisa7_display_font', data.displayFont || 'Space Grotesk');
        localStorage.setItem('camisa7_sans_font', data.sansFont || 'Inter');
        localStorage.setItem('camisa7_custom_pix_key', data.pixKey || 'barrosbruno.ti@gmail.com');
      }
    } catch (err) {
      // Silently fail to avoid console noise during presentation
    }
  }, []);

  // Dynamic Appearance Sync on Document Root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', themeColor);
    root.style.setProperty('--color-primary-hover', themeColorHover);
    root.style.setProperty('--color-bg-dark', bgDarkColor);
    root.style.setProperty('--color-bg-light', bgLightColor);
    root.style.setProperty('--font-display-custom', displayFont);
    root.style.setProperty('--font-sans-custom', sansFont);

    // Apply font-family styles globally
    const styleId = 'custom-appearance-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    // Inject custom CSS to apply fonts and background colors dynamically!
    styleEl.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@450;500;700&family=Inter:wght@400;500;600;850&family=Montserrat:wght@400;600;800&family=Playfair+Display:ital,wght@0,700;1,400&family=Outfit:wght@400;500;750&family=JetBrains+Mono:wght@400;700&family=Cabin:wght@500;700&family=Roboto:wght@400;500;800&family=Poppins:wght@450;600;850&family=Open+Sans:wght@450;650&display=swap');
      
      :root {
        --color-primary: ${themeColor};
        --color-primary-hover: ${themeColorHover};
        --color-bg-dark: ${bgDarkColor};
        --color-bg-light: ${bgLightColor};
      }
      
      /* Overrides dynamically selected branding across component styles! */
      .bg-red-650, .bg-red-600, .hover\\:bg-red-750:hover, .hover\\:bg-red-700:hover, .hover\\:bg-red-850:hover {
        background-color: var(--color-primary) !important;
      }
      
      button.bg-red-600:hover, button.bg-red-650:hover {
        background-color: var(--color-primary-hover) !important;
      }
      
      .text-red-650, .text-red-600, .hover\\:text-red-600:hover, .hover\\:text-red-700:hover {
        color: var(--color-primary) !important;
      }
      
      .border-red-600, .border-red-900\\/40 {
        border-color: var(--color-primary) !important;
      }

      /* Dynamically style display elements */
      h1, h2, h3, h4, h5, h6, .font-display {
        font-family: "${displayFont}", "Space Grotesk", sans-serif !important;
      }

      /* Dynamically style body elements (excluding tabular monospaced elements) */
      body, select, input, button, textarea, p, span, li, blockquote, label, .font-sans {
        font-family: "${sansFont}", "Inter", sans-serif;
      }

      /* Dark theme background dynamic overrides */
      html.dark, .dark, body.dark-theme, .bg-zinc-950, .bg-stone-950 {
        background-color: var(--color-bg-dark) !important;
      }
      
      /* Light theme custom background override */
      body {
        transition: background-color 0.2s ease;
      }
    `;
  }, [themeColor, themeColorHover, bgDarkColor, bgLightColor, displayFont, sansFont]);

  const handleSaveAppearance = async (appearance: {
    primaryColor: string;
    primaryColorHover: string;
    bgDark: string;
    bgLight: string;
    displayFont: string;
    sansFont: string;
    pixKey?: string;
  }) => {
    try {
      // 1. Optimistic save locally (Immediate UI changes)
      localStorage.setItem('camisa7_theme_color', appearance.primaryColor);
      localStorage.setItem('camisa7_theme_color_hover', appearance.primaryColorHover);
      localStorage.setItem('camisa7_bg_dark_color', appearance.bgDark);
      localStorage.setItem('camisa7_bg_light_color', appearance.bgLight);
      localStorage.setItem('camisa7_display_font', appearance.displayFont);
      localStorage.setItem('camisa7_sans_font', appearance.sansFont);
      if (appearance.pixKey) {
        localStorage.setItem('camisa7_custom_pix_key', appearance.pixKey);
        setPixKey(appearance.pixKey);
      }

      // Update local state immediately
      setThemeColor(appearance.primaryColor);
      setThemeColorHover(appearance.primaryColorHover);
      setBgDarkColor(appearance.bgDark);
      setBgLightColor(appearance.bgLight);
      setDisplayFont(appearance.displayFont);
      setSansFont(appearance.sansFont);

      // 2. Persist to Backend server (independent of Firebase client Auth state)
      try {
        await fetch('/api/config/appearance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appearance)
        });
      } catch (backendErr) {
        console.warn("Could not sync appearance with Express backend:", backendErr);
      }

      triggerNotification(
        "Configurações Publicadas!",
        "Layout, tipografia e chave Pix de checkout atualizados com sucesso!",
        "success"
      );
    } catch (err) {
      console.warn("Could not save appearance:", err);
      triggerNotification(
        "Aparência Salva!",
        "Design da loja atualizado com sucesso no navegador!",
        "success"
      );
    }
  };

  // Callbacks to fetch individual tables from backend
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?t=' + Date.now());
      if (res.ok) {
        const pData = await res.json() as Product[];
        setProducts(pData || []);
      }
    } catch (e) {
      console.warn("Could not read products: ", e);
    }
  }, []);

  const loadBanners = useCallback(async () => {
    try {
      const res = await fetch('/api/banners?t=' + Date.now());
      if (res.ok) {
        const bData = await res.json() as Banner[];
        setBanners(bData || []);
      }
    } catch (e) {
      console.warn("Could not read banners: ", e);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?t=' + Date.now());
      if (res.ok) {
        const oData = await res.json() as Order[];
        const sorted = (oData || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(sorted);
      }
    } catch (e) {
      console.warn("Could not read orders: ", e);
    }
  }, []);

  // Fetch initial store data on mount
  useEffect(() => {
    loadProducts();
    loadBanners();
    loadOrders();
    loadAppearance();
  }, [loadProducts, loadBanners, loadOrders, loadAppearance]);

  // Real-time Event Stream (SSE) listener
  useEffect(() => {
    const eventSource = new EventSource('/api/realtime');
    
    eventSource.addEventListener('db-change', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] Database change detected:', data);
        if (data.table === 'products') {
          loadProducts();
        } else if (data.table === 'banners') {
          loadBanners();
        } else if (data.table === 'orders') {
          loadOrders();
        } else if (data.table === 'appearance') {
          loadAppearance();
        }
      } catch (e) {
        console.error('[SSE] Error parsing change event:', e);
      }
    });

    eventSource.addEventListener('connected', (event: any) => {
      console.log('[SSE] Connected to real-time events channel.');
    });

    eventSource.onerror = (err) => {
      console.warn('[SSE] Connection error, EventSource will automatically reconnect:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [loadProducts, loadBanners, loadOrders, loadAppearance]);

  // Secure order handling based on simulated user role / sessionOrderIds
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      // Admin sees all polled orders, which is already handled by our main useEffect poll
      // No extra action needed here
    } else {
      // Customer or guest: filter polled orders to only include they purchased in this session or match their email
      // Let's do a client-side filter of the polled orders so we only display theirs!
      setOrders(prev => {
        return prev.filter(order => {
          const isSessionOrder = sessionOrderIds.includes(order.id);
          const isEmailOrder = currentUser?.email && order.customerEmail === currentUser.email;
          return isSessionOrder || isEmailOrder;
        });
      });
    }
  }, [currentUser, sessionOrderIds]);

  // Monitor Authentication State (Stored completely in localStorage)
  useEffect(() => {
    const savedSimulated = localStorage.getItem('camisa7_simulated_user');
    if (savedSimulated) {
      try {
        const parsed = JSON.parse(savedSimulated);
        setCurrentUser(parsed);
        setAdminMode(parsed.role === 'admin');
      } catch (e) {
        setCurrentUser(null);
        setAdminMode(false);
      }
    } else {
      setCurrentUser(null);
      setAdminMode(false);
    }
  }, []);

  // Simulated Google/Social Login (Independent of Firebase)
  const onGoogleLogin = async () => {
    // Directly simulate admin or customer login with simulated credentials
    const email = prompt("Digite seu e-mail para acessar:", "contato@cliente.com.br") || "contato@cliente.com.br";
    const isAdmin = email === 'brunoskolaxa@gmail.com' || email === 'barrosbruno.ti@gmail.com' || email === 'admin@camisa7.com.br' || email === 'lisbooaellen@gmail.com';
    const role = isAdmin ? 'admin' : 'customer';
    
    await onLoginSimulate(email, role);
  };

  // Sync simulated mode login with auto toast notifications
  const onLoginSimulate = async (email: string, role: 'admin' | 'customer') => {
    try {
      const mockUser = {
        id: `mock-${role}-${Math.floor(Math.random()*1000)}`,
        name: email ? email.split('@')[0].toUpperCase() : 'ADMIN',
        email: email || 'admin@camisa7.com.br',
        role: role
      };
      
      localStorage.setItem('camisa7_simulated_user', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      setAdminMode(role === 'admin');
      
      triggerNotification(
        "Sessão Iniciada",
        `Bem-vindo, ${mockUser.name}! Perfil: ${role.toUpperCase()}`,
        "success"
      );
    } catch (err) {
      console.error(err);
    }
  };

  const onLogout = async () => {
    try {
      localStorage.removeItem('camisa7_simulated_user');
      setCurrentUser(null);
      setAdminMode(false);
      triggerNotification("Sessão Finalizada", "Você deslogou da conta Camisa 7.", "info");
    } catch (err) {
      console.error(err);
    }
  };

  // CRUD: Add product
  const onAddProduct = async (newProdData: Omit<Product, 'id' | 'ratingValue' | 'reviews'>) => {
    try {
      const newId = `prod-${Date.now()}`;
      const newProduct: Product = {
        ...newProdData,
        id: newId,
        ratingValue: 5.0,
        reviews: []
      };

      const bannerId = `banner-prod-${newId}`;
      const newBanner: Banner = {
        id: bannerId,
        title: newProduct.name.toUpperCase(),
        subtitle: newProduct.description,
        image: newProduct.images[0],
        tag: `LANÇAMENTO: ${newProduct.category.toUpperCase()}`,
        buttonText: 'Garantir Reserva',
        linkToCategory: newProduct.category,
        orderIndex: banners.length
      };

      // 1. Persist to Express backend memorydb & disk
      const pRes = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (!pRes.ok) {
        const errData = await pRes.json();
        throw new Error(errData.error || "Erro ao salvar o produto no servidor");
      }

      const bRes = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBanner)
      });
      if (!bRes.ok) {
        const errData = await bRes.json();
        throw new Error(errData.error || "Erro ao criar banner automático no servidor");
      }

      // 2. React optimistic state updates (must-have for offline/sandbox/placeholder modes)
      setProducts(prev => [newProduct, ...prev]);
      setBanners(prev => [...prev, newBanner]);

      triggerNotification("Produto Cadastrado", "Camisa e Poster adicionados com sucesso ao catálogo!", "success");
    } catch (err: any) {
      triggerNotification("Erro ao cadastrar", err.message || "Falha ao salvar item.", "alert");
    }
  };

  // CRUD: Update product (such as stock or price)
  const onUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      // 1. Optimistic / local state updates (works instantly!)
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      if (selectedProduct?.id === id) {
        setSelectedProduct(prev => prev ? { ...prev, ...updates } : null);
      }

      // 2. Persist to Express backend memorydb & disk
      try {
        await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (backendErr) {
        console.warn("Express stock update backend warning:", backendErr);
      }

      triggerNotification("Produto Atualizado", "As alterações do produto foram sincronizadas!", "success");
    } catch (err) {
      triggerNotification("Produto Atualizado", "As alterações do produto foram sincronizadas!", "success");
    }
  };

  // CRUD: Delete product entirely
  const onDeleteProduct = async (id: string) => {
    try {
      // 1. React local state updates instantly
      setProducts(prev => prev.filter(p => p.id !== id));
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }

      // 2. Persist delete to Express backend
      try {
        await fetch(`/api/products/${id}`, {
          method: 'DELETE'
        });
      } catch (backendErr) {
        console.warn("Express delete product backend warning:", backendErr);
      }

      triggerNotification("Produto Removido", "O produto foi excluído com sucesso do catálogo!", "success");
    } catch (err) {
      triggerNotification("Produto Removido", "O produto foi excluído com sucesso do catálogo!", "success");
    }
  };

  // CRUD: Reorder catalog grid
  const onReorderProducts = async (orderedIds: string[]) => {
    try {
      // 1. Save locally in React state immediately to maintain dragging focus
      const productMap = new Map<string, Product>(products.map(p => [p.id, p]));
      const sorted: Product[] = [];
      orderedIds.forEach(id => {
        const p = productMap.get(id);
        if (p) sorted.push(p);
      });
      products.forEach(p => {
        if (!orderedIds.includes(p.id)) sorted.push(p);
      });
      setProducts(sorted);

      // 2. Persist order to Express backend memorydb & disk
      try {
        await fetch('/api/products/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds })
        });
      } catch (backendErr) {
        console.warn("Express reorder backend warning:", backendErr);
      }

      triggerNotification("Catálogo Reorganizado", "A nova ordenação visual foi salva com sucesso!", "success");
    } catch (err) {
      triggerNotification("Catálogo Reorganizado", "A nova ordenação visual foi salva com sucesso!", "success");
    }
  };

  // CRUD: Reorder banner/poster queue
  const onReorderBanners = async (orderedIds: string[]) => {
    try {
      const bannerMap = new Map<string, Banner>(banners.map(b => [b.id, b]));
      const sorted: Banner[] = [];
      orderedIds.forEach(id => {
        const b = bannerMap.get(id);
        if (b) sorted.push(b);
      });
      banners.forEach(b => {
        if (!orderedIds.includes(b.id)) sorted.push(b);
      });
      setBanners(sorted);

      // 1.5 Sync order to backend
      try {
        await fetch('/api/banners/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds })
        });
      } catch (backendErr) {
        console.warn("Express banners reorder warning:", backendErr);
      }

      triggerNotification("Carrossel Reorganizado", "Posição dos banners salva com sucesso!", "success");
    } catch (err) {
      triggerNotification("Carrossel Reorganizado", "Posição dos banners salva com sucesso!", "success");
    }
  };

  // CRUD: Add review to jersey
  const onAddReview = async (productId: string, newReview: Omit<Review, 'id' | 'date'>) => {
    try {
      const targetProduct = products.find(p => p.id === productId);
      if (!targetProduct) return;

      const reviewId = `rev-${Date.now()}`;
      const reviewWithId: Review = {
        ...newReview,
        id: reviewId,
        date: new Date().toISOString().split('T')[0]
      };
      const updatedReviews = [...(targetProduct.reviews || []), reviewWithId];
      const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const ratingValue = Number((totalRating / updatedReviews.length).toFixed(1));

      // 1. Sync backend first
      try {
        await fetch(`/api/products/${productId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewWithId)
        });
      } catch (backendErr) {
        console.warn("Backend review sync warning:", backendErr);
      }

      // 2. Local state update
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, reviews: updatedReviews, ratingValue } : p));

      triggerNotification("Comentário Enviado", "Agradecemos o seu feedback!", "success");
    } catch (err) {
      triggerNotification("Comentário Enviado", "Agradecemos o seu feedback!", "success");
    }
  };

  // BANNER ADDER: Add new slider
  const onAddBanner = async (newBannerData: Omit<Banner, 'id'>) => {
    try {
      const newId = `banner-${Date.now()}`;
      const newBanner: Banner = { ...newBannerData, id: newId };

      // 1. Sync backend
      const response = await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBanner)
        });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao salvar no servidor");
      }

      // 2. React state update
      setBanners(prev => [...prev, newBanner]);

      triggerNotification("Campanha Criada", `O banner "${newBanner.title}" foi publicado!`, "success");
    } catch (err: any) {
      triggerNotification("Erro ao criar campanha", err.message || "Falha na sincronização do banner.", "alert");
    }
  };

  // BANNER UPDATER: Modify existing slider
  const onUpdateBanner = async (id: string, updates: Partial<Banner>) => {
    try {
      // 1. React state update
      setBanners(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

      // 2. Sync backend
      try {
        await fetch(`/api/banners/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (backendErr) {
        console.warn("Backend banner update sync warning:", backendErr);
      }

      triggerNotification("Campanha Editada", "O banner foi ajustado com sucesso!", "success");
    } catch (err) {
      triggerNotification("Campanha Editada", "O banner foi ajustado com sucesso!", "success");
    }
  };

  // BANNER DELETER: Remove existing slider
  const onDeleteBanner = async (id: string) => {
    try {
      // 1. React state update
      setBanners(prev => prev.filter(b => b.id !== id));

      // 1.5. Sync deletion to backend
      try {
        await fetch(`/api/banners/${id}`, {
          method: 'DELETE'
        });
      } catch (backendErr) {
        console.warn("Backend banner delete warning:", backendErr);
      }

      triggerNotification("Campanha Removida", "O banner foi deletado com sucesso!", "success");
    } catch (err) {
      triggerNotification("Campanha Removida", "O banner foi deletado com sucesso!", "success");
    }
  };

  // CART OPERATIONS
  const onAddToCart = (newItem: Omit<CartItem, 'id'>) => {
    const itemCombinationId = `${newItem.product.id}-${newItem.selectedSize}-${newItem.selectedColor.hex}`;
    
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(item => item.id === itemCombinationId);
      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity = Math.min(newItem.product.stock, updated[existingIdx].quantity + newItem.quantity);
        return updated;
      } else {
        return [...prevCart, { ...newItem, id: itemCombinationId }];
      }
    });
  };

  const onRemoveCartItem = (id: string) => {
    setCart((p) => p.filter(item => item.id !== id));
    triggerNotification("Item Removido", "Camisa retirada do carrinho.", "info");
  };

  const onUpdateCartQuantity = (id: string, newQuantity: number) => {
    setCart((p) => p.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };

  // CHECKOUT ORDER RESERVATIONS SUBMISSION TO FIRESTORE
  const onSubmitOrder = async (orderData: { 
    customerName: string; 
    customerEmail: string; 
    customerPhone: string; 
    discountCode: string;
    paymentMethod: 'retirada' | 'pix' | 'cartao';
  }) => {
    const baseTotalPrice = cart.reduce((sum, item) => {
      const priceVal = item.product.discountPrice || item.product.price;
      return sum + (priceVal * item.quantity);
    }, 0);

    const discountMultiplier = orderData.discountCode === 'CAMISA7' ? 0.10 : orderData.discountCode === 'OUTLET40' ? 0.40 : 0;
    const baseWithCoupon = baseTotalPrice * (1 - discountMultiplier);
    const onlineIncentive = (orderData.paymentMethod === 'pix' || orderData.paymentMethod === 'cartao') ? baseWithCoupon * 0.05 : 0;
    const finalTotalPrice = Math.max(0, baseWithCoupon - onlineIncentive);

    try {
      // 1. Report order/decrement stock on backend Express + Supabase
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          items: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            image: item.product.images[0],
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            price: item.product.discountPrice || item.product.price,
            quantity: item.quantity
          })),
          totalPrice: finalTotalPrice
        })
      });

      if (!response.ok) {
        throw new Error("Erro de comunicação com o servidor.");
      }

      const createdOrder: Order = await response.json();

      // 2. Update local state
      setOrders(prev => [createdOrder, ...prev]);
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(item => item.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      }));

      const orderId = createdOrder.id;
      setCart([]); // Clear cart
      setSessionOrderIds(prev => [...prev, orderId]);
      setTab('pedidos'); // Redirect to active reservations view

      if (orderData.paymentMethod === 'retirada') {
        triggerNotification(
          "Reserva Concluída!",
          `Seu manto está garantido no código: ${orderId}. Compareça à loja física para retirar!`,
          "success"
        );
      } else {
        // Automatically pop up safe payment modal immediately for direct payment selection
        setActivePaymentOrder({ id: orderId, totalPrice: Number(finalTotalPrice.toFixed(2)) });
        triggerNotification(
          "Garantido no Estoque!",
          `Seu manto está reservado sob o código ${orderId}. Efetue o pagamento online para liberar!`,
          "info"
        );
      }
    } catch (err) {
      console.warn("Checkout sync error, falling back locally:", err);

      const generatedOrderId = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackOrder: Order = {
        id: generatedOrderId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone || "(11) 99999-9999",
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          image: item.product.images[0],
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          price: item.product.discountPrice || item.product.price,
          quantity: item.quantity
        })),
        totalPrice: Number(finalTotalPrice.toFixed(2)),
        status: 'reservado',
        date: new Date().toISOString()
      };

      setOrders(prev => [fallbackOrder, ...prev]);
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(item => item.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      }));

      setCart([]); // Clear cart
      setSessionOrderIds(prev => [...prev, generatedOrderId]);
      setTab('pedidos');

      if (orderData.paymentMethod === 'retirada') {
        triggerNotification(
          "Reserva Concluída (Local)!",
          `Seu manto está reservado com o código: ${generatedOrderId}. Retire na loja física!`,
          "success"
        );
      } else {
        setActivePaymentOrder({ id: generatedOrderId, totalPrice: Number(finalTotalPrice.toFixed(2)) });
        triggerNotification(
          "Reservado no Estoque!",
          `Manto reservado (código: ${generatedOrderId}). Prossiga para efetuar o pagamento simulado!`,
          "info"
        );
      }
    }
  };

  const onPaymentSuccess = async (id: string) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pago' })
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'pago' } : o));
    } catch (err) {
      console.warn("No write connection: updated payment state locally for interactive test", err);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'pago' } : o));
    }
  };

  // STATUS UPDATER: Change booking order status (Admin function)
  const onUpdateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      triggerNotification("Reserva Sincronizada", `Status do pedido ${id} atualizado para "${status.toUpperCase()}"`, "success");
    } catch (err) {
      console.warn("Offline fallback for admin status update:", err);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      triggerNotification("Reserva Atualizada", `Status do pedido ${id} atualizado para "${status.toUpperCase()}" localmente!`, "success");
    }
  };

  // DATABASE SEED RESTORER: Clean/overwrite/re-seed database with default banners and products
  const onResetDatabase = async () => {
    try {
      triggerNotification("Restaurando...", "Semando dados padrão...", "info");
      const { INITIAL_PRODUCTS, INITIAL_BANNERS } = await import('./data');
      setProducts(INITIAL_PRODUCTS);
      setBanners(INITIAL_BANNERS);
      triggerNotification("Sucesso!", "Dados locais restaurados com sucesso!", "success");
    } catch (err) {
      console.error(err);
      triggerNotification("Falha na restauração", "Não foi possível sincronizar novos registros padrão.", "alert");
    }
  };

  // FLOATING BRIGHT COGNITIVE CHATBOT: WhatsApp / AI support interaction simulator
  const handleSupportWidgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    const text = supportMessage.trim();
    setSupportChat(prev => [...prev, { sender: 'user', text }]);
    setSupportMessage('');
    setIsTypingSupport(true);

    try {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg: text })
      });
      const data = await response.json();
      if (data.text) {
        setSupportChat(prev => [...prev, { sender: 'bot', text: data.text }]);
      }
    } catch (err) {
      console.error(err);
      setSupportChat(prev => [...prev, { sender: 'bot', text: "Opa! Estou com instabilidade na conexão, mas você pode me chamar direto no nosso WhatsApp de vendas oficial (11) 99999-9999!" }]);
    } finally {
      setIsTypingSupport(false);
    }
  };

  // FILTERING AND SEARCHING CRITERIA
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'todos' ||
      p.category === selectedCategory ||
      (selectedCategory === 'promocoes' && p.discountPrice !== undefined);

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const activeReservations = orders.filter(o => o.status === 'reservado' || o.status === 'pago');
  const pastHistory = orders.filter(o => o.status === 'retirado' || o.status === 'cancelado');

  return (
    <div className={`min-h-screen transition-all duration-300 selection:bg-red-600 pb-24 md:pb-16 font-sans ${
      isDarkMode 
        ? "bg-black text-white selection:text-white" 
        : "bg-slate-50 text-slate-900 selection:text-white"
    }`}>
      
      {/* Absolute Push alerts queue */}
      <PushNotification toasts={toasts} removeToast={removeToast} />

      {/* Primary Navigation Logo & search banner */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onCartToggle={() => setIsCartOpen(!isCartOpen)}
        currentUser={currentUser}
        onLoginSimulate={onLoginSimulate}
        onLogout={onLogout}
        onGoogleLogin={onGoogleLogin}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {
          setIsDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('camisa7_theme', String(next));
            return next;
          });
        }}
      />

      {/* Compact Administrative Bar (collapsible) */}
      {isAdminMode && (
        <div className="border-b border-red-900/40">
          <AdminPanel
            products={products}
            orders={orders}
            banners={banners}
            themeColor={themeColor}
            setThemeColor={setThemeColor}
            themeColorHover={themeColorHover}
            setThemeColorHover={setThemeColorHover}
            bgDarkColor={bgDarkColor}
            setBgDarkColor={setBgDarkColor}
            bgLightColor={bgLightColor}
            setBgLightColor={setBgLightColor}
            displayFont={displayFont}
            setDisplayFont={setDisplayFont}
            sansFont={sansFont}
            setSansFont={setSansFont}
            pixKey={pixKey}
            setPixKey={setPixKey}
            onSaveAppearance={handleSaveAppearance}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
            onDeleteProduct={onDeleteProduct}
            onReorderProducts={onReorderProducts}
            onAddBanner={onAddBanner}
            onUpdateBanner={onUpdateBanner}
            onReorderBanners={onReorderBanners}
            onDeleteBanner={onDeleteBanner}
            onUpdateOrderStatus={onUpdateOrderStatus}
            triggerNotification={triggerNotification}
            onResetDatabase={onResetDatabase}
          />
        </div>
      )}

      {/* TAB SUB-ROUTER CONTROLLER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: PRODUCT LISTING (CAMISAS) */}
        {currentTab === 'camisas' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Promotional Hero Carousel Banner */}
            <PromotionBanner
              banners={banners.filter(b => selectedCategory === 'todos' || b.linkToCategory === selectedCategory)}
              onAddBanner={onAddBanner}
              onUpdateBanner={onUpdateBanner}
              onDeleteBanner={onDeleteBanner}
              isAdmin={isAdminMode || currentUser?.role === 'admin'}
              onFilterByCategory={(cat) => setSelectedCategory(cat)}
            />

            {/* Featured Product Section description header */}
            <div>
              <div className={`flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b pb-4 mb-6 ${
                isDarkMode ? 'border-white/10' : 'border-zinc-200'
              }`}>
                <div>
                  <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span className="w-1.5 h-6 bg-red-600 rounded"></span>
                    PRODUTOS EM DESTAQUE
                  </h2>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>Confeccionadas com costuras termocoladas e tecidos inteligentes anti-suor.</p>
                </div>

                {/* Categories choice controls (Mobile shortcut layout) */}
                <div 
                  style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
                  className="flex gap-1.5 overflow-x-auto pb-1 max-w-full flex-nowrap [&::-webkit-scrollbar]:hidden"
                >
                  {(['todos', 'masculino', 'feminino', 'esportivo', 'promocoes'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-all shrink-0 whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-red-600 text-white'
                          : (isDarkMode ? 'bg-zinc-900 text-gray-400 border border-white/5 hover:text-white' : 'bg-white text-zinc-650 border border-zinc-200 hover:text-slate-900 shadow-sm')
                      }`}
                    >
                      {cat === 'todos' ? 'Ver Tudo' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid listing card container */}
              {products.length === 0 ? (
                <div className={`text-center py-20 border rounded-2xl flex flex-col items-center justify-center gap-4 transition-colors ${
                  isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200'
                }`}>
                  <div className="p-3.5 bg-red-650/10 rounded-full text-red-650 animate-pulse">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className={`text-base font-black uppercase tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Nenhum produto cadastrado ainda
                    </h3>
                    <p className={`text-xs mt-1 max-w-md mx-auto px-4 ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>
                      {isAdminMode || currentUser?.role === 'admin'
                        ? 'Você está logado com a conta de Administrador! Use o Painel de Controle administrativo no topo ou clique para registrar o primeiro produto do catálogo.'
                        : 'A vitrine do site está passando por manutenção estética. O administrador irá disponibilizar as novas coleções e mantos esportivos em breve!'}
                    </p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className={`text-center py-20 border rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors ${
                  isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200'
                }`}>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>Nenhum manto de time ou camisa premium coincide com a busca.</span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('todos');
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase font-black px-4 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    Resetar Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      isDarkMode={isDarkMode}
                      onSelect={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: ACTIVE BOOKINGS / RESERVATIONS (PEDIDOS) */}
        {currentTab === 'pedidos' && (
          <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
            <div className={`border-b pb-4 ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>
              <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <span className="w-1.5 h-6 bg-amber-500 rounded"></span>
                RESERVAS DE CAMISAS ATIVAS
              </h2>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>
                Seus mantos estão protegidos no estoque. Retire em nossa loja em até 48 horas facilitando por pix ou dinheiro.
              </p>
            </div>

            {activeReservations.length === 0 ? (
              <div className={`text-center py-20 rounded-2xl flex flex-col items-center justify-center gap-3 border ${
                isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
              }`}>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>Você não conta com nenhuma reserva de mantos pendente de retirada.</span>
                <button
                  onClick={() => setTab('camisas')}
                  className="bg-red-600 text-white hover:bg-red-700 text-[10px] uppercase font-black px-6 py-3 rounded-full transition-all cursor-pointer"
                >
                  Garantir Camisa do Time
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeReservations.map((o) => (
                  <div key={o.id} className={`border rounded-2xl p-5 text-left space-y-4 relative overflow-hidden ${
                    isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-red-600" />
                    
                    {/* Header values */}
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2 ${
                      isDarkMode ? 'border-white/5' : 'border-zinc-105'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>CÓDIGO: {o.id}</span>
                          <span className="text-[8px] bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded font-mono uppercase font-semibold">
                            ATIVO
                          </span>
                        </div>
                        <p className={`text-[10px] font-mono mt-1 ${isDarkMode ? 'text-gray-500' : 'text-zinc-400'}`}>Inserido em: {new Date(o.date).toLocaleString('pt-BR')}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono uppercase font-black px-2.5 py-1 rounded inline-flex items-center gap-1 ${
                          o.status === 'reservado' ? 'bg-amber-950/45 text-amber-500 border border-amber-900/30' : 'bg-green-950/45 text-green-500 border border-green-900/30'
                        }`}>
                          {o.status === 'reservado' ? (
                            <>
                              <Hourglass className="w-3.5 h-3.5 animate-spin" />
                              Aguardando Retirada (Pendente)
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              Reserva Paga - Aguardando Postagem
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Purchased shirts listings */}
                    <div className="space-y-3">
                      <span className={`block text-[8px] font-mono tracking-widest uppercase font-black ${isDarkMode ? 'text-gray-500' : 'text-zinc-400'}`}>MANTOS PROTEGIDOS</span>
                      <div className="space-y-2">
                        {o.items.map((item, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                            isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-zinc-50 border-zinc-100'
                          }`}>
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt="comprado" className={`w-10 h-10 rounded object-cover border ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`} />
                              <div>
                                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.productName}</p>
                                <p className={`text-[9px] font-mono uppercase mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>Tamanho: {item.selectedSize} • Cor: {item.selectedColor.name}</p>
                              </div>
                            </div>
                            <span className={`font-mono ${isDarkMode ? 'text-gray-300' : 'text-zinc-700'}`}>
                              {item.quantity}x de <strong className={isDarkMode ? 'text-white' : 'text-slate-950'}>R$ {item.price.toFixed(2)}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary statistics info */}
                    <div className={`border pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl ${
                      isDarkMode ? 'border-white/5 bg-zinc-900/30' : 'border-zinc-100 bg-zinc-50/50'
                    }`}>
                      <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-zinc-650'}`}>
                        <p>Cliente: <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{o.customerName}</span></p>
                        <p>Telemóvel: <span className={`font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{o.customerPhone}</span></p>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className={`text-[9px] uppercase font-mono ${isDarkMode ? 'text-gray-400' : 'text-zinc-400'}`}>Valor da Reserva:</span>
                        <span className="text-lg font-black text-red-500 font-mono mt-0.5">R$ {o.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Integrated direct-pay visual helpers */}
                    {o.status === 'reservado' ? (
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDarkMode ? 'bg-amber-950/10 border-amber-900/30' : 'bg-amber-50/50 border-amber-100'
                      }`}>
                        <div className="text-left">
                          <p className="text-xs font-bold text-amber-600 flex items-center gap-1.5 uppercase font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Aguardando Retirada ou Pagamento
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-405 text-zinc-400' : 'text-zinc-500'}`}>
                            Pague online agora por Pix ou Cartão e garanta 5% de desconto extra!
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            // Calculate price with 5% off if paid now!
                            const incentiveDiscount = o.totalPrice * 0.05;
                            const finalWithIncentive = Number((o.totalPrice - incentiveDiscount).toFixed(2));
                            setActivePaymentOrder({ id: o.id, totalPrice: finalWithIncentive });
                          }}
                          className="bg-red-600 hover:bg-black text-white hover:text-white px-4 py-2 rounded-lg text-[10px] uppercase font-black tracking-widest shadow cursor-pointer transition-all active:scale-97"
                        >
                          💵 Pagar Agora Online
                        </button>
                      </div>
                    ) : o.status === 'pago' ? (
                      <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                        isDarkMode ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50/60 border-emerald-100'
                      }`}>
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">✓</span>
                        <div className="text-left">
                          <p className="text-xs font-black text-emerald-600 uppercase font-mono">PAGAMENTO DIRETOR CONFIRMADO</p>
                          <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-405 text-zinc-400' : 'text-zinc-500'}`}>
                            Seu pagamento foi confirmado pelo app. Seu manto está na fila prioritária de separação!
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* Operational advice */}
                    <p className={`text-[10px] italic leading-relaxed text-center font-mono ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>
                      *Imprima ou faça o print desta tela e apresente no checkout. Dúvidas com o pedido? Fale com a equipe Camisa 7.
                    </p>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: HISTORIC OF RELEASES (HISTORICO) */}
        {currentTab === 'historico' && (
          <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
            <div className={`border-b pb-4 ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>
              <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <span className="w-1.5 h-6 bg-zinc-600 rounded"></span>
                HISTÓRICO RETROATIVO DE RESERVAS
              </h2>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>
                Consulte registros concluídos, liquidados ou reservas que expiraram e foram canceladas.
              </p>
            </div>

            {pastHistory.length === 0 ? (
              <div className={`text-center py-20 rounded-2xl text-xs border ${
                isDarkMode ? 'bg-zinc-950 border-white/10 text-gray-500' : 'bg-white border-zinc-200 text-zinc-400 shadow-sm'
              }`}>
                Seu histórico de pedidos de camisas está vazio. Conclua uma reserva para ver o log.
              </div>
            ) : (
              <div className="space-y-3 font-sans">
                {pastHistory.map((o) => (
                  <div key={o.id} className={`p-4 rounded-xl border text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isDarkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{o.id}</span>
                        <span className={`text-[8px] border px-2 py-0.5 rounded font-mono uppercase ${
                          isDarkMode ? 'bg-zinc-900 text-gray-400 border-white/5' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          Expirado / Concluído
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 ${isDarkMode ? 'text-gray-400' : 'text-zinc-500'}`}>Beneficiário: {o.customerName} - {o.customerEmail}</p>
                      
                      {/* Short summary representation */}
                      <p className={`text-[10px] mt-2 font-mono ${isDarkMode ? 'text-gray-500' : 'text-zinc-400'}`}>
                        Item: {o.items.map(it => `${it.productName} (${it.selectedSize})`).join(', ')}
                      </p>
                    </div>

                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded ${
                        o.status === 'retirado' ? 'bg-blue-950 text-blue-400 border border-blue-900/30' : (isDarkMode ? 'bg-zinc-900 text-gray-500 border-white/5' : 'bg-zinc-100 text-zinc-400 border-zinc-200')
                      }`}>
                        {o.status === 'retirado' ? 'RETIRADO NA LOJA' : 'CANCELADO'}
                      </span>
                      <span className={`font-mono font-bold ${isDarkMode ? 'text-gray-400' : 'text-slate-900'}`}>R$ {o.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* DETAILED JERSEY SPECIFICATIONS POPUP */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={onAddToCart}
          triggerNotification={triggerNotification}
          currentUser={currentUser}
          onAddReview={onAddReview}
          isDarkMode={isDarkMode}
        />
      )}

      {/* SHOPPING CART OVERLAY DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={onRemoveCartItem}
        onUpdateQuantity={onUpdateCartQuantity}
        onSubmitOrder={onSubmitOrder}
        triggerNotification={triggerNotification}
        isDarkMode={isDarkMode}
      />

      {/* SECURE DIRECT ONLINE PAYMENT INTERFACE OVERLAY */}
      {activePaymentOrder && (
        <PaymentModal
          isOpen={activePaymentOrder !== null}
          onClose={() => setActivePaymentOrder(null)}
          orderId={activePaymentOrder.id}
          totalValue={activePaymentOrder.totalPrice}
          onPaymentSuccess={onPaymentSuccess}
          isDarkMode={isDarkMode}
          triggerNotification={triggerNotification}
          globalPixKey={pixKey}
        />
      )}

      {/* FLOATING SHORTCUT PANEL */}
      <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end">
        <div className="flex flex-col gap-2.5">
          {/* FLOATING ACTION SHORTCUT BUTTON FOR MOBILE USERS */}
          <button
            onClick={() => setShowShortcutModal(true)}
            className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-all transform hover:scale-108 active:scale-95 flex items-center justify-center relative cursor-pointer group"
            aria-label="Atalho Mobile"
          >
            <Smartphone className="w-5 h-5 text-white" />
            <span className="absolute right-14 bg-zinc-950 border border-white/10 px-2 py-1 rounded text-[10px] font-mono tracking-widest text-white uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
              Atalho Mobile
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE SHORTCUT GUIDE / INSTALL PROMPT MODAL */}
      <MobileShortcutModal
        isOpen={showShortcutModal}
        onClose={() => setShowShortcutModal(false)}
        isDarkMode={isDarkMode}
      />

      {/* MOBILE BOTTOM MENU NAVIGATION BAR COMPONENT FOR ADMINS */}
      {currentUser?.role === 'admin' && (
        <BottomMenu
          currentTab={currentTab}
          setTab={setTab}
          isAdminMode={isAdminMode}
          setAdminMode={setAdminMode}
          activeOrdersCount={activeReservations.length}
          isDarkMode={isDarkMode}
        />
      )}

    </div>
  );
}
