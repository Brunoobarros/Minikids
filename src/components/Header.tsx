import React, { useState } from 'react';
import { Search, ShoppingCart, User, LogOut, Check, Sliders, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  onCartToggle: () => void;
  currentUser: any;
  onLoginSimulate: (email: string, role: 'admin' | 'customer') => void;
  onLogout: () => void;
  onGoogleLogin: () => void;
  selectedCategory: string;
  setSelectedCategory: (cat: 'todos' | 'masculino' | 'feminino' | 'promocoes' | 'esportivo') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  cartCount,
  onCartToggle,
  currentUser,
  onLoginSimulate,
  onLogout,
  onGoogleLogin,
  selectedCategory,
  setSelectedCategory,
  isDarkMode,
  onToggleDarkMode,
  onLogoClick
}) => {
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const [typedPassword, setTypedPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [simulatedRole, setSimulatedRole] = useState<'customer' | 'admin'>('customer');

  const submitLogin = (e: React.SyntheticEvent, role: 'admin' | 'customer') => {
    e.preventDefault();
    setErrorMessage('');

    if (role === 'admin') {
      const p = typedPassword.trim();
      if (!p) {
        setErrorMessage("Por favor, digite a senha de administrador.");
        return;
      }
      if (p !== "admin" && p !== "camisa7pass") {
        setErrorMessage("Senha incorreta! Tente novamente.");
        return;
      }
    }

    const email = typedEmail.trim() || (role === 'admin' ? 'admin@camisa7.com.br' : 'cliente@exemplo.com');
    onLoginSimulate(email, role);
    setShowAuthDropdown(false);
    setTypedEmail('');
    setTypedPassword('');
    setErrorMessage('');
  };

  return (
    <header className={`sticky top-0 border-b z-40 transition-all duration-300 shadow-sm ${
      isDarkMode 
        ? "bg-zinc-950 border-zinc-900 text-white" 
        : "bg-white border-zinc-100 text-slate-900"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand Logo & Brand Slogan */}
        <div className="flex items-center justify-between">
          <div
            onClick={onLogoClick}
            className="flex items-center gap-2 cursor-pointer select-none hover:opacity-90 active:scale-[0.98] transition-all"
            title="Ir para a página inicial"
          >
            <span className="text-2xl font-black tracking-tighter uppercase font-sans italic">
              CAMISA <span className="text-red-600 font-extrabold text-2xl">7</span>
            </span>
            <span className={`text-[10px] tracking-widest text-red-600 font-mono uppercase px-2 py-0.5 rounded border transition-colors ${
              isDarkMode ? 'bg-red-950/30 border-red-900/60 text-red-400' : 'bg-red-50 border-red-200'
            }`}>
              STORE
            </span>
          </div>
          
          {/* Mobile Right Icons (Toggle Theme, Cart + Account) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onToggleDarkMode}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode ? "hover:bg-zinc-900 text-yellow-500" : "hover:bg-zinc-100 text-zinc-800"
              }`}
              title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onCartToggle}
              className={`relative p-2 rounded-full transition-colors ${
                isDarkMode ? "hover:bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setShowAuthDropdown(!showAuthDropdown)}
              className={`p-2 rounded-full transition-colors relative ${
                isDarkMode ? "hover:bg-zinc-900" : "hover:bg-zinc-100"
              }`}
            >
              <User className={`w-5 h-5 ${currentUser ? 'text-red-600' : (isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}`} />
            </button>
          </div>
        </div>

        {/* Central Category Navigation (Desktop) & Search Bar */}
        <div className="flex-1 max-w-lg mx-auto w-full relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar camisas de times, clássicas, dry-fit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-full text-sm font-sans focus:outline-none focus:ring-1 focus:ring-red-600 transition-all ${
                isDarkMode 
                  ? "border-zinc-800 bg-zinc-900 placeholder-zinc-500 text-white focus:bg-black focus:border-red-600" 
                  : "border-zinc-200 bg-zinc-100 placeholder-zinc-400 text-slate-900 focus:bg-white focus:border-red-600"
              }`}
            />
          </div>
        </div>

        {/* Right Actions (Theme Switch, Cart, Account, Authentication simulator) */}
        <div className="hidden md:flex items-center gap-6">
          {/* Categories Shortcuts */}
          <nav className={`flex items-center gap-4 text-xs tracking-widest font-bold uppercase transition-colors ${
            isDarkMode ? "text-zinc-400" : "text-zinc-500"
          }`}>
            {(['todos', 'masculino', 'feminino', 'esportivo', 'promocoes'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`transition-colors cursor-pointer ${
                  isDarkMode ? "hover:text-white" : "hover:text-black"
                } ${
                  selectedCategory === cat ? 'text-red-600 font-extrabold border-b-2 border-red-600 pb-1' : ''
                }`}
              >
                {cat === 'todos' ? 'Ver Tudo' : cat}
              </button>
            ))}
          </nav>

          {/* Theme Mode Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-zinc-900 text-yellow-500" : "hover:bg-zinc-100 text-zinc-850"
            }`}
            title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
          >
            {isDarkMode ? (
              <Sun className="w-5.5 h-5.5" />
            ) : (
              <Moon className="w-5.5 h-5.5" />
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={onCartToggle}
            className={`relative p-2 rounded-full transition-colors cursor-pointer ${
              isDarkMode ? "hover:bg-zinc-900" : "hover:bg-zinc-100"
            }`}
          >
            <ShoppingCart className={`w-5.5 h-5.5 ${isDarkMode ? "text-white" : "text-zinc-800"}`} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[10px] w-5.5 h-5.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Section dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowAuthDropdown(!showAuthDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-full hover:border-red-600 transition-all text-xs cursor-pointer font-bold ${
                isDarkMode 
                  ? "bg-zinc-900 border-zinc-800 hover:bg-black text-white" 
                  : "bg-zinc-100 border-zinc-200 hover:bg-white text-slate-900"
              }`}
            >
              <User className={`w-4 h-4 ${currentUser ? 'text-red-600' : (isDarkMode ? 'text-zinc-400' : 'text-zinc-500')}`} />
              <span className="font-mono">
                {currentUser ? currentUser.name : 'Entrar (Conta)'}
              </span>
            </button>
            
            {showAuthDropdown && (
              <div className={`absolute right-0 mt-2 w-72 border rounded-xl shadow-2xl p-4 z-50 ${
                isDarkMode 
                  ? "bg-zinc-950 border-zinc-800 text-white shadow-black/85" 
                  : "bg-white border-zinc-200 text-slate-900"
              }`}>
                {currentUser ? (
                  <div>
                    <div className={`border-b pb-3 mb-3 ${isDarkMode ? "border-zinc-800" : "border-zinc-100"}`}>
                      <p className={`text-xs uppercase font-mono tracking-wider ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>Acessado como</p>
                      <p className="text-sm font-black text-red-600 mt-1">{currentUser.name}</p>
                      <p className={`text-xs truncate ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>{currentUser.email}</p>
                      <p className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded uppercase font-mono border ${
                        isDarkMode ? 'bg-red-950/30 text-red-400 border-red-900' : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {currentUser.role === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onLogout();
                        setShowAuthDropdown(false);
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                        isDarkMode 
                          ? "bg-white hover:bg-zinc-200 text-black" 
                          : "bg-black hover:bg-zinc-800 text-white"
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sair da Conta
                    </button>
                  </div>                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        onGoogleLogin();
                        setShowAuthDropdown(false);
                      }}
                      className={`w-full py-2.5 rounded-lg border text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-sm active:scale-[0.98] ${
                        isDarkMode 
                          ? "bg-zinc-900 border-zinc-800 hover:bg-black text-white hover:border-zinc-700" 
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-slate-800 hover:border-zinc-300"
                      }`}
                    >
                      <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.463 0 4.127 1.012 5.069 1.908l2.42-2.324C17.96 1.411 15.341 0 12.24 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.918 0 11.52-4.821 11.52-11.714 0-.789-.082-1.389-.18-1.996l-11.34-.005z"/>
                      </svg>
                      Acessar com Google
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className={`flex-grow border-t ${isDarkMode ? "border-zinc-800" : "border-zinc-200"}`}></div>
                      <span className={`flex-shrink mx-3 text-[9px] uppercase font-mono ${isDarkMode ? "text-zinc-650" : "text-zinc-400"}`}>Acesso Rápido</span>
                      <div className={`flex-grow border-t ${isDarkMode ? "border-zinc-800" : "border-zinc-200"}`}></div>
                    </div>

                    {/* Role selector tab for simulation */}
                    <div className="grid grid-cols-2 gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedRole('customer');
                          setErrorMessage('');
                        }}
                        className={`py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                          simulatedRole === 'customer'
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        Sou Cliente
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedRole('admin');
                          setErrorMessage('');
                        }}
                        className={`py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                          simulatedRole === 'admin'
                            ? (isDarkMode ? "bg-zinc-800 text-white shadow-sm" : "bg-white text-slate-950 shadow-sm")
                            : "text-zinc-500 hover:text-zinc-800"
                        }`}
                      >
                        Sou Admin
                      </button>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                      {simulatedRole === 'customer' ? (
                        <div>
                          <label className={`block text-[10px] uppercase font-mono mb-1 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>E-mail (Opcional)</label>
                          <input
                            type="email"
                            placeholder="ex: cliente@exemplo.com"
                            value={typedEmail}
                            onChange={(e) => setTypedEmail(e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-red-600 transition-colors ${
                              isDarkMode 
                                ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" 
                                : "bg-zinc-50 border-zinc-200 text-slate-900 placeholder-zinc-400"
                            }`}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className={`block text-[10px] uppercase font-mono mb-1 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>Senha de Administrador</label>
                          <input
                            type="password"
                            placeholder="Digite a senha de administrador"
                            value={typedPassword}
                            onChange={(e) => setTypedPassword(e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-red-600 transition-colors ${
                              isDarkMode 
                                ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" 
                                : "bg-zinc-50 border-zinc-200 text-slate-900 placeholder-zinc-400"
                            }`}
                          />
                        </div>
                      )}

                      {errorMessage && (
                        <p className="text-[10px] text-red-500 font-mono font-bold text-center mt-1">
                          {errorMessage}
                        </p>
                      )}
                      
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={(e) => submitLogin(e, simulatedRole)}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {simulatedRole === 'admin' ? 'Entrar como Admin' : 'Entrar no Site'}
                        </button>
                      </div>

                      <p className={`text-[9px] text-center leading-relaxed font-mono ${isDarkMode ? "text-zinc-500" : "text-zinc-400"}`}>
                        {simulatedRole === 'admin' 
                          ? "*Acesso restrito ao administrador da loja"
                          : "*Nota: Nenhum login social ou senha é exigido para clientes usarem o site"
                        }
                      </p>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Authentication dropdown inside navigation flow */}
      {showAuthDropdown && (
        <div className={`md:hidden border-b p-4 ${
          isDarkMode ? "bg-zinc-950 border-zinc-900 text-white" : "bg-white border-zinc-200 text-slate-900"
        }`}>
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-[10px] font-mono ${isDarkMode ? "text-zinc-500" : "text-zinc-500"}`}>Acessado como</p>
                <p className="text-xs font-semibold text-red-600">{currentUser.name}</p>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setShowAuthDropdown(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase font-bold cursor-pointer ${
                  isDarkMode 
                    ? "bg-white hover:bg-zinc-200 text-black" 
                    : "bg-black hover:bg-zinc-800 text-white"
                }`}
              >
                <LogOut className="w-3 h-3" /> Sair
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-left">
              <p className={`text-[10px] font-mono uppercase font-bold ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>Acessar E-commerce</p>
              
              {/* Role selector tab for mobile simulation */}
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedRole('customer');
                    setErrorMessage('');
                  }}
                  className={`py-1.5 text-center text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    simulatedRole === 'customer'
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-850"
                  }`}
                >
                  Sou Cliente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedRole('admin');
                    setErrorMessage('');
                  }}
                  className={`py-1.5 text-center text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                    simulatedRole === 'admin'
                      ? (isDarkMode ? "bg-zinc-800 text-white shadow-sm" : "bg-white text-slate-950 shadow-sm")
                      : "text-zinc-500 hover:text-zinc-850"
                  }`}
                >
                  Sou Admin
                </button>
              </div>

              <div className="space-y-2">
                {simulatedRole === 'customer' ? (
                  <div>
                    <label className={`block text-[9px] uppercase font-mono mb-1 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>E-mail (Opcional)</label>
                    <input
                      type="email"
                      placeholder="ex: cliente@exemplo.com"
                      value={typedEmail}
                      onChange={(e) => setTypedEmail(e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-red-600 transition-colors ${
                        isDarkMode 
                          ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" 
                          : "bg-zinc-50 border-zinc-200 text-slate-900 placeholder-zinc-400"
                      }`}
                    />
                  </div>
                ) : (
                  <div>
                    <label className={`block text-[9px] uppercase font-mono mb-1 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>Senha de Administrador</label>
                    <input
                      type="password"
                      placeholder="Digite a senha de administrador"
                      value={typedPassword}
                      onChange={(e) => setTypedPassword(e.target.value)}
                      className={`w-full px-3 py-1.5 border rounded text-xs focus:outline-none focus:border-red-600 transition-colors ${
                        isDarkMode 
                          ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" 
                          : "bg-zinc-50 border-zinc-200 text-slate-900 placeholder-zinc-400"
                      }`}
                    />
                  </div>
                )}
              </div>

              {errorMessage && (
                <p className="text-[10px] text-red-500 font-mono font-bold text-center mt-1">
                  {errorMessage}
                </p>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={(e) => submitLogin(e, simulatedRole)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {simulatedRole === 'admin' ? 'Entrar como Admin' : 'Entrar no Site'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
