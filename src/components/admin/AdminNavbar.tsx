import React, { useState } from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { Badge } from '../ui/Badge';
import { 
  Shield, 
  Database, 
  ExternalLink, 
  Menu, 
  X, 
  LayoutDashboard, 
  CalendarDays, 
  FileSpreadsheet, 
  Users, 
  Settings, 
  ShieldCheck, 
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { SupabaseConfigModal } from '../SupabaseConfigModal';

interface AdminNavbarProps {
  currentTab: string;
  onNavigateHome: () => void;
  onSelectTab?: (tab: string) => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dasbor Utama', subtitle: 'Ringkasan statistik pendaftaran dan pendapatan' },
  events: { title: 'Manajemen Event', subtitle: 'Atur urutan, kuota, mode akses, dan biaya pendaftaran' },
  builder: { title: 'Form Builder Dinamis', subtitle: 'Desain formulir pendaftaran dan pembayaran lanjutan' },
  registrations: { title: 'Data Pendaftar', subtitle: 'Kelola status bayar, kelulusan, dan lampiran peserta' },
  templates: { title: 'Template & Pengaturan', subtitle: 'Kelola template invoice PDF dan email otomatis' },
  admins: { title: 'Kelola Akun Admin', subtitle: 'Hak akses event dan manajemen akun panitia' },
};

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ 
  currentTab, 
  onNavigateHome,
  onSelectTab 
}) => {
  const { profile, isSuperAdmin, logout } = useAuth();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tabInfo = TAB_TITLES[currentTab] || { title: 'Admin Portal', subtitle: 'EOMS Kobar Expo' };

  const handleTabClick = (tabId: string) => {
    if (onSelectTab) onSelectTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Manajemen Event', icon: CalendarDays },
    { id: 'builder', label: 'Form Builder', icon: FileSpreadsheet },
    { id: 'registrations', label: 'Data Pendaftar', icon: Users },
  ];

  const superAdminItems = [
    { id: 'templates', label: 'Template & Pengaturan', icon: Settings },
    { id: 'admins', label: 'Kelola Admin', icon: ShieldCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#1C1612]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-850/80 px-4 md:px-8 py-3 flex items-center justify-between transition-colors shadow-2xs">
        {/* Left: Mobile Hamburger & Title */}
        <div className="flex items-center gap-2.5">
          {onSelectTab && (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-amber-600" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-fredoka font-bold text-base md:text-xl text-stone-900 dark:text-stone-100">
                {tabInfo.title}
              </h2>
              <Badge variant={isSuperAdmin ? 'festival' : 'neutral'} className="text-[10px] hidden sm:inline-flex">
                <Shield className="w-3 h-3 mr-0.5" />
                {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
              </Badge>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-baloo hidden sm:block">
              {tabInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Supabase status badge */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono transition-colors cursor-pointer border border-stone-200/60 dark:border-stone-800"
            title="Klik untuk melihat atau mengatur koneksi Supabase asli"
          >
            <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="hidden sm:inline">
              {isSupabaseConfigured ? 'Supabase Live' : 'Setup DB'}
            </span>
          </button>

          {/* Public portal quick button */}
          <button
            onClick={onNavigateHome}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Portal Peserta</span>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>

        <SupabaseConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-30 bg-black/60 backdrop-blur-xs flex flex-col">
          <div className="bg-white dark:bg-[#1E1712] border-b-2 border-stone-200 dark:border-stone-800 p-4 max-h-[85vh] overflow-y-auto space-y-4 font-baloo shadow-2xl animate-in slide-in-from-top-4 duration-200">
            {/* User Info Header */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-fredoka font-bold text-sm">
                  {profile?.nama?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h4 className="font-fredoka font-bold text-xs text-stone-900 dark:text-stone-100">
                    {profile?.nama || 'Admin Panitia'}
                  </h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                    {profile?.email || 'admin@kobarexpo.id'}
                  </p>
                </div>
              </div>
              <Badge variant={isSuperAdmin ? 'festival' : 'neutral'} className="text-[9px]">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </Badge>
            </div>

            {/* Nav Links */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-fredoka px-2">
                Menu Utama
              </span>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl font-baloo text-xs font-semibold transition-colors text-left ${
                        isActive
                          ? 'bg-amber-500 text-white font-bold shadow-xs'
                          : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-850'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Super Admin Section */}
            {isSuperAdmin && (
              <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-850">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-fredoka">
                    Super Admin
                  </span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="space-y-1">
                  {superAdminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl font-baloo text-xs font-semibold transition-colors text-left ${
                          isActive
                            ? 'bg-amber-500 text-white font-bold shadow-xs'
                            : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-850'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigateHome();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Portal Peserta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold hover:bg-rose-100"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          <div 
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}
    </>
  );
};
