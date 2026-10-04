import React, { useState } from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { Badge } from '../ui/Badge';
import { Shield, Database, ExternalLink } from 'lucide-react';
import { SupabaseConfigModal } from '../SupabaseConfigModal';

interface AdminNavbarProps {
  currentTab: string;
  onNavigateHome: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dasbor Utama', subtitle: 'Ringkasan statistik pendaftaran dan pendapatan' },
  events: { title: 'Manajemen Event', subtitle: 'Atur urutan, kuota, mode akses, dan biaya pendaftaran' },
  builder: { title: 'Form Builder Dinamis', subtitle: 'Desain formulir pendaftaran dan pembayaran lanjutan' },
  registrations: { title: 'Data Pendaftar', subtitle: 'Kelola status bayar, kelulusan, dan lampiran peserta' },
  templates: { title: 'Template & Pengaturan', subtitle: 'Kelola template invoice PDF dan email otomatis' },
  admins: { title: 'Kelola Akun Admin', subtitle: 'Hak akses event dan manajemen akun panitia' },
};

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ currentTab, onNavigateHome }) => {
  const { profile, isSuperAdmin } = useAuth();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const tabInfo = TAB_TITLES[currentTab] || { title: 'Admin Portal', subtitle: 'EOMS Kobar Expo' };

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#1C1612]/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-850/80 px-4 md:px-8 py-3.5 flex items-center justify-between transition-colors">
      {/* Left: Mobile Title or Breadcrumb */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-fredoka font-bold text-lg md:text-xl text-stone-900 dark:text-stone-100">
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

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Supabase status badge */}
        <button
          onClick={() => setIsConfigModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-mono transition-colors cursor-pointer border border-stone-200/60 dark:border-stone-800"
          title="Klik untuk melihat atau mengatur koneksi Supabase asli"
        >
          <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span className="hidden sm:inline">
            {isSupabaseConfigured ? 'Supabase Live' : 'Setup Database'}
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
  );
};
