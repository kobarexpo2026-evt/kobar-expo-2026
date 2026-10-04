import React from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { Shield, Ticket, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface PublicNavbarProps {
  onNavigateAdmin: () => void;
  onScrollToEvents?: () => void;
  onScrollToStatus?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  onNavigateAdmin,
  onScrollToEvents,
  onScrollToStatus,
}) => {
  return (
    <nav className="sticky top-0 z-30 bg-white/90 dark:bg-[#18120E]/90 backdrop-blur-md border-b-2 border-amber-200/50 dark:border-stone-850/80 px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-teal-500 flex items-center justify-center text-white shadow-md font-fredoka font-bold text-lg">
            K
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-fredoka font-bold text-lg md:text-xl text-stone-900 dark:text-stone-100 tracking-wide">
                KOBAR EXPO
              </span>
              <span className="festival-ribbon text-[11px] bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full">
                2026
              </span>
            </div>
            <p className="text-[11px] font-baloo text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
              Kotawaringin Barat &bull; Kalimantan Tengah
            </p>
          </div>
        </div>

        {/* Center / Right Links */}
        <div className="flex items-center gap-2 sm:gap-4">
          {onScrollToEvents && (
            <button
              onClick={onScrollToEvents}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-baloo cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Daftar Event</span>
            </button>
          )}

          {onScrollToStatus && (
            <button
              onClick={onScrollToStatus}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-baloo cursor-pointer"
            >
              <Ticket className="w-4 h-4 text-teal-600" />
              <span>Cek Status</span>
            </button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Portal Button */}
          <Button
            onClick={onNavigateAdmin}
            variant="outline"
            size="sm"
            className="border-amber-400/60 dark:border-amber-700/60 text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Shield className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
            <span>Portal Admin</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};
