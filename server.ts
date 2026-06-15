import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { createClient, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

dotenv.config();

// Detect if running on Vercel (serverless) environment
const IS_VERCEL = !!process.env.VERCEL;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || IS_VERCEL;

// Removidas importações problemáticas do src para evitar erro de path no Vercel
// Definindo as interfaces localmente conforme planejado
interface Review {
  id: string;
  username: string;
  rating: number;
  comment: string;
  date: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  ratingValue: number;
  reviews: Review[];
}

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tag?: string;
  buttonText: string;
  linkToCategory?: string;
  orderIndex?: number;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: any[];
  totalPrice: number;
  status: 'reservado' | 'pago' | 'retirado' | 'cancelado';
  date: string;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// ===== SSE (Server-Sent Events) - Real-time Broadcasting =====
interface SSEClient {
  id: number;
  res: express.Response;
}

let sseClients: SSEClient[] = [];
let sseClientId = 0;

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (err) {
      // Client disconnected, will be cleaned up on next close
    }
  });
}

function addSSEClient(res: express.Response): number {
  const id = ++sseClientId;
  sseClients.push({ id, res });
  return id;
}

function removeSSEClient(id: number) {
  sseClients = sseClients.filter(c => c.id !== id);
}

// ===== Supabase Client Setup =====
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const HAS_SUPABASE = SUPABASE_URL.trim() !== "" && SUPABASE_KEY.trim() !== "";

let supabaseClient: any = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (HAS_SUPABASE) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
      console.log("[SUPABASE] Cliente inicializado com sucesso.");
      return supabaseClient;
    } catch (err) {
      console.error("[SUPABASE] Erro ao inicializar cliente Supabase:", err);
    }
  }
  return null;
}

// Persistent JSON Database Paths (fallback for local dev)
const PRODUCTS_FILE = path.resolve(process.cwd(), "products.json");
const BANNERS_FILE = path.resolve(process.cwd(), "banners.json");
const ORDERS_FILE = path.resolve(process.cwd(), "orders.json");

// Helper function to read from JSON file or write defaults
const loadData = <T>(filePath: string, fallback: T): T => {
  if (IS_VERCEL) return fallback; // Não tenta ler arquivos locais no Vercel para evitar crash
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn(`Could not read ${filePath}, using fallback.`);
  }
  if (!IS_VERCEL) {
    try { fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf-8"); } catch (e) {}
  }
  return fallback;
};

