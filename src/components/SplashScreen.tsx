import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  isLoading: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fadeExit, setFadeExit] = useState(false);
  const [currentMessageIdx, setCurrentMessageIdx] = useState(0);

  const loadingMessages = [
    'Estendendo os lookinhos no varal... 👕✨',
    'Arrumando os brinquedos na prateleira... 🧸',
    'Acendendo o brilho do Solzinho... ☀️',
    'Preparando cupons e ofertas especiais... 🏷️',
    'Quase pronto! 💫'
  ];

  // Rotate messages every 400ms for a playful feel
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setCurrentMessageIdx((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, [visible]);

  // Simulate progress bar increment
  useEffect(() => {
    if (!visible) return;
    
    if (isLoading) {
      // Fast progress up to 90%
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) {
            return prev + Math.floor(Math.random() * 10) + 5;
          }
          return prev;
        });
      }, 80);
      return () => clearInterval(timer);
    } else {
      // Fill to 100% immediately
      setProgress(100);
      
      // Trigger exit fade-out after the progress bar finishes filling
      const fadeTimeout = setTimeout(() => {
        setFadeExit(true);
        const removeTimeout = setTimeout(() => {
          setVisible(false);
        }, 500); // match duration-500
        return () => clearTimeout(removeTimeout);
      }, 300);
      return () => clearTimeout(fadeTimeout);
    }
  }, [isLoading, visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
        fadeExit ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      } bg-[#fffdf9] dark:bg-zinc-950`}
    >
      <div className="flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Spiral Sun Mascot Logo */}
        <div className="relative mb-6 animate-[bounce_2s_infinite]">
          <svg
            className="w-24 h-24 select-none animate-[spin_10s_linear_infinite] origin-center"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Spiral Sun Body */}
            <path
              d="M60,60 
                 C62,58 60,54 57,55
                 C52,56 51,62 54,65
                 C59,70 67,68 70,62
                 C74,54 70,43 61,40
                 C49,36 36,44 33,57
                 C29,73 41,88 58,91
                 C77,95 94,80 97,60"
              stroke="#FFC300"
              strokeWidth="6.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* 8 Teardrop Rays */}
            <g transform="translate(60,60)">
              <path d="M0,-35 C-2,-35 -3,-45 0,-52 C3,-45 2,-35 0,-35 Z" fill="#FFC300" />
              <path d="M0,-35 C-2,-35 -3,-45 0,-52 C3,-45 2,-35 0,-35 Z" fill="#FFC300" transform="rotate(45)" />
              <path d="M0,-35 C-2,-35 -3,-45 0,-52 C3,-45 2,-35 0,-35 Z" fill="#FFC300" transform="rotate(90)" />
              <path d="M0,-35 C-2,-35 -3,-45 0,-52 C3,-45 2,-35 0,-35 Z" fill="#FFC300" transform="rotate(135)" />
              <path d="M0,-35 C-2,-35 -3,-45 0,-52 C3,-45 2,-35 0,-35 Z" fill="#FFC300" transform="rotate(180)" />
              <path d="M0,-35 C-2,-35 -3,-45 0,-52 C3,-45 2,-35 0,-35 Z" fill="#FFC300" transform="rotate(225)" />
              <path d="M0,-35 C-2,-35 -3,-45 0,-52 C3,-45 2,-35 0,-35 Z" fill="#FFC300" transform="rotate(270)" />
              <path d="M0,-35 C-2,-35 -3,-45 0,-52 C3,-45 2,-35 0,-35 Z" fill="#FFC300" transform="rotate(315)" />
            </g>
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="flex items-center gap-1.5 font-display text-4xl font-extrabold mb-2 select-none tracking-tight">
          <span className="text-[#06b6d4]">MiNi</span>
          <span className="text-[#ff4f79]">kids</span>
        </h1>
        <p className="text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-widest font-bold mb-8 font-sans">
          Estilo &amp; Diversão
        </p>

        {/* Glassmorphic Loader Container */}
        <div className="w-64 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/40 rounded-full h-3 overflow-hidden mb-4 p-0.5 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#06b6d4] to-[#ff4f79] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Loading Message and progress indicator */}
        <div className="h-6 flex flex-col justify-center items-center">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 animate-pulse font-sans">
            {loadingMessages[currentMessageIdx]}
          </p>
        </div>
      </div>
    </div>
  );
};
