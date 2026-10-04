import React, { useState } from 'react';
import { StatusBayar, StatusLulus } from '../../../types/database';
import { Button } from '../../ui/Button';
import { 
  CheckSquare, 
  X, 
  CreditCard, 
  GraduationCap, 
  Download, 
  Trash2, 
  ChevronDown 
} from 'lucide-react';

interface BulkActionFloatingBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkUpdateBayar: (status: StatusBayar) => void;
  onBulkUpdateLulus: (status: StatusLulus) => void;
  onBulkDownloadVcf: () => void;
  onBulkPrintInvoices: () => void;
  onBulkDelete: () => void;
  isSuperAdmin: boolean;
  isLoading?: boolean;
}

export const BulkActionFloatingBar: React.FC<BulkActionFloatingBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkUpdateBayar,
  onBulkUpdateLulus,
  onBulkDownloadVcf,
  onBulkPrintInvoices,
  onBulkDelete,
  isSuperAdmin,
  isLoading = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-4 max-w-4xl mx-auto z-40 animate-in slide-in-from-bottom-6 duration-200">
      <div className="p-3 sm:p-4 rounded-3xl bg-stone-900/95 dark:bg-stone-900/95 text-white backdrop-blur-md shadow-2xl border-2 border-amber-500/80 flex flex-wrap items-center justify-between gap-3 font-baloo">
        {/* Left Count Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-amber-500 text-stone-900 flex items-center justify-center font-bold text-xs">
            {selectedCount}
          </span>
          <span className="text-xs sm:text-sm font-semibold">
            {selectedCount} pendaftar dipilih
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Change Status Bayar */}
          <div className="relative inline-block">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkUpdateBayar(e.target.value as StatusBayar);
                  e.target.value = '';
                }
              }}
              disabled={isLoading}
              defaultValue=""
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-amber-300 border border-stone-700 cursor-pointer focus:outline-none"
            >
              <option value="" disabled>Ubah Status Bayar...</option>
              <option value="Belum Bayar">Set: Belum Bayar</option>
              <option value="Verifikasi Proses">Set: Verifikasi Proses</option>
              <option value="Lunas">Set: Lunas</option>
              <option value="Ditolak">Set: Ditolak</option>
            </select>
          </div>

          {/* Quick Change Status Lulus */}
          <div className="relative inline-block">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkUpdateLulus(e.target.value as StatusLulus);
                  e.target.value = '';
                }
              }}
              disabled={isLoading}
              defaultValue=""
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-teal-300 border border-stone-700 cursor-pointer focus:outline-none"
            >
              <option value="" disabled>Ubah Status Kelulusan...</option>
              <option value="Belum Lulus">Set: Belum Lulus</option>
              <option value="Lulus">Set: Lulus</option>
              <option value="Ditolak">Set: Ditolak</option>
            </select>
          </div>

          {/* Bulk Invoices */}
          <button
            type="button"
            onClick={onBulkPrintInvoices}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Cetak dan unduh invoice massal untuk pendaftar terpilih"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak</span> Invoice
          </button>

          {/* VCF Export */}
          <button
            type="button"
            onClick={onBulkDownloadVcf}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Gabungkan seluruh kontak terpilih ke file .vcf"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh</span> VCF
          </button>

          {/* Delete (Super Admin only) */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={onBulkDelete}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Hapus pendaftar yang dipilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          )}

          {/* Deselect */}
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            title="Batal Pilih"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