// Modificado para garantir salvamento mesmo em ambientes de desenvolvimento
const saveData = <T>(filePath: string, data: T) => {
  if (IS_VERCEL) return; // Silent return no Vercel
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
};const DEFAULT_PRODUCTS = [
  {
    id: 'prod-dino-moletom',
    name: 'Casaco Moletom Dinossauro',
    category: 'menino',
    description: 'Super divertido e confortável! Este casaco em moletom 100% algodão com capuz interativo possui escamas de dinossauro nas costas. Toque macio e quentinho, perfeito para as brincadeiras e aventuras em dias frios!',
    price: 139.9,
    discountPrice: 99.9,
    images: [
      'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['1-2a', '3-4a', '5-6a', '7-8a'],
    colors: [
      { name: 'Verde Dino', hex: '#4CAF50' },
      { name: 'Amarelo Sol', hex: '#FFEB3B' }
    ],
    stock: 12,
    ratingValue: 5,
    reviews: [
      { id: 'rev-1', username: 'Mariana Souza', rating: 5, comment: 'Meu filho amou as escamas nas costas, não quer tirar o casaco para nada!', date: '2026-06-05' }
    ]
  },
  {
    id: 'prod-vestido-floral',
    name: 'Vestido Girassóis Alegre',
    category: 'menina',
    description: 'Um vestido charmoso e cheio de vida! Feito em viscose premium respirável, com caimento soltinho e estampa alegre de girassóis. Perfeito para festinhas, passeios ou para um dia de sol cheio de energia.',
    price: 119.9,
    images: [
      'https://images.unsplash.com/photo-1604467731651-1d5b1c8a371c?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['2-3a', '4-5a', '6-8a', '9-10a'],
    colors: [
      { name: 'Amarelo Floral', hex: '#FFC107' },
      { name: 'Azul Celeste', hex: '#03A9F4' }
    ],
    stock: 8,
    ratingValue: 4.8,
    reviews: [
      { id: 'rev-2', username: 'Renata Lima', rating: 5, comment: 'Vestido lindo e o tecido é super fresquinho. Minha filha se sentiu uma princesa!', date: '2026-06-04' }
    ]
  },
  {
    id: 'prod-trico-romper',
    name: 'Romper Tricot Nuvenzinha',
    category: 'bebe',
    description: 'Aconchego puro para o seu bebê! Romper confeccionado em tricot antialérgico ultra macio, com desenho fofo de nuvem no peito. Ideal para deixar seu bebê confortável e super estiloso.',
    price: 99.9,
    discountPrice: 79.9,
    images: [
      'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['RN', '3-6m', '6-12m', '12-18m'],
    colors: [
      { name: 'Cinza Mesclado', hex: '#9E9E9E' },
      { name: 'Rosa Bebê', hex: '#F8BBD0' },
      { name: 'Azul Bebê', hex: '#B3E5FC' }
    ],
    stock: 15,
    ratingValue: 4.9,
    reviews: []
  },
  {
    id: 'prod-conjunto-jeans',
    name: 'Conjunto Denim Aventureiro',
    category: 'menino',
    description: 'Estilo clássico em version kids! Jaqueta jeans macia com elastano e calça combinando, super flexíveis para não prender os movimentos da criança. Muito resistente para brincar no parque!',
    price: 189.9,
    discountPrice: 129.9,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['2a', '4a', '6a', '8a', '10a'],
    colors: [
      { name: 'Azul Jeans', hex: '#3F51B5' }
    ],
    stock: 5,
    ratingValue: 4.7,
    reviews: [
      { id: 'rev-3', username: 'Julio Neto', rating: 4, comment: 'O jeans é bem maleável e não aperta. Meu neto adorou.', date: '2026-06-01' }
    ]
  },
  {
    id: 'prod-urso-pelucia',
    name: 'Ursinho Teddy Plush Super Macio',
    category: 'brinquedos',
    description: 'O melhor companheiro de soneca! Ursinho de pelúcia hipoalergênico, com enchimento super fofinho de microfibra. Detalhes bordados para total segurança do seu filho.',
    price: 79.9,
    images: [
      'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Marrom Caramelo', hex: '#8D6E63' },
      { name: 'Creme', hex: '#FFF9C4' }
    ],
    stock: 20,
    ratingValue: 5,
    reviews: [
      { id: 'rev-4', username: 'Aline P.', rating: 5, comment: 'Extremamente macio e seguro, minha bebê dorme com ele todos os dias.', date: '2026-06-03' }
    ]
  },
  {
    id: 'prod-macacao-leao',
    name: 'Macacão Pijama Leãozinho',
    category: 'bebe',
    description: 'Pijama macacão com capuz de leãozinho e orelhinhas em relevo! Confeccionado em soft térmico antialérgico, perfeito para manter o bebê quentinho a noite toda com muita fofura.',
    price: 109.9,
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['3-6m', '6-12m', '12-18m', '2a'],
    colors: [
      { name: 'Laranja Leão', hex: '#FF9800' }
    ],
    stock: 9,
    ratingValue: 4.9,
    reviews: []
  },
  {
    id: 'prod-jardineira-jeans',
    name: 'Jardineira Jeans Bebê Clássica',
    category: 'bebe',
    description: 'Jardineira em jeans leve e macio com alças reguláveis e botões laterais que facilitam o vestir. Acompanha camiseta branca de algodão de manga curta para completar o visual aventureiro.',
    price: 129.9,
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['6-12m', '12-18m', '2a', '3a'],
    colors: [
      { name: 'Azul Denim', hex: '#2C3E50' }
    ],
    stock: 14,
    ratingValue: 4.6,
    reviews: []
  },
  {
    id: 'prod-capa-chuva',
    name: 'Capa de Chuva Amarela Divertida',
    category: 'promocoes',
    description: 'Deixe os dias chuvosos cheios de alegria! Capa de chuva impermeável com capuz divertido, fechamento por botões de pressão e bolsos frontais. Estilo inconfundível para brincar na chuva com proteção.',
    price: 159.9,
    discountPrice: 119.9,
    images: [
      'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['2a', '4a', '6a', '8a'],
    colors: [
      { name: 'Amarelo Sol', hex: '#FFEB3B' }
    ],
    stock: 7,
    ratingValue: 5,
    reviews: []
  },
  {
    id: 'prod-sueter-mostarda',
    name: 'Suéter de Algodão Mostarda',
    category: 'menino',
    description: 'Suéter clássico tricotado em algodão macio de alta qualidade. Com gola redonda e punhos canelados, oferece um toque quentinho e elegante ideal para dias frescos ou passeios formais.',
    price: 98.9,
    images: [
      'https://images.unsplash.com/photo-1566516171-414c99a70659?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['2-3a', '4-5a', '6-7a', '8-9a'],
    colors: [
      { name: 'Mostarda', hex: '#E67E22' },
      { name: 'Cinza Escuro', hex: '#34495E' }
    ],
    stock: 11,
    ratingValue: 4.5,
    reviews: []
  },
  {
    id: 'prod-vestido-tule',
    name: 'Vestido Rosa Tule Princesa',
    category: 'menina',
    description: 'O vestido dos sonhos de toda menina! Com corpete confortável de algodão e saia volumosa em camadas de tule macio com brilhos discretos. Ideal para aniversários e festas especiais.',
    price: 149.9,
    images: [
      'https://images.unsplash.com/photo-1505371904114-1b359f1fa443?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['2a', '4a', '6a', '8a', '10a'],
    colors: [
      { name: 'Rosa Algodão', hex: '#FFB6C1' },
      { name: 'Branco Neve', hex: '#FFFFFF' }
    ],
    stock: 6,
    ratingValue: 4.9,
    reviews: []
  },
  {
    id: 'prod-sapatinho-couro',
    name: 'Sapatinho de Couro Soft Bebê',
    category: 'bebe',
    description: 'Conforto e cuidado para os primeiros passos! Confeccionado em couro ecológico extra macio com solado antiderrapante e elástico no tornozelo para ajuste perfeito, permitindo o desenvolvimento saudável dos pezinhos.',
    price: 89.9,
    images: [
      'https://images.unsplash.com/photo-1533512930330-4ac257c86793?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['15-16', '17-18', '19-20', '21-22'],
    colors: [
      { name: 'Caramelo', hex: '#D35400' },
      { name: 'Azul Marinho', hex: '#1B4F72' }
    ],
    stock: 16,
    ratingValue: 4.7,
    reviews: []
  },
  {
    id: 'prod-conjunto-verao',
    name: 'Conjunto Verão Shorts e Regata',
    category: 'promocoes',
    description: 'Leveza e frescor para os dias quentes. Conjunto composto por regata leve 100% algodão e shorts de sarja confortável com elástico ajustável na cintura. Ideal para brincar à vontade sob o sol.',
    price: 89.9,
    discountPrice: 69.9,
    images: [
      'https://images.unsplash.com/photo-1471286174243-e7a4db931751?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['1-2a', '3-4a', '5-6a'],
    colors: [
      { name: 'Coral Verão', hex: '#E74C3C' },
      { name: 'Verde Aqua', hex: '#1ABC9C' }
    ],
    stock: 18,
    ratingValue: 4.8,
    reviews: []
  },
  {
    id: 'prod-blocos-madeira',
    name: 'Blocos de Empilhar de Madeira',
    category: 'brinquedos',
    description: 'Estimule a criatividade e a coordenação motora! Conjunto de 30 blocos de madeira reflorestada com tintas atóxicas à base de água. Formas geométricas coloridas para construir pontes, castelos e o que a imaginação permitir.',
    price: 119.9,
    images: [
      'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Multicolorido', hex: '#9B59B6' }
    ],
    stock: 22,
    ratingValue: 5,
    reviews: []
  },
  {
    id: 'prod-formas-coloridas',
    name: 'Brinquedo de Encaixe Formas Coloridas',
    category: 'brinquedos',
    description: 'Desenvolva a percepção de cores e formas geométricas dos pequenos! Brinquedo de encaixe clássico com base de madeira e pinos para ordenar cilindros, triângulos e quadrados de forma divertida.',
    price: 74.9,
    images: [
      'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Arco-Íris', hex: '#E67E22' }
    ],
    stock: 15,
    ratingValue: 4.9,
    reviews: []
  },
  {
    id: 'prod-torre-aneis',
    name: 'Torre de Anéis de Madeira Waldorf',
    category: 'brinquedos',
    description: 'Brinquedo pedagógico clássico com anéis de empilhar de tamanhos diferentes, incentivando o raciocínio lógico e a coordenação. Acabamento super suave com ceras naturais de abelha.',
    price: 85.9,
    images: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Pastel Kids', hex: '#F5B041' }
    ],
    stock: 13,
    ratingValue: 4.8,
    reviews: []
  },
  {
    id: 'prod-macacao-listrado',
    name: 'Macacão de Soft Algodão Listrado',
    category: 'bebe',
    description: 'Feito em malha de algodão canelada super elástica e macia. Com fechamento em zíper duplo frontal completo para trocas de fralda rápidas e sem estresse, além de proteção de zíper no queixo.',
    price: 95.95,
    images: [
      'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['RN', '3-6m', '6-12m', '12-18m'],
    colors: [
      { name: 'Listrado Cinza/Branco', hex: '#BDC3C7' },
      { name: 'Listrado Azul/Branco', hex: '#3498DB' }
    ],
    stock: 19,
    ratingValue: 4.7,
    reviews: []
  },
  {
    id: 'prod-moletom-mescla',
    name: 'Conjunto Moletom Kids Mescla',
    category: 'menino',
    description: 'Conjunto confortável e estiloso com calça e blusa de moletom flanelado por dentro. Perfeito para manter a garotada quentinha no colégio, parquinho ou passeios de inverno.',
    price: 145,
    images: [
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['2a', '4a', '6a', '8a', '10a'],
    colors: [
      { name: 'Cinza Mescla', hex: '#7F8C8D' },
      { name: 'Preto Clássico', hex: '#2C3E50' }
    ],
    stock: 10,
    ratingValue: 4.6,
    reviews: []
  },
  {
    id: 'prod-cortavento-colorblock',
    name: 'Jaqueta Corta-Vento Colorblock',
    category: 'menina',
    description: 'Estilo moderno e proteção contra ventos e garoas. Jaqueta corta-vento super leve com forro de tela respirável, capuz e punhos com elástico. Design tricolor moderno com cores vibrantes.',
    price: 169.9,
    images: [
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['3-4a', '5-6a', '7-8a', '9-10a'],
    colors: [
      { name: 'Colorblock Rosa/Roxo', hex: '#8E44AD' }
    ],
    stock: 9,
    ratingValue: 4.9,
    reviews: []
  },
  {
    id: 'prod-bermuda-linho',
    name: 'Bermuda Linho Menino Slim',
    category: 'menino',
    description: 'Sofisticação sem perder a leveza! Bermuda em mescla de linho e algodão com ajuste interno de elástico na cintura. Ideal para casamentos, festas de fim de ano ou passeios em dias ensolarados.',
    price: 79.9,
    images: [
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['2a', '3a', '4a', '6a', '8a'],
    colors: [
      { name: 'Areia Linho', hex: '#F1C40F' },
      { name: 'Azul Bebê', hex: '#5DADE2' }
    ],
    stock: 14,
    ratingValue: 4.7,
    reviews: []
  },
  {
    id: 'prod-kit-babadores',
    name: 'Kit de Babadores Bandana Impermeáveis',
    category: 'bebe',
    description: 'Kit com 3 babadores em formato bandana super charmosos. Frente em algodão egípcio macio e verso com camada impermeável que protege a roupa do bebê contra babas e sujeiras.',
    price: 49.9,
    images: [
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Mix Neutro', hex: '#BDC3C7' }
    ],
    stock: 30,
    ratingValue: 5,
    reviews: []
  }
];

const DEFAULT_BANNERS = [
  {
    id: 'banner-1',
    title: 'CONFORTO E MAGIA PARA SEU BEBÊ',
    subtitle: 'Roupinhas de tricot e algodão antialérgico feitas com carinho e fofura para proteger a pele macia do seu pequeno.',
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&auto=format&fit=crop&q=80',
    tag: 'FESTIVAL DO BEBÊ 👶',
    buttonText: 'Ver Roupinhas de Bebê',
    linkToCategory: 'bebe',
    orderIndex: 0
  },
  {
    id: 'banner-2',
    title: 'DIVERSÃO SEM LIMITES!',
    subtitle: 'Conjuntos super resistentes, coloridos e confortáveis para o seu filho correr, pular e criar grandes aventuras.',
    image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=1200&auto=format&fit=crop&q=80',
    tag: 'BRINCAR COM ESTILO 🎈',
    buttonText: 'Ver Coleção Infantil',
    linkToCategory: 'todos',
    orderIndex: 1
  },
  {
    id: 'banner-3',
    title: 'AMIGOS DE PELÚCIA E MUITA FOFURA',
    subtitle: 'Brinquedos seguros, fofinhos e antialérgicos para acompanhar o crescimento e o sono saudável do seu pequeno.',
    image: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=1200&auto=format&fit=crop&q=80',
    tag: 'COMPANHEIROS DE SONECAS 🧸',
    buttonText: 'Explorar Brinquedos',
    linkToCategory: 'brinquedos',
    orderIndex: 2
  }
];

// Para a apresentação: Inicializar como arrays com dados padrão se não houver arquivo salvo ou se estiver vazio
let products: any[] = loadData(PRODUCTS_FILE, DEFAULT_PRODUCTS);
let banners: any[] = loadData(BANNERS_FILE, DEFAULT_BANNERS);
let orders: any[] = loadData(ORDERS_FILE, []);

if (products.length === 0) {
  products = [...DEFAULT_PRODUCTS];
  saveData(PRODUCTS_FILE, products);
}
if (banners.length === 0) {
  banners = [...DEFAULT_BANNERS];
  saveData(BANNERS_FILE, banners);
}

const APPEARANCE_FILE = path.resolve(process.cwd(), "config_appearance.json");
const DEFAULT_APPEARANCE = {
  primaryColor: "#ff4f79",
  primaryColorHover: "#e0355f",
  bgDark: "#121026",
  bgLight: "#fffdf9",
  displayFont: "Quicksand",
  sansFont: "Quicksand",
  pixKey: "barrosbruno.ti@gmail.com"
};

let appearanceConfig = loadData(APPEARANCE_FILE, { ...DEFAULT_APPEARANCE });

// Sincronização inicial com Supabase
// No Vercel, evitamos rodar isso no escopo global para não causar timeout na função
if (HAS_SUPABASE && !IS_PRODUCTION) syncFromSupabase();

/* ===== SUPABASE REALTIME SUBSCRIPTIONS ===== */
function setupRealtimeSubscriptions() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  
  // Desativa realtime no Vercel (não suportado em serverless functions)
  if (IS_VERCEL) return;

  console.log("[REALTIME] Configurando subscriptions Realtime do Supabase...");

  const tables = ["products", "banners", "orders", "appearance"];
  
  tables.forEach(table => {
    supabase
      .channel(`public:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[REALTIME] Mudança detectada em ${table}:`, payload.eventType);
          
          // Broadcast to all SSE clients
          broadcastSSE("db-change", {
            table,
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });

          // Also refresh the in-memory data
          refreshFromSupabase(table);
        }
      )
      .subscribe();
  });
}

async function refreshFromSupabase(table: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    if (table === "products") {
      const { data } = await supabase.from("products").select("*").order("order_index", { ascending: true });
      if (data) {
        products = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description || "",
          price: Number(p.price),
          discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
          images: Array.isArray(p.images) ? p.images : (typeof p.images === "string" && p.images ? JSON.parse(p.images) : []),
          sizes: Array.isArray(p.sizes) ? p.sizes : (typeof p.sizes === "string" && p.sizes ? JSON.parse(p.sizes) : []),
          colors: Array.isArray(p.colors) ? p.colors : (typeof p.colors === "string" && p.colors ? JSON.parse(p.colors) : []),
          stock: Number(p.stock),
          ratingValue: Number(p.rating_value || 5.0),
          reviews: Array.isArray(p.reviews) ? p.reviews : (typeof p.reviews === "string" ? JSON.parse(p.reviews) : [])
        }));
        if (!IS_VERCEL) saveData(PRODUCTS_FILE, products);
      }
    } else if (table === "banners") {
      const { data } = await supabase.from("banners").select("*").order("order_index", { ascending: true });
      if (data) {
        banners = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image: b.image,
          tag: b.tag || "NOVIDADE",
          buttonText: b.button_text || "Comprar Agora",
          linkToCategory: b.link_to_category || "masculino",
          orderIndex: b.order_index
        }));
        if (!IS_VERCEL) saveData(BANNERS_FILE, banners);
      }
    } else if (table === "orders") {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (data) {
        orders = data.map((o: any) => ({
          id: o.id,
          customerName: o.customer_name,
          customerEmail: o.customer_email,
          customerPhone: o.customer_phone || "(11) 99999-9999",
          items: Array.isArray(o.items) ? o.items : (typeof o.items === "string" && o.items ? JSON.parse(o.items) : []),
          totalPrice: Number(o.total_price),
          status: o.status,
          statusHistory: Array.isArray(o.status_history) ? o.status_history : (typeof o.status_history === "string" && o.status_history ? JSON.parse(o.status_history) : []),
          paymentMethod: o.payment_method,
          paymentId: o.payment_id,
          date: o.created_at,
          pixQrCode: o.pix_qr_code,
          pixCopiaCola: o.pix_copia_cola
        }));
        if (!IS_VERCEL) saveData(ORDERS_FILE, orders);
      }
    } else if (table === "appearance") {
      const { data } = await supabase.from("appearance").select("*").eq("id", "default").maybeSingle();
      if (data) {
        appearanceConfig = {
          primaryColor: data.primary_color,
          primaryColorHover: data.primary_color_hover,
          bgDark: data.bg_dark,
          bgLight: data.bg_light,
          displayFont: data.display_font,
          sansFont: data.sans_font,
          pixKey: data.pix_key
        };
        if (!IS_VERCEL) saveData(APPEARANCE_FILE, appearanceConfig);
      }
    }
  } catch (e) {
    console.error(`[REALTIME] Erro ao recarregar ${table} do Supabase:`, e);
  }
}

