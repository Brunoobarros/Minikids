import React, { useState } from 'react';
import { Product } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isDarkMode: boolean;
  onSelect: (p: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isDarkMode,
  onSelect
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const images = product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentImgIndex(index);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className={`group relative border rounded-2xl p-3.5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col justify-between ${
        isDarkMode 
          ? 'bg-zinc-950 border-white/5 hover:border-red-650/40 hover:shadow-red-950/15' 
          : 'bg-white border-zinc-200 shadow-sm hover:border-red-600/20 hover:shadow-slate-250/50'
      }`}
    >
      <div>
        {/* Image frame */}
        <div className={`relative aspect-square w-full rounded-xl overflow-hidden mb-4 border transition-colors ${
          isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-100 border-zinc-200'
        }`}>
          {product.discountPrice && (
            <span className="absolute top-2 left-2 bg-red-600 text-white font-mono text-[9px] uppercase font-black px-2 py-0.5 rounded z-10 animate-pulse">
              OFERTA
            </span>
          )}

          {/* Active Image */}
          <img
            src={images[currentImgIndex]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-106"
          />

          {/* Next & Prev Image arrows (only if product has multiple images) */}
          {images.length > 1 && (
            <>
              {/* Prev Button */}
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-all duration-200 z-10 hover:scale-110 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-all duration-200 z-10 hover:scale-110 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Póxima imagem"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Mini Dot Indicators */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-auto">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => handleDotClick(e, i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      currentImgIndex === i 
                        ? 'bg-red-600 scale-125 w-3' 
                        : 'bg-white/50 hover:bg-white'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Hover rapid trigger panel overlay (not showing over arrows) */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <span className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
              Ver Lookinho →
            </span>
          </div>
        </div>

        {/* Header specifications */}
        <span className="text-[9px] uppercase font-bold tracking-widest text-red-500 font-mono">
          {product.category === 'bebe' ? 'Bebê' : product.category === 'menino' ? 'Menino' : product.category === 'menina' ? 'Menina' : product.category === 'brinquedos' ? 'Brinquedos' : product.category === 'promocoes' ? 'Oferta' : product.category}
        </span>
        
        <h3 className={`text-sm font-bold uppercase tracking-tight mt-1 group-hover:text-red-500 transition-colors line-clamp-1 ${
          isDarkMode ? 'text-white' : 'text-slate-900'
        }`}>
          {product.name}
        </h3>

        {/* Sizes representation badges */}
        <div className="flex flex-wrap gap-1 items-center mt-2.5">
          {product.sizes.map((size) => (
            <span
              key={size}
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 border-white/10 bg-zinc-900' 
                  : 'text-zinc-700 border-zinc-200 bg-zinc-50'
              }`}
            >
              {size}
            </span>
          ))}
        </div>
      </div>

      {/* Footer details (price + stock counter indicator) */}
      <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
        isDarkMode ? 'border-white/5' : 'border-zinc-100'
      }`}>
        <div className="flex flex-col text-left">
          {product.discountPrice ? (
            <>
              <span className="text-xs text-gray-500 line-through font-mono">
                R$ {product.price.toFixed(2)}
              </span>
              <span className="text-sm font-black text-red-500 font-mono">
                R$ {product.discountPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className={`text-sm font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              R$ {product.price.toFixed(2)}
            </span>
          )}
        </div>
        
        <div className="text-right">
          {product.stock === 0 ? (
            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase font-mono border ${
              isDarkMode ? 'bg-zinc-900 text-red-650 border-red-950' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              Esgotado
            </span>
          ) : product.stock <= 3 ? (
            <span className="text-[9px] bg-yellow-950/20 text-yellow-500 px-2 py-0.5 rounded font-bold uppercase font-mono border border-yellow-900/30 animate-pulse">
              Só {product.stock} un
            </span>
          ) : (
            <span className={`text-[8px] font-mono ${isDarkMode ? 'text-gray-500' : 'text-zinc-400'}`}>
              {product.stock} un disponíveis
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
