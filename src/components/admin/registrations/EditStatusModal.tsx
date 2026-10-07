import React, { useState } from 'react';
import { Registration, StatusBayar, StatusLulus } from '../../../types/database';
import { registrationService } from '../../../lib/services/registrationService';
import { emailInvoiceService } from '../../../lib/services/emailInvoiceService';
import { Button } from '../../ui/Button';
import { X, CheckCircle, AlertCircle, Save } from 'lucide-react';

interface EditStatusModalProps {
  isOpen: boolean;
  registration: Registration | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditStatusModal: React.FC<EditStatusModalProps> = ({
  isOpen,
  registration,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !registration) return null;

  const [statusBayar, setStatusBayar] = useState<StatusBayar>(registration.status_bayar);
  const [statusLulus, setStatusLulus] = useState<StatusLulus>(registration.status_lulus);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const res = await registrationService.updateStatus(registration.id, statusBayar, statusLulus);
    setIsSaving(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      // Fire-and-forget status notification email
      emailInvoiceService.triggerAutoEmail({
        ...registration,
        status_bayar: statusBayar,
        status_lulus: statusLulus,
      }).catch(() => {});

      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1E1712] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4 font-baloo">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <CheckCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-base text-stone-900 dark:text-stone-100">
                Ubah Status Pendaftar
              </h3>
              <p className="text-[11px] text-stone-500">
                {registration.nama} &bull; <span className="font-mono">{registration.reg_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
              Status Pembayaran:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Belum Bayar', 'Verifikasi Proses', 'Lunas', 'Ditolak'] as StatusBayar[]).map((st) => (
                <label
                  key={st}
                  className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                    statusBayar === st
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="status_bayar"
                    value={st}
                    checked={statusBayar === st}
                    onChange={() => setStatusBayar(st)}
                    className="sr-only"
                  />
                  <span>{st}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
              Status Kelulusan / Kurasi Berkas:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Belum Lulus', 'Lulus', 'Ditolak'] as StatusLulus[]).map((st) => (
                <label
                  key={st}
                  className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                    statusLulus === st
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="status_lulus"
                    value={st}
                    checked={statusLulus === st}
                    onChange={() => setStatusLulus(st)}
                    className="sr-only"
                  />
                  <span>{st}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
            <Button type="button" onClick={onClose} variant="ghost" size="sm">
              Batal
            </Button>
            <Button type="submit" variant="festival" size="sm" isLoading={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1" />
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
