import React, { useState } from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { Shield, Ticket, Sparkles, Menu, X, ChevronRight, Home, HelpCircle } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleEventsClick = () => {
    setIsMobileMenuOpen(false);
    if (onScrollToEvents) onScrollToEvents();
  };

  const handleStatusClick = () => {
    setIsMobileMenuOpen(false);
    if (onScrollToStatus) onScrollToStatus();
  };

  const handleAdminClick = () => {
    setIsMobileMenuOpen(false);
    onNavigateAdmin();
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-[#18120E]/95 backdrop-blur-md border-b-2 border-amber-200/50 dark:border-stone-850/80 px-4 md:px-8 py-3.5 transition-colors shadow-2xs">
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
              <span className="festival-ribbon text-[11px] bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full font-bold">
                2026
              </span>
            </div>
            <p className="text-[11px] font-baloo text-stone-500 dark:text-stone-400 font-medium hidden sm:block">
              Kotawaringin Barat &bull; Kalimantan Tengah
            </p>
          </div>
        </div>

        {/* Desktop Center / Right Links */}
        <div className="hidden md:flex items-center gap-2 sm:gap-4">
          {onScrollToEvents && (
            <button
              onClick={onScrollToEvents}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-baloo cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Daftar Event</span>
            </button>
          )}

          {onScrollToStatus && (
            <button
              onClick={onScrollToStatus}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-baloo cursor-pointer"
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

        {/* Mobile & Zoom Hamburger Controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-850 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-amber-600" />
            ) : (
              <Menu className="w-5 h-5 text-stone-800 dark:text-stone-200" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 space-y-2 animate-in slide-in-from-top-3 duration-200 font-baloo">
          <div className="flex flex-col gap-1.5">
            {onScrollToEvents && (
              <button
                type="button"
                onClick={handleEventsClick}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 font-semibold text-sm hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="block font-bold font-fredoka">Daftar Event & Agenda</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">Pilih kegiatan dan lakukan pendaftaran</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600" />
              </button>
            )}

            {onScrollToStatus && (
              <button
                type="button"
                onClick={handleStatusClick}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 font-semibold text-sm hover:bg-teal-100 dark:hover:bg-teal-950/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                    <Ticket className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="block font-bold font-fredoka">Cek Status & Unduh Tiket</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">Cari berdasarkan No. Registrasi</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-teal-600" />
              </button>
            )}

            <button
              type="button"
              onClick={handleAdminClick}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-100 dark:bg-stone-850 text-stone-800 dark:text-stone-200 font-semibold text-sm hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-stone-800 text-amber-400 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </span>
                <div>
                  <span className="block font-bold font-fredoka">Portal Admin Panitia</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">Masuk ke manajemen verifikasi & kurasi</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