/* ===== SSE ENDPOINT (Real-time Events) ===== */
app.get("/api/realtime", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  // Send initial connected event
  res.write(`event: connected\ndata: {"message":"Conectado ao servidor em tempo real"}\n\n`);

  const clientId = addSSEClient(res);
  console.log(`[SSE] Cliente ${clientId} conectado. Total: ${sseClients.length}`);

  // Keep alive every 30 seconds
  const keepAlive = setInterval(() => {
    try {
      res.write(`event: ping\ndata: {}\n\n`);
    } catch {
      clearInterval(keepAlive);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeSSEClient(clientId);
    console.log(`[SSE] Cliente ${clientId} desconectado. Total: ${sseClients.length}`);
  });
});

/* ===== EXISTING API ROUTES (with real-time broadcasting) ===== */
async function syncFromSupabase() {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      console.log("[SUPABASE] Sincronizando dados na inicialização...");
      
      // 1. Products
      const { data: dbProds, error: pErr } = await supabase.from("products").select("*").order("order_index", { ascending: true });
      if (!pErr) {
        // Se pErr for nulo, sincronizamos o que vier (mesmo que seja array vazio)
        products = (dbProds || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description || "",
          price: Number(p.price),
          discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
          images: Array.isArray(p.images) ? p.images : (typeof p.images === "string" && p.images ? JSON.parse(p.images) : []),
          sizes: Array.isArray(p.sizes) ? p.sizes : (typeof p.sizes === "string" && p.sizes ? JSON.parse(p.sizes) : []),
          colors: Array.isArray(p.colors) ? p.colors : (typeof p.colors === "string" && p.colors ? JSON.parse(p.colors) : []),
          stock: Number(p.stock),
          ratingValue: Number(p.rating_value || 5.0),
          reviews: Array.isArray(p.reviews) ? p.reviews : (typeof p.reviews === "string" ? JSON.parse(p.reviews) : [])
        }));
        saveData(PRODUCTS_FILE, products);
        console.log(`[SUPABASE] ${products.length} produtos sincronizados.`);
      } else {
        console.error("[SUPABASE ERROR] Falha ao buscar produtos:", pErr.message);
      }

      // 2. Banners
      const { data: dbBanners, error: bErr } = await supabase.from("banners").select("*").order("order_index", { ascending: true });
      if (!bErr) {
        banners = (dbBanners || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          image: b.image,
          tag: b.tag || "NOVIDADE",
          buttonText: b.button_text || "Comprar Agora",
          linkToCategory: b.link_to_category || "masculino",
          orderIndex: b.order_index
        }));
        saveData(BANNERS_FILE, banners);
        console.log(`[SUPABASE] ${banners.length} banners sincronizados.`);
      } else {
        console.error("[SUPABASE ERROR] Falha ao buscar banners:", bErr.message);
      }

      // 3. Orders
      const { data: dbOrders, error: oErr } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!oErr) {
        orders = (dbOrders || []).map((o: any) => ({
          id: o.id,
          customerName: o.customer_name,
          customerEmail: o.customer_email,
          customerPhone: o.customer_phone || "(11) 99999-9999",
          items: Array.isArray(o.items) ? o.items : (typeof o.items === "string" && o.items ? JSON.parse(o.items) : []),
          totalPrice: Number(o.total_price),
          status: o.status,
          statusHistory: Array.isArray(o.status_history) ? o.status_history : (typeof o.status_history === "string" && o.status_history ? JSON.parse(o.status_history) : []),
          paymentMethod: o.payment_method,
          paymentId: o.payment_id,
          date: o.created_at,
          pixQrCode: o.pix_qr_code,
          pixCopiaCola: o.pix_copia_cola
        }));
        saveData(ORDERS_FILE, orders);
        console.log(`[SUPABASE] ${orders.length} pedidos sincronizados.`);
      } else {
        console.error("[SUPABASE ERROR] Falha ao buscar pedidos:", oErr.message);
      }

      // 4. Appearance
      const { data: dbApp, error: aErr } = await supabase.from("appearance").select("*").eq("id", "default").maybeSingle();
      if (!aErr && dbApp) {
        appearanceConfig = {
          primaryColor: dbApp.primary_color,
          primaryColorHover: dbApp.primary_color_hover,
          bgDark: dbApp.bg_dark,
          bgLight: dbApp.bg_light,
          displayFont: dbApp.display_font,
          sansFont: dbApp.sans_font,
          pixKey: dbApp.pix_key
        };
        saveData(APPEARANCE_FILE, appearanceConfig);
        console.log("[SUPABASE] Configurações de layout sincronizadas.");
      }
    } catch (e) {
      console.warn("[SUPABASE] Falha ao sincronizar dados na inicialização (as tabelas podem não existir ainda):", e);
    }
  }
};

const migrateToSupabase = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não está configurado. Cadastre as segredo SUPABASE_URL e SUPABASE_KEY no painel.");

  // Prepare products
  const productsToUpsert = products.map((p, idx) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    discount_price: p.discountPrice || null,
    images: p.images,
    sizes: p.sizes,
    colors: p.colors,
    stock: p.stock,
    rating_value: p.ratingValue,
    reviews: p.reviews,
    order_index: idx
  }));

  // Prepare banners
  const bannersToUpsert = banners.map((b, idx) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    image: b.image,
    tag: b.tag || "NOVIDADE",
    button_text: b.buttonText || "Comprar Agora",
    link_to_category: b.linkToCategory || "masculino",
    order_index: b.orderIndex !== undefined ? b.orderIndex : idx
  }));

  // Prepare orders
  const ordersToUpsert = orders.map(o => ({
    id: o.id,
    customer_name: o.customerName,
    customer_email: o.customerEmail,
    customer_phone: o.customerPhone,
    items: o.items,
    total_price: o.totalPrice,
    status: o.status,
    status_history: (o as any).statusHistory || [],
    payment_method: (o as any).paymentMethod || null,
    payment_id: (o as any).paymentId || null,
    created_at: o.date,
    pix_qr_code: (o as any).pixQrCode || null,
    pix_copia_cola: (o as any).pixCopiaCola || null
  }));

  // Prepare appearance
  const appearanceToUpsert = {
    id: "default",
    primary_color: appearanceConfig.primaryColor,
    primary_color_hover: appearanceConfig.primaryColorHover,
    bg_dark: appearanceConfig.bgDark,
    bg_light: appearanceConfig.bgLight,
    display_font: appearanceConfig.displayFont,
    sans_font: appearanceConfig.sansFont,
    pix_key: appearanceConfig.pixKey,
    updated_at: new Date().toISOString()
  };

  const results = {
    products: 0,
    banners: 0,
    orders: 0,
    appearance: false,
    errors: [] as string[]
  };

  // Upsert products
  if (productsToUpsert.length > 0) {
    const { error } = await supabase.from("products").upsert(productsToUpsert);
    if (error) results.errors.push(`Produtos: ${error.message}`);
    else results.products = productsToUpsert.length;
  }

  // Upsert banners
  if (bannersToUpsert.length > 0) {
    const { error } = await supabase.from("banners").upsert(bannersToUpsert);
    if (error) results.errors.push(`Banners: ${error.message}`);
    else results.banners = bannersToUpsert.length;
  }

  // Upsert orders
  if (ordersToUpsert.length > 0) {
    const { error } = await supabase.from("orders").upsert(ordersToUpsert);
    if (error) results.errors.push(`Pedidos: ${error.message}`);
    else results.orders = ordersToUpsert.length;
  }

  // Upsert appearance
  const { error: appErr } = await supabase.from("appearance").upsert(appearanceToUpsert);
  if (appErr) results.errors.push(`Aparência: ${appErr.message}`);
  else results.appearance = true;

  if (results.errors.length > 0) {
    throw new Error(`Erros na migração: ${results.errors.join(" | ")}`);
  }

  return results;
};

