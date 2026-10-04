import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { formFieldService } from '../../lib/services/formFieldService';
import { FormField, Registration } from '../../types/database';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { QrisLightboxModal } from './QrisLightboxModal';
import { 
  X, 
  CreditCard, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { formatRupiah } from '../../lib/utils';

interface SubsequentPaymentModalProps {
  isOpen: boolean;
  registration: Registration | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubsequentPaymentModal: React.FC<SubsequentPaymentModalProps> = ({
  isOpen,
  registration,
  onClose,
  onSuccess,
}) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [otherTextValues, setOtherTextValues] = useState<Record<string, string>>({});
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isQrisLightboxOpen, setIsQrisLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !registration) return;

    const loadFields = async () => {
      setIsLoadingFields(true);
      setErrorMsg(null);
      const loaded = await formFieldService.getFormFields(registration.event_id, 'Pembayaran');
      setFields(loaded);
      setIsLoadingFields(false);
    };

    loadFields();
  }, [isOpen, registration]);

  if (!isOpen || !registration) return null;

  // Conditional logic for payment method & proof
  const paymentMethodField = fields.find(
    (f) =>
      (f.tipe === 'Dropdown' || f.tipe === 'Radio') &&
      f.label.toLowerCase().includes('pembayaran')
  );

  const paymentProofField = fields.find(
    (f) =>
      (f.tipe === 'File' || f.tipe === 'File Multiple') &&
      f.label.toLowerCase().includes('bukti')
  );

  const selectedPaymentMethod = paymentMethodField ? (formData[paymentMethodField.label] || '').toLowerCase() : '';
  const isCash = selectedPaymentMethod.includes('cash') || selectedPaymentMethod.includes('tunai') || selectedPaymentMethod.includes('langsung');
  const isTransfer = selectedPaymentMethod.includes('transfer') || selectedPaymentMethod.includes('qris') || selectedPaymentMethod.includes('bank') || (selectedPaymentMethod !== '' && !isCash);
  const shouldShowProofAndQris = Boolean(paymentMethodField && isTransfer);

  const handleInputChange = (label: string, value: any) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const handleFileUpload = (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Rule: File maks 1 MB
    if (file.size > 1 * 1024 * 1024) {
      alert(`Ukuran file "${file.name}" melebihi batas maksimal 1 MB! Harap kompres file Anda.`);
      e.target.value = '';
      return;
    }

    // Save file name/object
    setFormData((prev) => ({
      ...prev,
      [label]: file.name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    // Merge "Lainnya" text values
    const finalAnswers: Record<string, any> = { ...formData };
    Object.keys(otherTextValues).forEach((key) => {
      if (formData[key] === 'Lainnya' || (Array.isArray(formData[key]) && formData[key].includes('Lainnya'))) {
        finalAnswers[`${key}_lainnya`] = otherTextValues[key];
      }
    });

    if (isSupabaseConfigured) {
      try {
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('submit_payment_atomic', {
          p_reg_id: registration.reg_id,
          p_payment_answers: finalAnswers,
        });

        if (rpcErr) {
          setErrorMsg(rpcErr.message);
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        alert('Bukti pembayaran lanjutan berhasil dikirim! Status pembayaran Anda kini "Verifikasi Proses".');
        onSuccess();
        onClose();
        return;
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal mengirim pembayaran');
        setIsSubmitting(false);
        return;
      }
    }

    // Offline / demo fallback
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Bukti pembayaran lanjutan berhasil dikirim! Status pembayaran Anda kini "Verifikasi Proses".');
      onSuccess();
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-xl w-full my-8 bg-white dark:bg-[#1E1712] rounded-3xl border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-fredoka font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                Formulir Pembayaran Lanjutan
              </h3>
              <p className="text-[11px] text-stone-500 font-baloo truncate max-w-[220px]">
                {registration.event_nama}
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

        {/* Participant & Payment Overview Card */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-2 text-xs font-baloo">
          <div className="flex justify-between items-center">
            <span className="text-stone-500">Nomor Registrasi:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{registration.reg_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-500">Nama Peserta / Usaha:</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{registration.nama}</span>
          </div>
          <div className="flex justify-between items-center border-t border-stone-200 dark:border-stone-800 pt-1.5">
            <span className="text-stone-500 font-semibold">Total Biaya Pelunasan:</span>
            <span className="font-extrabold text-teal-600 dark:text-teal-400 text-sm">
              {formatRupiah(registration.event_harga || 0)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-baloo flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dynamic Fields Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {isLoadingFields ? (
            <p className="text-center text-xs text-stone-400 py-6">Memuat formulir pembayaran...</p>
          ) : (
            fields.map((f) => {
              const isProofField = paymentProofField && f.id === paymentProofField.id;
              if (isProofField && !shouldShowProofAndQris) {
                return null;
              }

              const optionsList = (f.options || '').split('\n').map((opt) => opt.trim()).filter(Boolean);

              return (
                <div key={f.id} className="space-y-1.5 font-baloo text-xs">
                  {f.tipe === 'Judul' && (
                    <div className="pt-2 pb-1 border-b border-stone-100 dark:border-stone-850">
                      <h4 className="font-fredoka font-bold text-sm text-stone-900 dark:text-stone-100">{f.label}</h4>
                      {f.options && (
                        <div
                          className="text-stone-500 text-xs leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: f.options }}
                        />
                      )}
                    </div>
                  )}

                  {f.tipe === 'Dropdown' && (
                    <div>
                      <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        value={formData[f.label] || ''}
                        onChange={(e) => handleInputChange(f.label, e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 font-baloo"
                        required={f.required}
                      >
                        <option value="">-- Pilih opsi --</option>
                        {optionsList.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {f.tipe === 'Textarea' && (
                    <div>
                      <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </label>
                      <textarea
                        rows={2}
                        value={formData[f.label] || ''}
                        onChange={(e) => handleInputChange(f.label, e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-baloo"
                        required={f.required}
                      />
                    </div>
                  )}

                  {(f.tipe === 'File' || f.tipe === 'File Multiple') && (
                    <div>
                      <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                        {f.label} {f.required && <span className="text-rose-500">* (Maks 1 MB)</span>}
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileUpload(f.label, e)}
                        required={f.required && !formData[f.label]}
                        className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                      />
                    </div>
                  )}

                  {/* QRIS Display */}
                  {f === paymentMethodField && shouldShowProofAndQris && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 text-center space-y-2">
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200 font-fredoka flex items-center justify-center gap-1">
                        <QrCode className="w-4 h-4" />
                        Pindai QRIS Pembayaran
                      </p>
                      <img
                        src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80"
                        alt="QRIS"
                        className="w-36 h-36 object-contain mx-auto bg-white p-2 rounded-xl shadow-xs cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setIsQrisLightboxOpen(true)}
                        title="Klik untuk memperbesar QRIS"
                      />
                      <button
                        type="button"
                        onClick={() => setIsQrisLightboxOpen(true)}
                        className="text-[11px] text-amber-700 dark:text-amber-300 underline font-semibold cursor-pointer"
                      >
                        Klik untuk memperbesar / unduh QRIS
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
            <Button type="button" onClick={onClose} variant="ghost" size="sm">
              Batal
            </Button>
            <Button type="submit" variant="festival" size="sm" isLoading={isSubmitting}>
              Kirim Bukti Pembayaran
            </Button>
          </div>
        </form>

        <QrisLightboxModal
          isOpen={isQrisLightboxOpen}
          qrisUrl="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80"
          eventName={registration.event_nama || 'Kobar Expo'}
          onClose={() => setIsQrisLightboxOpen(false)}
        />
      </div>
    </div>
  );
};
