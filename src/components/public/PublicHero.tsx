import React from 'react';
import { Calendar, MapPin, Sparkles, ArrowDown } from 'lucide-react';
import { Button } from '../ui/Button';

interface PublicHeroProps {
  onExploreClick: () => void;
  onCheckStatusClick: () => void;
}

export const PublicHero: React.FC<PublicHeroProps> = ({ onExploreClick, onCheckStatusClick }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24">
      {/* Background Tropical Flower Accents (SVG Left & Right) */}
      <div className="absolute top-2 left-2 -translate-x-6 md:translate-x-0 w-28 h-28 md:w-44 md:h-44 opacity-25 dark:opacity-15 pointer-events-none text-rose-500 animate-pulse duration-1000">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="16" fill="#F59E0B" />
          <circle cx="50" cy="22" r="14" fill="#E11D48" />
          <circle cx="50" cy="78" r="14" fill="#E11D48" />
          <circle cx="22" cy="50" r="14" fill="#E11D48" />
          <circle cx="78" cy="50" r="14" fill="#E11D48" />
          <circle cx="30" cy="30" r="12" fill="#FB7185" />
          <circle cx="70" cy="70" r="12" fill="#FB7185" />
          <circle cx="70" cy="30" r="12" fill="#FB7185" />
          <circle cx="30" cy="70" r="12" fill="#FB7185" />
        </svg>
      </div>

      <div className="absolute top-4 right-2 translate-x-6 md:translate-x-0 w-28 h-28 md:w-44 md:h-44 opacity-25 dark:opacity-15 pointer-events-none text-teal-600 animate-pulse duration-1000">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="16" fill="#F59E0B" />
          <circle cx="50" cy="22" r="14" fill="#0D9488" />
          <circle cx="50" cy="78" r="14" fill="#0D9488" />
          <circle cx="22" cy="50" r="14" fill="#0D9488" />
          <circle cx="78" cy="50" r="14" fill="#0D9488" />
          <circle cx="30" cy="30" r="12" fill="#2DD4BF" />
          <circle cx="70" cy="70" r="12" fill="#2DD4BF" />
          <circle cx="70" cy="30" r="12" fill="#2DD4BF" />
          <circle cx="30" cy="70" r="12" fill="#2DD4BF" />
        </svg>
      </div>

      {/* Decorative Traditional House Motif (Rumah Betang Dayak) Silhouette Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-5 pointer-events-none select-none">
        <svg className="w-[600px] h-[300px]" viewBox="0 0 400 200" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 180 L200 40 L380 180 Z" stroke="currentColor" strokeWidth="3" />
          <path d="M50 180 L200 70 L350 180" stroke="currentColor" strokeWidth="2" />
          <line x1="200" y1="40" x2="200" y2="180" stroke="currentColor" strokeWidth="2" />
          <line x1="120" y1="180" x2="120" y2="105" stroke="currentColor" strokeWidth="1.5" />
          <line x1="280" y1="180" x2="280" y2="105" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="200" cy="110" r="15" stroke="currentColor" strokeWidth="2" />
          <path d="M0 180 Q 200 160 400 180" stroke="currentColor" strokeWidth="4" />
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6">
        {/* Ribbon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-stone-900 shadow-sm border border-amber-500/40">
          <Sparkles className="w-4 h-4 text-amber-800" />
          <span className="font-fredoka font-semibold text-xs tracking-wider uppercase">
            Pesta Rakyat Terbesar Bumi Marunting Batu Aji
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-fredoka text-stone-900 dark:text-stone-100 leading-tight tracking-tight">
          <span className="block">Pendaftaran Resmi Seluruh Kegiatan</span>
          <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-amber-500 via-rose-500 to-teal-600 bg-clip-text text-transparent">
            Kotawaringin Barat Expo
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl font-baloo text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
          Daftarkan tim lomba seni budaya, sewa booth kuliner & UMKM, atau registrasi partisipasi kegiatan tanpa perlu membuat akun! Cepat, mudah, dan transparan.
        </p>

        {/* Highlights Pill */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs md:text-sm font-baloo text-stone-600 dark:text-stone-400">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/70 dark:bg-stone-850/70 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-500" />
            15 - 20 Mei 2026
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/70 dark:bg-stone-850/70 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <MapPin className="w-4 h-4 text-rose-500" />
            Pangkalan Bun, Kotawaringin Barat
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            onClick={onExploreClick}
            variant="festival"
            size="lg"
            className="w-full sm:w-auto px-8 py-3.5 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <span>Pilih & Daftar Event</span>
            <ArrowDown className="w-4 h-4 ml-2" />
          </Button>

          <Button
            onClick={onCheckStatusClick}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto px-6 py-3.5 text-base border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-850/80 shadow-xs"
          >
            <span>Cek Status Pendaftaran</span>
          </Button>
        </div>
      </div>

      {/* Decorative Wave Transition (Blue & Yellow) towards Event Grid */}
      <div className="mt-14 relative w-full leading-none">
        <svg
          className="w-full h-12 md:h-16 text-amber-400/40 dark:text-amber-900/20"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,60 L1200,120 L0,120 Z"></path>
        </svg>
        <svg
          className="absolute -bottom-1 inset-x-0 w-full h-10 md:h-14 text-sky-500/20 dark:text-sky-900/20"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,40 C300,120 600,0 900,80 C1050,120 1150,50 1200,60 L1200,120 L0,120 Z"></path>
        </svg>
      </div>
    </section>
  );
};