function getSupabaseSqlScript() {
  return `-- EXECUTE ESTE SCRIPT NO EDITOR SQL DO SUPABASE (SQL Editor -> New Query)

-- HABILITAR EXTENSÃO REALTIME
-- Acesse: Database > Replication e ative a replicação para as tabelas abaixo
-- Ou execute os comandos no SQL Editor:

-- 1. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  discount_price NUMERIC,
  images JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  stock INTEGER NOT NULL DEFAULT 0,
  rating_value NUMERIC DEFAULT 5.0,
  reviews JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0
);

-- 2. TABELA DE BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image TEXT NOT NULL,
  tag TEXT,
  button_text TEXT,
  link_to_category TEXT,
  order_index INTEGER DEFAULT 0
);

-- 3. TABELA DE PEDIDOS / RESERVAS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'reservado',
  status_history JSONB DEFAULT '[]'::jsonb,
  payment_method TEXT,
  payment_id TEXT,
  created_at TEXT,
  pix_qr_code TEXT,
  pix_copia_cola TEXT
);

-- 4. TABELA DE APARÊNCIA / CONFIGURAÇÃO
CREATE TABLE IF NOT EXISTS appearance (
  id TEXT PRIMARY KEY DEFAULT 'default',
  primary_color TEXT,
  primary_color_hover TEXT,
  bg_dark TEXT,
  bg_light TEXT,
  display_font TEXT,
  sans_font TEXT,
  pix_key TEXT,
  updated_at TEXT
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appearance ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre para facilitar o teste / desenvolvimento sem chaves privadas expostas
-- IMPORTANTE: Use DROP POLICY IF EXISTS para evitar erro se já existir
DROP POLICY IF EXISTS "Acesso publico products" ON products;
DROP POLICY IF EXISTS "Acesso publico banners" ON banners;
DROP POLICY IF EXISTS "Acesso publico orders" ON orders;
DROP POLICY IF EXISTS "Acesso publico appearance" ON appearance;

CREATE POLICY "Acesso publico products" ON products FOR ALL USING (true);
CREATE POLICY "Acesso publico banners" ON banners FOR ALL USING (true);
CREATE POLICY "Acesso publico orders" ON orders FOR ALL USING (true);
CREATE POLICY "Acesso publico appearance" ON appearance FOR ALL USING (true);
`;
}

// Initialize optional server-side Gemini client safely (fails-safe if key is missing)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

/* --- API REST - ROUTES --- */

// Simulated Auth API (Simulando autenticação JWT)
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  // High-fidelity validation: standard admin/customer credentials for presentation
  if ((email === "admin@minikids.com.br" || email === "admin@camisa7.com.br") && password === "minikids2026*") {
    return res.json({
      success: true,
      token: "simulated-jwt-header.payload-admin.signature",
      user: {
        id: "u-admin",
        name: "Administrador Mini Kids",
        email: email || "admin@minikids.com.br",
        role: "admin"
      }
    });
  }
  
  // Custom customer flow
  if (email && email.includes("@")) {
    const name = email.split("@")[0];
    return res.json({
      success: true,
      token: "simulated-jwt-header.payload-customer.signature",
      user: {
        id: "u-" + Math.floor(Math.random() * 1000),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email,
        role: "customer"
      }
    });
  }

  return res.status(401).json({ success: false, message: "E-mail ou senha inválidos." });
});

// Products API - Always fetch from Supabase in production (Vercel serverless)
app.get("/api/products", async (req, res) => {
  if (IS_PRODUCTION && HAS_SUPABASE) {
    // On Vercel, always reload from Supabase since memory is not shared between instances
    await syncFromSupabase();
  } else if (products.length === 0) {
    await syncFromSupabase();
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(products);
});

app.post("/api/products", async (req, res) => {
  const { name, category, description, price, discountPrice, images, sizes, colors, stock } = req.body;
  
  if (!name || !category || !price || !stock) {
    return res.status(400).json({ error: "Campos obrigatórios: Nome, categoria, preço e estoque." });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    category,
    description: description || "Camisa premium inspirada em alta performance urbana.",
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"],
    sizes: sizes || ["P", "M", "G", "GG"],
    colors: colors || [{ name: "Chumbo", hex: "#1C1C1E" }],
    stock: Number(stock),
    ratingValue: 5.0,
    reviews: []
  };

  // 1. Try to sync to Supabase first
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      // Sincroniza catálogo completo atualizado com o novo item temporariamente no início
      const rows = [newProduct, ...products].map((p, idx) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        price: p.price,
        discount_price: p.discountPrice || null,
        images: p.images,
        sizes: p.sizes,
        colors: p.colors,
        stock: p.stock,
        rating_value: p.ratingValue,
        reviews: p.reviews,
        order_index: idx
      }));
      const { error: upsertErr1 } = await supabase.from("products").upsert(rows);
      if (upsertErr1) {
        console.error("[SUPABASE ERROR] Erro ao sincronizar catálogo:", upsertErr1.message);
        return res.status(500).json({ error: "Erro ao sincronizar catálogo de produtos no Supabase: " + upsertErr1.message });
      }

      // IMPORTANTE: Upsert apenas do NOVO produto, não do array inteiro.
      // Em serverless, o array local pode estar incompleto.
      const { error: upsertErr2 } = await supabase.from("products").upsert({
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        description: newProduct.description,
        price: newProduct.price,
        discount_price: newProduct.discountPrice || null,
        images: newProduct.images,
        sizes: newProduct.sizes,
        colors: newProduct.colors,
        stock: newProduct.stock,
        rating_value: newProduct.ratingValue,
        reviews: newProduct.reviews,
        order_index: 0 // Novo item no topo
      });
      if (upsertErr2) {
        console.error("[SUPABASE ERROR] Erro ao sincronizar novo produto:", upsertErr2.message);
        return res.status(500).json({ error: "Erro ao salvar o produto no Supabase: " + upsertErr2.message });
      }
      console.log(`[SUPABASE] Produto ${newProduct.id} persistido com sucesso.`);
    }
  } catch (err: any) {
    console.error("[SUPABASE EXCEPTION] Erro ao sincronizar novo produto:", err);
    return res.status(500).json({ error: "Erro inesperado ao sincronizar produto: " + err.message });
  }

  // 2. Only if Supabase succeeds, commit to local memory & files
  products.unshift(newProduct);
  saveData(PRODUCTS_FILE, products);

  res.status(201).json(newProduct);
});

// Reorder products array (Admin drag-and-drop action)
app.post("/api/products/reorder", (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: "Parâmetro 'orderedIds' deve ser um array." });
  }

  const productMap = new Map(products.map(p => [p.id, p]));
  const reordered: Product[] = [];

  for (const id of orderedIds) {
    const prod = productMap.get(id);
    if (prod) {
      reordered.push(prod);
      productMap.delete(id);
    }
  }

  // Append any remaining products that weren't in orderedIds
  for (const prod of productMap.values()) {
    reordered.push(prod);
  }

  products = reordered;
  saveData(PRODUCTS_FILE, products);

  // Sync reorder to Supabase
  const syncToSupabase = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const rows = products.map((p, idx) => ({ id: p.id, order_index: idx }));
        await supabase.from("products").upsert(rows);
        console.log("[SUPABASE] Nova ordenação de produtos reordenada em lote.");
      }
    } catch (err) {
      console.warn("[SUPABASE] Erro ao sincronizar nova ordenação de produtos:", err);
    }
  };
  syncToSupabase();

  res.json(products);
});

// Update Product Stock or Details (Admin action)
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, category, description, price, discountPrice, images, sizes, colors, stock } = req.body;
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: "Produto não encontrado." });
  }

  const updatedProduct = { ...products[productIndex] };
  if (name !== undefined) updatedProduct.name = name;
  if (category !== undefined) updatedProduct.category = category;
  if (description !== undefined) updatedProduct.description = description;
  if (price !== undefined) updatedProduct.price = Number(price);
  if (discountPrice !== undefined) updatedProduct.discountPrice = discountPrice ? Number(discountPrice) : undefined;
  if (images !== undefined) updatedProduct.images = images;
  if (sizes !== undefined) updatedProduct.sizes = sizes;
  if (colors !== undefined) updatedProduct.colors = colors;
  if (stock !== undefined) updatedProduct.stock = Number(stock);

  products[productIndex] = updatedProduct;
  saveData(PRODUCTS_FILE, products);

  // Sync edit to Supabase
  const syncToSupabase = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from("products").update({
          name: updatedProduct.name,
          category: updatedProduct.category,
          description: updatedProduct.description,
          price: updatedProduct.price,
          discount_price: updatedProduct.discountPrice || null,
          images: updatedProduct.images,
          sizes: updatedProduct.sizes,
          colors: updatedProduct.colors,
          stock: updatedProduct.stock
        }).eq("id", id);
        console.log(`[SUPABASE] Produto ${id} editado sincronizado.`);
      }
    } catch (err) {
      console.warn("[SUPABASE] Erro ao sincronizar edição do produto:", err);
    }
  };
  syncToSupabase();

  res.json(updatedProduct);
});

// Delete Product entirely (Admin action)
app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = products.length;
  products = products.filter(p => p.id !== id);
  if (products.length === initialLength) {
    return res.status(404).json({ error: "Produto não encontrado para excluir." });
  }
  saveData(PRODUCTS_FILE, products);

  // Sync deletion to Supabase
  const syncToSupabase = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from("products").delete().eq("id", id);
        console.log(`[SUPABASE] Produto ${id} excluído de forma sincronizada.`);
      }
    } catch (err) {
      console.warn("[SUPABASE] Erro ao sincronizar remoção do produto:", err);
    }
  };
  syncToSupabase();

  res.json({ success: true, message: "Produto excluído com sucesso do catálogo." });
});

// Post review (Customer action)
app.post("/api/products/:id/review", (req, res) => {
  const { id } = req.params;
  const { username, rating, comment } = req.body;
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(304).json({ error: "Produto não encontrado." });
  }

  if (!rating || !username) {
    return res.status(400).json({ error: "Nome de usuário e nota são obrigatórios." });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    username,
    rating: Number(rating),
    comment: comment || "",
    date: new Date().toISOString().split("T")[0]
  };

  const product = products[productIndex];
  product.reviews.unshift(newReview);
  
  // Recalculating average rating
  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.ratingValue = Number((totalRating / product.reviews.length).toFixed(1));

  saveData(PRODUCTS_FILE, products);

  // Sync comments to Supabase
  const syncToSupabase = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from("products").update({
          rating_value: product.ratingValue,
          reviews: product.reviews
        }).eq("id", id);
        console.log(`[SUPABASE] Novo comentário para o produto ${id} sincronizado.`);
      }
    } catch (err) {
      console.warn("[SUPABASE] Erro ao sincronizar comentário:", err);
    }
  };
  syncToSupabase();

  res.status(201).json({ product, review: newReview });
});

