import React from 'react';
import { Shirt, ClipboardList, History, Settings } from 'lucide-react';

interface BottomMenuProps {
  currentTab: 'lookinhos' | 'pedidos' | 'historico';
  setTab: (tab: 'lookinhos' | 'pedidos' | 'historico') => void;
  isAdminMode: boolean;
  setAdminMode: (active: boolean) => void;
  activeOrdersCount: number;
  isDarkMode: boolean;
}

export const BottomMenu: React.FC<BottomMenuProps> = ({
  currentTab,
  setTab,
  isAdminMode,
  setAdminMode,
  activeOrdersCount,
  isDarkMode
}) => {
  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t z-40 block shadow-xl transition-all duration-300 ${
      isDarkMode ? 'bg-zinc-950 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-slate-900'
    }`}>
      <div className="max-w-md mx-auto flex items-center justify-around py-3 px-2">
        {/* Lookinhos Tab */}
        <button
          onClick={() => {
            setTab('lookinhos');
            setAdminMode(false);
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            currentTab === 'lookinhos' && !isAdminMode 
              ? 'text-red-600 scale-105 font-bold' 
              : (isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-slate-900')
          }`}
        >
          <Shirt className="w-5 h-5" />
          <span className="text-[10px] font-sans tracking-widest font-bold uppercaseScale">Lookinhos</span>
        </button>

        {/* Pedidos Tab */}
        <button
          onClick={() => {
            setTab('pedidos');
            setAdminMode(false);
          }}
          className={`relative flex flex-col items-center gap-1 transition-all cursor-pointer ${
            currentTab === 'pedidos' && !isAdminMode 
              ? 'text-red-600 scale-105 font-bold' 
              : (isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-slate-900')
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          {activeOrdersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-[9px] text-white font-mono w-4.5 h-4.5 flex items-center justify-center rounded-full border border-white animate-pulse">
              {activeOrdersCount}
            </span>
          )}
          <span className="text-[10px] font-sans tracking-widest font-bold uppercaseScale">Pedidos</span>
        </button>

        {/* Histórico Tab */}
        <button
          onClick={() => {
            setTab('historico');
            setAdminMode(false);
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            currentTab === 'historico' && !isAdminMode 
              ? 'text-red-600 scale-105 font-bold' 
              : (isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-slate-900')
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-sans tracking-widest font-bold uppercaseScale">Histórico</span>
        </button>

        {/* Admin Toggle */}
        <button
          onClick={() => {
            setAdminMode(!isAdminMode);
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            isAdminMode 
              ? 'text-red-600 scale-105 font-bold' 
              : (isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-slate-900')
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-sans tracking-widest font-bold uppercaseScale">Painel</span>
        </button>
      </div>
    </div>
  );
};
