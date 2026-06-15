import React, { useState, useEffect } from 'react';
import { X, Smartphone, ArrowRight, Share2, PlusSquare, Trash2, Smartphone as MobileIcon, Laptop, HelpCircle } from 'lucide-react';

interface MobileShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const MobileShortcutModal: React.FC<MobileShortcutModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Detect user agent
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Capture PWA native install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div 
        className={`relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 border ${
          isDarkMode 
            ? "bg-zinc-950 border-zinc-800 text-white" 
            : "bg-white border-zinc-200 text-slate-900"
        }`}
      >
        {/* Color accent bar matching Mini Kids color palette */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full hover:scale-105 transition-transform ${
            isDarkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-650"
          }`}
          aria-label="Fecar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl ${
              isDarkMode ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}>
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight uppercase font-sans">Atalho Mini Kids</h3>
              <p className="text-xs text-zinc-400 font-mono">LOJA SEMPRE NO SEU CELULAR</p>
            </div>
          </div>

          <p className={`text-sm leading-relaxed mb-5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Buscando carregar a loja ainda mais rápido? Crie um atalho exclusivo na sua tela inicial para acessar os lookinhos com apenas um clique!
          </p>

          {/* Native PWA install button when applicable */}
          {deferredPrompt && (
            <button
              onClick={handleNativeInstall}
              className="w-full py-3 mb-5 font-black text-sm uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" /> Instalar Aplicativo Oficial
            </button>
          )}

          {/* Step-by-Step interactive guide tabs */}
          <div className="mb-4">
            <div className={`flex rounded-lg overflow-hidden border p-0.5 text-xs font-bold leading-5 ${
              isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <button
                onClick={() => setPlatform('ios')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  platform === 'ios'
                    ? (isDarkMode ? 'bg-zinc-850 text-white border-zinc-700' : 'bg-white text-slate-900 shadow-xs')
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Apple iOS
              </button>
              <button
                onClick={() => setPlatform('android')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  platform === 'android'
                    ? (isDarkMode ? 'bg-zinc-850 text-white border-zinc-700' : 'bg-white text-slate-900 shadow-xs')
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Android / Chrome
              </button>
              <button
                onClick={() => setPlatform('other')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  platform === 'other'
                    ? (isDarkMode ? 'bg-zinc-850 text-white border-zinc-700' : 'bg-white text-slate-900 shadow-xs')
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                PC / Outros
              </button>
            </div>
          </div>

          {/* Guide details per platform */}
          <div className={`p-4 rounded-xl text-xs border space-y-3 ${
            isDarkMode ? 'bg-zinc-900/50 border-zinc-850' : 'bg-zinc-55 border-zinc-150'
          }`}>
            {platform === 'ios' && (
              <>
                <div className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono text-slate-950 font-black">1</span>
                  <p className="leading-normal">
                    Abra este site através do navegador <strong className="text-amber-600 dark:text-amber-400 font-bold">Safari</strong> no seu iPhone ou iPad.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono text-slate-950 font-black">2</span>
                  <div className="leading-normal space-y-1">
                    <p>Toque no ícone de <strong className="text-amber-600 dark:text-amber-400 font-bold">Compartilhar</strong> na barra inferior do navegador:</p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 text-white text-[10px] border border-white/5 font-medium">
                      <Share2 className="w-3.5 h-3.5 text-blue-400" /> Compartilhar
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono text-slate-950 font-black">3</span>
                  <div className="leading-normal space-y-1">
                    <p>Suba o menu de opções e selecione <strong className="text-amber-600 dark:text-amber-400 font-bold">"Adicionar à Tela de Início"</strong>:</p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 text-white text-[10px] border border-white/5 font-medium">
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> Adicionar à Tela de Início
                    </div>
                  </div>
                </div>
              </>
            )}

            {platform === 'android' && (
              <>
                <div className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono text-slate-950 font-black">1</span>
                  <p className="leading-normal">
                    Abra o site através de um navegador confiável como o <strong className="text-amber-600 dark:text-amber-400 font-bold">Google Chrome</strong>.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono text-slate-950 font-black">2</span>
                  <p className="leading-normal">
                    Toque nos <strong className="text-amber-600 dark:text-amber-400 font-bold">três pontinhos verticais (menu)</strong> no topo à direita da tela.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono text-slate-950 font-black">3</span>
                  <p className="leading-normal">
                    Clique em <strong className="text-amber-600 dark:text-amber-400 font-bold">"Adicionar à tela inicial"</strong> ou <strong className="text-amber-600 dark:text-amber-400 font-bold">"Instalar aplicativo"</strong> para criar o ícone automaticamente.
                  </p>
                </div>
              </>
            )}

            {platform === 'other' && (
              <>
                <div className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono text-slate-950 font-black">1</span>
                  <p className="leading-normal">
                    Em computadores, no Chrome ou Edge, clique no ícone de <strong className="text-amber-600 dark:text-amber-400 font-bold">Monitor/Seta de Download</strong> ao lado da barra de endereço no navegador.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-mono text-slate-950 font-black">2</span>
                  <p className="leading-normal">
                    Confirme o prompt clicando em <strong className="text-amber-655 text-amber-600 dark:text-amber-400 font-bold">"Instalar"</strong> para abrir a Mini Kids em modo de janela cheia autônomo sem molduras de navegador.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 text-center border-t text-[10px] font-mono uppercase tracking-widest ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
        }`}>
          Mini Kids • Versão Mobile Otimizada
        </div>
      </div>
    </div>
  );
};
