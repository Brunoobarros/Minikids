import React, { useState } from 'react';
import { Product, Review, CartItem } from '../types';
import { X, Star, MessageCircle, Send, Sparkles, AlertCircle } from 'lucide-react';
import { CarrinhoInfantilIcon } from './CarrinhoInfantilIcon';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (cartItem: Omit<CartItem, 'id'>) => void;
  triggerNotification: (title: string, body: string, type: 'info' | 'success' | 'alert') => void;
  currentUser: any;
  onAddReview: (id: string, review: Omit<Review, 'id' | 'date'>) => void;
  isDarkMode: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  triggerNotification,
  currentUser,
  onAddReview,
  isDarkMode
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || '1-2a');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || { name: 'Padrão', hex: '#000000' });
  const [quantity, setQuantity] = useState(1);

  // Styling AI chat state
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: `Olá! Sou o Solzinho AI da Mini Kids! ☀️✨ Gostaria de sugestões de sapatinhos, meias ou dicas de looks fofos para usar com "${product.name}"? Pergunte-me qualquer dúvida!` }
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [isQueryingAI, setIsQueryingAI] = useState(false);

  // New Review Form State
  const [reviewName, setReviewName] = useState(currentUser?.name || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const userText = userQuery.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setUserQuery('');
    setIsQueryingAI(true);

    try {
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg: userText, currentProduct: product.name })
      });
      const data = await response.json();
      if (data.text) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.text }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Desculpe, meu pozinho de pirlimpimpim falhou um pouquinho. Mas posso te dizer que este lookinho combina perfeitamente com um sapato confortável e uma calça de moletom super macia! 🧚✨' }]);
    } finally {
      setIsQueryingAI(false);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = reviewName.trim() || 'Cliente Sete';
    if (!reviewComment.trim()) {
      triggerNotification("Formulário Incompleto", "Por favor, digite seu comentário antes de enviar.", "alert");
      return;
    }

    onAddReview(product.id, {
      username: name,
      rating: reviewRating,
      comment: reviewComment
    });

    triggerNotification("Avaliação Recebida", "Muito obrigado pelo seu feedback sobre este lookinho!", "success");
    setReviewComment('');
  };

  const executeAddToCart = () => {
    if (product.stock === 0) {
      triggerNotification("Indisponível", "Infelizmente este lookinho está esgotado no estoque.", "alert");
      return;
    }

    onAddToCart({
      product,
      selectedSize,
      selectedColor,
      quantity
    });

    triggerNotification(
      "Lookinho na Sacola!",
      `Adicionado ao carrinho: ${product.name} (${selectedSize}) - Cor: ${selectedColor.name}`,
      "success"
    );
  };

  // WhatsApp formatted string URL generator (High converting e-commerce template)
  const getWhatsAppURL = () => {
    const message = `Olá! Estou na Mini Kids e gostaria de tirar dúvidas sobre a ${product.name} (${selectedSize}, Cor: ${selectedColor.name}). Tem mais detalhes sobre a roupinha e o envio?`;
    return `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className={`border rounded-2xl w-full max-w-4xl p-4 sm:p-6 relative max-h-[92vh] overflow-y-auto animate-zoom-in shadow-2xl transition-all duration-300 ${
        isDarkMode 
          ? "bg-zinc-950 border-zinc-850 text-white" 
          : "bg-white border-zinc-200 text-slate-900"
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`sticky top-0 float-right -mt-2 -mr-2 p-1.5 transition-colors z-20 cursor-pointer ${
            isDarkMode 
              ? "text-zinc-400 hover:text-white" 
              : "text-zinc-500 hover:text-black"
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left mt-2">
          
          {/* Left Column: Photos Carousel & Style Assistant Frame */}
          <div className="space-y-4">
            
            {/* Primary Gallery frame */}
            <div className={`relative aspect-square w-full overflow-hidden rounded-xl border flex items-center justify-center transition-colors ${
              isDarkMode ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-zinc-50"
            }`}>
              {product.discountPrice && (
                <span className="absolute top-3 left-3 bg-red-600 text-white font-mono text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-wider z-10 animate-pulse">
                  Promoção
                </span>
              )}
              <img
                src={product.images[activeImageIdx] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500 ease-in-out"
              />
            </div>

            {/* Gallery Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border transition-all cursor-pointer ${
                      activeImageIdx === idx 
                        ? 'border-red-600 ring-1 ring-red-600' 
                        : (isDarkMode ? 'border-zinc-800 grayscale hover:grayscale-0' : 'border-zinc-200 grayscale hover:grayscale-0')
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* AI Stylist Dialogue box */}
            <div className={`border rounded-xl p-3.5 mt-2 space-y-2.5 transition-colors ${
              isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
            }`}>
              <div className="flex items-center gap-1.5 text-amber-500">
                <svg className="w-5 h-5 select-none animate-[spin_12s_linear_infinite] origin-center" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="18" stroke="#F5A623" strokeWidth="4" fill="#FFEB3B"/>
                  <path d="M50,50 Q48,46 52,44 Q56,46 53,52 Q47,56 43,49 Q42,40 52,37" stroke="#D07A00" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M50,14 L50,4 M50,96 L50,86 M14,50 L4,50 M96,50 L86,50" stroke="#F5A623" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M24,24 L18,18 M76,76 L70,70 M24,76 L18,82 M76,24 L70,18" stroke="#F5A623" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                <span className="text-[10px] font-black uppercase tracking-wider font-mono">Solzinho AI ☀️✨</span>
              </div>
              
              <div className="h-32 overflow-y-auto space-y-2 pr-1 text-xs font-sans max-h-32">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`p-2 rounded-lg max-w-[85%] leading-relaxed ${
                    msg.sender === 'ai' 
                      ? (isDarkMode ? 'bg-zinc-950 border border-zinc-800 text-zinc-100 mr-auto' : 'bg-white border border-zinc-200 text-zinc-800 mr-auto') 
                      : (isDarkMode ? 'bg-red-950/40 text-red-200 border border-red-900/40 ml-auto' : 'bg-red-50 text-red-900 border border-red-200 ml-auto')
                  }`}>
                    {msg.text}
                  </div>
                ))}
                
                {isQueryingAI && (
                  <div className="text-zinc-500 text-[10px] font-mono animate-pulse uppercase">
                    Solzinho AI está digitando...
                  </div>
                )}
              </div>

              <form onSubmit={handleSendQuery} className={`flex gap-1.5 pt-1.5 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <input
                  type="text"
                  placeholder="Ex: Qual calça combina com esse casaco?"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  className={`flex-1 border rounded-md px-2.5 py-1.5 text-xs focus:outline-none transition-colors ${
                    isDarkMode 
                      ? "bg-black border-zinc-800 text-white placeholder-zinc-500 focus:border-red-600" 
                      : "bg-white border-zinc-200 text-slate-900 placeholder-zinc-400 focus:border-red-600"
                  }`}
                />
                <button
                  type="submit"
                  disabled={isQueryingAI}
                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Order selector controls & Star reviews */}
          <div className="flex flex-col justify-between gap-4">
            
            {/* Base Product Specifications */}
            <div className="space-y-4">
              <div>
                <span className={`text-[10px] tracking-widest font-mono font-black uppercase px-2 py-0.5 rounded border ${
                  isDarkMode ? 'bg-red-950/30 text-red-400 border-red-900/60' : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {product.category === 'bebe' ? 'Bebê' : product.category === 'menino' ? 'Menino' : product.category === 'menina' ? 'Menina' : product.category === 'brinquedos' ? 'Brinquedos' : product.category === 'promocoes' ? 'Oferta' : product.category}
                </span>
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight uppercase mt-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {product.name}
                </h2>
                
                {/* Visual aggregate review scoring */}
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= Math.round(product.ratingValue) ? 'fill-amber-500' : 'text-zinc-350 text-zinc-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-500">
                    {product.ratingValue} ({product.reviews.length} avaliações)
                  </span>
                </div>
              </div>

              {/* Price Tag values */}
              <div className="flex items-baseline gap-3">
                {product.discountPrice ? (
                  <>
                    <span className="text-xl sm:text-2xl font-black text-red-500 font-mono">
                      R$ {product.discountPrice.toFixed(2)}
                    </span>
                    <span className="text-xs text-zinc-400 line-through font-mono">
                      R$ {product.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className={`text-xl sm:text-2xl font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    R$ {product.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Shirt Description Copy */}
              <p className={`text-xs sm:text-sm leading-relaxed font-sans border-t border-b py-3 transition-colors ${
                isDarkMode ? 'text-zinc-300 border-zinc-800' : 'text-zinc-600 border-zinc-200'
              }`}>
                {product.description}
              </p>

              {/* Color selectors */}
              <div>
                <span className={`block text-[10px] uppercase font-mono mb-1.5 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Cor Ativa</span>
                <div className="flex gap-2">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedColor.hex === color.hex 
                          ? 'border-red-656 border-red-600 text-red-500 font-bold bg-red-600/10' 
                          : (isDarkMode ? 'bg-zinc-905 bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-black')
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full inline-block border border-black/30" style={{ backgroundColor: color.hex }}></span>
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes choosing panel (Dynamic) */}
              <div>
                <span className={`block text-[10px] uppercase font-mono mb-1.5 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Tamanho da Roupinha</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 h-10 rounded text-xs font-black transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'bg-red-600 border border-red-600 text-white font-black'
                          : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white shadow-sm' : 'bg-white border-zinc-200 text-slate-800 hover:text-black font-semibold shadow-sm')
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock controller display message */}
              <div className="flex items-center gap-2 text-xs font-mono">
                {product.stock <= 3 && product.stock > 0 ? (
                  <div className="text-amber-500 flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Estoque Quase Esgotado! Restam apenas {product.stock} unidades.</span>
                  </div>
                ) : product.stock === 0 ? (
                  <div className="text-red-600 flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                    <span>Esgotado! Faça uma consulta no suporte WhatsApp para reposição.</span>
                  </div>
                ) : (
                  <span className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}>⚡ Estoque assegurado para reserva imediata ({product.stock} disponíveis).</span>
                )}
              </div>

            </div>

            {/* CTA action controllers (Add to reserve Cart, or Direct WhatsApp support link) */}
            <div className={`space-y-2 pt-2 border-t mt-2 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                
                {/* Quantity controller */}
                {product.stock > 0 && (
                  <div className={`flex items-center border rounded overflow-hidden ${
                    isDarkMode ? 'bg-black border-zinc-800' : 'bg-zinc-105 bg-zinc-100 border-zinc-200'
                  }`}>
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-2.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className={`px-3 text-xs font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="px-3 py-2.5 text-xs text-zinc-500 hover:text-black dark:hover:text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                )}

                <button
                  onClick={executeAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all transform active:scale-95 cursor-pointer ${
                    product.stock === 0
                      ? 'bg-zinc-100 text-zinc-400 border border-zinc-250 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-black hover:text-white text-white shadow'
                  }`}
                >
                  <CarrinhoInfantilIcon className="w-4 h-4" /> Adicionar ao Carrinho
                </button>
              </div>

              {/* Support button WhatsApp (Simulando chat e-commerce) */}
              <a
                href={getWhatsAppURL()}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2 py-2.5 border rounded-full transition-all text-center cursor-pointer uppercase tracking-wider text-xs font-bold ${
                  isDarkMode 
                    ? "bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-900 text-emerald-400" 
                    : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
                }`}
              >
                <MessageCircle className="w-4 h-4" /> Duvidas? Chamar no WhatsApp
              </a>
            </div>

            {/* Live review list and rating form */}
            <div className={`border-t pt-4 space-y-4 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h4 className={`text-xs uppercase tracking-wider font-mono font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Avaliações dos Clientes</h4>
              
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {product.reviews.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">Ninguém avaliou esta roupinha ainda. Seja o primeiro!</p>
                ) : (
                  product.reviews.map((r) => (
                    <div key={r.id} className={`border p-2.5 rounded-lg text-xs leading-relaxed transition-colors ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-850' : 'bg-zinc-50 border-zinc-200/60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <strong className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{r.username}</strong>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-amber-500 font-bold">{r.rating}</span>
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        </div>
                      </div>
                      <p className={`font-sans ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{r.comment}</p>
                      <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block">{r.date}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Review Adder Form */}
              <form onSubmit={handleReviewSubmit} className={`border p-3 rounded-xl space-y-2 text-xs transition-colors ${
                isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <span className="block text-[10px] text-zinc-500 uppercase font-mono font-bold">Escrever sua Avaliação</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Seu Nome completo"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className={`border rounded px-2.5 py-1.5 focus:outline-none transition-colors ${
                      isDarkMode 
                        ? 'bg-black border-zinc-800 text-white focus:border-red-600' 
                        : 'bg-white border-zinc-200 text-slate-900 focus:border-red-600'
                    }`}
                  />
                  
                  <div className={`flex items-center justify-between border rounded px-2 ${
                    isDarkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <span className="text-zinc-400 text-[10px] font-mono">Nota:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setReviewRating(s)}
                          className="p-0.5 text-amber-500 hover:scale-115 transition-transform cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${s <= reviewRating ? 'fill-amber-500' : 'text-zinc-355 text-zinc-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Escreva sua opinião sincera sobre o corte..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className={`flex-1 border rounded px-2.5 py-1.5 focus:outline-none transition-colors ${
                      isDarkMode 
                        ? 'bg-black border-zinc-800 text-white focus:border-red-600' 
                        : 'bg-white border-zinc-200 text-slate-900 focus:border-red-600'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-1.5 font-bold rounded cursor-pointer transition-colors ${
                      isDarkMode ? 'bg-white hover:bg-zinc-200 text-black' : 'bg-black hover:bg-zinc-800 text-white'
                    }`}
                  >
                    Enviar
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
