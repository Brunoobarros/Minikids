import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { X, Trash2, Tag, ShoppingBag, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, q: number) => void;
  onSubmitOrder: (orderData: { 
    customerName: string; 
    customerEmail: string; 
    customerPhone: string; 
    discountCode: string;
    paymentMethod: 'retirada' | 'pix' | 'cartao';
  }) => void;
  triggerNotification: (title: string, body: string, type: 'info' | 'success' | 'alert') => void;
  isDarkMode: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onUpdateQuantity,
  onSubmitOrder,
  triggerNotification,
  isDarkMode
}) => {
  // Coupon input
  const [coupon, setCoupon] = useState('');
  const [activeDiscount, setActiveDiscount] = useState(0); // decimal percent, e.g. 0.1 for 10%
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Customer attributes
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'retirada' | 'pix' | 'cartao'>('retirada');

  // Validation errors
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  if (!isOpen) return null;

  // Calculos de preços
  const subtotal = cart.reduce((sum, item) => {
    const p = item.product.discountPrice || item.product.price;
    return sum + (p * item.quantity);
  }, 0);

  const discountAmount = subtotal * activeDiscount;
  
  // Extra 5% off incentive for in-app online methods (PIX or Credit Card)
  const isOnlinePayment = paymentMethod === 'pix' || paymentMethod === 'cartao';
  const onlineDiscount = isOnlinePayment ? (subtotal - discountAmount) * 0.05 : 0;
  
  const grandTotal = Math.max(0, subtotal - discountAmount - onlineDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCoupon = coupon.trim().toUpperCase();
    if (cleanCoupon === 'MINIKIDS10') {
      setActiveDiscount(0.1); // 10% Discount
      setAppliedCoupon('MINIKIDS10');
      setCoupon('');
      triggerNotification("Cupom Aplicado!", "Você ganhou 10% de desconto na sua compra!", "success");
    } else if (cleanCoupon === 'KIDS40') {
      setActiveDiscount(0.40); // 40% Discount
      setAppliedCoupon('KIDS40');
      setCoupon('');
      triggerNotification("Super Cupom!", "Incrível: Garantiu 40% de desconto especial!", "success");
    } else {
      triggerNotification("Cupom Inválido", "O código digitado não existe ou expirou.", "alert");
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setNameError(false);
    setEmailError(false);
    setPhoneError(false);

    if (cart.length === 0) {
      triggerNotification("Carrinho Vazio", "Selecione algum produto do catálogo para prosseguir.", "alert");
      return;
    }

    // Validar Nome Completo (pelo menos duas palavras)
    const nameTrimmed = custName.trim();
    const nameParts = nameTrimmed.split(/\s+/);
    if (!nameTrimmed || nameParts.length < 2 || nameParts.some(part => part.length < 2)) {
      setNameError(true);
      triggerNotification("Nome Completo Necessário", "Por favor, informe seu Nome Completo (Nome e Sobrenome).", "alert");
      return;
    }

    // Validar Email
    if (!custEmail.trim() || !custEmail.includes('@')) {
      setEmailError(true);
      triggerNotification("E-mail Necessário", "Por favor, indique um endereço de E-mail de contato válido.", "alert");
      return;
    }

    // Validar WhatsApp / Telefone (mínimo 10 e máximo 11 dígitos numéricos com DDD)
    const phoneDigits = custPhone.replace(/\D/g, '');
    if (!custPhone.trim()) {
      setPhoneError(true);
      triggerNotification("Telefone Necessário", "Por favor, informe seu WhatsApp / Telefone.", "alert");
      return;
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setPhoneError(true);
      triggerNotification("Telefone Inválido", "Por favor, informe um WhatsApp/Telefone válido com DDD (10 ou 11 dígitos).", "alert");
      return;
    }

    // Submit order action
    onSubmitOrder({
      customerName: nameTrimmed,
      customerEmail: custEmail.trim(),
      customerPhone: custPhone.trim(),
      discountCode: appliedCoupon,
      paymentMethod: paymentMethod
    });

    // Reset customer states
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setActiveDiscount(0);
    setAppliedCoupon('');
    setPaymentMethod('retirada');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      {/* Click outside backdrop close handler */}
      <div className="flex-1" onClick={onClose} />

      <div className={`w-full max-w-lg border-l h-full flex flex-col justify-between p-6 relative shadow-2xl overflow-y-auto animate-slide-left transition-colors duration-300 ${
        isDarkMode 
          ? "bg-zinc-950 border-zinc-900 text-white" 
          : "bg-white border-zinc-200 text-slate-900"
      }`}>
        
        {/* Header Drawer Control */}
        <div>
          <div className={`flex items-center justify-between border-b pb-4 mb-4 ${
            isDarkMode ? 'border-zinc-900' : 'border-zinc-200'
          }`}>
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-red-600 w-5 h-5 animate-pulse" />
              <h3 className={`text-sm font-black tracking-widest uppercase font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                SACOLA <span className="text-xs text-red-600">// MINI KIDS</span>
              </h3>
            </div>
            
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-zinc-400 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart items listing */}
          <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className={`text-center py-12 text-xs font-semibold ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-405 text-zinc-400'
              }`}>
                Seu carrinho de reservas está vazio no momento.
              </div>
            ) : (
              cart.map((item) => {
                const itemPrice = item.product.discountPrice || item.product.price;
                return (
                  <div key={item.id} className={`p-3 rounded-xl flex items-center justify-between gap-3 border transition-colors ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className={`w-12 h-12 rounded object-cover border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
                    />

                    <div className="flex-1 text-left min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.product.name}</h4>
                      <p className={`text-[10px] mt-0.5 font-mono uppercase ${isDarkMode ? 'text-zinc-450 text-zinc-400' : 'text-zinc-500'}`}>
                        Tam: {item.selectedSize} | Cor: {item.selectedColor.name}
                      </p>
                      
                      <div className="flex items-center gap-2.5 mt-2">
                        {/* Quantity switcher of specific custom item */}
                        <div className={`flex items-center border rounded overflow-hidden ${
                          isDarkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200'
                        }`}>
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className={`px-2 py-0.5 text-xs focus:outline-none transition-colors cursor-pointer ${
                              isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-zinc-400 hover:text-black hover:bg-zinc-100'
                            }`}
                          >
                            -
                          </button>
                          <span className={`px-2 text-[10px] font-mono ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))}
                            className={`px-2 py-0.5 text-xs focus:outline-none transition-colors cursor-pointer ${
                              isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-zinc-400 hover:text-black hover:bg-zinc-100'
                            }`}
                          >
                            +
                          </button>
                        </div>
                        
                        <span className="text-xs text-red-500 font-bold font-mono">
                          R$ {(itemPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className={`p-1.5 transition-colors self-start cursor-pointer ${
                        isDarkMode ? 'text-zinc-550 text-zinc-500 hover:text-red-500' : 'text-zinc-400 hover:text-red-600'
                      }`}
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coupon Discount & Customer Data forms */}
        <div className={`border-t pt-4 mt-4 space-y-4 ${
          isDarkMode ? 'border-zinc-900' : 'border-zinc-200'
        }`}>
          
          {/* Coupon apply system */}
          {cart.length > 0 && (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="flex-1 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Cupom: MINIKIDS10 (10% OFF)"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className={`w-full border rounded px-3 pl-9 py-1.5 text-xs uppercase focus:outline-none focus:border-red-600 transition-colors ${
                    isDarkMode 
                      ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" 
                      : "bg-zinc-50 border-zinc-200 text-slate-900 placeholder-zinc-400"
                  }`}
                />
              </div>
              <button
                type="submit"
                className={`px-4 py-1.5 text-xs font-bold rounded uppercase transition-colors cursor-pointer ${
                  isDarkMode 
                    ? "bg-white hover:bg-zinc-200 text-black" 
                    : "bg-black hover:bg-zinc-800 text-white"
                }`}
              >
                Aplicar
              </button>
            </form>
          )}

          {/* Pricing Summary */}
          {cart.length > 0 && (
            <div className={`p-4 rounded-xl border space-y-1.5 text-xs leading-relaxed transition-colors ${
              isDarkMode ? 'bg-zinc-900/40 border-zinc-900' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className={`flex justify-between ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <span>Subtotal dos itens:</span>
                <span className={`font-mono font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>R$ {subtotal.toFixed(2)}</span>
              </div>
              
              {activeDiscount > 0 && (
                <div className="flex justify-between text-emerald-500 font-bold">
                  <span>Desconto Cupom ({appliedCoupon}):</span>
                  <span className="font-mono">- R$ {discountAmount.toFixed(2)}</span>
                </div>
              )}

              {isOnlinePayment && (
                <div className="flex justify-between text-yellow-500 font-bold">
                  <span>Desconto Pagamento Online (5% EXTRA):</span>
                  <span className="font-mono">- R$ {onlineDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className={`flex justify-between font-bold border-t pt-2 ${
                isDarkMode ? 'border-zinc-850 text-white' : 'border-zinc-200 text-slate-900'
              }`}>
                <span className="text-sm">Total a Pagar:</span>
                <span className="text-red-500 font-mono text-sm leading-6">R$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Customer Booking registration Form */}
          {cart.length > 0 && (
            <form onSubmit={handleCheckoutSubmit} className={`space-y-4 text-left text-xs p-4 rounded-xl border transition-colors ${
              isDarkMode ? 'bg-zinc-900/40 border-zinc-900' : 'bg-zinc-50 border-zinc-200'
            }`}>
              
              {/* Payment Method Selector Tabs */}
              <div className="space-y-2">
                <span className={`block text-[10px] uppercase font-mono font-black tracking-wider ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Como prefere pagar o seu lookinho?</span>
                
                <div className="grid grid-cols-3 gap-1.5 bg-black/10 p-1 rounded-lg border border-zinc-500/10">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('retirada')}
                    className={`py-2 rounded-md text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                      paymentMethod === 'retirada'
                        ? 'bg-red-600 text-white shadow'
                        : isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black font-semibold'
                    }`}
                  >
                    Na Loja
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`py-2 rounded-md text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer relative ${
                      paymentMethod === 'pix'
                        ? 'bg-red-600 text-white shadow'
                        : isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black font-semibold'
                    }`}
                  >
                    Pix
                    <span className="absolute -top-1.5 -right-1 bg-yellow-500 text-black text-[7px] px-1 rounded-full font-black animate-bounce scale-90">-5%</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao')}
                    className={`py-2 rounded-md text-[9px] uppercase font-bold tracking-wider transition-all cursor-pointer relative ${
                      paymentMethod === 'cartao'
                        ? 'bg-red-600 text-white shadow'
                        : isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black font-semibold'
                    }`}
                  >
                    Cartão
                    <span className="absolute -top-1.5 -right-1 bg-yellow-500 text-black text-[7px] px-1 rounded-full font-black animate-bounce scale-90">-5%</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-500/10 pt-2 space-y-2.5">
                <span className={`block text-[10px] uppercase font-mono font-black tracking-wider ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Seus Dados de Identificação</span>
              </div>

              <div>
                <label className={`block uppercase font-mono text-[9px] mb-0.5 font-bold ${
                  isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                }`}>Nome Completo</label>
                <input
                  type="text"
                  placeholder="ex: Carlos Nobre Barros"
                  value={custName}
                  onChange={(e) => {
                    setCustName(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  className={`w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none transition-colors ${
                    nameError 
                      ? "border-red-500 ring-1 ring-red-500 bg-red-500/5 focus:border-red-500" 
                      : (isDarkMode ? "bg-black border-zinc-800 focus:border-red-600" : "bg-white border-zinc-200 focus:border-red-600")
                  } ${isDarkMode ? "text-white placeholder-zinc-500" : "text-slate-900 placeholder-zinc-400"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block uppercase font-mono text-[9px] mb-0.5 font-bold ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>E-mail de Contato</label>
                  <input
                    type="email"
                    placeholder="carlos@exemplo.com"
                    value={custEmail}
                    onChange={(e) => {
                      setCustEmail(e.target.value);
                      if (emailError) setEmailError(false);
                    }}
                    className={`w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none transition-colors ${
                      emailError 
                        ? "border-red-500 ring-1 ring-red-500 bg-red-500/5 focus:border-red-500" 
                        : (isDarkMode ? "bg-black border-zinc-800 focus:border-red-600" : "bg-white border-zinc-200 focus:border-red-600")
                    } ${isDarkMode ? "text-white placeholder-zinc-500" : "text-slate-900 placeholder-zinc-400"}`}
                  />
                </div>
                <div>
                  <label className={`block uppercase font-mono text-[9px] mb-0.5 font-bold ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>WhatsApp / Telefone</label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={custPhone}
                    onChange={(e) => {
                      setCustPhone(e.target.value);
                      if (phoneError) setPhoneError(false);
                    }}
                    className={`w-full border rounded px-2.5 py-1.5 text-xs focus:outline-none transition-colors ${
                      phoneError 
                        ? "border-red-500 ring-1 ring-red-500 bg-red-500/5 focus:border-red-500" 
                        : (isDarkMode ? "bg-black border-zinc-800 focus:border-red-600" : "bg-white border-zinc-200 focus:border-red-600")
                    } ${isDarkMode ? "text-white placeholder-zinc-500" : "text-slate-900 placeholder-zinc-400"}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-red-600 hover:bg-black hover:text-white text-white text-xs font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />{' '}
                {paymentMethod === 'retirada' 
                  ? 'Reservar e Pagar na Loja' 
                  : `Pagar Seguro via ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'} (-5% OFF!)`
                }
              </button>

              <p className={`text-[10px] text-center font-mono leading-relaxed mt-1 ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                {paymentMethod === 'retirada' 
                  ? '*As roupinhas ficarão reservadas no estoque por 48 horas para que você as retire na Mini Kids com segurança!'
                  : '*Efetue o seu pagamento na próxima etapa com total segurança digital de ponta a ponta!'
                }
              </p>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
