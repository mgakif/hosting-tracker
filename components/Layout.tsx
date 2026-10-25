
import React from 'react';
import { Calendar, Settings as SettingsIcon, LayoutDashboard, LogOut, User, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: 'dashboard' | 'settings';
  onNavigate: (view: 'dashboard' | 'settings') => void;
  userEmail?: string;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate, userEmail, onLogout }) => {
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onLogout();
  };

  const navItemClass = (view: string) => 
    `flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-tighter transition-all ${
      activeView === view ? 'text-blue-600' : 'text-slate-400'
    }`;

  const desktopLinkClass = (view: string) => 
    `text-sm font-bold transition-all cursor-pointer py-5 border-b-2 flex items-center gap-2 ${
      activeView === view 
      ? 'text-blue-600 border-blue-600' 
      : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-200'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 pb-20 md:pb-0">
      {/* Desktop Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => onNavigate('dashboard')}
            >
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tighter">HostTracker</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 h-16">
              <button onClick={() => onNavigate('dashboard')} className={desktopLinkClass('dashboard')}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button onClick={() => onNavigate('settings')} className={desktopLinkClass('settings')}>
                <SettingsIcon className="w-4 h-4" />
                Ayarlar
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight truncate max-w-[120px]">
                  {userEmail}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center min-w-[44px] min-h-[44px]"
                aria-label="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 z-50 flex justify-around items-center shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className={navItemClass('dashboard')}
        >
          <div className={`p-2 rounded-xl ${activeView === 'dashboard' ? 'bg-blue-50' : ''}`}>
            <LayoutDashboard className="w-6 h-6" />
          </div>
          PANEL
        </button>
        
        <button 
          onClick={() => onNavigate('settings')} 
          className={navItemClass('settings')}
        >
          <div className={`p-2 rounded-xl ${activeView === 'settings' ? 'bg-blue-50' : ''}`}>
            <SettingsIcon className="w-6 h-6" />
          </div>
          AYARLAR
        </button>

        <button 
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-tighter text-rose-500"
        >
          <div className="p-2 rounded-xl bg-rose-50">
            <LogOut className="w-6 h-6" />
          </div>
          ÇIKIŞ
        </button>
      </div>

      <footer className="hidden md:block bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-slate-400">
          <div>&copy; {new Date().getFullYear()} HostTracker Freelance Panel.</div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <User className="w-3 h-3" /> Secure Access Only
          </div>
        </div>
      </footer>
    </div>
  );
};