// Banners API
app.get("/api/banners", async (req, res) => {
  if (banners.length === 0) {
    await syncFromSupabase();
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(banners);
});

app.post("/api/banners", async (req, res) => {
  const { title, subtitle, image, tag, buttonText, linkToCategory } = req.body;

  if (!title || !subtitle || !image) {
    return res.status(400).json({ error: "Título, subtítulo e imagem são necessários." });
  }

  const newBanner: Banner = {
    id: `banner-${Date.now()}`,
    title,
    subtitle,
    image,
    tag: tag || "NOVIDADE",
    buttonText: buttonText || "Comprar Agora",
    linkToCategory: linkToCategory || "masculino",
    orderIndex: banners.length
  };

  // 1. Try to sync to Supabase first
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error: upsertErr } = await supabase.from("banners").upsert({
        id: newBanner.id,
        title: newBanner.title,
        subtitle: newBanner.subtitle,
        image: newBanner.image,
        tag: newBanner.tag,
        button_text: newBanner.buttonText,
        link_to_category: newBanner.linkToCategory,
        order_index: newBanner.orderIndex
      });
      if (upsertErr) {
        console.error("[SUPABASE ERROR] Erro ao sincronizar novo banner:", upsertErr.message);
        return res.status(500).json({ error: "Erro ao salvar o banner no Supabase: " + upsertErr.message });
      }
    }
  } catch (err: any) {
    console.error("[SUPABASE EXCEPTION] Erro ao sincronizar novo banner:", err);
    return res.status(500).json({ error: "Erro inesperado ao sincronizar banner: " + err.message });
  }

  // 2. Only if Supabase succeeds, commit to local memory & files
  banners.push(newBanner);
  saveData(BANNERS_FILE, banners);

  res.status(201).json(newBanner);
});

app.put("/api/banners/:id", (req, res) => {
  const { id } = req.params;
  const { title, subtitle, image, tag, buttonText, linkToCategory } = req.body;
  const index = banners.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Banner não encontrado." });
  }

  const updatedBanner = { ...banners[index] };
  if (title !== undefined) updatedBanner.title = title;
  if (subtitle !== undefined) updatedBanner.subtitle = subtitle;
  if (image !== undefined) updatedBanner.image = image;
  if (tag !== undefined) updatedBanner.tag = tag;
  if (buttonText !== undefined) updatedBanner.buttonText = buttonText;
  if (linkToCategory !== undefined) updatedBanner.linkToCategory = linkToCategory;

  banners[index] = updatedBanner;
  saveData(BANNERS_FILE, banners);

  // Sync edit to Supabase
  const syncToSupabase = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from("banners").update({
          title: updatedBanner.title,
          subtitle: updatedBanner.subtitle,
          image: updatedBanner.image,
          tag: updatedBanner.tag,
          button_text: updatedBanner.buttonText,
          link_to_category: updatedBanner.linkToCategory
        }).eq("id", id);
        console.log(`[SUPABASE] Banner ${id} editado de forma sincronizada.`);
      }
    } catch (err) {
      console.warn("[SUPABASE] Erro ao sincronizar edição do banner:", err);
    }
  };
  syncToSupabase();

  res.json(updatedBanner);
});

// Delete Banner (Admin action)
app.delete("/api/banners/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = banners.length;
  banners = banners.filter(b => b.id !== id);
  if (banners.length === initialLength) {
    return res.status(404).json({ error: "Banner não encontrado para excluir." });
  }
  saveData(BANNERS_FILE, banners);

  // Sync deletion to Supabase
  const syncToSupabase = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from("banners").delete().eq("id", id);
        console.log(`[SUPABASE] Banner ${id} removido de forma sincronizada.`);
      }
    } catch (err) {
      console.warn("[SUPABASE] Erro ao sincronizar remoção de banner:", err);
    }
  };
  syncToSupabase();

  res.json({ success: true, message: "Banner excluído com sucesso do catálogo." });
});

// Reorder banners array (Admin action)
app.post("/api/banners/reorder", (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: "Parâmetro 'orderedIds' deve ser um array." });
  }

  const bannerMap = new Map(banners.map(b => [b.id, b]));
  const reordered: Banner[] = [];

  for (const id of orderedIds) {
    const b = bannerMap.get(id);
    if (b) {
      reordered.push(b);
      bannerMap.delete(id);
    }
  }

  // Append any remaining banners that weren't in orderedIds
  for (const b of bannerMap.values()) {
    reordered.push(b);
  }

  banners = reordered;
  saveData(BANNERS_FILE, banners);

  // Sync to Supabase
  const syncToSupabase = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const rows = banners.map((b, idx) => ({ id: b.id, order_index: idx }));
        await supabase.from("banners").upsert(rows);
        console.log("[SUPABASE] Nova ordenação de banners reordenada em lote.");
      }
    } catch (err) {
      console.warn("[SUPABASE] Erro ao sincronizar nova ordenação de banners:", err);
    }
  };
  syncToSupabase();

  res.json(banners);
});

