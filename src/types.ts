export interface Product {
  id: string;
  name: string;
  category: 'masculino' | 'feminino' | 'promocoes' | 'esportivo';
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  sizes: ('P' | 'M' | 'G' | 'GG')[];
  colors: { name: string; hex: string }[];
  stock: number;
  ratingValue: number;
  reviews: Review[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tag?: string;
  buttonText: string;
  linkToCategory?: string;
  orderIndex?: number;
}

export interface CartItem {
  id: string; // unique for this combination of product, size, and color
  product: Product;
  selectedSize: 'P' | 'M' | 'G' | 'GG';
  selectedColor: { name: string; hex: string };
  quantity: number;
}

export interface Review {
  id: string;
  username: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    productId: string;
    productName: string;
    image: string;
    selectedSize: 'P' | 'M' | 'G' | 'GG';
    selectedColor: { name: string; hex: string };
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
  status: 'reservado' | 'pago' | 'retirado' | 'cancelado';
  date: string;
}

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  pendingReservations: number;
  revenue: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'alert';
}
