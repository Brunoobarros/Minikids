import { Product, Banner, Order } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-dino-moletom',
    name: 'Casaco Moletom Dinossauro',
    category: 'menino',
    description: 'Super divertido e confortável! Este casaco em moletom 100% algodão com capuz interativo possui escamas de dinossauro nas costas. Toque macio e quentinho, perfeito para as brincadeiras e aventuras em dias frios!',
    price: 139.90,
    discountPrice: 99.90,
    images: [
      'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80'
    ],
    sizes: ['1-2a', '3-4a', '5-6a', '7-8a'],
    colors: [
      { name: 'Verde Dino', hex: '#4CAF50' },
      { name: 'Amarelo Sol', hex: '#FFEB3B' }
    ],
    stock: 12,
    ratingValue: 5.0,
    reviews: [
      { id: 'rev-1', username: 'Mariana Souza', rating: 5, comment: 'Meu filho amou as escamas nas costas, não quer tirar o casaco para nada!', date: '2026-06-05' }
    ]
  },
  {
    id: 'prod-vestido-floral',
    name: 'Vestido Girassóis Alegre',
    category: 'menina',
    description: 'Um vestido charmoso e cheio de vida! Feito em viscose premium respirável, com caimento soltinho e estampa alegre de girassóis. Perfeito para festinhas, passeios ou para um dia de sol cheio de energia.',
    price: 119.90,
    images: [
      '/products/prod-dino-moletom.jpg'
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
    price: 99.90,
    discountPrice: 79.90,
    images: [
      '/products/prod-vestido-floral.jpg'
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
    category: 'promocoes',
    description: 'Estilo clássico em versão kids! Jaqueta jeans macia com elastano e calça combinando, super flexíveis para não prender os movimentos da criança. Muito resistente para brincar no parque!',
    price: 189.90,
    discountPrice: 129.90,
    images: [
      '/products/prod-trico-romper.jpg'
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
    price: 79.90,
    images: [
      '/products/prod-conjunto-jeans.jpg'
    ],
    sizes: ['Tamanho Único'],
    colors: [
      { name: 'Marrom Caramelo', hex: '#8D6E63' },
      { name: 'Creme', hex: '#FFF9C4' }
    ],
    stock: 20,
    ratingValue: 5.0,
    reviews: [
      { id: 'rev-4', username: 'Aline P.', rating: 5, comment: 'Extremamente macio e seguro, minha bebê dorme com ele todos os dias.', date: '2026-06-03' }
    ]
  },
  {
    id: 'prod-macacao-leao',
    name: 'Macacão Pijama Leãozinho',
    category: 'bebe',
    description: 'Pijama macacão com capuz de leãozinho e orelhinhas em relevo! Confeccionado em soft térmico antialérgico, perfeito para manter o bebê quentinho a noite toda com muita fofura.',
    price: 109.90,
    images: [
      '/products/prod-urso-pelucia.jpg'
    ],
    sizes: ['3-6m', '6-12m', '12-18m', '2a'],
    colors: [
      { name: 'Laranja Leão', hex: '#FF9800' }
    ],
    stock: 9,
    ratingValue: 4.9,
    reviews: []
  }
];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    title: 'CONFORTO E MAGIA PARA SEU BEBÊ',
    subtitle: 'Roupinhas de tricot e algodão antialérgico feitas com carinho e fofura para proteger a pele macia do seu pequeno.',
    image: '/products/prod-trico-romper.jpg',
    tag: 'FESTIVAL DO BEBÊ 👶',
    buttonText: 'Ver Roupinhas de Bebê',
    linkToCategory: 'bebe',
    orderIndex: 0
  },
  {
    id: 'banner-2',
    title: 'DIVERSÃO SEM LIMITES!',
    subtitle: 'Conjuntos super resistentes, coloridos e confortáveis para o seu filho correr, pular e criar grandes aventuras.',
    image: '/products/prod-capa-chuva.jpg',
    tag: 'BRINCAR COM ESTILO 🎈',
    buttonText: 'Ver Coleção Infantil',
    linkToCategory: 'todos',
    orderIndex: 1
  },
  {
    id: 'banner-3',
    title: 'AMIGOS DE PELÚCIA E MUITA FOFURA',
    subtitle: 'Brinquedos seguros, fofinhos e antialérgicos para acompanhar o crescimento e o sono saudável do seu pequeno.',
    image: '/products/prod-urso-pelucia.jpg',
    tag: 'COMPANHEIROS DE SONECAS 🧸',
    buttonText: 'Explorar Brinquedos',
    linkToCategory: 'brinquedos',
    orderIndex: 2
  }
];

export const INITIAL_ORDERS: Order[] = [];