// Appearance Config API
app.get("/api/config/appearance", async (req, res) => {
  try {
    if (HAS_SUPABASE) {
      await syncFromSupabase(); 
    }
  } catch (err) {
    console.error("Erro ao sincronizar aparência do Supabase:", err);
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(appearanceConfig);
});

app.post("/api/config/appearance", async (req, res) => {
  const newConfig = req.body;
  if (!newConfig) {
    return res.status(400).json({ error: "Dados inválidos para atualizar aparência." });
  }

  appearanceConfig = { ...appearanceConfig, ...newConfig };
  saveData(APPEARANCE_FILE, appearanceConfig);

  // CRITICAL: Aguardar a gravação da aparência
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from("appearance").upsert({
        id: "default",
        primary_color: appearanceConfig.primaryColor,
        primary_color_hover: appearanceConfig.primaryColorHover,
        bg_dark: appearanceConfig.bgDark,
        bg_light: appearanceConfig.bgLight,
        display_font: appearanceConfig.displayFont,
        sans_font: appearanceConfig.sansFont,
        pix_key: appearanceConfig.pixKey,
        updated_at: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn("[SUPABASE] Erro ao sincronizar aparência:", err);
  }

  res.json(appearanceConfig);
});

// Supabase Status check Endpoint
app.get("/api/config/supabase-status", async (req, res) => {
  const supabase = getSupabaseClient();
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const hasKeys = url.trim() !== "" && key.trim() !== "";

  if (!hasKeys) {
    return res.json({
      configured: false,
      url: "",
      tables: { products: false, banners: false, orders: false, appearance: false },
      sqlScript: getSupabaseSqlScript()
    });
  }

  const tables = {
    products: false,
    banners: false,
    orders: false,
    appearance: false
  };

  let connected = false;
  if (supabase) {
    try {
      // Ping tables
      const { error: prodErr } = await supabase.from("products").select("id").limit(1);
      tables.products = !prodErr || (prodErr.code !== undefined && prodErr.code !== "P0001" && prodErr.code !== "42P01" && prodErr.code !== "42703");

      const { error: banErr } = await supabase.from("banners").select("id").limit(1);
      tables.banners = !banErr || (banErr.code !== undefined && banErr.code !== "P0001" && banErr.code !== "42P01" && banErr.code !== "42703");

      const { error: ordErr } = await supabase.from("orders").select("id").limit(1);
      tables.orders = !ordErr || (ordErr.code !== undefined && ordErr.code !== "P0001" && ordErr.code !== "42P01" && ordErr.code !== "42703");

      const { error: appErr } = await supabase.from("appearance").select("id").limit(1);
      tables.appearance = !appErr || (appErr.code !== undefined && appErr.code !== "P0001" && appErr.code !== "42P01" && appErr.code !== "42703");

      connected = !prodErr || prodErr.code !== undefined;
    } catch (err) {
      console.warn("[SUPABASE STATUS] Falha ao verificar tabelas:", err);
    }
  }

  res.json({
    configured: true,
    connected,
    url: url.replace(/(https?:\/\/)(.*)/, "$1..."), // mask url for privacy
    tables,
    allTablesExist: tables.products && tables.banners && tables.orders && tables.appearance,
    sqlScript: getSupabaseSqlScript()
  });
});

// Supabase Trigger Migration Endpoint
app.post("/api/config/supabase-migrate", async (req, res) => {
  try {
    const results = await migrateToSupabase();
    res.json({
      success: true,
      results
    });
  } catch (error: any) {
    console.error("[SUPABASE MIGRATE] Falha:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro desconhecido durante a migração."
    });
  }
});

// Orders API (Reservations)
app.get("/api/orders", async (req, res) => {
  if (orders.length === 0) {
    await syncFromSupabase();
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.json(orders);
});

app.post("/api/orders", async (req, res) => {
  const { customerName, customerEmail, customerPhone, items, totalPrice } = req.body;

  if (!customerName || !customerEmail || !items || items.length === 0) {
    return res.status(400).json({ error: "Nome, E-mail e itens do carrinho são obrigatórios para a reserva." });
  }

  // Deduct stock for each item ordered
  for (const item of items) {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      if (prod.stock < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente para a camisa: ${prod.name}` });
      }
      prod.stock -= item.quantity;
    }
  }

  const newOrder: Order = {
    id: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName,
    customerEmail,
    customerPhone: customerPhone || "(11) 99999-9999",
    items,
    totalPrice: Number(totalPrice),
    status: 'reservado',
    date: new Date().toISOString()
  };

  // 1. Sync the order and product stock updates to Supabase first
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      // Safe write order to Supabase
      const { error: ordErr } = await supabase.from("orders").insert({
        id: newOrder.id,
        customer_name: newOrder.customerName,
        customer_email: newOrder.customerEmail,
        customer_phone: newOrder.customerPhone,
        items: newOrder.items,
        total_price: newOrder.totalPrice,
        status: newOrder.status,
        status_history: [],
        created_at: newOrder.date
      });
      if (ordErr) {
        console.error("[SUPABASE ERROR] Erro ao sincronizar pedido:", ordErr.message);
        // revert local stock deduction if failed
        for (const item of items) {
          const prod = products.find(p => p.id === item.productId);
          if (prod) prod.stock += item.quantity;
        }
        return res.status(500).json({ error: "Erro ao criar pedido no Supabase: " + ordErr.message });
      }

      // Sync individual product stocks in Supabase
      for (const item of items) {
        const prodUpdated = products.find(p => p.id === item.productId);
        if (prodUpdated) {
          const { error: prodErr } = await supabase.from("products").update({
            stock: prodUpdated.stock
          }).eq("id", prodUpdated.id);
          if (prodErr) {
            console.error("[SUPABASE ERROR] Erro ao atualizar estoque no Supabase:", prodErr.message);
          }
        }
      }
    }
  } catch (err: any) {
    console.error("[SUPABASE EXCEPTION] Erro ao criar pedido:", err);
    // revert local stock
    for (const item of items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) prod.stock += item.quantity;
    }
    return res.status(500).json({ error: "Erro inesperado ao criar pedido: " + err.message });
  }

  // 2. Only on success, commit to local memory and files
  orders.unshift(newOrder);
  saveData(ORDERS_FILE, orders);
  saveData(PRODUCTS_FILE, products);

  res.status(201).json(newOrder);
});

// Helper function to update an order in both local memorydb and Supabase
const updateOrderInDb = async (orderId: string, status: 'reservado' | 'pago' | 'retirado' | 'cancelado') => {
  // 1. Update in local memory and JSON file
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].status = status;
    saveData(ORDERS_FILE, orders);
    console.log(`[LOCAL DB] Pedido ${orderId} atualizado com sucesso para status: ${status}`);
  }

  // 2. Update in Supabase if connected
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) console.warn("[SUPABASE] Erro ao sincronizar status do pedido:", error.message);
      else console.log(`[SUPABASE] Status do pedido ${orderId} sincronizado para ${status}`);
    }
  } catch (err) {
    console.warn("[SUPABASE] Falha ao sincronizar status do pedido:", err);
  }
};

// Admin change order status
app.put("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orderIndex = orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Pedido não encontrado." });
  }

  await updateOrderInDb(id, status);
  res.json({ ...orders[orderIndex], status });
});

/* --- PIX PAYLOAD GENERATOR UTILITIES --- */
function formatPixKey(key: string): string {
  let cleanKey = key.trim();
  
  // If it's an email, keep as is
  if (cleanKey.includes('@')) {
    return cleanKey.toLowerCase();
  }
  
  // If it is a UUID (Chave Aleatória), keep as is
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleanKey);
  if (isUuid) {
    return cleanKey.toLowerCase();
  }

  // Remove non-alphanumeric characters, but track if it originally has +
  const hasPlus = cleanKey.startsWith('+');
  const rawDigits = cleanKey.replace(/\D/g, '');

  if (!rawDigits) {
    return cleanKey;
  }

  // Check if it looks like CPF (11 digits) or CNPJ (14 digits)
  if (rawDigits.length === 11) {
    // Basic CPF validation check to distinguish from cellphone
    const isCpfValid = (cpf: string) => {
      let sum = 0;
      let remainder;
      if (cpf === "00000000000" || cpf === "11111111111" || cpf === "22222222222" || 
          cpf === "33333333333" || cpf === "44444444444" || cpf === "55555555555" || 
          cpf === "66666666666" || cpf === "77777777777" || cpf === "88888888888" || 
          cpf === "99999999999") return false;
      for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
      remainder = (sum * 10) % 11;
      if ((remainder === 10) || (remainder === 11)) remainder = 0;
      if (remainder !== parseInt(cpf.substring(9, 10))) return false;
      sum = 0;
      for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
      remainder = (sum * 10) % 11;
      if ((remainder === 10) || (remainder === 11)) remainder = 0;
      if (remainder !== parseInt(cpf.substring(10, 11))) return false;
      return true;
    };

    if (isCpfValid(rawDigits)) {
      return rawDigits;
    }

    // It's 11 digits, but not a valid CPF -> treat as cellphone
    const ddd = parseInt(rawDigits.substring(0, 2), 10);
    if (ddd >= 11 && ddd <= 99) {
      return `+55${rawDigits}`;
    }
  }

  if (rawDigits.length === 14) {
    return rawDigits;
  }

  // Cellphones with 55 (12 or 13 digits)
  if ((rawDigits.length === 12 || rawDigits.length === 13) && rawDigits.startsWith('55')) {
    return `+${rawDigits}`;
  }

  // Cellphones with DDD and no 55 or + (10 or 11 digits)
  if (rawDigits.length === 10 || rawDigits.length === 11) {
    const ddd = parseInt(rawDigits.substring(0, 2), 10);
    if (ddd >= 11 && ddd <= 99) {
      return `+55${rawDigits}`;
    }
  }

  if (hasPlus) {
    return `+${rawDigits}`;
  }

  return rawDigits || cleanKey;
}

function calculateCRC16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    const code = payload.charCodeAt(i);
    crc ^= (code << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generatePixPayload(key: string, name: string, city: string, amount: number, txid: string): string {
  const formattedKey = formatPixKey(key);

  const emv = (tag: string, value: string): string => {
    const len = value.length.toString().padStart(2, '0');
    return `${tag}${len}${value}`;
  };

  const gui = emv('00', 'br.gov.bcb.pix');
  const keyTag = emv('01', formattedKey);
  const merchantAccountInfo = emv('26', `${gui}${keyTag}`);

  let payload = '';
  payload += emv('00', '01'); // Payload Format Indicator
  payload += merchantAccountInfo;
  payload += emv('52', '0000'); // Merchant Category Code
  payload += emv('53', '986');  // Currency BRL
  
  if (amount > 0) {
    payload += emv('54', amount.toFixed(2)); // Transaction Amount
  }
  
  payload += emv('58', 'BR'); // Country Code
  payload += emv('59', name.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()); // Merchant Name
  payload += emv('60', city.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()); // Merchant City
  
  // BACEN rules for Static Pix require txid to be '***' to working smoothly on all banks
  const additionalData = emv('62', emv('05', '***'));
  payload += additionalData;
  payload += '6304';
  
  const crc = calculateCRC16(payload);
  return `${payload}${crc}`;
}

/* --- MERCADO PAGO INTEGRATIONS --- */

// Endpoint 0: Safe public credentials config retrieval at runtime
app.get("/api/config", (req, res) => {
  const publicKey = process.env.VITE_MERCADO_PAGO_PUBLIC_KEY || process.env.MERCADO_PAGO_PUBLIC_KEY || "";
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
  const isReal = !!(token && token !== "YOUR_MERCADO_PAGO_ACCESS_TOKEN" && token.trim() !== "");
  
  res.json({
    mercadoPagoPublicKey: publicKey || "TEST-efd0b3a3-7640-410a-b3ff-2acbeb555555",
    isProduction: isReal
  });
});

// Endpoint: Verify payment status directly with Mercado Pago (extremely robust fallback!)
app.post("/api/payment/verify-status", async (req, res) => {
  const { paymentId, orderId, customAccessToken } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "Parâmetro 'orderId' é obrigatório." });
  }

  // Check if order is already marked as paid locally
  const order = orders.find(o => o.id === orderId);
  if (order && order.status === 'pago') {
    return res.json({ success: true, status: 'approved', message: "Excelente! Pagamento já aprovado e registrado anteriomente!" });
  }

  const mpToken = customAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.ME;
  const isSimulated = !mpToken || mpToken === "YOUR_MERCADO_PAGO_ACCESS_TOKEN" || mpToken.trim() === "";

  if (isSimulated || !paymentId || paymentId.startsWith("mp-sim-")) {
    return res.json({ 
      success: false, 
      status: 'pending', 
      message: "Modo de simulação ativo: Por favor, clique no botão 'Aprovar Pagamento (Simular Webhook)'." 
    });
  }

  try {
    console.log(`[VERIFY STATUS] Consultando status de pagamento ${paymentId} diretamente no Mercado Pago.`);
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${mpToken}`
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: "Erro ao consultar a API do Mercado Pago." });
    }

    const data = await response.json();
    const status = data.status; // 'approved', 'rejected', 'pending', etc.
    
    console.log(`[VERIFY STATUS RESULT] Status do pagamento ${paymentId}: "${status}"`);

    if (status === "approved" || status === "accredited") {
      await updateOrderInDb(orderId, 'pago');
      return res.json({
        success: true,
        status: 'approved',
        message: "Excelente! Pagamento aprovado com sucesso e sincronizado!"
      });
    }

    return res.json({
      success: true,
      status: status,
      message: `O pagamento ainda está com status pendente: ${status}`
    });

  } catch (err: any) {
    console.error("[VERIFY STATUS EXCEPTION]", err);
    return res.status(500).json({ error: `Falha na verificação: ${err.message}` });
  }
});

function generateValidCPF(): string {
  const num = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += num[i] * (10 - i);
  }
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  
  num.push(d1);
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += num[i] * (11 - i);
  }
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  
  num.push(d2);
  
  return num.join('');
}

