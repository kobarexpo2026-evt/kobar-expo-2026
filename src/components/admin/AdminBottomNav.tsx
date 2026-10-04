import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileSpreadsheet, 
  Users, 
  MoreHorizontal, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface AdminBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNavigateHome: () => void;
}

export const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ currentTab, onSelectTab, onNavigateHome }) => {
  const { profile, isSuperAdmin, logout } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
    { id: 'events', label: 'Event', icon: CalendarDays },
    { id: 'builder', label: 'Builder', icon: FileSpreadsheet },
    { id: 'registrations', label: 'Peserta', icon: Users },
  ];

  return (
    <>
      {/* Drawer overlay for 'More' menu */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden" onClick={() => setShowMoreMenu(false)}>
          <div 
            className="fixed inset-x-0 bottom-16 bg-white dark:bg-[#201813] rounded-t-3xl p-5 border-t border-stone-200 dark:border-stone-800 space-y-4 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <p className="font-fredoka font-bold text-stone-900 dark:text-stone-100">
                  Menu Lainnya
                </p>
                <Badge variant={isSuperAdmin ? 'festival' : 'neutral'} className="text-[10px]">
                  {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
                </Badge>
              </div>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {isSuperAdmin && (
                <>
                  <button
                    onClick={() => {
                      onSelectTab('templates');
                      setShowMoreMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl font-baloo font-semibold text-sm text-left transition-colors',
                      currentTab === 'templates' ? 'bg-amber-500 text-white' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    )}
                  >
                    <Settings className="w-5 h-5 text-amber-500" />
                    <span>Template & Pengaturan</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectTab('admins');
                      setShowMoreMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl font-baloo font-semibold text-sm text-left transition-colors',
                      currentTab === 'admins' ? 'bg-amber-500 text-white' : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                    )}
                  >
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                    <span>Kelola Akun Admin</span>
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  onNavigateHome();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl font-baloo font-semibold text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-left transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-sky-500" />
                <span>Portal Peserta (Publik)</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl font-baloo font-semibold text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar Akun ({profile?.email})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden bg-white/95 dark:bg-[#1A130E]/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-3 py-2 flex items-center justify-around shadow-lg">
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setShowMoreMenu(false);
              }}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer',
                isActive
                  ? 'text-amber-500 dark:text-amber-400 font-bold scale-105'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-baloo">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer',
            showMoreMenu || currentTab === 'templates' || currentTab === 'admins'
              ? 'text-amber-500 dark:text-amber-400 font-bold scale-105'
              : 'text-stone-500 dark:text-stone-400'
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-baloo">Lainnya</span>
        </button>
      </nav>
    </>
  );
};
