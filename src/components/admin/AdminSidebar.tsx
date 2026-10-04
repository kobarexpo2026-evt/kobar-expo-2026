import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileSpreadsheet, 
  Users, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNavigateHome: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentTab, onSelectTab, onNavigateHome }) => {
  const { profile, isSuperAdmin, logout } = useAuth();

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
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-[#1F1712] border-r-2 border-stone-200/80 dark:border-stone-850/80 min-h-screen p-4 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-teal-500 flex items-center justify-center text-white shadow-md font-fredoka font-bold text-lg">
          K
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100 tracking-wide">
              KOBAR EXPO
            </h1>
            <span className="text-[10px] font-fredoka font-bold bg-amber-400 text-stone-900 px-1.5 py-0.5 rounded-full">
              2026
            </span>
          </div>
          <p className="text-[11px] font-baloo text-stone-500 dark:text-stone-400 font-medium">
            Event Management System
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 space-y-6">
        <div>
          <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-fredoka">
            Menu Utama
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-baloo text-sm font-semibold transition-all text-left cursor-pointer',
                    isActive
                      ? 'bg-amber-500 text-white shadow-sm font-bold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-stone-400 dark:text-stone-500')} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-fredoka">
                Super Admin
              </span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <nav className="space-y-1">
              {superAdminItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-baloo text-sm font-semibold transition-all text-left cursor-pointer',
                      isActive
                        ? 'bg-amber-500 text-white shadow-sm font-bold'
                        : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-stone-400 dark:text-stone-500')} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Profile & Actions */}
      <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800/80 space-y-3">
        <button
          onClick={onNavigateHome}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Portal Peserta (Publik)
          </span>
          <span className="text-[10px] text-stone-400">/</span>
        </button>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-[#18120E] border border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate font-baloo">
              {profile?.nama || 'Administrator'}
            </p>
            <Badge variant={isSuperAdmin ? 'festival' : 'neutral'} className="text-[10px] px-1.5 py-0">
              {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
            </Badge>
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate font-mono">
            {profile?.email}
          </p>

          <button
            onClick={logout}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