// Endpoint 1: Generate PIX payment
app.post("/api/payment/pix", async (req, res) => {
  const { orderId, amount, payerEmail, payerName, payerCpf, customAccessToken, customPixKey } = req.body;
  if (!orderId || !amount) {
    return res.status(400).json({ error: "Parâmetros 'orderId' e 'amount' são obrigatórios para pagamento." });
  }

  const mpToken = customAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.ME;
  const isSimulated = !mpToken || mpToken === "YOUR_MERCADO_PAGO_ACCESS_TOKEN" || mpToken.trim() === "";

  if (isSimulated) {
    console.log(`[MP PIX SIMULATION] Gerando PIX fictício sob-demanda para pedido: ${orderId}, total: R$ ${amount}`);
    const simulatedPix = generatePixPayload(
      customPixKey || "barrosbruno.ti@gmail.com",
      "CAMISA 7 STORE",
      "SAO PAULO",
      Number(amount),
      `PED_${orderId}_ONLINE_C7`
    );
    
    return res.json({
      success: true,
      paymentId: `mp-sim-pix-${Date.now()}`,
      merchantOrderId: "9" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      qrCode: simulatedPix,
      qrCodeBase64: "", // Frontend defaults to clean local high-fidelity SVG qr-graphics render
      isSimulated: true
    });
  }

  try {
    console.log(`[MP PIX REAL] Conectando com a API oficial do Mercado Pago para gerar PIX. Pedido: ${orderId}, Valor: ${amount}`);
    const first_name = payerName?.split(" ")[0] || "Cliente";
    const last_name = payerName?.split(" ").slice(1).join(" ") || "Camisa 7";
    const identificationNumber = payerCpf ? payerCpf.replace(/\D/g, '') : generateValidCPF();

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpToken}`,
        "X-Idempotency-Key": `pix-${orderId}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        description: `Mini Kids - Pedido ${orderId}`,
        payment_method_id: "pix",
        external_reference: orderId,
        notification_url: process.env.APP_URL ? `${process.env.APP_URL}/api/payment/webhook` : undefined,
        payer: {
          email: payerEmail || "contato@minikids.com.br",
          first_name,
          last_name,
          identification: {
            type: "CPF",
            number: identificationNumber
          }
        }
      })
    });

    const data = await response.json();
    if (response.ok) {
      const qrCode = data.point_of_interaction?.transaction_data?.qr_code || "";
      const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64 || "";
      
      console.log(`[MP PIX REAL] PIX gerado com Sucesso! Id Pagamento: ${data.id}`);
      return res.json({
        success: true,
        paymentId: data.id,
        merchantOrderId: data.order ? (typeof data.order === 'object' ? data.order.id : data.order) : null,
        qrCode,
        qrCodeBase64,
        isSimulated: false
      });
    } else {
      console.warn("[MP PIX REAL ERROR] Falling back to high-fidelity simulated scan code:", data);
      const simulatedPix = generatePixPayload(
        customPixKey || "barrosbruno.ti@gmail.com",
        "CAMISA 7 STORE",
        "SAO PAULO",
        Number(amount),
        `PED_${orderId}_ONLINE_C7`
      );
      
      const mpErrorMsg = data.message || (data.cause && data.cause[0]?.description) || "Erro de credenciais";
      let friendlyWarning = `A API do Mercado Pago retornou o erro: "${mpErrorMsg}".`;
      if (data.cause && Array.isArray(data.cause)) {
        friendlyWarning += " Detalhes: " + data.cause.map((c: any) => c.description || c.code).join(", ");
      }
      if (mpErrorMsg.includes("Unauthorized use of live credentials") || data.error === "unauthorized" || (data.cause && data.cause[0]?.code === 7)) {
        friendlyWarning = "Erro 401 (Unauthorized use of live credentials): Suas credenciais de Produção não foram homologadas pelo formulário do painel do Mercado Pago.";
      }

      return res.json({
        success: true,
        paymentId: `mp-sim-pix-${Date.now()}`,
        merchantOrderId: "9" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        qrCode: simulatedPix,
        qrCodeBase64: "", // Frontend defaults to clean local high-fidelity SVG qr-graphics render
        isSimulated: true,
        warning: friendlyWarning
      });
    }
  } catch (err: any) {
    console.warn("[MP PIX EXCEPTION] Falling back to high-fidelity simulated scan code:", err);
    const simulatedPix = generatePixPayload(
      customPixKey || "barrosbruno.ti@gmail.com",
      "CAMISA 7 STORE",
      "SAO PAULO",
      Number(amount),
      `PED_${orderId}_ONLINE_C7`
    );
    return res.json({
      success: true,
      paymentId: `mp-sim-pix-${Date.now()}`,
      merchantOrderId: "9" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      qrCode: simulatedPix,
      qrCodeBase64: "",
      isSimulated: true,
      warning: `Exceção de rede do servidor: ${err.message || 'Erro de conexão'}.`
    });
  }
});

// Endpoint 2: Process credit card securely tokenized in the frontend
app.post("/api/payment/card", async (req, res) => {
  const { orderId, token, payment_method_id, installments, issuer_id, payerEmail, payerName, payerCpf, amount, customAccessToken } = req.body;
  if (!orderId || !amount) {
    return res.status(400).json({ error: "Parâmetros 'orderId' e 'amount' são obrigatórios." });
  }

  const mpToken = customAccessToken || process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.ME;
  const isSimulated = !mpToken || mpToken === "YOUR_MERCADO_PAGO_ACCESS_TOKEN" || mpToken.trim() === "";

  if (isSimulated) {
    console.log(`[MP CARD SIMULATION] Processando transação de crédito fictícia para pedido: ${orderId}, total: R$ ${amount}`);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    await updateOrderInDb(orderId, 'pago');
    
    return res.json({
      success: true,
      status: "approved",
      paymentId: `mp-sim-card-${Date.now()}`,
      merchantOrderId: "9" + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
      message: "Pagamento aprovado via cartão simulado! (Gateway em modo de simulação)"
    });
  }

  try {
    console.log(`[MP CARD REAL] Cobrando cartão no Mercado Pago para pedido: ${orderId}, Token: ${token}, Valor: ${amount}`);
    const first_name = payerName?.split(" ")[0] || "Cliente";
    const last_name = payerName?.split(" ").slice(1).join(" ") || "Camisa 7";
    const identificationNumber = payerCpf ? payerCpf.replace(/\D/g, '') : generateValidCPF();

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mpToken}`,
        "X-Idempotency-Key": `card-${orderId}-${Date.now()}`
      },
      body: JSON.stringify({
        token,
        issuer_id: issuer_id ? String(issuer_id) : undefined,
        payment_method_id,
        transaction_amount: Number(amount),
        installments: Number(installments || 1),
        description: `Mini Kids - Pedido ${orderId}`,
        external_reference: orderId,
        notification_url: process.env.APP_URL ? `${process.env.APP_URL}/api/payment/webhook` : undefined,
        payer: {
          email: payerEmail || "contato@minikids.com.br",
          first_name,
          last_name,
          identification: {
            type: "CPF",
            number: identificationNumber
          }
        }
      })
    });

    const data = await response.json();
    if (response.ok && (data.status === "approved" || data.status_detail === "accredited")) {
      console.log(`[MP CARD REAL] Transação Aprovada com sucesso! Id Pagamento: ${data.id}`);
      await updateOrderInDb(orderId, 'pago');
      return res.json({
        success: true,
        status: "approved",
        paymentId: data.id,
        merchantOrderId: data.order ? (typeof data.order === 'object' ? data.order.id : data.order) : null,
        message: "Pagamento de cartão de crédito aprovado com sucesso!"
      });
    } else {
      console.warn("[MP CARD REAL ERROR] Mercado Pago payment failed:", data);
      
      const mpErrorMsg = data.message || (data.cause && data.cause[0]?.description) || "";
      let friendlyWarning = `Erro de pagamento do Mercado Pago: "${mpErrorMsg || 'Recusado'}".`;

      const tokenIsLive = mpToken && mpToken.trim().startsWith("APP_USR-");

      if (mpErrorMsg.includes("Unauthorized use of live credentials") || data.error === "unauthorized" || (data.cause && data.cause[0]?.code === 7)) {
        friendlyWarning = "Erro 401 (Não Autorizado): Suas credenciais de Produção não foram homologadas ou estão inativas no Mercado Pago. Verifique se concluiu o formulário de ativação no painel de desenvolvedor.";
      } else if (mpErrorMsg.includes("cannot pay to this merchant") || mpErrorMsg.includes("same merchant") || (data.status === 400 && mpErrorMsg.toLowerCase().includes("payer")) || data.status_detail === "cc_rejected_bad_filled_card_number") {
        friendlyWarning = "Erro de Negócio: Você não pode realizar um pagamento para si mesmo utilizando a mesma conta Mercado Pago de vendedor e comprador.";
      } else if (tokenIsLive && (mpErrorMsg.includes("token") || mpErrorMsg.includes("credential") || mpErrorMsg.includes("test_card"))) {
        friendlyWarning = "Conflito de Credenciais: Você está usando chaves de Produção (APP_USR-), mas tentou preencher com um cartão de teste. O Mercado Pago bloqueia cartões fictícios de teste sob credenciais reais de produção.";
      } else if ((data.cause && data.cause[0]?.code === "2062") || mpErrorMsg.includes("cardholder")) {
        friendlyWarning = "Erro do Portador: O nome do titular ou informações do portador estão inválidas ou incompletas.";
      } else if (data.status === 400 && mpErrorMsg.includes("action")) {
        friendlyWarning = "Ação Recusada: O Mercado Pago não autorizou a transação. Verifique se o CPF preenchido pertence ao titular do cartão.";
      }

      if (data.cause && Array.isArray(data.cause) && !friendlyWarning.includes("Ação Recusada") && !friendlyWarning.includes("Conflito") && !friendlyWarning.includes("Erro do Portador") && !friendlyWarning.includes("Erro de Negócio") && !friendlyWarning.includes("Erro 401")) {
        friendlyWarning += " Detalhes adicionais: " + data.cause.map((c: any) => c.description || c.code).join(", ");
      }

      // Since we are using REAL keys, DO NOT silently approve via mock fallback! 
      // Return the error so the merchant / user knows what went wrong!
      return res.status(response.status || 400).json({
        success: false,
        error: friendlyWarning,
        details: data
      });
    }
  } catch (err: any) {
    console.warn("[MP CARD EXCEPTION]", err);
    return res.status(500).json({
      success: false,
      error: `Exceção de rede no processamento do cartão: ${err.message || 'Erro de conexão'}.`
    });
  }
});

// Endpoint 3: Mercado Pago Webhook / IPN status updates receiver
app.post("/api/payment/webhook", async (req, res) => {
  // Extract payment id from nested body action models or querystring
  const paymentId = req.body?.data?.id || req.body?.id || req.query?.id || req.query?.['data.id'];
  const topic = req.body?.type || req.query?.topic;

  console.log(`[WEBHOOK] Notificação webhook recebida do Mercado Pago. ID Pagamento: ${paymentId}, Topic: ${topic}`);

  if (!paymentId) {
    return res.status(200).json({ received: true, info: "Nenhum ID de pagamento detectado na notificação estruturada." });
  }

  const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.ME;
  if (!mpToken || mpToken === "YOUR_MERCADO_PAGO_ACCESS_TOKEN" || mpToken.trim() === "") {
    console.warn("[WEBHOOK] Notificação recebida, mas credencial oficial do Mercado Pago não está ativa na sandbox local.");
    return res.status(200).json({ received: true, simulated: true });
  }

  try {
    // Fetch payment details directly from Mercado Pago structure to check status and secure token ownership
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${mpToken}`
      }
    });

    if (!response.ok) {
      console.error(`[WEBHOOK] Erro buscando detalhes da cobrança ${paymentId} no Mercado Pago API.`);
      return res.status(200).json({ received: true, error: "Impossível consultar detalhes da cobrança segura." });
    }

    const data = await response.json();
    const status = data.status; // 'approved', 'rejected', 'pending', 'cancelled'
    const orderId = data.external_reference; // This matches our custom Order ID!

    console.log(`[WEBHOOK] Cobrança verificada de ID ${paymentId}. Status: "${status}", Pedido Relacionado: "${orderId}"`);

    if (orderId) {
      if (status === "approved" || status === "accredited") {
        await updateOrderInDb(orderId, 'pago');
        console.log(`[WEBHOOK] Pedido ${orderId} atualizado para 'PAGO' via Webhook status aprovado.`);
      } else if (status === "rejected" || status === "cancelled") {
        // Optional state change to cancelado or keep reserved
        console.log(`[WEBHOOK] Pedido ${orderId} atualizado com status não-aprovado: ${status}`);
      }
    }

    return res.status(200).json({ received: true, updated: true });
  } catch (err: any) {
    console.error("[WEBHOOK PROCESSING EXCEPTION]", err);
    // Always respond 200/OK to Mercado Pago so they stop retrying/flooding, even on error processing
    return res.status(200).json({ received: true, error: err.message });
  }
});

