import React from 'react';
import { Tag, Sparkles } from 'lucide-react';

interface PlaceholderChipBarProps {
  onInsertChip: (placeholder: string) => void;
  dynamicFieldLabels?: string[];
}

export const PlaceholderChipBar: React.FC<PlaceholderChipBarProps> = ({
  onInsertChip,
  dynamicFieldLabels = [],
}) => {
  const standardChips = [
    { label: 'Nama Peserta', placeholder: '{nama}' },
    { label: 'No. Registrasi', placeholder: '{regId}' },
    { label: 'Email', placeholder: '{email}' },
    { label: 'WhatsApp', placeholder: '{wa}' },
    { label: 'Nama Event', placeholder: '{eventNama}' },
    { label: 'Total Biaya', placeholder: '{totalPembayaran}' },
    { label: 'Status Bayar', placeholder: '{statusBayar}' },
    { label: 'Status Lulus', placeholder: '{statusLulus}' },
    { label: 'Tanggal Cetak', placeholder: '{tanggalCetak}' },
  ];

  return (
    <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 font-baloo">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Klik Chip Placeholder untuk Menyisipkan ke Kursor:
        </span>
        <span className="text-[10px] text-stone-400 font-mono">Dinamis</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {standardChips.map((chip) => (
          <button
            key={chip.placeholder}
            type="button"
            onClick={() => onInsertChip(chip.placeholder)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-stone-700 dark:text-stone-300 text-xs font-mono hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-900/60 transition-colors cursor-pointer shadow-2xs"
            title={`Sisipkan ${chip.placeholder}`}
          >
            <span>{chip.placeholder}</span>
          </button>
        ))}

        {/* Dynamic form field chips */}
        {dynamicFieldLabels.map((lbl) => (
          <button
            key={lbl}
            type="button"
            onClick={() => onInsertChip(`{${lbl}}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-mono hover:bg-teal-100 transition-colors cursor-pointer shadow-2xs"
            title={`Sisipkan {${lbl}}`}
          >
            <span>{`{${lbl}}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