// Endpoint 4: Direct Webhook Sandbox simulation tool (extremely elegant developer helper!)
app.post("/api/payment/simulate-callback", async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({ error: "orderId é obrigatório para disparar simulação." });
  }

  console.log(`[SIMULATION BACKEND] Forçando webhook aprovado de fundo mockado para o pedido: ${orderId}`);
  await updateOrderInDb(orderId, 'pago');
  res.json({
    success: true,
    message: `Notificação recebida com sucesso! Status do pedido ${orderId} sincronizado para 'pago' em tempo real!`
  });
});

// AI Gemini Content Generator (Failsafe AI copywriting backend endpoint)
app.post("/api/ai/describe", async (req, res) => {
  const { prompt } = req.body;
  const ai = getGeminiClient();

  if (!prompt) {
    return res.status(400).json({ error: "Por favor, indique detalhes para gerar a descrição." });
  }

  if (!ai) {
    // Elegant simulated response if Gemini key is not configured yet
    return res.json({
      text: `[ESTILO INFANTIL SIMULADO]\nEste adorável lookinho ${prompt} traz o máximo de conforto, unindo fios selecionados de algodão 100% hipoalergênico e toque ultra macio. Apresenta costuras suaves anti-atrito para não irritar a pele, caimento perfeito para brincar livremente e cores alegres que as crianças amam.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é o redator de e-commerce sênior da Mini Kids, uma loja de roupas e acessórios infantis cheia de magia, diversão e muito conforto. Escreva uma descrição curta, fofa, extremamente chamativa, persuasiva e focada na qualidade do tecido (maciez, flexibilidade para brincar, durabilidade, antialérgico, facilidade de lavar/vestir) para a roupinha descrita no prompt. Limite a resposta a no máximo 350 caracteres.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na API Gemini:", error);
    res.json({
      text: `[CONEXÃO AUTOMÁTICA EM CURSO]\nEste lookinho infantil destaca-se pela doçura e alegria do modelo ${prompt}. Confeccionado com malha super respirável, oferece toque suave na pele, flexibilidade e total liberdade para todas as brincadeiras.`
    });
  }
});

// AI Customer Styling Bot
app.post("/api/ai/recommend", async (req, res) => {
  const { msg, currentProduct } = req.body;
  const ai = getGeminiClient();

  if (!msg) {
    return res.status(400).json({ error: "Mensagem obrigatória." });
  }

  if (!ai) {
    return res.json({
      text: `Olá! Sou o Solzinho AI da Mini Kids! ☀️✨\n\nExcelente escolha! No caso de "${currentProduct || "Conjunto Dinossauro"}", ele combina super bem com uma galocha colorida ou um tênis de velcro bem prático. Se estiver mais friozinho, uma calça de moletom super macia ou uma meia-calça colorida vai deixar o lookinho uma fofura só!`
    });
  }

  try {
    const contextStr = currentProduct 
      ? `O cliente está visualizando a roupinha infantil: "${currentProduct}".`
      : "O cliente está navegando em nosso catálogo geral da Mini Kids de roupas, pijamas e acessórios infantis.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: msg,
      config: {
        systemInstruction: `Você é o Solzinho AI da Mini Kids, o simpático sol dourado mascote oficial da loja, interativo, caloroso e muito divertido. Você ajuda pais e crianças a escolherem roupinhas alegres, confortáveis e cheias de estilo. ${contextStr} Responda de forma alegre, simpática e brincalhona, usando emojis ensolarados e divertidos (como ☀️, 🎈, ✨, 🧸, 🕶️). Dê sugestões de combinações de roupas, sapatinhos ou ideias de looks para passear, brincar ou dormir. Mantenha a resposta rápida, objetiva e inspiradora. Máximo 400 caracteres.`,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na API Gemini Style Assist:", error);
    res.json({
      text: "Olá! Que ótima escolha de lookinho. Nossas roupinhas são super macias e fáceis de combinar, ótimas para todas as brincadeiras do dia a dia. Combine cores alegres para deixar o dia ainda mais divertido! ☀️✨🎈"
    });
  }
});


/* --- VITE MIDDLEWARE SETUP --- */

// Serve static files in production
if (IS_PRODUCTION) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath, {
    index: false, // Prevents serving index.html for '/' so it falls through to our custom app.get('*') handler
    setHeaders: (res, filePath) => {
      // Check if the file is in the /assets/ directory
      if (/[\\/]assets[\\/]/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // Root config files like manifest.json should not be cached aggressively
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      }
    }
  }));
  
  // Return a self-healing reload script for missing JS assets to recover outdated client cache
  app.get('/assets/*.js', (req, res) => {
    const filePath = path.join(distPath, req.path);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        return res.send('console.warn("Asset em cache desatualizado. Recarregando pagina..."); window.location.reload();');
      }
      res.sendFile(filePath);
    });
  });

  // Return 404 for missing assets or files with extensions instead of serving index.html
  app.get(['/assets/*', '/*.*'], (req, res) => {
    res.status(404).send('Asset not found');
  });

  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    
    const htmlPath = path.join(distPath, 'index.html');
    fs.readFile(htmlPath, 'utf8', (err, html) => {
      if (err) {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html><head><title>Camisa 7 Store</title></head>
          <body><h1>Camisa 7 Store</h1><p>API está funcionando. Aguarde o build do frontend.</p></body>
        </html>`);
      }

      // Inject server-side appearance values directly in index.html to prevent flash of default theme (FOUC)
      const themeColor = appearanceConfig.primaryColor || '#d12229';
      const themeColorHover = appearanceConfig.primaryColorHover || '#aa1a1e';
      const bgDarkColor = appearanceConfig.bgDark || '#09090b';
      const bgLightColor = appearanceConfig.bgLight || '#fafafa';
      const displayFont = appearanceConfig.displayFont || 'Space Grotesk';
      const sansFont = appearanceConfig.sansFont || 'Inter';

      const injectedScript = `
    <script>
      (function() {
        const themeColor = "${themeColor}";
        const themeColorHover = "${themeColorHover}";
        const bgDarkColor = "${bgDarkColor}";
        const bgLightColor = "${bgLightColor}";
        const displayFont = "${displayFont}";
        const sansFont = "${sansFont}";

        const root = document.documentElement;
        root.style.setProperty('--color-primary', themeColor);
        root.style.setProperty('--color-primary-hover', themeColorHover);
        root.style.setProperty('--color-bg-dark', bgDarkColor);
        root.style.setProperty('--color-bg-light', bgLightColor);
        root.style.setProperty('--font-display-custom', displayFont);
        root.style.setProperty('--font-sans-custom', sansFont);

        const styleEl = document.createElement('style');
        styleEl.id = 'custom-appearance-styles';
        styleEl.innerHTML = \`
          @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@450;500;700&family=Inter:wght@400;500;600;850&family=Montserrat:wght@400;600;800&family=Playfair+Display:ital,wght@0,700;1,400&family=Outfit:wght@400;500;750&family=JetBrains+Mono:wght@400;700&family=Cabin:wght@500;700&family=Roboto:wght@400;500;800&family=Poppins:wght@450;600;850&family=Open+Sans:wght@450;650&display=swap');
          
          :root {
            --color-primary: \${themeColor};
            --color-primary-hover: \${themeColorHover};
            --color-bg-dark: \${bgDarkColor};
            --color-bg-light: \${bgLightColor};
          }
          
          .bg-red-500, .bg-red-650, .bg-red-600, .hover\\\\:bg-red-750:hover, .hover\\\\:bg-red-700:hover, .hover\\\\:bg-red-850:hover {
            background-color: var(--color-primary) !important;
          }
          
          button.bg-red-600:hover, button.bg-red-650:hover {
            background-color: var(--color-primary-hover) !important;
          }
          
          .text-red-500, .text-red-655, .text-red-650, .text-red-600, .text-red-700, .hover\\\\:text-red-500:hover, .hover\\\\:text-red-655:hover, .hover\\\\:text-red-600:hover, .hover\\\\:text-red-700:hover, .group:hover .group-hover\\\\:text-red-500, .group:hover .group-hover\\\\:text-red-650, .group:hover .group-hover\\\\:text-red-600 {
            color: var(--color-primary) !important;
          }
          
          .border-red-600, .border-red-900\\\\/40, .hover\\\\:border-red-600\\\\/20:hover, .hover\\\\:border-red-650\\\\/40:hover {
            border-color: var(--color-primary) !important;
          }

          h1, h2, h3, h4, h5, h6, .font-display {
            font-family: "\${displayFont}", "Space Grotesk", sans-serif !important;
          }

          body, select, input, button, textarea, p, span, li, blockquote, label, .font-sans {
            font-family: "\${sansFont}", "Inter", sans-serif;
          }
        \`;
        document.head.appendChild(styleEl);
      })();
    </script>
      `;

      const updatedHtml = html.replace('<head>', '<head>' + injectedScript);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(updatedHtml);
    });
  });
}

// Initialize data from Supabase (non-blocking, sync happens on first request too)
if (!IS_VERCEL) {
  syncFromSupabase().then(() => {
    setupRealtimeSubscriptions();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[SERVER] Camisa 7 Store rodando na porta ${PORT}`);
    });
  });
}

export default app;
